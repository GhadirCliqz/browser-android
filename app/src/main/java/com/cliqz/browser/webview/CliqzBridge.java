package com.cliqz.browser.webview;

import android.content.Intent;
import android.support.annotation.NonNull;
import android.util.Log;
import android.webkit.WebView;

import org.json.JSONObject;

import java.util.List;
import java.util.Locale;

import acr.browser.lightning.database.HistoryDatabase;
import acr.browser.lightning.database.HistoryItem;

/**
 * @author Stefano Pacifici
 * @date 2015/11/09
 */
class CliqzBridge extends Bridge {

    private static final String TAG = CliqzBridge.class.getSimpleName();

    private enum Action implements IAction {

        /**
         * Search through the browser history
         *
         * TODO Is it used, can it not be more generic and not SearchWebView dependant?
         */
        searchHistory(new IAction() {
            @Override
            public void execute(Bridge bridge, Object data, String callback) {
                final String query = (data instanceof String) ? (String) data: null;
                final WebView webView = bridge.getWebView();
                final SearchWebView searchWebView = (webView instanceof SearchWebView) ?
                        (SearchWebView) bridge.getWebView() : null;
                if (searchWebView == null || callback == null || callback.isEmpty() || query == null) {
                    Log.e(TAG, "Can't perform searchHistory without a query and/or a callback");
                    return; // Nothing to do without callback or data
                }

                final String result = searchWebView.searchHistory(query);
                final StringBuilder builder = new StringBuilder();
                builder.append(callback).append("({results:").append(result).append(",query:\"")
                        .append(query).append("\"})");
                bridge.executeJavascript(builder.toString());
            }
        }),

        /**
         * The extension notify it is ready
         */
        isReady(new IAction() {
            @Override
            public void execute(Bridge bridge, Object data, String callback) {
                ((BaseWebView) bridge.getWebView()).extensionReady();
                bridge.executeJavascript(String.format(Locale.US,  "%s(-1)", callback));
            }
        }),

        /**
         * Generally fired when the user tap on search result
         */
        openLink(new IAction() {
            @Override
            public void execute(Bridge bridge, Object data, String callback) {
                final String url = (data instanceof String) ? (String) data : null;
                if (url != null) {
                    bridge.bus.post(new CliqzMessages.OpenLink(url));
                }
            }
        }),

        /**
         * The extension asks to handle the message with an external app (if available)
         */
        browserAction(new IAction() {
            @Override
            public void execute(final Bridge bridge, Object data, String callback) {
                final JSONObject params = (data instanceof JSONObject) ? (JSONObject) data : null;
                final WebView webView = bridge.getWebView();
                final String dataPar = params != null ? params.optString("data") : null;
                final String typePar = params != null ? params.optString("type") : null;
                if (dataPar == null || typePar == null) {
                    Log.e(TAG, "Can't parse the action");
                    return;
                }

                final BrowserActionTypes action = BrowserActionTypes.fromTypeString(typePar);
                final Intent intent = action.getIntent(webView.getContext(), dataPar);
                if (intent != null) {
                    webView.getContext().startActivity(intent);
                }
            }
        }),

        getTopSites(new IAction() {
            @Override
            public void execute(Bridge bridge, Object data, String callback) {
                final int no = data instanceof Integer ? (Integer) data : 5;
                if (callback == null) {
                    Log.e(TAG, "Can't perform getTopSites without a callback");
                    return; // Nothing to do without callback or data
                }
                final HistoryDatabase history = ((BaseWebView) bridge.getWebView()).historyDatabase;
                String result = "[]";
                if (history != null) {
                    final List<HistoryItem> items = history.getTopSites(no);
                    try {
                        result = historyToJSON(items);
                    } catch (Exception e) {
                        Log.e(TAG, "Cannot serialize History", e);
                    }
                }
                final String js = String.format("%s(%s)", callback, result);
                bridge.executeJavascript(js);
            }
        }),

        autocomplete(new IAction() {
            @Override
            public void execute(Bridge bridge, Object data, String callback) {
                final String url = (data instanceof String) ? (String) data : null;
                if (url == null) {
                    Log.w(TAG, "No url for autocompletion");
                    return;
                }
                bridge.bus.post(new CliqzMessages.Autocomplete(url));
            }
        }),

        notifyQuery(new IAction() {
            @Override
            public void execute(Bridge bridge, Object data, String callback) {
                final String query = (data instanceof String) ? (String) data : null;
                if (query == null) {
                    Log.w(TAG, "No url to notify");
                    return;
                }
                bridge.bus.post(new CliqzMessages.NotifyQuery(query));
            }
        }),

        pushTelemetry(new IAction() {
            @Override
            public void execute(Bridge bridge, Object data, String callback) {
                final JSONObject signal = (data instanceof JSONObject) ? (JSONObject) data : null;
                bridge.telemetry.saveSignal(signal);
            }
        }),

        none(new IAction() {
            @Override
            public void execute(Bridge bridge, Object data, String callback) {
                throw new RuntimeException("Invalid action invoked");
            }
        });

        private final IAction action;

        Action(final IAction action) {
            this.action = action;
        }

        @Override
        public void execute(Bridge bridge, Object data, String callback) {
            action.execute(bridge, data, callback);
        }
    }

    CliqzBridge(BaseWebView baseWebView) {
        super(baseWebView);
    }

    @Override
    protected IAction safeValueOf(@NonNull String name) {
        try {
            return Action.valueOf(name);
        } catch (IllegalArgumentException e) {
            Log.e(TAG, "Can't convert the given name to Action: " + name, e);
            return Action.none;
        }

    }

    @Override
    protected boolean checkCapabilities() {
        return true;
    }

    private static String historyToJSON(final List<HistoryItem> items) {
        final StringBuilder sb = new StringBuilder(items.size() * 100);
        sb.append("[");
        String sep = "";
        for (final HistoryItem item : items) {
            sb.append(sep);
            item.toJsonString(sb);
            sep = ",";
        }
        sb.append("]");
        return sb.toString();
    }
}
