package com.cliqz.browser.widget;

import android.content.ClipboardManager;
import android.content.Context;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.AttributeSet;
import android.util.Log;
import android.view.inputmethod.EditorInfo;
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

    private static final String TAG = AutocompleteEditText.class.getSimpleName();
    
    @Inject
    Telemetry mTelemetry;

    private final ArrayList<TextWatcher> mListeners = new ArrayList<>();
    private boolean mIsAutocompleting;
    private boolean mDeleting = false;

    // private AutocompleteService mAutocompleteService;

    private boolean mIsAutocompleted;
    private boolean mIsTyping = false;
    private AutocompleteRunnable autocompleteRunnable = null;

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

    public boolean isAutocompleted() {
        return mIsAutocompleted;
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
        final String autocompletion = text.toString();
        if (autocompleteRunnable != null) {
            autocompleteRunnable.cancel();
        }
        autocompleteRunnable = new AutocompleteRunnable(autocompletion);
        postDelayed(autocompleteRunnable, 200);
    }

//    public AutocompleteService getAutocompleteService() {
//        return mAutocompleteService;
//    }

    private class DefaultTextWatcher implements TextWatcher {

        private String mBefore = "";

        @Override
        public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            if (mIsAutocompleting) {
                return;
            }
            if (autocompleteRunnable != null) {
                autocompleteRunnable.cancel();
            }

            mIsTyping = true;

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

            final String str = s.toString();
            mDeleting = mBefore.startsWith(str) && mBefore.length() >= str.length();
            mBefore = str;

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
            mIsTyping = false;

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

    private class AutocompleteRunnable implements Runnable {

        private boolean mCancelled = false;

        private final String completion;

        AutocompleteRunnable(String completion) {
            this.completion = completion;
        }

        public void cancel() {
            mCancelled = true;
        }

        @Override
        public void run() {
            if (mDeleting || mIsTyping || mCancelled) {
                return;
            }
            final String currentText = getText().toString();
            mIsAutocompleting = true;
            if (completion.startsWith(currentText)) {
                mIsAutocompleted = true;
                final int selectionBegin = currentText.length();
                final int selectionEnd = completion.length();
                try {
                    setTextKeepState(completion);
                    setSelection(selectionBegin, selectionEnd);
                } catch (IndexOutOfBoundsException e) {
                    Log.i(TAG, "Can't select part of the url bar", e);
                }
            }
            mIsAutocompleting = false;
        }
    }
}
