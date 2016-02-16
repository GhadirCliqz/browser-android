package com.cliqz.browser.webview;

import android.app.Activity;
import android.content.Intent;
import android.support.annotation.NonNull;
import android.util.Log;
import android.webkit.WebView;

import com.cliqz.browser.main.Messages;
import com.cliqz.browser.utils.Telemetry;
import com.squareup.otto.Bus;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.List;
import java.util.Locale;

import javax.inject.Inject;

import acr.browser.lightning.database.HistoryDatabase;
import acr.browser.lightning.database.HistoryItem;

/**
 * @author Stefano Pacifici
 * @date 2015/11/09
 */
public class CliqzBridge extends Bridge {

    private static final String TAG = CliqzBridge.class.getSimpleName();

    public CliqzBridge(Activity activity) {
        super(activity);
    }

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
                if (callback == null || callback.isEmpty() || query == null) {
                    Log.e(TAG, "Can't perform searchHistory without a query and/or a callback");
                    return; // Nothing to do without callback or data
                }

                final List<HistoryItem> items =
                        bridge.historyDatabase.findItemsContaining(query, 50);

                final StringBuilder builder = new StringBuilder();
                builder.append(callback).append("({results: [");
                String sep = "";
                for (HistoryItem item: items) {
                    builder.append(sep);
                    item.toJsonString(builder);
                    sep = ",";
                }
                builder.append("] ,query:\"")
                        .append(query).append("\"})");
                bridge.executeJavascript(builder.toString());
            }
        }),

        /**
         * Delete history with the passed List of ids.
         */
        removeHistory(new IAction() {
            @Override
            public void execute(Bridge bridge, Object data, String callback) {
                final JSONArray ids = (data instanceof JSONArray) ? (JSONArray) data : null;
                if(ids == null) {
                    Log.e(TAG, "Can't delete without an ID");
                } else {
                    for(int i = 0; i < ids.length(); i++) {
                        try {
                            bridge.historyDatabase.deleteHistoryItem(ids.getInt(i));
                        } catch (JSONException e) {
                            Log.e(TAG, "JSONException while reading ids in removeHistory", e);
                        }
                    }
                }
            }
        }),

        /**
         * The extension notify it is ready
         */
        isReady(new IAction() {
            @Override
            public void execute(Bridge bridge, Object data, String callback) {
                bridge.getWebView().extensionReady();
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
                final BaseWebView webView = bridge.getWebView();
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
                final JSONObject json = (data instanceof JSONObject) ? (JSONObject) data : null;
                final String query = json != null ? json.optString("q", null): null;
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
                bridge.telemetry.saveExtSignal(signal);
            }
        }),

        copyResult(new IAction() {
            @Override
            public void execute(Bridge bridge, Object data, String callback) {
                final String copiedData = (data instanceof String) ? (String) data : null;
                if(copiedData != null) {
                    bridge.bus.post(new CliqzMessages.CopyData(copiedData));
                }
            }
        }),

        shareCard(new IAction() {
            @Override
            public void execute(Bridge bridge, Object data, String callback) {
                final String cardLink = (data instanceof String) ? (String) data : null;
                if (cardLink == null) {
                    Log.w(TAG, "Expect either url or -1");
                    return;
                }
                bridge.bus.post(new Messages.ShareCard(cardLink));
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
