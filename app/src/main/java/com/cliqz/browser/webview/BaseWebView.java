package com.cliqz.browser.webview;

import android.annotation.TargetApi;
import android.app.Activity;
import android.content.Context;
import android.os.Build;
import android.support.annotation.Nullable;
import android.util.AttributeSet;
import android.util.Log;
import android.view.View;
import android.webkit.ConsoleMessage;
import android.webkit.GeolocationPermissions;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.cliqz.browser.main.CliqzBrowserState;
import com.cliqz.browser.main.MainActivity;
import com.cliqz.browser.utils.LocationCache;
import com.cliqz.browser.utils.Telemetry;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Locale;

import javax.inject.Inject;

import acr.browser.lightning.BuildConfig;
import acr.browser.lightning.app.BrowserApp;
import acr.browser.lightning.constant.SearchEngines;
import acr.browser.lightning.database.HistoryDatabase;
import acr.browser.lightning.preference.PreferenceManager;

/**
 * This class help us to create a standardized webview in which we can execute our javascript code.
 * It provide a standard way to add bridges that works with the postMessage javascript protocol.
 *
 * @author Stefano Pacifici
 * @date 2015/12/08
 */
public abstract class BaseWebView extends AbstractionWebView {
    private static final String TAG = BaseWebView.class.getSimpleName();

    private boolean mSuperSetupCalled = false;
    private boolean mJsReady = false;

    @Inject
    HistoryDatabase historyDatabase;

    @Inject
    LocationCache locationCache;

    @Inject
    PreferenceManager preferenceManager;

    @Inject
    Telemetry telemetry;

    @Inject
    CliqzBrowserState state;

    @Inject
    CliqzBridge bridge;

    Context context;

    public BaseWebView(Context context) {
        super(context);
        this.context = context;
        setup();
        checkSuperSetupCalled();
    }

    private void checkSuperSetupCalled() {
        if (!mSuperSetupCalled)
            throw new RuntimeException("BaseWebView setup method should be called by children");
    }

    @Override
    protected  void setup() {
        ((MainActivity)context).mActivityComponent.inject(this);
        // Make extra sure web performance is nice on scrolling. Can this actually be harmful?
        super.setup();

        final AWVClient client = createClient();
        setClient(client);

        // Callbacks from JS to Java
        if (bridge != null) {
            addBridge(bridge, "jsBridge");
        }

        final String extensionUrl = getExtensionUrl();
        if (extensionUrl != null) {
            loadApp(extensionUrl);
        }
        mSuperSetupCalled = true;
    }

    @Nullable
    protected abstract AWVClient createClient();

    @Nullable
    protected abstract String getExtensionUrl();

    void extensionReady() {
        mJsReady = true;
        setDefaultSearchEngine();
    }

    public boolean isExtesionReady() { return mJsReady; }

    @Override
    public void onPause() {
        super.onPause();
        pauseTimers();
    }

    @Override
    public void onResume() {
        super.onResume();
        resumeTimers();
        // When created we call this twice (one here and one in extensionReady()
        // That should not be a problem
        setDefaultSearchEngine();
    }

    private void setDefaultSearchEngine() {
        if (!mJsReady) {
            return;
        }

        final JSONObject param = new JSONObject();
        final SearchEngines engine = preferenceManager.getSearchChoice();
        try {
            param.put("name", engine.engineName);
            param.put("url", engine.engineUrl);
            executeJS(String.format(Locale.US, "setDefaultSearchEngine(%s)", param.toString()));
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }
}
