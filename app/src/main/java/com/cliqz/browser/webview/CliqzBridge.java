package com.cliqz.browser.webview;

import android.content.Intent;
import android.support.annotation.NonNull;
import android.util.Log;

import org.json.JSONObject;

/**
 * @author Stefano Pacifici
 * @date 2015/11/09
 */
class CliqzBridge extends Bridge {

    private static final String TAG = CliqzBridge.class.getSimpleName();

    private enum Action implements IAction {

        /**
         * Search through the browser history
         */
        searchHistory(new IAction() {
            @Override
            public void execute(Bridge bridge, Object data, String callback) {
                final String query = (data instanceof String) ? (String) data: null;
                final CliqzView cliqzView = (CliqzView) bridge.getWebView();
                if (callback == null || callback.isEmpty() || query == null) {
                    Log.e(TAG, "Can't perform searchHistory without a query and/or a callback");
                    return; // Nothing to do without callback or data
                }

                final String result = cliqzView.searchHistory(query);
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
                ((CliqzView) bridge.getWebView()).extensionReady();
            }
        }),

        /**
         * Generally fired when the user tap on search result
         */
        openLink(new IAction() {
            @Override
            public void execute(Bridge bridge, Object data, String callback) {
                final String url = (data instanceof String) ? (String) data : null;
                final CliqzView cliqzView = (CliqzView) bridge.getWebView();
                final CliqzView.CliqzCallbacks listener = cliqzView.mListener;
                if (url != null && listener != null) {
                    listener.onResultClicked(url);
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
                final CliqzView cliqzView = (CliqzView) bridge.getWebView();
                final String dataPar = params != null ? params.optString("data") : null;
                final String typePar = params != null ? params.optString("type") : null;
                if (dataPar == null || typePar == null) {
                    Log.e(TAG, "Can't parse the action");
                    return;
                }

                final BrowserActionTypes action = BrowserActionTypes.fromTypeString(typePar);
                final Intent intent = action.getIntent(cliqzView.getContext(), dataPar);
                if (intent != null) {
                    cliqzView.getContext().startActivity(intent);
                }
            }
        }),

        getTopSites(new IAction() {
            @Override
            public void execute(Bridge bridge, Object data, String callback) {
                if (callback == null) {
                    Log.e(TAG, "Can't perform getTopSites without a callback");
                    return; // Nothing to do without callback or data
                }

                final String result = ((CliqzView) bridge.getWebView()).getTopSites();
                bridge.executeJavascript(String.format("%s(%s)", callback, result));
            }
        }),

        autocomplete(new IAction() {
            @Override
            public void execute(Bridge bridge, Object data, String callback) {
                final String url = (data instanceof String) ? (String) data : null;
                final CliqzView cliqzView = (CliqzView) bridge.getWebView();
                if (url == null) {
                    Log.w(TAG, "No url for autocompletion");
                    return;
                }
                final CliqzView.CliqzCallbacks listener = cliqzView.mListener;
                if(listener != null) {
                    listener.onAutocompleteUrl(url);
                }
            }
        }),

        notifyQuery(new IAction() {
            @Override
            public void execute(Bridge bridge, Object data, String callback) {
                final String query = (data instanceof String) ? (String) data : null;
                final CliqzView cliqzView = (CliqzView) bridge.getWebView();
                if (query == null) {
                    Log.w(TAG, "No url to notify");
                    return;
                }
                final CliqzView.CliqzCallbacks listener = cliqzView.mListener;
                if(listener != null) {
                    listener.onNotifyQuery(query);
                }
            }
        }),

        pushTelemetry(new IAction() {
            @Override
            public void execute(Bridge bridge, Object data, String callback) {
                final JSONObject signal = (data instanceof JSONObject) ? (JSONObject) data : null;
                ((CliqzView) bridge.getWebView()).sendTelemetry(signal);
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

    CliqzBridge(CliqzView searchView) {
        super(searchView);
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


}
