package com.cliqz.browser.main;

import android.content.Context;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.support.annotation.Nullable;
import android.view.LayoutInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewGroup.LayoutParams;
import android.view.inputmethod.InputMethodManager;
import android.webkit.WebView;
import android.widget.FrameLayout;

import com.cliqz.browser.webview.CliqzMessages;
import com.cliqz.browser.webview.SearchWebView;
import com.cliqz.browser.widget.AutocompleteEditText;
import com.cliqz.browser.widget.SearchBar;
import com.squareup.otto.Subscribe;

import acr.browser.lightning.R;
import acr.browser.lightning.bus.BrowserEvents;
import acr.browser.lightning.constant.Constants;
import acr.browser.lightning.view.AnimatedProgressBar;
import acr.browser.lightning.view.LightningView;
import butterknife.Bind;
import butterknife.ButterKnife;
import butterknife.OnClick;

/**
 * @author Stefano Pacifici
 * @date 2015/11/23
 */
public class MainFragment extends BaseFragment {

    enum State {
        SHOWING_SEARCH,
        SHOWING_BROWSER,
    }

    private final static int KEYBOARD_ANIMATION_DELAY = 200;

    private final Handler handler = new Handler(Looper.getMainLooper());

    private String mUrl = "";

    String lastQuery = "";

    State mState = State.SHOWING_SEARCH;

    SearchWebView mSearchWebView = null;
    LightningView mLightningView = null;

    @Bind(R.id.local_container)
    FrameLayout mContentContainer;

    @Bind(R.id.progress_view)
    AnimatedProgressBar mProgressBar;

    @Bind(R.id.menu_history)
    View mMenuHistory;

    @Bind(R.id.search_bar)
    SearchBar searchBar;

    @Bind(R.id.search_edit_text)
    AutocompleteEditText mAutocompleteEditText;

    @Override
    protected View onCreateContentView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_search, container, false);
    }

    @Override
    public void onViewCreated(View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        ButterKnife.bind(this, view);
        if (mSearchWebView == null || mLightningView == null) {
            mSearchWebView = new SearchWebView(view.getContext());
            mLightningView = new LightningView(getActivity(), mUrl, false, "1");
            mSearchWebView.setLayoutParams(
                    new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
        } else {
            final WebView webView = mLightningView.getWebView();
            ((ViewGroup) mSearchWebView.getParent()).removeView(mSearchWebView);
            ((ViewGroup) webView.getParent()).removeView(webView);
        }
         MainFragmentListener.create(this);
        mLightningView.resumeTimers();
        final WebView webView = mLightningView.getWebView();
        webView.setId(R.id.right_drawer_list);
        // TODO I don't like this is too dirty, let's see if we can do better
        if (mState == State.SHOWING_SEARCH) {
            searchBar.showSearchEditText();
            mContentContainer.addView(webView);
            mContentContainer.addView(mSearchWebView);
        } else {
            updateTitle();
            searchBar.showTitleBar();
            mContentContainer.addView(mSearchWebView);
            mContentContainer.addView(webView);
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        if (mSearchWebView != null) {
            mSearchWebView.onResume();
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        if (mSearchWebView != null) {
            mSearchWebView.onPause();
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
        mSearchWebView.saveState(outState);
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

    @OnClick(R.id.title_bar)
    void titleClicked() {
        searchBar.showSearchEditText();
        mAutocompleteEditText.setText(mLightningView.getUrl());
        mAutocompleteEditText.requestFocus();
        showKeyBoard();
    }

    void showKeyBoard() {
        InputMethodManager inputMethodManager = (InputMethodManager) getActivity()
                .getSystemService(getActivity().INPUT_METHOD_SERVICE);
        inputMethodManager.showSoftInput(mAutocompleteEditText, InputMethodManager.SHOW_IMPLICIT);
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
        updateTitle();
    }

    @Subscribe
    public void openLink(CliqzMessages.OpenLink event) {
        final WebView webView = mLightningView.getWebView();
        final String eventUrl = event.url;
        // final String eventQuery = lastQuery;
        searchBar.showTitleBar();
        webView.bringToFront();
        mState = State.SHOWING_BROWSER;
        final String url = Uri.parse(Constants.CLIQZ_TRAMPOLINE)
                .buildUpon()
                .appendQueryParameter("url", event.url)
                .appendQueryParameter("q", lastQuery)
                .build().toString();
        webView.loadUrl(url);
    }

    @Subscribe
    public void onBackPressed(Messages.BackPressed event) {
        if (mLightningView.canGoBack()) {
            mLightningView.goBack();
            if (mState == State.SHOWING_SEARCH) {
                final WebView webView = mLightningView.getWebView();
                searchBar.showTitleBar();
                webView.bringToFront();
                mState = State.SHOWING_BROWSER;
            }
        } else {
            bus.post(new Messages.Exit());
        }
    }

    @Subscribe
    public void showSearch(Messages.ShowSearch event) {
        searchBar.showSearchEditText();
        mSearchWebView.bringToFront();
        mAutocompleteEditText.requestFocus();
        if (event != null) {
            mAutocompleteEditText.setText(event.query);
            mAutocompleteEditText.setSelection(event.query.length());
        }
        mState = State.SHOWING_SEARCH;
        showKeyBoard();
    }

    void updateTitle() {
        searchBar.setTitle(mLightningView.getTitle());
    }

}
