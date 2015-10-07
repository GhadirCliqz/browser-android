package com.cliqz.browser.search;

import android.annotation.TargetApi;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.location.Location;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Debug;
import android.support.annotation.Nullable;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.View;
import android.webkit.ConsoleMessage;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.squareup.otto.Bus;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.List;

import javax.inject.Inject;

import acr.browser.lightning.BuildConfig;
import acr.browser.lightning.app.BrowserApp;
import acr.browser.lightning.database.HistoryDatabase;
import acr.browser.lightning.database.HistoryItem;
import acr.browser.lightning.view.ILightningTab;

/**
 * Created by kread on 13/07/15.
 */
public class WebSearchView extends WebView implements ILightningTab {

    private static final String TAG = WebSearchView.class.getSimpleName();
    private static final boolean DO_PROFILE_QUERY = false;
    // app_debug includes single JS files, app includes minified JS
    private static final String CLIQZ_URL = "file:///android_asset/navigation/index.html";

    private CharSequence mLastQuery;
    private boolean mJsReady = false;
    private boolean mProfilingRunning = false;
    private int mLastScrollPosition = 0;
    private boolean mFirstHide = true;
    private CliqzCallbacks mCliqzCallbacksListener;
    private HistoryDatabase mHistoryDatabase;

    @Inject
    Bus mAutoCompleteBus;


    public interface CliqzCallbacks {
        void onResultClicked(final String url);

        void onNotifyQuery(final String query);

        void onAutocompleteUrl(final String str);
    }

    private WebViewClient mWebViewClient = new WebViewClient() {
        /* public void onPageFinished (WebView view, String url) {
            executeJS("_cliqzLoadCSS('content/skin/android.css');");
        } */

        public boolean shouldOverrideUrlLoading(final WebView wv, final String url) {
            Log.d (TAG, "New url: " + url);
            return true;
        }
    };
    private Location mLocation;
    private Location mLastLocation;
    private String mUrl;

    public WebSearchView(Context context) {
        super(context);

        setup();
        BrowserApp.getAppComponent().inject(this);
    }

    public void setHistoryDatabase(final HistoryDatabase db) {
        mHistoryDatabase = db;
    }

    public void setResultListener(final CliqzCallbacks cb) {
        mCliqzCallbacksListener = cb;
    }

    // Next steps:
    // Load local data, esp. images like for contacts
    // Optimize layouts

    @TargetApi(Build.VERSION_CODES.KITKAT)
    @Nullable
    public void setup() {
        // Make extra sure web performance is nice on scrolling. Can this actually be harmful?
        setLayerType(View.LAYER_TYPE_HARDWARE, null);

        setWebViewClient(mWebViewClient);

        // Web view settings
        WebSettings webSettings = getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        /* webSettings.setGeolocationEnabled(true);
        webSettings.setGeolocationDatabasePath(mContext.getCacheDir().getAbsolutePath()); */

        if (Build.VERSION.SDK_INT >= 16) {
            // Otherwise we can't do XHR
            webSettings.setAllowUniversalAccessFromFileURLs(true);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT && BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true);
        }


