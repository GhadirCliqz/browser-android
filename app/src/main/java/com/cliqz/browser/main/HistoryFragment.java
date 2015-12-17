package com.cliqz.browser.main;

import android.os.Bundle;
import android.support.annotation.Nullable;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewGroup.LayoutParams;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ImageView;

import com.squareup.otto.Subscribe;

import acr.browser.lightning.R;
import acr.browser.lightning.constant.HistoryPage;
import butterknife.ButterKnife;
import butterknife.OnClick;

/**
 * @author Stefano Pacifici
 * @date 2015/11/23
 */
public class HistoryFragment extends BaseFragment {

    private WebView mView;

    @Override
    protected View onCreateContentView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        mView = new WebView(inflater.getContext());
        mView.setLayoutParams(new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
        mView.loadUrl(HistoryPage.getHistoryPage(inflater.getContext()));
        mView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url.startsWith("file")) {
                    return false;
                }

                bus.post(new Messages.GoToLink(url));
                return true;
            }
        });
        return mView;
    }

    @Override
    protected int getMenuResource() {
        return R.menu.fragment_history_menu;
    }

    @Override
    protected boolean onMenuItemClick(MenuItem item) {
        return false;
    }

    @Override
    public void onViewCreated(View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        ButterKnife.bind(this, view);
    }

    @OnClick(R.id.menu_search)
    void downClicked() {
        bus.post(new Messages.GoToSearch());
    }

    @Override
    protected int getFragmentTheme() {
        return R.style.Theme_Cliqz_History;
    }

    @Override
    public void onStart() {
        super.onStart();
        telemetry.sendLayerChangeSignal("past");
    }

    @Nullable
    @Override
    protected View onCreateCustomToolbarView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_history_toolbar, container, false);
    }

    @Subscribe
    public void onBackPressed(Messages.BackPressed event) {
        MainFragment mainFragment = (MainFragment)getActivity()
                .getSupportFragmentManager()
                .findFragmentByTag(MainActivity.SEARCH_FRAGMENT_TAG);
        if(mainFragment != null) {
            String state = mainFragment.mState == MainFragment.State.SHOWING_BROWSER ? "web" : "cards";
            telemetry.sendBackPressedSignal("past", state, mainFragment.mAutocompleteEditText.length());
        }
        bus.post(new Messages.GoToSearch());
    }
}
