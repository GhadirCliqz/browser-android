package com.cliqz.browser.webview;

import android.annotation.TargetApi;
import android.content.Context;
import android.location.Location;
import android.os.Build;
import android.os.Debug;
import android.support.annotation.Nullable;
import android.util.Log;
import android.view.View;
import android.webkit.ConsoleMessage;
import android.webkit.GeolocationPermissions;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.cliqz.browser.utils.LocationCache;

import java.util.List;
import java.util.Locale;

import javax.inject.Inject;

import acr.browser.lightning.BuildConfig;
import acr.browser.lightning.app.BrowserApp;
import acr.browser.lightning.database.HistoryDatabase;
import acr.browser.lightning.database.HistoryItem;
import acr.browser.lightning.view.ILightningTab;

/**
 * Created by kread on 13/07/15.
 */
public class CliqzView extends WebView implements ILightningTab {

    private static final String TAG = CliqzView.class.getSimpleName();
    private static final boolean DO_PROFILE_QUERY = false;
    // app_debug includes single JS files, app includes minified JS
    private static final String CLIQZ_URL = "file:///android_asset/navigation/index.html";

    private CharSequence mLastQuery;
    private boolean mJsReady = false;
    private boolean mProfilingRunning = false;
    private int mLastScrollPosition = 0;
    private boolean mFirstHide = true;

    // Package visible to support the new brigde
    CliqzCallbacks mListener;

    @Inject
    HistoryDatabase historyDatabase;

    @Inject
    LocationCache locationCache;

    public interface CliqzCallbacks {
        void onResultClicked(final String url);

        void onNotifyQuery(final String query);

        void onAutocompleteUrl(final String str);
    }

    private WebViewClient mWebViewClient = new WebViewClient() {
        /* public void onPageFinished (WebView view, String url) {
            executeJS("_cliqzLoadCSS('content/skin/android.css');");
        } */
        @Override
        public boolean shouldOverrideUrlLoading(final WebView wv, final String url) {
            Log.d (TAG, "New url: " + url);
            return true;
        }
    };
    private Location mLocation;
    private Location mLastLocation;
    private String mUrl;

    public CliqzView(Context context) {
        super(context);

        setup();
        BrowserApp.getAppComponent().inject(this);
    }

    public void setResultListener(final CliqzCallbacks cb) {
        mListener = cb;
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
        webSettings.setAllowFileAccess(true);
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setGeolocationEnabled(true);
        webSettings.setGeolocationDatabasePath(getContext().getCacheDir().getAbsolutePath());

        if (Build.VERSION.SDK_INT >= 16) {
            // Otherwise we can't do XHR
            webSettings.setAllowFileAccessFromFileURLs(true);
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
        addJavascriptInterface(new CliqzBridge(this), "jsBridge");
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

    /**
     * Support for the {@link CliqzBridge} to search the history
     * @param query
     * @return a stringified json result string
     */
    String searchHistory(final String query) {
        if (historyDatabase != null) {
            final List<HistoryItem> items = historyDatabase.findItemsContaining(query, 100);
            try {
                return historyToJSON(items);
            } catch (Exception e) {
                Log.e(TAG, "Cannot serialize History", e);
            }
        }
        return "[]";
    }

    /**
     * Support for {@link CliqzBridge} to get the 20 most visited web sites
     * @return a stringified json result string
     */
    String getTopSites() {
        if (historyDatabase != null) {
            final List<HistoryItem> items = historyDatabase.getTopSites(20);
            try {
                return historyToJSON(items);
            } catch (Exception e) {
                Log.e(TAG, "Cannot serialize History", e);
            }
        }
        return "[]";
    }

    /**
     * Support for the {@link CliqzBridge}, signal sent from JS once it is ready
     */
    void extensionReady() {
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
    }

    /**
     * Evaluate JS in web context
     * @param js JS command
     */
    void executeJS(final String js) {
        if (js != null && !js.isEmpty()) {
            post(new Runnable() {
                @Override
                public void run() {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                        evaluateJavascript(js, null);
                    } else {
                        loadUrl("javascript:" + js);
                    }
                }
            });
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
        final Location location = locationCache.getLastLocation();
        final boolean hasLocation = location != null;
        final double lat = hasLocation ? location.getLatitude() : 0.0;
        final double lon = hasLocation ? location.getLongitude() : 0.0;
        final String call = String.format(Locale.getDefault(),
                "search_mobile('%1$s', %2$b, %3$.6f, %4$.6f)",
                query.toLowerCase(), hasLocation, lat, lon);

        if (query.length() > 0) {
            executeJS(call);
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
