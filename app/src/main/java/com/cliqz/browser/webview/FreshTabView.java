package com.cliqz.browser.webview;

import android.annotation.TargetApi;
import android.content.Context;
import android.os.Build;
import android.support.annotation.Nullable;
import android.util.AttributeSet;
import android.webkit.WebViewClient;

/**
 * @author Stefano Pacifici
 * @date 2015/12/08
 */
public class FreshTabView extends BaseWebView {

    private static final String FRESHTAB_URL = "file:///android_asset/incognito/index.html";

    public FreshTabView(Context context) {
        this(context, null);
    }

    public FreshTabView(Context context, AttributeSet attrs) {
        this(context, attrs, 0);
    }

    public FreshTabView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    @TargetApi(Build.VERSION_CODES.LOLLIPOP)
    public FreshTabView(Context context, AttributeSet attrs, int defStyleAttr, int defStyleRes) {
        super(context, attrs, defStyleAttr, defStyleRes);
    }

    @Nullable
    @Override
    protected WebViewClient createWebViewClient() {
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
        return FRESHTAB_URL;
    }
}
