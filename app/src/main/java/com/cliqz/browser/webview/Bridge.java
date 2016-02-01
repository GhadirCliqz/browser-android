package com.cliqz.browser.webview;

import android.app.Activity;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.support.annotation.NonNull;
import android.util.Log;

import com.cliqz.browser.main.MainActivity;
import com.cliqz.browser.utils.Telemetry;
import com.squareup.otto.Bus;

import org.json.JSONException;
import org.json.JSONObject;

import javax.inject.Inject;

import acr.browser.lightning.app.BrowserApp;
import acr.browser.lightning.database.HistoryDatabase;

/**
 * @author Stefano Pacifici
 * @date 2015/11/13
 */
public abstract class Bridge {

    private static final String TAG = Bridge.class.getSimpleName();

    private final Handler handler;
    private BaseWebView webView;

    @Inject
    Telemetry telemetry;

    @Inject
    Bus bus;

    @Inject
    HistoryDatabase historyDatabase;

    protected Bridge(Activity activity) {
        this.handler = new Handler(Looper.getMainLooper());
        ((MainActivity)activity).mActivityComponent.inject(this);
    }

    interface IAction {
        void execute(Bridge bridge, Object data, String callback);
    }

    public void setWebView(BaseWebView baseWebView) {
        this.webView = baseWebView;
    }
    protected abstract  IAction safeValueOf(@NonNull String name);

    protected abstract boolean checkCapabilities();

    BaseWebView getWebView() {
        return webView;
    }

    public final void postMessage(String message) {
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
