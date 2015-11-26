package com.cliqz.browser.main;


import android.os.Bundle;
import android.support.annotation.Nullable;
import android.view.LayoutInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

import acr.browser.lightning.R;
import acr.browser.lightning.view.LightningView;
import butterknife.ButterKnife;
import butterknife.OnClick;

/**
 * @author Ravjit
 * @date 2015/11/24
 */
public class LightningFragment extends BaseFragment {

    protected static String URL = "url";
    protected static String UNIQUEID = "uniqueId";
    protected static String ISINCOGNITO = "isIncognito";

    private LightningView mLightningView = null;
    private String mUrl = "";

    @Override
    public View onCreateContentView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        if (mLightningView == null) {
            mLightningView = new LightningView(getActivity(), mUrl, false, "1");
        } else {
            final WebView webView = mLightningView.getWebView();
            ((ViewGroup) webView.getParent()).removeView(webView);
        }
        return mLightningView.getWebView();
    }

    public void setUrl(String url) {
        mUrl = url; // Cache it, used if we didn't create the view already
        if (mLightningView != null) {
            mLightningView.loadUrl(url);
        }
    }
    @Override
    protected int getMenuResource() {
        return R.menu.fragment_search_menu;
    }

    @Override
    protected boolean onMenuItemClick(MenuItem item) {
        switch (item.getItemId()) {
            case R.id.menu_suggestions:
                bus.post(new Messages.GoToSuggestions());
                return true;
            default:
                return false;
        }
    }

    @Nullable
    @Override
    protected View onCreateCustomToolbarView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        final View view = inflater.inflate(R.layout.fragment_lightning_toolbar, container, false);
        ButterKnife.bind(this, view);
        return view;
    }

    @OnClick(R.id.menu_history)
    void historyClicked() {
        bus.post(new Messages.GoToHistory());
    }

}