        setWebChromeClient(new WebChromeClient() {

            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                callback.invoke(origin, true, false);
            }

            public boolean onConsoleMessage(ConsoleMessage cm) {
                Log.d(TAG, cm.message() + " -- From line "
                        + cm.lineNumber() + " of "
                        + cm.sourceId());
                return true;
            }
        });

        openCliqzView();

        // Callbacks from JS to Java
        addJavascriptInterface(new JsBridge(), "jsBridge");
    }

    public void openCliqzView() {
        if (!CLIQZ_URL.equals(mUrl)) {
            mUrl = CLIQZ_URL;
            loadUrl(mUrl);
            mJsReady = false;
            mFirstHide = true;
        }
    }

    public void onHiddenChanged (boolean hidden) {
        if (!isCliqzUrl()) {
            return;
        }
        if (hidden && mFirstHide) {
            mFirstHide = false;
            return;
        }
        if (!hidden) {
            executeJS("CLIQZ.Core.popupOpen()");
        } else {
            executeJS("CLIQZ.Core.popupClose()");
        }
    }

    public void onPause() {
        if (isCliqzUrl()) {
            executeJS("CliqzUtils.pushTelemetry()");
        }
    }

    public boolean isCliqzUrl() {
        return CLIQZ_URL.equals(mUrl);
    }

    public void onStop() {

        pauseTimers();

        if (mProfilingRunning) {
            Debug.stopMethodTracing();
        }
    }

    public void onStart() {

        resumeTimers();
    }


    public void setLocation(Location location) {
        if (!mJsReady) {
            mLastLocation = location;
        } else {
            mLastLocation = null;
            executeJS("_cliqzSetGeolocation(" + location.getLatitude() + "," + location.getLongitude() + ")");
        }
    }

    public void openUrl(String url) {
        if (url != null && !url.equals(mUrl)) {
            mUrl = url;
            loadUrl(url);
        }
    }

    public class JsBridge {
        // Can open any URI, event Android internal ones like contacts etc
        @JavascriptInterface
        public void openAndroidUri(final String uriStr) {
            final Uri uri = Uri.parse(uriStr);
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            /* if (intent.resolveActivity(getActivity().getPackageManager()) != null) {
                startActivity(intent);
            } */
        }

        @JavascriptInterface
        public boolean openLink(final String url) {
            final CliqzCallbacks listener = mCliqzCallbacksListener;
            if (listener != null) {
                post(new Runnable() {
                    @Override
                    public void run() {
                        listener.onResultClicked(url);
                    }
                });
            }
            return false;
        }

        private String historyToJSON(final List<HistoryItem> items) {
            final StringBuilder sb = new StringBuilder(items.size() * 100);
            sb.append("[");
            String sep = "";
            for (final HistoryItem item : items) {
                sb.append(sep);
                item.toJsonString(sb);
                sep = ",";
            }
            sb.append("]");
            return sb.toString();
        }

        @JavascriptInterface
        public String searchHistory(final String query) {
            if (mHistoryDatabase != null) {
                final List<HistoryItem> items = mHistoryDatabase.findItemsContaining(query, 100);
                try {
                    return historyToJSON(items);
                } catch (Exception e) {
                    Log.e(TAG, "Cannot serialize History", e);
                }
            }
            return "[]";
        }

        @JavascriptInterface
        public String getTopSites() {
            if (mHistoryDatabase != null) {
                final List<HistoryItem> items = mHistoryDatabase.getTopSites(20);
                try {
                    return historyToJSON(items);
                } catch (Exception e) {
                    Log.e(TAG, "Cannot serialize History", e);
                }
            }
            return "[]";
        }

        /**
         * Callback sent from JS once it is ready
         * @return
         */
        @JavascriptInterface
        public int isReady() {
            mJsReady = true;
            // If the user typed a query before JS was ready, fire it now
            if (mLastQuery != null || mLastLocation != null) {
                final CharSequence lastQuery = mLastQuery;
                post(new Runnable() {
                    public void run() {
                        if (mLastQuery != null) {
                            mLastQuery = null;
                            onQueryChanged(lastQuery.toString());
                        }
                        if (mLastLocation != null) {
                            setLocation(mLastLocation);
                            mLastLocation = null;
                        }
                    }
                });

            }
            return 0;
        }

        @JavascriptInterface
        public String getEnvironment() {
            final Context act = getContext();
            if (act == null) {
                return "{}";
            }

            final JSONObject environment = new JSONObject();
            final DisplayMetrics dm = getResources().getDisplayMetrics();

            try {
                environment.put("width", dm.widthPixels);
                environment.put("height", dm.heightPixels);
                environment.put("dpi", dm.densityDpi);
                environment.put("manufacturer", Build.MANUFACTURER);
                environment.put("model", Build.MODEL);
                environment.put("apilevel", Build.VERSION.SDK_INT);
                ConnectivityManager cm =
                        (ConnectivityManager) act.getSystemService(Context.CONNECTIVITY_SERVICE);

                NetworkInfo activeNetwork = cm.getActiveNetworkInfo();
                if (activeNetwork != null &&
                        activeNetwork.isConnectedOrConnecting()) {

                    environment.put("connection", activeNetwork.getTypeName());
                } else {
                    environment.put("connection", "offline");
                }
                // environment.put("UUID", app.getInstallationId());
                // environment.put("first_install", app.getInstallationTime());
            } catch (JSONException e) {
                Log.w(TAG, "Cannot create env", e);
            }
            final PackageInfo pInfo;
            try {
                pInfo = act.getPackageManager().getPackageInfo(act.getPackageName(), 0);
                environment.put("version", pInfo.versionName);
            } catch (PackageManager.NameNotFoundException e) {
            } catch (JSONException e) {
            }

            return environment.toString();
        }

        /**
         * Callback from JS which suggests a url.
         * @param url the suggested url that the user might be typing
         */
        @JavascriptInterface
        public void autocomplete(final String url) {
            final CliqzCallbacks listener = mCliqzCallbacksListener;
            if (listener != null) {
                post(new Runnable() {
                    @Override
                    public void run() {
                        listener.onAutocompleteUrl(url);
                    }
                });
            }
        }

        /**
         * Callback from JS used to notify the interface the query had been changed (i.e. the user
         * select a previous query between the query history)
         *
         * @param query the selected query
         */
        @JavascriptInterface
        public void notifyQuery(final String query) {
            final CliqzCallbacks listener = mCliqzCallbacksListener;
            if (listener != null) {
                post(new Runnable() {
                    @Override
                    public void run() {
                        listener.onNotifyQuery(query);
                    }
                });
            }
        }
    }

    /**
     * Evaluate JS in web context
     * @param js JS command
     */
    private void executeJS(final String js) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            evaluateJavascript(js, null);
        } else {
            loadUrl("javascript:" + js);
        }
    }

    public void onQueryChanged(String q) {
        if (q.length() == 0) {
            return;
        }
        // If we only want to profile the query itself, start here
        if (DO_PROFILE_QUERY) {
            if (mProfilingRunning) {
                return;
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                Debug.startMethodTracingSampling("typing", 8 * 1024 * 1024, 500);
            } else {
                Debug.startMethodTracing("typing");
            }
        }

        final String query = q.toString().trim();
        Log.d(TAG, "Query: " + query);

        // If JS isn't ready yet, just store the query for now. Will be fetched once JS is ready
        if (!mJsReady || !isCliqzUrl()) {
            mLastQuery = query;
            return;
        }

        if (query.equals(mLastQuery)) {
            return;
        }
        mLastQuery = query;
        final String lowerQuery = query.toLowerCase();
        if (query.length() > 0) {
            executeJS("search_mobile('" + lowerQuery + "')");
        } else {
            executeJS("_cliqzNoResults()");
        }

        /*

        // Add your results to this map
        final Map<String, String> results = new HashMap<>();
        results.put("contacts", mContactStore.retrieveContacts(query));


        final StringBuilder builder = new StringBuilder("{");
        Iterator<Map.Entry<String, String>> iter = results.entrySet().iterator();
        String sep = "";
        while (iter.hasNext()) {
            Map.Entry<String, String> entry = iter.next();
            builder.append(sep)
                    .append("\"")
                    .append(entry.getKey())
                    .append("\":")
                    .append(entry.getValue());
            sep = ",";
        }
        builder.append("}");
        // Call with contacts
        mWebView.loadUrl("javascript:_cliqzLocalResults('" + builder.toString() + "')");

        // TODO: @Kevin - History disabled for now as it is far too slow
        // searchHistory(query);

        if (DO_PROFILE_QUERY) {
            Debug.stopMethodTracing();
        }
        */
    }

}
