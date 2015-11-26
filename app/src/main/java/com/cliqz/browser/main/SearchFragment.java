package com.cliqz.browser.main;

import android.content.Context;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.support.annotation.Nullable;
import android.support.v4.app.FragmentManager;
import android.view.LayoutInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewGroup.LayoutParams;
import android.view.inputmethod.InputMethodManager;
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

    private final static int KEYBOARD_ANIMATION_DELAY = 200;

    private final Handler handler = new Handler(Looper.getMainLooper());

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
}
