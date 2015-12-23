package com.cliqz.browser.webview;

import android.annotation.TargetApi;
import android.content.Context;
import android.os.Build;
import android.support.annotation.Nullable;
import android.util.AttributeSet;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * @author Stefano Pacifici
 * @date 2015/12/08
 */
public class HistoryWebView extends BaseWebView {

    private static final String FRESHTAB_URL = "file:///android_asset/search/history.html";

    public HistoryWebView(Context context) {
        this(context, null);
    }

    public HistoryWebView(Context context, AttributeSet attrs) {
        this(context, attrs, 0);
    }

    public HistoryWebView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    @TargetApi(Build.VERSION_CODES.LOLLIPOP)
    public HistoryWebView(Context context, AttributeSet attrs, int defStyleAttr, int defStyleRes) {
        super(context, attrs, defStyleAttr, defStyleRes);
    }

    @Nullable
    @Override
    protected WebViewClient createWebViewClient() {
        return new WebViewClient();
    }

    @Nullable
    @Override
    protected Bridge createBridge() {
        return new CliqzBridge(this);
    }

    @Nullable
    @Override
    protected String getExtensionUrl() {
        return FRESHTAB_URL;
    }
}
