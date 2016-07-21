package com.cliqz.browser.main;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewGroup.LayoutParams;

import com.cliqz.browser.webview.CliqzMessages;
import com.cliqz.browser.webview.FavoritesWebView;
import com.cliqz.browser.webview.HistoryWebView;
import com.squareup.otto.Subscribe;

import acr.browser.lightning.preference.PreferenceManager;

/**
 * @author Stefano Pacifici
 * @date 2015/11/23
 */
public class HistoryFragment extends FragmentWithBus {

    protected HistoryWebView mHistoryWebView;

    private boolean mJustCreated = false;
    private boolean isFav;

    @SuppressLint("ValidFragment")
    public HistoryFragment(Activity activity) {
        super();
        createWebView(activity);
    }

    public HistoryFragment() {
        super();
    }

    public HistoryFragment(boolean isFav) {
        super();
        this.isFav = isFav;
    }

    private void createWebView(Activity activity) {
        // Must use activity due to Crosswalk webview
        mHistoryWebView = isFav ? new FavoritesWebView(activity) : new HistoryWebView(activity);
        mHistoryWebView.setLayoutParams(
                new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        if (mHistoryWebView == null) {
            createWebView(getActivity());
            mJustCreated = true;
        }
        final ViewGroup parent = (ViewGroup) mHistoryWebView.getParent();
        if (parent != null) {
            parent.removeView(mHistoryWebView);
        }
        return mHistoryWebView;
    }

    @Override
    public void onResume() {
        super.onResume();
        if (mHistoryWebView != null) {
            mHistoryWebView.onResume();
            if (!mJustCreated) {
                //mHistoryWebView.fourceUpdateHistory();
                mHistoryWebView.isVisible();
            }
            mJustCreated = false;
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        telemetry.sendLayerChangeSignal("past");

        final PreferenceManager.ClearQueriesOptions clear = preferenceManager.shouldClearQueries();
        if (clear != PreferenceManager.ClearQueriesOptions.NO) {
            mHistoryWebView.cleanupQueries(clear);
            preferenceManager.setShouldClearQueries(PreferenceManager.ClearQueriesOptions.NO);
        }
    }

    @Subscribe
    public void onOpenLink(CliqzMessages.OpenLink event) {
        bus.post(new Messages.GoToLink(event.url));
    }

    @Subscribe
    public void onNotifyQuery(CliqzMessages.NotifyQuery event) {
        bus.post(new Messages.GoToSearch(event.query));
    }

}
