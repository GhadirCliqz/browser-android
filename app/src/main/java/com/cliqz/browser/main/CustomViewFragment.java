package com.cliqz.browser.main;

import android.app.Dialog;
import android.content.DialogInterface;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.DialogFragment;
import android.view.KeyEvent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebChromeClient.CustomViewCallback;

/**
 * Helper to display full screen videos in the browser.
 *
 * @author Stefano Pacifici
 * @date 2016/01/22
 */
public class CustomViewFragment extends DialogFragment {

    private View mCustomView = null;
    private CustomViewCallback mCallback = null;
    private boolean mAlreadyRemoved = false;

    @Override
    public Dialog onCreateDialog(Bundle savedInstanceState) {
        final Dialog dialog = new Dialog(getContext(), android.R.style.Theme_Black_NoTitleBar_Fullscreen);
        dialog.setOnKeyListener(new DialogInterface.OnKeyListener() {
            @Override
            public boolean onKey(DialogInterface dialog, int keyCode, KeyEvent event) {
                if (keyCode == KeyEvent.KEYCODE_BACK) {
                    final CustomViewFragment self = CustomViewFragment.this;
                    self.mCallback.onCustomViewHidden();
                    self.dismiss();
                    mAlreadyRemoved = true;
                    return true;
                }
                return false;
            }
        });
        return dialog;
    }

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        if (mCustomView == null) {
            throw new RuntimeException("Custom view can't be null." +
                    "Please, use CustomViewFragment.create(...) to create the Fragment.");
        }
        return mCustomView;
    }

    @Override
    public void onPause() {
        super.onPause();
        if (mCallback == null) {
            throw new RuntimeException("Custom view callback can't be null. " +
                    "Please, use CustomViewFragment.create(...) to create the Fragment.");
        }
        if (!mAlreadyRemoved) {
            mCallback.onCustomViewHidden();
            dismiss();
        }
    }

    public static CustomViewFragment create(View customView, CustomViewCallback callback) {
        final CustomViewFragment customViewFragment = new CustomViewFragment();
        customViewFragment.mCallback = callback;
        customViewFragment.mCustomView = customView;
        return customViewFragment;
    }
}
