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
public class SearchFragment extends BaseFragment implements CliqzView.CliqzCallbacks {
    CliqzView mCliqzView = null;

    @Bind(R.id.menu_history)
    ImageView mMenuHistory;

    @Bind(R.id.search_bar)
    AutocompleteEditText mAutocompleteEditText;

    @Override
    protected View onCreateContentView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        if (mCliqzView == null) {
            mCliqzView = new CliqzView(inflater.getContext());
            mCliqzView.setLayoutParams(
                    new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
            mCliqzView.setResultListener(this);
        } else {
            final ViewGroup parent = (ViewGroup) mCliqzView.getParent();
            parent.removeView(mCliqzView);
        }
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

    @Override
    public void onResultClicked(String url) {
        final FragmentManager fm = getFragmentManager();
        final LightningFragment lightningFragment = new LightningFragment();
        final Bundle bundle = new Bundle();
        bundle.putString(LightningFragment.URL, url);
        bundle.putString(LightningFragment.UNIQUEID, "1");
        bundle.putBoolean(LightningFragment.ISINCOGNITO, false);
        lightningFragment.setArguments(bundle);
        fm.beginTransaction()
                .setCustomAnimations(R.anim.slide_in_from_right, R.anim.slide_out_to_right)
                .add(android.R.id.content, lightningFragment)
                .addToBackStack(null)
                .commit();
    }

    @Override
    public void onNotifyQuery(String query) {

    }

    @Override
    public void onAutocompleteUrl(String str) {

    }
}
