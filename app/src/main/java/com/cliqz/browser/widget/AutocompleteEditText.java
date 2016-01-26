package com.cliqz.browser.widget;

import android.content.ClipboardManager;
import android.content.Context;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.AttributeSet;
import android.util.Log;
import android.view.inputmethod.EditorInfo;
import android.widget.EditText;
import android.widget.TextView;

import com.cliqz.browser.utils.Telemetry;

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

    private static final String TAG = AutocompleteEditText.class.getSimpleName();
    
    @Inject
    Telemetry mTelemetry;

    private final ArrayList<TextWatcher> mListeners = new ArrayList<>();
    private boolean mIsAutocompleting;
    private boolean mDeleting = false;

    // private AutocompleteService mAutocompleteService;

    public boolean mIsAutocompleted;
    private int mSelectionStart;
    private int mSelectionEnd;

    public AutocompleteEditText(Context context) {
        this(context, null);
    }

    public AutocompleteEditText(Context context, AttributeSet attrs) {
        this(context, attrs, 0);
    }

    public AutocompleteEditText(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        super.addTextChangedListener(new DefaultTextWatcher());
        final int imeOptions = getImeOptions() | EditorInfo.IME_FLAG_NO_EXTRACT_UI;
        setImeOptions(imeOptions);
        mIsAutocompleting = false;
        mIsAutocompleted = false;
        // mAutocompleteService = AutocompleteService.createInstance(context);
        BrowserApp.getAppComponent().inject(this);
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

    public String getQuery() {
        return getText().toString().substring(0, getSelectionStart());
    }

    /*
    @Override
    public boolean onKeyPreIme (int keyCode, KeyEvent event) {
        if(keyCode == KeyEvent.KEYCODE_BACK && this.hasFocus()) {
            this.clearFocus();
            return true;
        }
        return super.onKeyPreIme(keyCode, event);
    }*/

    public void setAutocompleteText(CharSequence text) {
        if (mDeleting) {
            return;
        }
        mIsAutocompleting = true;
        mIsAutocompleted = true;
        final CharSequence currentText = getText();
        if (text.toString().startsWith(currentText.toString())) {
            setTextKeepState(text);
            mSelectionStart = currentText.length();
            mSelectionEnd = text.length();
            final int selectionBegin = mSelectionStart;
            final int selectionEnd = mSelectionEnd;
            post(new Runnable() {
                @Override
                public void run() {
                    final int tl = currentText.length();
                    // TODO: Check this, sometimes the next instruction crash
                    try {
                        setSelection(selectionBegin, selectionEnd);
                    } catch (IndexOutOfBoundsException e) {
                        Log.i(TAG, "Can't select part of the url bar", e);
                    }
                }
            });
        }
        mIsAutocompleting = false;
    }

//    public AutocompleteService getAutocompleteService() {
//        return mAutocompleteService;
//    }

    private class DefaultTextWatcher implements TextWatcher {

        @Override
        public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            if (mIsAutocompleting) {
                return;
            }
            mDeleting = after < 1;

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

            if (mDeleting) {
                mTelemetry.sendTypingSignal(Telemetry.Action.KEYSTROKE_DEL, s.length());
            }
        }

        @Override
        public void afterTextChanged(Editable s) {
            if (mIsAutocompleting) {
                return;
            }
            mIsAutocompleted = false;
            for (TextWatcher watcher: mListeners) {
                watcher.afterTextChanged(s);
            }

//            if (!mDeleting) {
//                final String autocompletion = mAutocompleteService.autocomplete(s.toString());
//                if (autocompletion != null) {
//                    setAutocompleteText(autocompletion);
//                }
//            }
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
