package com.cliqz.browser.main;

import android.graphics.Color;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.view.LayoutInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import acr.browser.lightning.R;

/**
 * @author Stefano Pacifici
 * @date 2015/11/23
 */
public class HistoryFragment extends BaseFragment {

    private View mView;

    @Override
    protected View onCreateContentView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        mView = new FrameLayout(container.getContext());
        mView.setBackgroundColor(Color.YELLOW);
        return mView;
    }

    @Override
    protected int getMenuResource() {
        return R.menu.main;
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
