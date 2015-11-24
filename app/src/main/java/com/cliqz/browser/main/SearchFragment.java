package com.cliqz.browser.main;

import android.graphics.Color;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentManager;
import android.view.LayoutInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewGroup.LayoutParams;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageView;

import com.cliqz.browser.webview.CliqzView;
import com.cliqz.browser.widget.AutocompleteEditText;

import acr.browser.lightning.R;
import butterknife.Bind;
import butterknife.ButterKnife;
import butterknife.OnClick;

/**
 * @author Stefano Pacifici
 * @date 2015/11/23
 */
public class SearchFragment extends BaseFragment {
    CliqzView mCliqzView;

    @Bind(R.id.menu_history)
    ImageView mMenuHistory;

    @Bind(R.id.search_bar)
    AutocompleteEditText mAutocompleteEditText;

    @Override
    protected View onCreateContentView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        mCliqzView = new CliqzView(inflater.getContext());
        mCliqzView.setLayoutParams(new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
        return mCliqzView;
    }

    @Override
    protected int getMenuResource() {
        return R.menu.fragment_search_menu;
    }

    @Override
    protected boolean onMenuItemClick(MenuItem item) {
        final FragmentManager fm = getFragmentManager();
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
        final View view = inflater.inflate(R.layout.fragment_search_toolbar, container, false);
        ButterKnife.bind(this, view);
        return view;
    }

    @Override
    protected void onViewCreated() {
        // Wire the search here
        SearchFragmentListener.create(this);
    }

    @OnClick(R.id.menu_history)
    void historyClicked() {
        bus.post(new Messages.GoToHistory());
    }
}
