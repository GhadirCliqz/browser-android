package com.cliqz.browser.webview;

import android.annotation.TargetApi;
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
public abstract class BaseWebView extends WebView {
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


    public BaseWebView(Context context) {
        this(context, null);
    }

    public BaseWebView(Context context, AttributeSet attrs) {
        this(context, attrs, 0);
    }

    public BaseWebView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        setup();
        checkSuperSetupCalled();
    }

    @TargetApi(Build.VERSION_CODES.LOLLIPOP)
    public BaseWebView(Context context, AttributeSet attrs, int defStyleAttr, int defStyleRes) {
        super(context, attrs, defStyleAttr, defStyleRes);
        setup();
        checkSuperSetupCalled();
    }

    private void checkSuperSetupCalled() {
        if (!mSuperSetupCalled)
            throw new RuntimeException("BaseWebView setup method should be called by children");
    }

    protected  void setup() {
        BrowserApp.getAppComponent().inject(this);
        // Make extra sure web performance is nice on scrolling. Can this actually be harmful?
        setLayerType(View.LAYER_TYPE_HARDWARE, null);

        final WebViewClient webViewClient = createWebViewClient();
        if (webViewClient != null) {
            setWebViewClient(createWebViewClient());
        }

        // Web view settings
        WebSettings webSettings = getSettings();
        webSettings.setAllowFileAccess(true);
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setGeolocationEnabled(true);
        webSettings.setGeolocationDatabasePath(getContext().getCacheDir().getAbsolutePath());

        if (Build.VERSION.SDK_INT >= 16) {
            // Otherwise we can't do XHR
            webSettings.setAllowFileAccessFromFileURLs(true);
            webSettings.setAllowUniversalAccessFromFileURLs(true);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT && BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true);
        }


        setWebChromeClient(new WebChromeClient() {

            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                callback.invoke(origin, true, false);
            }

            public boolean onConsoleMessage(ConsoleMessage cm) {
                Log.d(TAG, cm.message() + " -- From line "
                        + cm.lineNumber() + " of "
                        + cm.sourceId());
                return true;
            }
        });

        // Callbacks from JS to Java
        final Bridge bridge = createBridge();
        if (bridge != null) {
            addJavascriptInterface(bridge, "jsBridge");
        }

        final String extensionUrl = getExtensionUrl();
        if (extensionUrl != null) {
            loadUrl(extensionUrl);
        }
        mSuperSetupCalled = true;
    }

    @Nullable
    protected abstract WebViewClient createWebViewClient();

    @Nullable
    protected abstract Bridge createBridge();

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

    /**
     * Evaluate JS in web context
     * @param js JS command
     */
     protected final void executeJS(final String js) {
        if (js != null && !js.isEmpty()) {
            post(new Runnable() {
                @Override
                public void run() {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                        evaluateJavascript(js, null);
                    } else {
                        loadUrl("javascript:" + js);
                    }
                }
            });
        }
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
