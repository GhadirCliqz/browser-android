package com.cliqz.browser.main;

import android.text.Editable;
import android.text.TextWatcher;
import android.util.Log;
import android.util.Patterns;
import android.view.KeyEvent;
import android.view.View;
import android.widget.TextView;
import android.webkit.URLUtil;
import android.widget.EditText;

import acr.browser.lightning.app.BrowserApp;
import acr.browser.lightning.utils.UrlUtils;

/**
 * @author Stefano Pacifici
 * @date 2015/11/24
 */
class MainFragmentListener implements View.OnFocusChangeListener, TextWatcher {
    private final MainFragment fragment;
    private int queryLength;

    public static MainFragmentListener create(MainFragment fragment) {
        return new MainFragmentListener(fragment);
    }

    private MainFragmentListener(MainFragment fragment) {
        this.fragment = fragment;
        fragment.mAutocompleteEditText.setOnFocusChangeListener(this);
        fragment.mAutocompleteEditText.addTextChangedListener(this);
    }

    @Override
    public void onFocusChange(View v, boolean hasFocus) {
        if (!hasFocus) {
            fragment.telemetry.sendURLBarBlurSignal();
            fragment.hideKeyboard();
            if(fragment.mState == MainFragment.State.SHOWING_BROWSER) {
                fragment.searchBar.showTitleBar();
            }
        } else {
            fragment.timings.setUrlBarFocusedTime();
            String context = fragment.mState == MainFragment.State.SHOWING_BROWSER ? "web" : "cards";
            fragment.telemetry.sendURLBarFocusSignal(context);
        }
    }

    @Override
    public void beforeTextChanged(CharSequence s, int start, int count, int after) {

    }

    @Override
    public void onTextChanged(CharSequence s, int start, int before, int count) {
        if (!fragment.mAutocompleteEditText.hasFocus()) {
            return;
        }

        fragment.showSearch(null);

        final String q = s.toString();
        if (fragment.mSearchWebView != null) {
            fragment.lastQuery = q;
            fragment.mSearchWebView.onQueryChanged(q);
        }
    }

    @Override
    public void afterTextChanged(Editable s) {
        fragment.timings.setLastTypedTime();
    }
}
