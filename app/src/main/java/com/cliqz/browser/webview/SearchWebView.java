package com.cliqz.browser.webview;

import android.content.Context;
import android.location.Location;
import android.os.Build;
import android.os.Debug;
import android.support.annotation.Nullable;
import android.util.Log;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.cliqz.browser.main.CliqzBrowserState;

import java.util.List;
import java.util.Locale;

import javax.inject.Inject;

import acr.browser.lightning.app.BrowserApp;
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
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                executeJS(String.format(Locale.US,"initSearch(%s);", state.toJSON()));
            }

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

        if (query.equals(mLastQuery)) {
            return;
        }
        performSearch(query);
    }

    @Override
    void extensionReady() {
        super.extensionReady();
        if (mLastQuery != null && !mLastQuery.isEmpty()) {
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
}
