package com.cliqz.browser.main;

import android.content.Context;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.support.annotation.Nullable;
import android.view.LayoutInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewGroup.LayoutParams;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.view.inputmethod.InputMethodManager;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;

import com.cliqz.browser.webview.CliqzView;
import com.cliqz.browser.widget.AutocompleteEditText;
import com.squareup.otto.Subscribe;

import acr.browser.lightning.R;
import acr.browser.lightning.bus.BrowserEvents;
import acr.browser.lightning.view.AnimatedProgressBar;
import acr.browser.lightning.view.LightningView;
import butterknife.Bind;
import butterknife.ButterKnife;
import butterknife.OnClick;

/**
 * @author Stefano Pacifici
 * @date 2015/11/23
 */
public class SearchFragment extends BaseFragment implements CliqzView.CliqzCallbacks {

    private enum State {
        SHOWING_SEARCH,
        SHOWING_BROWSER,
    }

    private final static int KEYBOARD_ANIMATION_DELAY = 200;

    private final Handler handler = new Handler(Looper.getMainLooper());

    private String mUrl = "";

    private State mState = State.SHOWING_SEARCH;

    CliqzView mCliqzView = null;
    LightningView mLightningView = null;

    @Bind(R.id.local_container)
    FrameLayout mContentContainer;

    @Bind(R.id.progress_view)
    AnimatedProgressBar mProgressBar;

    @Bind(R.id.menu_history)
    ImageView mMenuHistory;

    @Bind(R.id.search_bar)
    AutocompleteEditText mAutocompleteEditText;

    public SearchFragment() {
        getClass();
    }
    @Override
    public void onResume() {
        super.onResume();
        bus.register(this);
    }

    @Override
    public void onPause() {
        super.onPause();
        bus.unregister(this);
    }

    @Override
    protected View onCreateContentView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_search, container, false);
    }

    @Override
    public void onViewCreated(View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        ButterKnife.bind(this, view);
        if (mCliqzView == null || mLightningView == null) {
            mCliqzView = new CliqzView(view.getContext());
            mLightningView = new LightningView(getActivity(), mUrl, false, "1");
            mCliqzView.setLayoutParams(
                    new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
            mCliqzView.setResultListener(this);
            SearchFragmentListener.create(this);
        } else {
            final WebView webView = mLightningView.getWebView();
            ((ViewGroup) mCliqzView.getParent()).removeView(mCliqzView);
            ((ViewGroup) webView.getParent()).removeView(webView);
        }
        mLightningView.resumeTimers();
        final WebView webView = mLightningView.getWebView();
        webView.setId(R.id.right_drawer_list);
        // TODO I don't like this is too dirty, let's see if we can do better
        if (mState == State.SHOWING_SEARCH) {
            mContentContainer.addView(webView);
            mContentContainer.addView(mCliqzView);
        } else {
            mContentContainer.addView(mCliqzView);
            mContentContainer.addView(webView);
        }
    }

    @Override
    public void onDestroyView() {
        mLightningView.pauseTimers();
        super.onDestroyView();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
    }

    @Override
    public void onViewStateRestored(@Nullable Bundle savedInstanceState) {
        super.onViewStateRestored(savedInstanceState);
    }

    @Override
    public void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        mLightningView.getWebView().saveState(outState);
        mCliqzView.saveState(outState);
    }

    @Override
    protected int getMenuResource() {
        return R.menu.fragment_search_menu;
    }

    @Override
    protected boolean onMenuItemClick(MenuItem item) {
        switch (item.getItemId()) {
            case R.id.menu_suggestions:
                hideKeyboard();
                delayedPostOnBus(new Messages.GoToSuggestions());
                return true;
            case R.id.menu_settings:
                hideKeyboard();
                delayedPostOnBus(new Messages.GoToSettings());
                return true;
            default:
                return false;
        }
    }

    @Override
    protected int getFragmentTheme() {
        return R.style.Theme_Cliqz_Present;
    }

    @Nullable
    @Override
    protected View onCreateCustomToolbarView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_search_toolbar, container, false);
    }

    @OnClick(R.id.menu_history)
    void historyClicked() {
        hideKeyboard();
        delayedPostOnBus(new Messages.GoToHistory());
    }

    @Override
    public void onResultClicked(String url) {
        delayedPostOnBus(new Messages.OpenUrl(url));
    }

    @Override
    public void onNotifyQuery(String query) {

    }

    @Override
    public void onAutocompleteUrl(String str) {

    }

    // Hide the keyboard, used also in SearchFragmentListener
    void hideKeyboard() {
        InputMethodManager imm = (InputMethodManager) mAutocompleteEditText.getContext()
                .getSystemService(Context.INPUT_METHOD_SERVICE);
        imm.hideSoftInputFromWindow(mAutocompleteEditText.getWindowToken(), 0);
    }

    private void delayedPostOnBus(final Object event) {
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                bus.post(event);
            }
        }, KEYBOARD_ANIMATION_DELAY);
    }

    @Subscribe
    public void updateProgress(BrowserEvents.UpdateProgress event) {
        mProgressBar.setProgress(event.progress);
    }

    @Subscribe
    public void updateTitle(Messages.UpdateTitle event) {
        // setTitle();
    }

    @Subscribe
    public void openUrl(Messages.OpenUrl event) {
        final WebView webView = mLightningView.getWebView();
        if (mState != State.SHOWING_BROWSER){
//            final Animation slideInAnimation =
//                    AnimationUtils.loadAnimation(getContext(), R.anim.slide_in_from_right);
//            final Animation slideOutAnimation =
//                    AnimationUtils.loadAnimation(getContext(), R.anim.slide_out_to_left);
//            slideInAnimation.setFillAfter(true);
//            slideOutAnimation.setFillAfter(true);
//            mCliqzView.startAnimation(slideOutAnimation);
//            webView.startAnimation(slideInAnimation);
            webView.clearHistory();
            webView.bringToFront();
            mState = State.SHOWING_BROWSER;
        }
        webView.loadUrl(event.url);
    }

    void showSearch() {
        if (mState != State.SHOWING_SEARCH) {
//            final WebView webView = mLightningView.getWebView();
//            final Animation slideInAnimation =
//                    AnimationUtils.loadAnimation(getContext(), R.anim.slide_in_from_left);
//            final Animation slideOutAnimation =
//                    AnimationUtils.loadAnimation(getContext(), R.anim.slide_out_to_right);
//            slideInAnimation.setFillAfter(true);
//            slideOutAnimation.setFillAfter(true);
//            mCliqzView.startAnimation(slideInAnimation);
            mCliqzView.bringToFront();
//            webView.startAnimation(slideOutAnimation);
            mState = State.SHOWING_SEARCH;
        }
    }
}
