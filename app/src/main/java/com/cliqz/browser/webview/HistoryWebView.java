package com.cliqz.browser.webview;

import android.annotation.TargetApi;
import android.content.Context;
import android.os.Build;
import android.support.annotation.Nullable;
import android.util.AttributeSet;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import acr.browser.lightning.BuildConfig;

/**
 * @author Stefano Pacifici
 * @date 2015/12/08
 */
public class HistoryWebView extends BaseWebView {

    private static final String FRESHTAB_URL = "file:///android_asset/search/history.html";
    private static final String FRESHTAB_MANIFEST_URL = "file:///android_asset/search/history.json";

    public HistoryWebView(Context context) {
        super(context);
    }

    @Nullable
    @Override
    protected AWVClient createClient() {
        return null;
    }

    @Nullable
    @Override
    protected Bridge createBridge() {
        return new CliqzBridge(this);
    }

    @Nullable
    @Override
    protected String getExtensionUrl() {
        if ("xwalk".equals(BuildConfig.FLAVOR)) {
            return FRESHTAB_MANIFEST_URL;
        } else {
            return FRESHTAB_URL;
        }
    }

    public void fourceUpdateHistory() {
        executeJS("osBridge.searchHistory(\"\", \"showHistory\")");
    }
}
