package com.cliqz.browser.main;

import android.os.Bundle;
import android.support.annotation.Nullable;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewGroup.LayoutParams;

import com.cliqz.browser.webview.CliqzMessages;
import com.cliqz.browser.webview.FreshTabWebView;
import com.squareup.otto.Subscribe;

import acr.browser.lightning.R;
import butterknife.ButterKnife;
import butterknife.OnClick;

/**
 * @author Stefano Pacifici
 * @date 2015/11/23
 */
public class FreshTabFragment extends BaseFragment {

    private FreshTabWebView mFreshTabWebView;

    @Override
    protected View onCreateContentView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        if (mFreshTabWebView == null) {
            mFreshTabWebView = new FreshTabWebView(inflater.getContext());
            mFreshTabWebView.setLayoutParams(
                    new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
        } else {
            ((ViewGroup) mFreshTabWebView.getParent()).removeView(mFreshTabWebView);
        }
        return mFreshTabWebView;
    }

    @Override
    public void onResume() {
        super.onResume();
        if (mFreshTabWebView != null) {
            mFreshTabWebView.onResume();
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        if (mFreshTabWebView != null) {
            mFreshTabWebView.onPause();
        }
    }

    @Override
    protected int getMenuResource() {
        return 0;
    }

    @Override
    protected boolean onMenuItemClick(MenuItem item) {
        return false;
    }

    @Override
    protected int getFragmentTheme() {
        return R.style.Theme_Cliqz_Suggestions;
    }

    @Nullable
    @Override
    protected View onCreateCustomToolbarView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_suggestions_toolbar, container, false);
        ButterKnife.bind(this, view);
        return view;
    }

    @Override
    public void onStart() {
        super.onStart();
        telemetry.sendLayerChangeSignal("future");
    }

    @OnClick(R.id.menu_search)
    void onUpClicked(){
        bus.post(new Messages.GoToSearch());
    }

    @Subscribe
    public void onBackPressed(Messages.BackPressed event) {
        MainFragment mainFragment = (MainFragment)getActivity()
                .getSupportFragmentManager()
                .findFragmentByTag(MainActivity.SEARCH_FRAGMENT_TAG);
        if(mainFragment != null) {
            String state = mainFragment.mState == MainFragment.State.SHOWING_BROWSER ? "web" : "cards";
            telemetry.sendBackPressedSignal("future", state, mainFragment.mAutocompleteEditText.length());
        }
        bus.post(new Messages.GoToSearch());
    }

    @Subscribe
    public void onOpenLink(CliqzMessages.OpenLink event) {
        bus.post(new Messages.GoToLink(event.url));
    }
}
