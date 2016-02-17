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
import android.support.v4.content.ContextCompat;
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
import android.widget.TextView;
import android.widget.Toast;

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
    private static final int ICON_STATE_CLEAR = 0;
    //private static final int RELOAD = 1;
    private static final int ICON_STATE_STOP = 2;
    private static final int ICON_STATE_NONE = 3;
    private int currentIcon;
    private boolean isAnimationInProgress = false;
    private OverFlowMenu mOverFlowMenu = null;
    private boolean isIncognito = false;

    public enum State {
        SHOWING_SEARCH,
        SHOWING_BROWSER,
    }

    private String url = null;
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
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        final Bundle arguments = getArguments();
        if (arguments != null) {
            parseArguments(arguments);
        }
    }

    private void parseArguments(Bundle arguments) {
        isIncognito = arguments.getBoolean(Constants.KEY_IS_INCOGNITO, false);
        url = arguments.getString(Constants.KEY_URL, null);
        // We need to remove the key, otherwise the url get reloaded for each resume
        arguments.remove(Constants.KEY_URL);
    }

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
            mLightningView = new LightningView(getActivity()/*, mUrl */, isIncognito, "1");
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

        if (url != null && !url.isEmpty()) {
            mState = State.SHOWING_BROWSER;
            bus.post(new CliqzMessages.OpenLink(url, true));
            url = null;
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
                switchIcon(ICON_STATE_NONE);
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
        if(isIncognito) {
            return R.style.Theme_Cliqz_Present_Incognito;
        } else {
            return R.style.Theme_Cliqz_Present;
        }
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
        mOverFlowMenu = new OverFlowMenu(getActivity());
        mOverFlowMenu.setBrowserState(mState);
        mOverFlowMenu.setCanGoForward(mLightningView.canGoForward());
        mOverFlowMenu.setAnchorView(overflowMenuButton);
        mOverFlowMenu.setIncognitoMode(isIncognito);
        mOverFlowMenu.show();
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

    private void shareText(String text) {
        final String footer = getString(R.string.shared_using);
        final Intent intent = new Intent(Intent.ACTION_SEND);
        intent.setType("text/plain");
        intent.putExtra(Intent.EXTRA_TEXT, new StringBuilder()
                        .append(text)
                        .append("\n")
                        .append(footer)
                        .toString()
        );
        startActivity(Intent.createChooser(intent, getString(R.string.share_link)));
    }

    @Subscribe
    public void updateProgress(BrowserEvents.UpdateProgress event) {
        mProgressBar.setProgress(event.progress);
        if (!mLightningView.getUrl().contains(Constants.CLIQZ_TRAMPOLINE)) {
            if (event.progress == 100) {
                switchIcon(ICON_STATE_NONE);
            } else {
                switchIcon(ICON_STATE_STOP);
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

    private void bringWebViewToFront() {
        final WebView webView = mLightningView.getWebView();
        searchBar.showTitleBar();
        webView.bringToFront();
        mState = State.SHOWING_BROWSER;
    }

    @Subscribe
    public void openLink(CliqzMessages.OpenLink event) {
        final String eventUrl = event.url;
        // final String eventQuery = lastQuery;
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
        bringWebViewToFront();
    }

    @Subscribe
    public void notifyQuery(CliqzMessages.NotifyQuery event) {
        bus.post(new Messages.ShowSearch(event.query));
    }

    @Subscribe
    public void onBackPressed(Messages.BackPressed event) {
        // We can go back if:
        // 1. the webview can go back
        if (mOverFlowMenu != null && mOverFlowMenu.isShowing()) {
            mOverFlowMenu.dismiss();
            mOverFlowMenu = null;
        } else if (mState == State.SHOWING_SEARCH && mLightningView.canGoBack()) {
            // In any case the trampoline will be current page predecessor
            bringWebViewToFront();
        } else if (mLightningView.canGoBack()) {
            telemetry.backPressed = true;
            telemetry.showingCards = mState == State.SHOWING_SEARCH ? true : false;
            mLightningView.goBack();
        } else {
            bus.post(new Messages.Exit());
        }
    }

    @Subscribe
    public void onGoForward(Messages.GoForward event) {
        if (mLightningView.canGoForward()) {
            mLightningView.goForward();
            if (mState == State.SHOWING_SEARCH) {
                bringWebViewToFront();
            }
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
        if(mState == State.SHOWING_SEARCH) {
            mSearchWebView.requestCardUrl();
        } else {
            final String url = mLightningView.getUrl();
            shareText(url);
        }
    }

    @Subscribe
    public void shareCard(Messages.ShareCard event) {
        final String url = event.url;
        if(url.equals("-1")) {
            Toast.makeText(getContext(), getString(R.string.not_shareable), Toast.LENGTH_SHORT).show();
        } else {
            shareText(url);
        }
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
    public void copyData(CliqzMessages.CopyData event) {
        final String message = getResources().getString(R.string.message_text_copied);
        final ClipboardManager clipboard = (ClipboardManager) getContext()
                .getSystemService(Context.CLIPBOARD_SERVICE);
        final ClipData clip = ClipData.newPlainText("result", event.data);
        clipboard.setPrimaryClip(clip);
        Toast.makeText(getContext(), message, Toast.LENGTH_SHORT).show();
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
            case ICON_STATE_CLEAR:
                icon = ThemeUtils.getLightThemedDrawable(getContext(), R.drawable.ic_action_delete);
                break;
//            case RELOAD:
//                icon = ThemeUtils.getLightThemedDrawable(getContext(), R.drawable.ic_action_refresh);
//                break;
            case ICON_STATE_STOP:
                icon = ThemeUtils.getLightThemedDrawable(getContext(), R.drawable.ic_action_delete);
                break;
            case ICON_STATE_NONE:
                icon = null;
                final int height = ContextCompat.getDrawable(getContext(), R.drawable.ic_action_delete)
                        .getIntrinsicHeight();
                titleBar.setHeight(height);
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
                        case ICON_STATE_CLEAR:
                            searchBar.showSearchEditText();
                            mAutocompleteEditText.setText("");
                            break;
                        case ICON_STATE_STOP:
                            mLightningView.getWebView().stopLoading();
                            break;
//                        case RELOAD:
//                            mLightningView.getWebView().reload();
//                            break;
                    }
                    return true;
                }
            }
            return false;
        }
    };

}
