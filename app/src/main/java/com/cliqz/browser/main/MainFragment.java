package com.cliqz.browser.main;

import android.animation.Animator;
import android.app.ActivityManager;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.util.Log;
import android.util.Patterns;
import android.view.LayoutInflater;
import android.view.MenuItem;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewGroup.LayoutParams;
import android.view.animation.AccelerateInterpolator;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputMethodManager;
import android.webkit.URLUtil;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ListPopupWindow;
import android.widget.TextView;

import com.cliqz.browser.webview.CliqzMessages;
import com.cliqz.browser.webview.SearchWebView;
import com.cliqz.browser.widget.AutocompleteEditText;
import com.cliqz.browser.widget.OverFlowMenu;
import com.cliqz.browser.widget.SearchBar;
import com.squareup.otto.Subscribe;

import acr.browser.lightning.BuildConfig;
import acr.browser.lightning.R;
import acr.browser.lightning.bus.BrowserEvents;
import acr.browser.lightning.constant.Constants;
import acr.browser.lightning.utils.ThemeUtils;
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
    private static final int CLEAR = 0;
    private static final int RELOAD = 1;
    private static final int STOP = 2;
    private int currentIcon;
    private boolean isAnimationInProgress = false;

    public enum State {
        SHOWING_SEARCH,
        SHOWING_BROWSER,
    }

    private String mUrl = "";
    private String mSearchEngine;
    String lastQuery = "";

    public State mState = State.SHOWING_SEARCH;

    SearchWebView mSearchWebView = null;
    public LightningView mLightningView = null;

    @Bind(R.id.local_container)
    FrameLayout mLocalContainer;

    @Bind(R.id.progress_view)
    AnimatedProgressBar mProgressBar;

    @Bind(R.id.menu_history)
    View mMenuHistory;

    @Bind(R.id.search_bar)
    SearchBar searchBar;

    @Bind(R.id.search_edit_text)
    AutocompleteEditText mAutocompleteEditText;

    @Bind(R.id.title_bar)
    TextView titleBar;

    @Bind(R.id.overflow_menu)
    View overflowMenuButton;

    @Override
    protected View onCreateContentView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_search, container, false);
    }

    @Override
    public void onViewCreated(View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        ButterKnife.bind(this, view);
        if (mSearchWebView == null || mLightningView == null) {
            // Must use activity due to Crosswalk webview
            mSearchWebView = new SearchWebView(getActivity());
            mLightningView = new LightningView(getActivity()/*, mUrl */, false, "1");
            mSearchWebView.setLayoutParams(
                    new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
        } else {
            final WebView webView = mLightningView.getWebView();
            ((ViewGroup) mSearchWebView.getParent()).removeView(mSearchWebView);
            ((ViewGroup) webView.getParent()).removeView(webView);
        }

        MainFragmentListener.create(this);
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
        mLocalContainer.addView(webView);
        mLocalContainer.addView(mSearchWebView);
        titleBar.setOnTouchListener(onTouchListener);
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
        if (mSearchWebView != null) {
            mSearchWebView.onResume();
        }
        if (mLightningView != null) {
            mLightningView.onResume();
            mLightningView.resumeTimers();
        }

        // This code may look confused. It's relevant when we receive a new intent to open a new
        // url.
        final Bundle arguments = getArguments();
        final String url;
        if (arguments != null) {
            url = arguments.getString("URL", "");
            // We need to remove the key, otherwise the url get reloaded for each resume
            arguments.remove("URL");
        } else {
            url = null;
        }

        if (url != null && !url.isEmpty()) {
            mState = State.SHOWING_BROWSER;
            bus.post(new CliqzMessages.OpenLink(url, true));
            arguments.clear();
        } else {
            final boolean reset = System.currentTimeMillis() - state.getTimestamp() >= Constants.HOME_RESET_DELAY;
            mState = reset ? State.SHOWING_SEARCH : mState;
            final String query = reset ? "" : state.getQuery();
            if (mState == State.SHOWING_SEARCH) {
                showToolBar(null);
                bus.post(new Messages.ShowSearch(query));
            } else {
                mLightningView.getWebView().bringToFront();
                searchBar.showTitleBar();
                searchBar.setTitle(mLightningView.getTitle());
                switchIcon(RELOAD);
            }
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        if (mSearchWebView != null) {
            mSearchWebView.onPause();
        }
        if (mLightningView != null) {
            mLightningView.onPause();
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
        /* This code was removed because settings are now in the "PAST"
        switch (item.getItemId()) {
            case R.id.menu_settings:
                hideKeyboard();
                delayedPostOnBus(new Messages.GoToSettings());
                return true;
            default:
                return false;
        }
        */
        return false;
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

    @OnClick(R.id.overflow_menu)
    void menuClicked() {
        OverFlowMenu overFlowMenu = new OverFlowMenu(getActivity(), mState);
        overFlowMenu.setAnchorView(overflowMenuButton);
        overFlowMenu.show();
    }

    @OnEditorAction(R.id.search_edit_text)
    boolean onEditorAction(int actionId) {
        // Navigate to autocomplete url or search otherwise
        if ((actionId & EditorInfo.IME_MASK_ACTION) == EditorInfo.IME_ACTION_UNSPECIFIED) {
            final String content = mAutocompleteEditText.getText().toString();
            if (content != null && !content.isEmpty()) {
                if (Patterns.WEB_URL.matcher(content).matches()) {
                    final String guessedUrl = URLUtil.guessUrl(content);
                    if (mAutocompleteEditText.isAutocompleted()) {
                        telemetry.sendResultEnterSignal(false, true,
                                mAutocompleteEditText.getQuery().length(), guessedUrl.length());
                    } else {
                        telemetry.sendResultEnterSignal(false, false, content.length(), -1);
                    }
                    bus.post(new CliqzMessages.OpenLink(guessedUrl));
                } else {
                    telemetry.sendResultEnterSignal(true, false, content.length(), -1);
                    setSearchEngine();
                    String searchUrl = mSearchEngine + UrlUtils.QUERY_PLACE_HOLDER;
                    bus.post(new CliqzMessages.OpenLink(UrlUtils.smartUrlFilter(content, true, searchUrl)));
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
        if (!mLightningView.getUrl().contains(Constants.CLIQZ_TRAMPOLINE)) {
            if (event.progress == 100) {
                switchIcon(RELOAD);
            } else {
                switchIcon(STOP);
            }
        }
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
        final Uri.Builder builder = Uri.parse(Constants.CLIQZ_TRAMPOLINE).buildUpon();
        builder.appendQueryParameter("url", eventUrl)
                .appendQueryParameter("q", lastQuery);
        if (event.reset) {
            builder.appendQueryParameter("r", "true");
        }
        final String url = builder.build().toString();
        mLightningView.loadUrl(url);
        searchBar.setTitle(eventUrl);
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

    @Subscribe
    public void autocomplete(CliqzMessages.Autocomplete event) {
        mAutocompleteEditText.setAutocompleteText(event.completion);
    }


    @Subscribe
    public void reloadPage(Messages.ReloadPage event) {
        mLightningView.getWebView().reload();
    }

    @Subscribe
    public void shareLink(Messages.ShareLink event) {
        final String footer = getString(R.string.shared_using);
        final Intent intent = new Intent(Intent.ACTION_SEND);
        intent.setType("text/plain");
        intent.putExtra(Intent.EXTRA_TEXT, new StringBuilder()
                        .append(mLightningView.getUrl())
                        .append("\n")
                        .append(footer)
                        .toString()
        );
        startActivity(Intent.createChooser(intent, getString(R.string.share_link)));
    }

    @Subscribe
    public void contactCliqz(Messages.ContactCliqz event) {
        final Uri to = Uri.parse(String.format("mailto:%s?subject=%s",
                getString(R.string.feedback_at_cliqz_dot_com),
                Uri.encode(getString(R.string.feedback_mail_subject))));
        final Intent intent = new Intent(Intent.ACTION_SENDTO, to);
        intent.putExtra(Intent.EXTRA_TEXT, new StringBuilder()
                        .append("\n")
                        .append("Feedback für CLIQZ for Android (")
                        .append(BuildConfig.VERSION_NAME)
                        .append("), auf ")
                        .append(Build.MODEL)
                        .append(" (")
                        .append(Build.VERSION.SDK_INT)
                        .append(")")
                        .toString()
        );
        startActivity(Intent.createChooser(intent, getString(R.string.contact_cliqz)));
    }

    @Subscribe
    public void copyUrl(Messages.CopyUrl event) {
        if (mLightningView.getWebView() != null) {
            final ClipboardManager clipboard = (ClipboardManager) getContext()
                    .getSystemService(Context.CLIPBOARD_SERVICE);
            final ClipData clip = ClipData.newPlainText("link", mLightningView.getUrl());
            clipboard.setPrimaryClip(clip);
        }
    }

    @Subscribe
    public synchronized void hideToolBar(BrowserEvents.HideToolBar event) {
        if (mStatusBar.getTranslationY() >= 0.0f && !isAnimationInProgress) {
            isAnimationInProgress = true;
            final int height = mStatusBar.getHeight();
            mStatusBar.animate().translationY(-height).setInterpolator(new AccelerateInterpolator()).start();
            mContentContainer.animate().translationY(-height).setInterpolator(new AccelerateInterpolator())
                    .setListener(new Animator.AnimatorListener() {
                        @Override
                        public void onAnimationStart(Animator animation) {
                            int containerh = mContentContainer.getHeight();
                            mContentContainer.setLayoutParams(new LinearLayout.LayoutParams(
                                    LayoutParams.MATCH_PARENT, containerh + height));
                        }

                        @Override
                        public void onAnimationCancel(Animator animation) {
                        }

                        @Override
                        public void onAnimationRepeat(Animator animation) {
                        }

                        @Override
                        public void onAnimationEnd(Animator animation) {
                            isAnimationInProgress = false;
                        }
                    }).start();
        }
    }

    /**
     * @param event Marker for bus. Can be null if function is called directly.
     */
    @Subscribe
    public void showToolBar(BrowserEvents.ShowToolBar event) {
        if (mStatusBar.getTranslationY() < 0.0f && !isAnimationInProgress) {
            isAnimationInProgress = true;
            final int height = mStatusBar.getHeight();
            mStatusBar.animate().translationY(0).setInterpolator(new AccelerateInterpolator()).start();
            mContentContainer.animate().translationY(0).setInterpolator(new AccelerateInterpolator())
                    .setListener(new Animator.AnimatorListener() {
                        @Override
                        public void onAnimationStart(Animator animation) {
                        }

                        @Override
                        public void onAnimationCancel(Animator animation) {
                        }

                        @Override
                        public void onAnimationRepeat(Animator animation) {
                        }

                        @Override
                        public void onAnimationEnd(Animator animation) {
                            int containerh = mContentContainer.getHeight();
                            mContentContainer.setLayoutParams(new LinearLayout.LayoutParams(
                                    LayoutParams.MATCH_PARENT, containerh - height));
                            isAnimationInProgress = false;
                        }
                    }).start();
        }
    }

    void updateTitle() {
        final String title = mLightningView.getTitle();
        searchBar.setTitle(title);
        state.setTitle(title);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            getActivity().setTaskDescription(new ActivityManager.TaskDescription(title));
        }
    }

    private void setSearchEngine() {
        mSearchEngine = preferenceManager.getSearchChoice().engineUrl;
    }

    private void switchIcon(int type) {
        currentIcon = type;
        Drawable icon;
        switch (type) {
            case CLEAR:
                icon = ThemeUtils.getLightThemedDrawable(getContext(), R.drawable.ic_action_delete);
                break;
            case RELOAD:
                icon = ThemeUtils.getLightThemedDrawable(getContext(), R.drawable.ic_action_refresh);
                break;
            case STOP:
                icon = ThemeUtils.getLightThemedDrawable(getContext(), R.drawable.ic_action_delete);
                break;
            default:
                icon = ThemeUtils.getLightThemedDrawable(getContext(), R.drawable.ic_action_delete);
        }
        titleBar.setCompoundDrawablesWithIntrinsicBounds(null, null, icon, null);

    }

    private View.OnTouchListener onTouchListener = new View.OnTouchListener() {
        @Override
        public boolean onTouch(View view, MotionEvent event) {
            if (event.getAction() == MotionEvent.ACTION_UP) {
                int width = getContext().getResources().getDrawable(R.drawable.ic_action_delete).getIntrinsicWidth();
                if (event.getX() > (view.getWidth() - view.getPaddingRight()) - width) {
                    switch (currentIcon) {
                        case CLEAR:
                            mAutocompleteEditText.setText("");
                            break;
                        case STOP:
                            mLightningView.getWebView().stopLoading();
                            break;
                        case RELOAD:
                            mLightningView.getWebView().reload();
                            break;
                    }
                    return true;
                }
            }
            return false;
        }
    };

}
