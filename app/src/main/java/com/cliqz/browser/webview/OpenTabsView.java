package com.cliqz.browser.webview;

import android.annotation.TargetApi;
import android.content.Context;
import android.os.Build;
import android.os.Environment;
import android.support.annotation.Nullable;
import android.util.Log;
import android.view.View;
import android.webkit.ConsoleMessage;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.cliqz.browser.bus.TabManagerEvents;
import com.squareup.otto.Bus;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Objects;

import javax.inject.Inject;

import acr.browser.lightning.BuildConfig;
import acr.browser.lightning.activity.BrowserActivity;
import acr.browser.lightning.activity.TabsManager;
import acr.browser.lightning.app.BrowserApp;
import acr.browser.lightning.constant.Constants;
import acr.browser.lightning.view.ILightningTab;
import acr.browser.lightning.view.LightningView;

/**
 * Created by Ravjit on 12/10/15.
 */
public class OpenTabsView extends WebView implements ILightningTab {

    private static final String TAG = OpenTabsView.class.getSimpleName();
    private static final String KEY_ID = "id";
    private static final String KEY_URL = "url";
    private static final String KEY_IMAGE_URL = "img";
    private static final String KEY_LIST = "list";
    private static String directory;

    @Inject
    Bus mTabManagerBus;

    @Inject
    TabsManager tabsManager;

    public OpenTabsView(Context context) {
        super(context);
        directory = context.getDir("cliqz",Context.MODE_PRIVATE).getPath();
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

        addJavascriptInterface(new JsBridge(), "tabmanager");
    }

    private class JsBridge {

        @JavascriptInterface
        public void onReady() {
            sendUrls();
        }

        @JavascriptInterface
        public void goBack() {
            post(new Runnable() {
                @Override
                public void run() {
                    mTabManagerBus.post(new TabManagerEvents.ExitTabManager());
                }
            });
        }

        @JavascriptInterface
        public void openLink(final String id) {
            post(new Runnable() {
                @Override
                public void run() {
                    mTabManagerBus.post(new TabManagerEvents.OpenTab(id));
                }
            });
        }

        @JavascriptInterface
        public void deleteTabs(final String id) {
            post(new Runnable() {
                @Override
                public void run() {
                    try {
                        List<String> deleteTabsList = new ArrayList<>();
                        JSONObject jsonObject = new JSONObject(id);
                        JSONArray list = jsonObject.getJSONArray(KEY_LIST);
                        for (int i = 0; i < list.length(); i++) {
                            deleteTabsList.add(list.getJSONObject(i).getString(KEY_ID));
                        }
                        mTabManagerBus.post(new TabManagerEvents.CloseTab(deleteTabsList));

                    } catch (JSONException e) {
                        e.printStackTrace();
                    }
                }
            });
        }

    }

    // returns JSON encoded String details of the open tabs
    private String openTabsToJSON() {
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

    public void sendUrls() {
        post(new Runnable() {
            @Override
            public void run() {
                executeJS("main(" + openTabsToJSON() + ")");
            }
        });
    }

    public void updateTabmanagerView() {
        executeJS("updateView()");
    }

    public void showTabManager() {
        executeJS("showTabManager()");
    }

    public void backPressed() {
        executeJS("onBackPressed()");
    }

    private void executeJS(final String js) {
        if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            evaluateJavascript(js, null);
        } else {
            loadUrl("javascript:" + js);
        }
    }


}
