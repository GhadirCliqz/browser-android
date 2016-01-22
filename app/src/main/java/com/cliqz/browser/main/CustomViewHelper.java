package com.cliqz.browser.main;

import android.app.Dialog;
import android.content.Context;
import android.content.DialogInterface;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.WebChromeClient.CustomViewCallback;

/**
 * Helper to display full screen videos in the browser.
 *
 * @author Stefano Pacifici
 * @date 2016/01/22
 */
class CustomViewHelper {

    private final Dialog dialog;
    private final CustomViewCallback callback;
    private final Listener listener;

    public CustomViewHelper(Context context, View customView, CustomViewCallback callback) {
        this.callback = callback;
        this.listener = new Listener();
        this.dialog = new Dialog(context, android.R.style.Theme_Black_NoTitleBar_Fullscreen);
        this.dialog.setContentView(customView);
        this.dialog.setOnCancelListener(listener);
        this.dialog.setOnKeyListener(listener);
    }

    public void show() {
        dialog.show();
    }


    private class Listener implements DialogInterface.OnCancelListener, DialogInterface.OnKeyListener {

        @Override
        public void onCancel(DialogInterface dialog) {
            callback.onCustomViewHidden();
            dialog.dismiss();
        }

        @Override
        public boolean onKey(DialogInterface dialog, int keyCode, KeyEvent event) {
            if (keyCode == KeyEvent.KEYCODE_BACK) {
                callback.onCustomViewHidden();
                dialog.dismiss();
                return true;
            }
            return false;
        }
    }
}
