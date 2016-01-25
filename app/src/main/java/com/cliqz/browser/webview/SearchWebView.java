package com.cliqz.browser.webview;

import android.content.Context;
import android.location.Location;
import android.os.Build;
import android.os.Debug;
import android.support.annotation.Nullable;
import android.util.Log;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.List;
import java.util.Locale;

import acr.browser.lightning.app.BrowserApp;
import acr.browser.lightning.constant.Constants;
import acr.browser.lightning.database.HistoryItem;

/**
 * Created by kread on 13/07/15.
 */
public class SearchWebView extends BaseWebView {

    private static final String TAG = SearchWebView.class.getSimpleName();
    private static final boolean DO_PROFILE_QUERY = false;
    // app_debug includes single JS files, app includes minified JS
    private static final String CLIQZ_URL = "file:///android_asset/search/index.html";

    private String mLastQuery;
    private boolean mProfilingRunning = false;

    public SearchWebView(Context context) {
        super(context);
        BrowserApp.getAppComponent().inject(this);
    }

    @Nullable
    @Override
    protected WebViewClient createWebViewClient() {
        return new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(final WebView wv, final String url) {
                Log.d(TAG, "New url: " + url);
                return true;
            }
        };
    }

    @Nullable
    @Override
    protected Bridge createBridge() {
        return new CliqzBridge(this);
    }

    @Nullable
    @Override
    protected String getExtensionUrl() {
        return CLIQZ_URL;
    }


    private boolean isCliqzUrl() {
        final String url = getUrl();
        return url != null && url.startsWith(CLIQZ_URL);
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

    public void onQueryChanged(String q) {
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
        if (!isExtesionReady() || !isCliqzUrl()) {
            mLastQuery = query;
            return;
        }

        performSearch(query);
    }

    @Override
    void extensionReady() {
        super.extensionReady();
        final long t = System.currentTimeMillis() - state.getTimestamp();
        if (shouldShowHomePage()) {
            showHomepage();
        } else if (mLastQuery != null && !mLastQuery.isEmpty()) {
            performSearch(mLastQuery);
        }
    }

    private void performSearch(String query) {
        mLastQuery = query;
        final String lowerQuery = query.toLowerCase();
        state.setQuery(lowerQuery);
        final Location location = locationCache.getLastLocation();
        final boolean hasLocation = location != null;
        final double lat = hasLocation ? location.getLatitude() : 0.0;
        final double lon = hasLocation ? location.getLongitude() : 0.0;
        if (hasLocation) {
            state.setLatitude((float) lat);
            state.setLongitude((float) lon);
        } else {
            state.setLongitude(Float.MAX_VALUE);
            state.setLatitude(Float.MAX_VALUE);
        }
        final String call = String.format(Locale.US,
                "search_mobile('%1$s', %2$b, %3$.6f, %4$.6f)",
                lowerQuery, hasLocation, lat, lon);

        executeJS(call);
    }

    @Override
    public void onResume() {
        super.onResume();
        if (isExtesionReady() && shouldShowHomePage()) {
            showHomepage();
        }
    }

    private boolean shouldShowHomePage() {
        return (System.currentTimeMillis() - state.getTimestamp() >= Constants.HOME_RESET_DELAY);
    }

    private void showHomepage() {
        final JSONObject params = new JSONObject();
        try {
            switch (state.getMode()) {
                case SEARCH:
                    final float lon = state.getLongitude();
                    final float lat = state.getLatitude();
                    if ((lon < Float.MAX_VALUE - 1) && (lat < Float.MAX_VALUE - 1)) {
                        params.put("lat", lat);
                        params.put("lon", lon);
                    }
                    params.put("q", state.getQuery());
                    break;
                case WEBPAGE:
                    params.put("url", state.getUrl());
                    params.put("title", state.getTitle());
                    break;
            }
            executeJS(String.format(Locale.US, "resetState(%s);", params.toString()));
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }
}
