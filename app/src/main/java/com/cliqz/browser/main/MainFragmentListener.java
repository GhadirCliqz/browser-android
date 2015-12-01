package com.cliqz.browser.main;

import android.text.Editable;
import android.text.TextWatcher;
import android.view.KeyEvent;
import android.view.View;
import android.widget.EditText;
import android.widget.TextView;

/**
 * @author Stefano Pacifici
 * @date 2015/11/24
 */
class MainFragmentListener implements EditText.OnKeyListener, View.OnFocusChangeListener,
        TextView.OnEditorActionListener, TextWatcher {
    private final MainFragment fragment;

    public static MainFragmentListener create(MainFragment fragment) {
        return new MainFragmentListener(fragment);
    }

    private MainFragmentListener(MainFragment fragment) {
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
                fragment.hideKeyboard();
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
            fragment.hideKeyboard();
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
            fragment.bus.post(new Messages.SearchFor(q));
        }
    }

    @Override
    public void afterTextChanged(Editable s) {

    }
}
