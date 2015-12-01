package com.cliqz.browser.main;


import android.os.Bundle;
import android.support.annotation.Nullable;
import android.view.LayoutInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.squareup.otto.Bus;
import com.squareup.otto.Subscribe;

import javax.inject.Inject;

import acr.browser.lightning.R;
import acr.browser.lightning.app.BrowserApp;
import acr.browser.lightning.bus.BrowserEvents;
import acr.browser.lightning.view.AnimatedProgressBar;
import acr.browser.lightning.view.LightningView;
import butterknife.Bind;
import butterknife.ButterKnife;
import butterknife.OnClick;

/**
 * @author Ravjit
 * @date 2015/11/24
 */
public class LightningFragment extends FragmentWithBus {

    protected static String URL = "url";
    protected static String UNIQUEID = "uniqueId";
    protected static String ISINCOGNITO = "isIncognito";

    private LightningView mLightningView = null;
    private String mUrl = "";
    private AnimatedProgressBar mProgressBar;

    public LightningFragment() {
        bus.register(this);
    }

    @Bind(R.id.title)
    TextView mTitle;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        if (mLightningView == null) {
            mLightningView = new LightningView(getActivity(), mUrl, false, "1");
        } else {
            final WebView webView = mLightningView.getWebView();
            ((ViewGroup) webView.getParent()).removeView(webView);
        }
        final View view = inflater.inflate(R.layout.fragment_lightning, container, false);
        LinearLayout contentContainer = (LinearLayout) view.findViewById(R.id.content_container);
        mProgressBar = (AnimatedProgressBar) view.findViewById(R.id.progress_view);
        contentContainer.addView(mLightningView.getWebView());
        return view;
    }

    /**
     * Set the url to load in the LightningView
     * @param url
     */
    public void setUrl(String url) {
        mUrl = url; // Cache it, used if we didn't create the view already
        if (mLightningView != null) {
            mLightningView.getWebView().clearHistory();
            mLightningView.loadUrl(url);
        }
    }

    @OnClick(R.id.menu_history)
    void historyClicked() {
        bus.post(new Messages.GoToHistory());
    }

    @OnClick(R.id.title)
    void goBack() {
        getFragmentManager().popBackStack();
    }

    private void onProgress(int progress) {
        mProgressBar.setProgress(progress);
    }

    private void setTitle() {
        // mTitle.setText(mLightningView.getTitle());
    }

    @Subscribe
    public void updateProgress(BrowserEvents.UpdateProgress event) {
        onProgress(event.progress);
    }

    @Subscribe
    public void updateTitle(Messages.UpdateTitle event) {
        setTitle();
    }
}
