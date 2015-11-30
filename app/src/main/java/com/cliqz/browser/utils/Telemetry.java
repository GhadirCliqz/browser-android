package com.cliqz.browser.utils;

import android.app.ActivityManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Debug;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Locale;

import javax.inject.Inject;
import javax.inject.Singleton;

import acr.browser.lightning.BuildConfig;
import acr.browser.lightning.database.HistoryDatabase;
import acr.browser.lightning.preference.PreferenceManager;

/**
 * Created by Ravjit on 17/11/15.
 */
@Singleton
public class Telemetry {

    @Inject
    public Telemetry(Context context) {
        this.context = context;
        signal = new HashMap<>();
        batteryLevel = -1;
        context.registerReceiver(mBatteryInfoReceiver, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
        context.registerReceiver(mNetworkChangeReceiver, new IntentFilter(ConnectivityManager.CONNECTIVITY_ACTION));
    }
    
    private static class Key {

        private static final String SOURCE = "MA00";
        private static final String ALPHA_NUMERIC_SPACE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        private static final String NUMERIC_SPACE = "0123456789";
        private static final String SESSION = "session";
        private static final String TIME_STAMP = "ts";
        private static final String TELEMETRY_SEQUENCE = "telemetrySeq";
        private static final String ACTION = "action";
        private static final String TYPE = "type";
        private static final String VERSION = "version";
        private static final String OS_VERSION = "os_version";
        private static final String DEVICE = "device";
        private static final String LANGUAGE = "language";
        private static final String DEFAULT_SEARCH_ENGINE = "defaultSearchEngine";
        private static final String HISTORY_URLS = "history_urls";
        private static final String HISTORY_DAYS = "history_days";
        private static final String PREFERENCES = "prefs";
        private static final String NETWORK = "network";
        private static final String BATTERY = "battery";
        private static final String CONTEXT = "context";
        private static final String MEMORY = "memory";
        private static final String TIME_USED = "time_used";
        private static final String LENGTH = "key_length";
        private static final String PAGE = "page";
        private static final String DISPLAY_TIME = "display_time";
        private static final String DURATION = "duration";
        private static final String ACTIVITY = "activity";
        private static final String ENVIRONMENT = "environment";
        private static final String ONBOARDING = "onboarding";
        private static final String CURRENT_LAYER = "current_layer";
        private static final String NEXT_LAYER = "next_layer";
    }

    public static class Action {

        public static final String INSTALL = "install";
        public static final String UPDATE = "update";
        public static final String URLBAR_FOCUS = "urlbar_focus";
        public static final String KEY_STROKE = "key_stroke";
        public static final String KEYSTROKE_DEL = "keystroke_del";
        public static final String PASTE = "paste";
        public static final String SHOW = "show";
        public static final String HIDE = "hide";
        public static final String NETWORK_STATUS = "network_status";
        public static final String OPEN = "open";
        public static final String CLOSE = "close";
        public static final String KILL = "kill";
        public static final String LAYER_CHANGE = "layer_change";
    }

    @Inject
    PreferenceManager mPreferenceManager;

    @Inject
    HistoryDatabase mHistoryDatabase;

    private HashMap<String, Object> signal;
    private String currentNetwork;
    private Context context;
    private int batteryLevel;
    private long appStartTime, appEndTime, networkStartTime;

    /**
     * Sends a telemetry signal related to the application life cycle: install/update
     * @param action type of the signal: App install or App update
     */
    public void sendLifeCycleSignal(String action) {
        signal.clear();
        signal.put(Key.TYPE, Key.ACTIVITY);
        signal.put(Key.ACTION, action);
        sendSignal();
    }

    /**
     * Send a telemetry signal when the app is opened or closed
     * @param action One of the three: "open", "close" or "kill"
     * @param context The screen which is visible when the this signal is sent.
     */
    //TODO No startup time
    private void sendAppUsageSignal(String action, String context) {
        signal.clear();
        signal.put(Key.TYPE, Key.ACTIVITY);
        signal.put(Key.ACTION, action);
        signal.put(Key.NETWORK, getNetworkState());
        signal.put(Key.BATTERY, batteryLevel);
        signal.put(Key.MEMORY, getMemoryUsage());
        signal.put(Key.CONTEXT, context);
        if(action.equals(Action.CLOSE) || action.equals(Action.KILL)) {
            signal.put(Key.TIME_USED, appEndTime - appStartTime);
        }
        sendSignal();
    }

    public void sendURLBarFocusChange(String focused) {
        signal.clear();
        signal.put(Key.TYPE, Key.ACTIVITY);
        signal.put(Key.ACTION, Action.URLBAR_FOCUS);
        signal.put(Key.CONTEXT, focused);
        sendSignal();
    }

    /**
     * Send a telemetry signal for each key stroke by the user in the search bar.
     * Only the query length is logged, actual query is not logged.
     * @param action It tells if the user typed a character or deleted a character
     * @param length Length of the query in the search bar
     */
    public void sendTypingSignal(String action, int length) {
        signal.clear();
        signal.put(Key.TYPE, Key.ACTIVITY);
        signal.put(Key.ACTION, action);
        signal.put(Key.LENGTH, length);
        sendSignal();
    }

    /**
     * Send a telemetry signal when the user pastes something in the search bar
     * @param length Length of the text pasted in the search bar
     */
    public void sendPasteSignal(int length) {
        signal.clear();
        signal.put(Key.TYPE, Key.ACTIVITY);
        signal.put(Key.ACTION, Action.PASTE);
        signal.put(Key.LENGTH, length);
        sendSignal();
    }

    /**
     * Send a signal for showing an onboarding page
     * @param page Position/Page number of the onboarding-screen which is shown
     */
    public void sendOnBoardingShowSignal(int page) {
        signal.clear();
        signal.put(Key.TYPE, Key.ONBOARDING);
        signal.put(Key.ACTION, Action.SHOW);
        signal.put(Key.PAGE, page);
        sendSignal();
    }

    /**
     * Send a signal for hiding/closing an onboarding page
     * @param page Position/Page number of the onboarding-screen which is hidden
     * @param time Duration for which the onboarding page was shown
     */
    public void sendOnBoardingHideSignal(int page, long time) {
        signal.clear();
        signal.put(Key.TYPE, Key.ONBOARDING);
        signal.put(Key.ACTION, Action.HIDE);
        signal.put(Key.PAGE, page);
        signal.put(Key.DISPLAY_TIME,time);
        sendSignal();
    }

    /**
     * Send a telemetry signal when the user switches between the past, present and future layers
     * @param currentLayer The layer visible before switching/changing
     * @param nextLayer The layer visible after switching/changing
     */
    //TODO Implement function calls in MainActivity
    public void sendLayerChangeSignal(String currentLayer, String nextLayer, long displayTime) {
        signal.clear();
        signal.put(Key.TYPE, Key.ACTIVITY);
        signal.put(Key.ACTION, Action.LAYER_CHANGE);
        signal.put(Key.CURRENT_LAYER, currentLayer);
        signal.put(Key.NEXT_LAYER, nextLayer);
        signal.put(Key.DISPLAY_TIME, displayTime);
        sendSignal();
    }

    /**
     *Sends a telemetry signal about the environment when the app starts.
     *This signal is sent at most once an hour.
     */
    private void sendEnvironmentSignal() {
        long oneHour = 3600000;
        long currentTime = getUnixTimeStamp();
        long days = 0;
        long previousTime = mPreferenceManager.getTimeOfLastEnvSignal();
        if(currentTime-previousTime < oneHour) {
            return;
        }
        mPreferenceManager.setTimeOfLastEnvSignal(currentTime);
        signal.clear();
        signal.put(Key.TYPE, Key.ENVIRONMENT);
        signal.put(Key.DEVICE, Build.MODEL);
        signal.put(Key.LANGUAGE, getLanguage());
        signal.put(Key.VERSION, BuildConfig.VERSION_NAME);
        signal.put(Key.OS_VERSION, Integer.toString(Build.VERSION.SDK_INT));
        signal.put(Key.DEFAULT_SEARCH_ENGINE, getDefaultSearchEngine());
        signal.put(Key.HISTORY_URLS, mHistoryDatabase.getHistoryItemsCount());
        if(mHistoryDatabase.getHistoryItemsCount() > 0) {
            long firstItemTime = mHistoryDatabase.getFirstHistoryItem().getTimestamp();
            days = (currentTime - firstItemTime) / 86400000;
        }
        signal.put(Key.HISTORY_DAYS, days);
        sendSignal();
    }

    //Send a telemetry signal of the network state, when the app closes and when the network changes
    private void sendNetworkStatus() {
        long duration = getUnixTimeStamp() - networkStartTime;
        signal.clear();
        signal.put(Key.TYPE, Key.ACTIVITY);
        signal.put(Key.ACTION, Action.NETWORK_STATUS);
        signal.put(Key.NETWORK, currentNetwork);
        signal.put(Key.DURATION, duration);
        networkStartTime = getUnixTimeStamp();
        currentNetwork = getNetworkState();
        sendSignal();
    }

    /**
     * Send telemetry signals when the app starts/comes to foreground
     * @param context the layer which is visble
     */
    public void sendStartingSignals(String context) {
        appStartTime = getUnixTimeStamp();
        networkStartTime = getUnixTimeStamp();
        currentNetwork = getNetworkState();
        sendEnvironmentSignal();
        sendAppUsageSignal(Action.OPEN, context);
    }

    /**
     * Send telemtry signals when the app closes/goes to background
     * @param context the layer which is visible
     */
    public void sendClosingSignals(String context) {
        appEndTime = getUnixTimeStamp();
        sendNetworkStatus();
        sendAppUsageSignal("close", context);
    }

    //converts the signal to json and post the signal to the logger
    private void sendSignal() {
        addIdentifiers();
        JSONObject js = new JSONObject(signal);
        JSONArray jss = new JSONArray().put(js);
        new HttpHandler(mPreferenceManager).execute(jss.toString());
    }

    //TODO for signals from javascript
    public void sendSignal(String signal) {

    }

    //adds session id. timestamp, sequence number to the signals
    private void addIdentifiers() {
        int telemetrySequence = mPreferenceManager.getTelemetrySequence();
        signal.put(Key.SESSION, mPreferenceManager.getSessionId());
        signal.put(Key.TIME_STAMP, getUnixTimeStamp());
        signal.put(Key.TELEMETRY_SEQUENCE, telemetrySequence);
        mPreferenceManager.setTelemetrySequence(telemetrySequence);
    }

    /**
     * Generates a SessionID as per the CLIQZ standard
     * @see <a href="https://github.com/cliqz/navigation-extension/wiki/Logging#session-id-format</a>
     * @return A newly generated SessionID
     */
    public String generateSessionID() {
        String randomAlphaNumericString = generateRandomString(18, Key.ALPHA_NUMERIC_SPACE);
        String randomNumericString = generateRandomString(6, Key.NUMERIC_SPACE);
        String days = Long.toString(getUnixTimeStamp() / 86400000);
        return randomAlphaNumericString + randomNumericString + "|" + days + "|" + Key.SOURCE;
    }

    //Returns a random string of length 'length' using characters from the given 'space'
    private String generateRandomString(int length, String space) {
        String randomString = "";
        for(int i=0; i < length; i++ ) {
            randomString += space.charAt((int)Math.floor(Math.random() * space.length()));
        }
        return randomString;
    }

    //Returns the current time in milliseconds since January 1, 1970 midningt UTC.
    //This returns the time in UTC regardless of the timezone of the system
    private long getUnixTimeStamp() {
        return (long)Math.floor(System.currentTimeMillis());
    }

    //returns current language of the device
    private String getLanguage() {
        String language = Locale.getDefault().getLanguage()+"-"+Locale.getDefault().getCountry();
        language = language.replaceAll("_","-");
        return language;
    }

    private String getDefaultSearchEngine() {
        String[] searchEngines = {mPreferenceManager.getSearchUrl(), "Google",
                "Ask", "Bing", "Yahoo", "StartPage", "StartPage (Mobile)",
                "DuckDuckGo (Privacy)", "DuckDuckGo Lite (Privacy)", "Baidu (Chinese)",
                "Yandex (Russian)"};
        int searchChoice = mPreferenceManager.getSearchChoice();
        return searchEngines[searchChoice];
    }

    private String getNetworkState() {
        ConnectivityManager manager = (ConnectivityManager)
                context.getSystemService(context.CONNECTIVITY_SERVICE);
        NetworkInfo networkInfo = manager.getActiveNetworkInfo();
        boolean isConnected = networkInfo != null && networkInfo.isConnected();
        if(isConnected) {
            if(networkInfo.getType() == ConnectivityManager.TYPE_WIFI) {
                return "Wifi";
            } else if(networkInfo.getType() == ConnectivityManager.TYPE_MOBILE) {
                return "WWAN";
            } else if(networkInfo.getType() == ConnectivityManager.TYPE_WIMAX) {
                return "WIMAX";
            } else if(networkInfo.getType() == ConnectivityManager.TYPE_ETHERNET) {
                return "ETHERNET";
            } else {
                return "Connected";
            }
        } else {
            return "Disconnected";
        }
    }

    //Memory(RAM) being used by the application in MBs
    private int getMemoryUsage() {
        ActivityManager activityManager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
        int currentPid = android.os.Process.myPid();
        int pids[] = new int[1];
        pids[0] = currentPid;
        Debug.MemoryInfo[] memoryInfoArray = activityManager.getProcessMemoryInfo(pids);
        for (Debug.MemoryInfo pidMemoryInfo : memoryInfoArray) {
            return pidMemoryInfo.getTotalPss() / 1024;
        }
        return -1;
    }

    //receiver listening to changes in battery levels
    private BroadcastReceiver mBatteryInfoReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(final Context context, Intent intent) {
            int level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, 0);
            int scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, 100);
            int percent = (level*100)/scale;
            batteryLevel = percent;
        }
    };

    //receiver listening to changes in network state
    private BroadcastReceiver mNetworkChangeReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            //check to make sure the app is in foreground
            if(appStartTime > appEndTime) {
                sendNetworkStatus();
            }
        }
    };

}
