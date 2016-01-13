package com.cliqz.browser.main;

import android.content.Context;
import android.net.Uri;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.util.Log;
import android.util.Patterns;
import android.view.LayoutInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewGroup.LayoutParams;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputMethodManager;
import android.webkit.URLUtil;
import android.webkit.WebView;
import android.widget.FrameLayout;

import com.cliqz.browser.webview.CliqzMessages;
import com.cliqz.browser.webview.SearchWebView;
import com.cliqz.browser.widget.AutocompleteEditText;
import com.cliqz.browser.widget.SearchBar;
import com.squareup.otto.Subscribe;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;

import acr.browser.lightning.R;
import acr.browser.lightning.bus.BrowserEvents;
import acr.browser.lightning.constant.Constants;
import acr.browser.lightning.utils.UrlUtils;
import acr.browser.lightning.view.AnimatedProgressBar;
import acr.browser.lightning.view.LightningView;
import butterknife.Bind;
import butterknife.ButterKnife;
import butterknife.OnClick;
import butterknife.OnEditorAction;

/**
 * @author Stefano Pacifici
 * @date 2015/11/23
 */
public class MainFragment extends BaseFragment {

    private static final String TAG = MainFragment.class.getSimpleName();
    private static final String STATE_KEY = TAG + ".STATE";
    private static final String NAVIGATION_STATE_KEY = TAG + ".NAVIGATION_STATE";

    enum State {
        SHOWING_SEARCH,
        SHOWING_BROWSER,
    }

    private String mUrl = "";

    private String mSearchEngine;
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
        if (savedInstanceState != null) {
            final String stateName = savedInstanceState.getString(STATE_KEY);
            final Bundle webViewOutState = savedInstanceState.getBundle(NAVIGATION_STATE_KEY);
            if (webViewOutState != null) {
                webView.restoreState(webViewOutState);
            }
            try {
                mState = State.valueOf(stateName);
            } catch (IllegalArgumentException e) {
                Log.i(TAG, "Can't convert " + stateName + " to state enum");
            }
        }
        mContentContainer.addView(webView);
        mContentContainer.addView(mSearchWebView);
    }

    @Override
    public void onActivityCreated(@Nullable Bundle savedInstanceState) {
        super.onActivityCreated(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();
        telemetry.sendLayerChangeSignal("present");
    }

    @Override
    public void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        outState.putString(STATE_KEY, mState.toString());
        final WebView webView = mLightningView != null ? mLightningView.getWebView() : null;
        if (webView != null) {
            final Bundle webViewOutState = new Bundle();
            webView.saveState(webViewOutState);
            outState.putBundle(NAVIGATION_STATE_KEY, webViewOutState);
        }
    }

    @Override
    public void onResume() {
        super.onResume();
//        final String query = mAutocompleteEditText.getQuery();
        if (mSearchWebView != null) {
            mSearchWebView.onResume();
//            if (query != null && !query.isEmpty()) {
//                mSearchWebView.onQueryChanged(query);
//            }
        }
        final Bundle arguments = getArguments();
        final String url = arguments != null ? arguments.getString("URL", ""): null;

        if (url != null && !url.isEmpty()) {
            mState = State.SHOWING_BROWSER;
            bus.post(new CliqzMessages.OpenLink(url));
            arguments.clear();
        } else {
            final boolean reset = System.currentTimeMillis() - state.getTimestamp() >= Constants.HOME_RESET_DELAY;
            mState = reset ? State.SHOWING_SEARCH : mState;
            final String query = reset ? "" : state.getQuery();
            if (mState == State.SHOWING_SEARCH) {
                bus.post(new Messages.ShowSearch(query));
            } else {
                bus.post(new CliqzMessages.OpenLink(state.getUrl()));
            }
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

    @OnEditorAction(R.id.search_edit_text)
    boolean onEditorAction(int actionId) {
        // Navigate to autocomplete url or search otherwise
        if (actionId == EditorInfo.IME_ACTION_GO) {
            final String content = mAutocompleteEditText.getText().toString();
            if (content != null && !content.isEmpty()) {
                if (Patterns.WEB_URL.matcher(content).matches()) {
                    final String guessedUrl = URLUtil.guessUrl(content);
                    if(mAutocompleteEditText.mIsAutocompleted) {
                        telemetry.sendResultEnterSignal(false, true,
                                mAutocompleteEditText.getQuery().length(), guessedUrl.length());
                    } else {
                        telemetry.sendResultEnterSignal(false, false, content.length(), -1);
                    }
                    bus.post(new CliqzMessages.OpenLink(guessedUrl));
                } else {
                    try {
                        final String query = URLEncoder.encode(content, "UTF-8").trim();
                        telemetry.sendResultEnterSignal(true, false, query.length(), -1);
                        setSearchEngine();
                        String searchUrl = mSearchEngine + UrlUtils.QUERY_PLACE_HOLDER;
                        bus.post(new CliqzMessages.OpenLink(UrlUtils.smartUrlFilter(query, true, searchUrl)));
                    } catch (UnsupportedEncodingException e) {
                        e.printStackTrace();
                        return false;
                    }
                }
                return true;
            }
        }
        return false;
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

    @Subscribe
    public void updateProgress(BrowserEvents.UpdateProgress event) {
        mProgressBar.setProgress(event.progress);
    }

    @Subscribe
    public void updateTitle(Messages.UpdateTitle event) {
        updateTitle();
    }

    @Subscribe
    public void updateUrl(BrowserEvents.UpdateUrl event) {
        final String url = event.url;
        if (url != null && !url.isEmpty() && !url.startsWith(Constants.CLIQZ_TRAMPOLINE)) {
            state.setUrl(url);
        }
    }

    @Subscribe
    public void openLink(CliqzMessages.OpenLink event) {
        final WebView webView = mLightningView.getWebView();
        final String eventUrl = event.url;
        // final String eventQuery = lastQuery;
        searchBar.showTitleBar();
        webView.bringToFront();
        mState = State.SHOWING_BROWSER;
        telemetry.resetNavigationVariables(eventUrl.length());
        final String url = Uri.parse(Constants.CLIQZ_TRAMPOLINE)
                .buildUpon()
                .appendQueryParameter("url", eventUrl)
                .appendQueryParameter("q", lastQuery)
                .build().toString();
        webView.loadUrl(url);
    }

    @Subscribe
    public void notifyQuery(CliqzMessages.NotifyQuery event) {
        bus.post(new Messages.ShowSearch(event.query));
    }

    @Subscribe
    public void onBackPressed(Messages.BackPressed event) {
        if (mLightningView.canGoBack()) {
            telemetry.backPressed = true;
            telemetry.showingCards = mState == State.SHOWING_SEARCH ? true : false;
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
        final String title = mLightningView.getTitle();
        searchBar.setTitle(title);
        state.setTitle(title);
    }

    private void setSearchEngine() {
        mSearchEngine = preferenceManager.getSearchChoice().engineUrl;
    }

}
