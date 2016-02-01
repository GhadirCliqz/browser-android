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
public class FreshTabWebView extends BaseWebView {

    private static final String FRESHTAB_URL = "file:///android_asset/search/freshtab.html";

    public FreshTabWebView(Context context) {
        super(context);
    }


    @Nullable
    @Override
    protected AWVClient createClient() {
        return new AWVClient() {
            @Override
            public void onPageFinished(AbstractionWebView view, String url) {
                super.onPageFinished(view, url);
                executeJS("initFreshtab()");
            }
        };
    }

    @Nullable
    @Override
    protected String getExtensionUrl() {
        return FRESHTAB_URL;
    }
}
