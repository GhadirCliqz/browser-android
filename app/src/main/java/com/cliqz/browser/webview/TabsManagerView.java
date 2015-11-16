package com.cliqz.browser.webview;

import android.content.Context;
import android.os.Build;
import android.util.Log;
import android.view.View;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.squareup.otto.Bus;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.util.HashMap;

import javax.inject.Inject;

import acr.browser.lightning.BuildConfig;
import acr.browser.lightning.activity.TabsManager;
import acr.browser.lightning.app.BrowserApp;
import acr.browser.lightning.constant.Constants;
import acr.browser.lightning.view.ILightningTab;
import acr.browser.lightning.view.LightningView;

/**
 * Created by Ravjit on 12/10/15.
 */
public class TabsManagerView extends WebView implements ILightningTab {

    private static final String TAG = TabsManagerView.class.getSimpleName();
    private static final String KEY_ID = "id";
    private static final String KEY_URL = "url";
    private static final String KEY_IMAGE_URL = "img";
    private static final String KEY_LIST = "list";

    private final File directory;
    private final TabsManagerBridge bridge;

    @Inject
    Bus mTabManagerBus;

    @Inject
    TabsManager tabsManager;

    public TabsManagerView(Context context) {
        super(context);
        directory = context.getDir(Constants.TABS_SCREENSHOT_FOLDER_NAME,Context.MODE_PRIVATE);
        directory.mkdirs();
        bridge = new TabsManagerBridge(this);
        setup();
        BrowserApp.getAppComponent().inject(this);
    }

    private WebViewClient mWebViewClient = new WebViewClient() {

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return true;
        }
    };

    public void setup() {
        setLayerType(View.LAYER_TYPE_HARDWARE, null);
        setWebViewClient(mWebViewClient);

        //Web view settings
        WebSettings webSettings = getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);

        if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
            webSettings.setAllowUniversalAccessFromFileURLs(true);
        }

        if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT && BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        setWebChromeClient(new WebChromeClient() {

            public boolean onConsoleMessage(ConsoleMessage cm) {
                Log.d(TAG, cm.message() + " -- From line "
                        + cm.lineNumber() + " of "
                        + cm.sourceId());
                return true;
            }
        });

        addJavascriptInterface(bridge, "tabmanager");
        super.loadUrl(Constants.OPEN_TABS);
    }

    // returns JSON encoded String details of the open tabs
    String openTabsToJSON() {
        JSONArray openTabsJSON = new JSONArray();
        for(LightningView tabDetails : tabsManager.getTabsList()) {
            File file = new File(directory + "/" + tabDetails.getId() + ".jpeg");
            String imagePath;
            if(file.exists()) {
                imagePath = file.getAbsolutePath();
            } else {
                imagePath = "";
            }
            HashMap<String,String> processedTabDetails = new HashMap<>();
            processedTabDetails.put(KEY_ID,tabDetails.getId());
            processedTabDetails.put(KEY_URL,tabDetails.getUrl());
            processedTabDetails.put(KEY_IMAGE_URL, imagePath);
            JSONObject jsonObject = new JSONObject(processedTabDetails);
            openTabsJSON.put(jsonObject);
        }
        return openTabsJSON.toString();
    }

    public void updateTabmanagerView() {
        bridge.executeJavascript("updateView()");
    }

    public void showTabManager() {
        bridge.executeJavascript("showTabManager()");
    }

    public void backPressed() {
        bridge.executeJavascript("onBackPressed()");
    }
}
