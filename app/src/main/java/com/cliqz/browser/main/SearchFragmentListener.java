package com.cliqz.browser.main;

import android.content.Context;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.EditText;
import android.widget.TextView;

import acr.browser.lightning.constant.Constants;
import acr.browser.lightning.view.LightningView;

/**
 * @author Stefano Pacifici
 * @date 2015/11/24
 */
class SearchFragmentListener implements EditText.OnKeyListener, View.OnFocusChangeListener,
        TextView.OnEditorActionListener, TextWatcher {
    private final SearchFragment fragment;

    public static SearchFragmentListener create(SearchFragment fragment) {
        return new SearchFragmentListener(fragment);
    }

    private SearchFragmentListener(SearchFragment fragment) {
        this.fragment = fragment;
        fragment.mAutocompleteEditText.setOnKeyListener(this);
        fragment.mAutocompleteEditText.setOnFocusChangeListener(this);
        fragment.mAutocompleteEditText.setOnEditorActionListener(this);
        // fragment.mAutocompleteEditText.setOnTouchListener(this);
        fragment.mAutocompleteEditText.addTextChangedListener(this);
    }

    @Override
    public boolean onKey(View v, int keyCode, KeyEvent event) {
        switch (keyCode) {
            case KeyEvent.KEYCODE_ENTER:
                InputMethodManager imm = (InputMethodManager) fragment.getContext()
                        .getSystemService(Context.INPUT_METHOD_SERVICE);
                imm.hideSoftInputFromWindow(fragment.mAutocompleteEditText.getWindowToken(), 0);
                // searchTheWeb(mSearch.getText().toString());
                return true;
            default:
                break;
        }
        return false;
    }

    @Override
    public void onFocusChange(View v, boolean hasFocus) {
        if (!hasFocus) {
            InputMethodManager imm = (InputMethodManager) fragment.getContext()
                    .getSystemService(Context.INPUT_METHOD_SERVICE);
            imm.hideSoftInputFromWindow(fragment.mAutocompleteEditText.getWindowToken(), 0);
        }
    }

    @Override
    public boolean onEditorAction(TextView v, int actionId, KeyEvent event) {
        return false;
    }

    @Override
    public void beforeTextChanged(CharSequence s, int start, int count, int after) {

    }

    @Override
    public void onTextChanged(CharSequence s, int start, int before, int count) {
        if (!fragment.mAutocompleteEditText.hasFocus()) {
            return;
        }

        final String q = s.toString();

        if (!q.isEmpty()) {
            fragment.mCliqzView.onQueryChanged(q);
        }
    }

    @Override
    public void afterTextChanged(Editable s) {

    }
}
