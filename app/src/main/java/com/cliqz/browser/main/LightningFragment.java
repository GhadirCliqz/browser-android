package com.cliqz.browser.main;


import android.os.Bundle;
import android.support.annotation.Nullable;
import android.view.LayoutInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;

import acr.browser.lightning.view.LightningView;

/**
 * @author Ravjit
 * @date 2015/11/24
 */
public class LightningFragment extends BaseFragment {

    protected static String URL = "url";
    protected static String UNIQUEID = "uniqueId";
    protected static String ISINCOGNITO = "isIncognito";

    @Override
    public View onCreateContentView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        Bundle bundle = getArguments();
        String url = bundle.getString(URL);
        String uniqueId = bundle.getString(UNIQUEID);
        boolean isIncognito = bundle.getBoolean(ISINCOGNITO);
        return new LightningView(getActivity(), url, isIncognito, uniqueId).getWebView();
    }

    @Override
    protected int getMenuResource() {
        return 0;
    }

    @Override
    protected boolean onMenuItemClick(MenuItem item) {
        return false;
    }

    @Nullable
    @Override
    protected View onCreateCustomToolbarView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        return null;
    }


}
