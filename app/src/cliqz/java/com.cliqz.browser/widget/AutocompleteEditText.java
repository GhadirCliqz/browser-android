package com.cliqz.browser.widget;

import android.content.Context;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.AttributeSet;
import android.view.KeyEvent;
import android.widget.EditText;

import java.util.ArrayList;

/**
 * @author Stefano Pacifici
 * @date 2015/10/13
 */
public class AutocompleteEditText extends EditText {

    private final ArrayList<TextWatcher> mListeners = new ArrayList<>();
    private boolean mIsAutocompleting;

    public AutocompleteEditText(Context context) {
        this(context, null);
    }

    public AutocompleteEditText(Context context, AttributeSet attrs) {
        this(context, attrs, 0);
    }

    public AutocompleteEditText(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        super.addTextChangedListener(new DefaultTextWatcher());
        mIsAutocompleting = false;
    }

    @Override
    public void addTextChangedListener(TextWatcher watcher) {
        final int index = mListeners.indexOf(watcher);
        if (index < 0) {
            mListeners.add(watcher);
        }
    }

    @Override
    public void removeTextChangedListener(TextWatcher watcher) {
        final int index = mListeners.indexOf(watcher);
        if (index >= 0) {
            mListeners.remove(index);
        }
    }

    @Override
    public boolean onKeyPreIme (int keyCode, KeyEvent event) {
        if(keyCode == KeyEvent.KEYCODE_BACK && this.hasFocus()) {
            this.clearFocus();
        }
        return super.onKeyPreIme(keyCode, event);
    }

    public void setAutocompleteText(CharSequence text) {
        mIsAutocompleting = true;
        final CharSequence currentText = getText();
        if (text.toString().startsWith(currentText.toString())) {
            setTextKeepState(text);
            setSelection(currentText.length(), text.length());
        }
        mIsAutocompleting = false;
    }

    private class DefaultTextWatcher implements TextWatcher {

        @Override
        public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            if (mIsAutocompleting) {
                return;
            }

            for (TextWatcher watcher: mListeners) {
                watcher.beforeTextChanged(s, start, count, after);
            }
        }

        @Override
        public void onTextChanged(CharSequence s, int start, int before, int count) {
            if (mIsAutocompleting) {
                return;
            }

            for (TextWatcher watcher: mListeners) {
                watcher.onTextChanged(s, start, before, count);
            }
        }

        @Override
        public void afterTextChanged(Editable s) {
            if (mIsAutocompleting) {
                return;
            }
            for (TextWatcher watcher: mListeners) {
                watcher.afterTextChanged(s);
            }
        }
    }
}
