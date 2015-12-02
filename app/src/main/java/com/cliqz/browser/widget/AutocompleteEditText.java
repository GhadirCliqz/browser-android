package com.cliqz.browser.widget;

import android.content.ClipboardManager;
import android.content.Context;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.AttributeSet;
import android.util.Log;
import android.view.KeyEvent;
import android.widget.EditText;

import com.cliqz.browser.utils.Telemetry;

import java.util.ArrayList;

import javax.inject.Inject;

import acr.browser.lightning.app.BrowserApp;

/**
 * Custom EditText widget with autocompletion
 *
 * @author Stefano Pacifici
 * @date 2015/10/13
 */
public class AutocompleteEditText extends EditText {

    @Inject
    Telemetry mTelemetry;

    private final ArrayList<TextWatcher> mListeners = new ArrayList<>();
    private boolean mIsAutocompleting;
    private AutocompleteService mAutocompleteService;

    public AutocompleteEditText(Context context) {
        this(context, null);
    }

    public AutocompleteEditText(Context context, AttributeSet attrs) {
        this(context, attrs, 0);
        BrowserApp.getAppComponent().inject(this);

    }

    public AutocompleteEditText(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        super.addTextChangedListener(new DefaultTextWatcher());
        mIsAutocompleting = false;
        mAutocompleteService = AutocompleteService.createInstance(context);
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

    private void setAutocompleteText(CharSequence text) {
        mIsAutocompleting = true;
        final CharSequence currentText = getText();
        if (text.toString().startsWith(currentText.toString())) {
            setTextKeepState(text);
            final int selectionBegin = currentText.length();
            final int selectionEnd = text.length();
            post(new Runnable() {
                @Override
                public void run() {
                    setSelection(selectionBegin, selectionEnd);
                }
            });
        }
        mIsAutocompleting = false;
    }

    public AutocompleteService getAutocompleteService() {
        return mAutocompleteService;
    }

    private class DefaultTextWatcher implements TextWatcher {

        private boolean mDeleting = false;

        @Override
        public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            mDeleting = after == 0;
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

            if (!mDeleting) {
                if(count == 1) { //check to prevent sending keystroke signal when something is pasted in the url bar
                    mTelemetry.sendTypingSignal(Telemetry.Action.KEY_STROKE, s.length());
                }
            } else {
                mTelemetry.sendTypingSignal(Telemetry.Action.KEYSTROKE_DEL, s.length());
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

            if (!mDeleting) {
                final String autocompletion = mAutocompleteService.autocomplete(s.toString());
                if (autocompletion != null) {
                    setAutocompleteText(autocompletion);
                }
            }
            mDeleting = false;
        }
    }

    @Override
    public boolean onTextContextMenuItem(int id) {
        ClipboardManager clipboard = (ClipboardManager) getContext()
                .getSystemService(getContext().CLIPBOARD_SERVICE);
        switch (id){
            case android.R.id.paste:
                mTelemetry.sendPasteSignal(clipboard.getPrimaryClip().getItemAt(0).getText().length());
                break;
        }
        return super.onTextContextMenuItem(id);
    }
}
