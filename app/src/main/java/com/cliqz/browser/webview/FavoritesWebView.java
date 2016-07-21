package com.cliqz.browser.webview;

import android.content.Context;
import android.support.annotation.Nullable;

/**
 * Created by Ravjit on 04/08/16.
 */
public class FavoritesWebView extends HistoryWebView {

    private static final String FRESHTAB_URL_FAV = "file:///android_asset/search/history.html#favorites";

    public FavoritesWebView(Context context) {
        super(context);
    }

    @Nullable
    @Override
    protected String getExtensionUrl() {
        return FRESHTAB_URL_FAV;
    }
}

