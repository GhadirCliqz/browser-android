package com.cliqz.browser.webview;

import android.os.Build;
import android.os.Handler;
import android.support.annotation.NonNull;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * @author Stefano Pacifici
 * @date 2015/11/13
 */
abstract class Bridge {

    private static final String TAG = Bridge.class.getSimpleName();

    private final Handler handler;
    private final WebView webView;

    Bridge(@NonNull WebView webView) {
        this.webView = webView;
        this.handler = new Handler(webView.getContext().getMainLooper());
    }

    interface IAction {
        void execute(Bridge bridge, Object data, String callback);
    }

    protected abstract  IAction safeValueOf(@NonNull String name);

    protected abstract boolean checkCapabilities();

    WebView getWebView() {
        return webView;
    }

    @JavascriptInterface
    public void postMessage(String message) {
        if (!checkCapabilities()) {
            Log.w(TAG, "Not enough capabilities to execute");
            return;
        }
        try {
            final JSONObject msg = new JSONObject(message);
            final String actionName = msg.optString("action", "none");
            final Object data = msg.opt("data");
            final String callback = msg.optString("callback");
            final IAction action = safeValueOf(actionName);
            handler.post(new Runnable() {
                @Override
                public void run() {
                    action.execute(Bridge.this, data, callback);
                }
            });
        } catch (JSONException e) {
            Log.w(TAG, "Can't parse message");
        }
    }

    void executeJavascript(final String javascript) {
        if (javascript != null || !javascript.isEmpty()) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                webView.evaluateJavascript(javascript, null);
            } else {
                webView.loadUrl("javascript:" + javascript);
            }
        }
    }
}
