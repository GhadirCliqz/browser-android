package com.cliqz.browser.main;

import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;

/**
 * @author Stefano Pacifici
 * @date 2015/11/24
 */
class MainFragmentListener implements View.OnFocusChangeListener, TextWatcher {
    private final MainFragment fragment;

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
            fragment.hideKeyboard();
            if(fragment.mState == MainFragment.State.SHOWING_BROWSER) {
                fragment.searchBar.showTitleBar();
            }
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
        if (!q.isEmpty() && fragment.mSearchWebView != null) {
            fragment.lastQuery = q;
            fragment.mSearchWebView.onQueryChanged(q);
        }
    }

    @Override
    public void afterTextChanged(Editable s) {

    }

}
