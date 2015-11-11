package com.cliqz.browser.search;

import android.content.Intent;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.util.Log;
import android.webkit.JavascriptInterface;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * @author Stefano Pacifici
 * @date 2015/11/09
 */
class SearchBridge {

    private static final String TAG = SearchBridge.class.getSimpleName();

    interface IAction {
        void execute(@NonNull WebSearchView searchView, Object data, @Nullable String callback);
    }

    private enum Action implements IAction {

        /**
         * Search trought the browser history
         */
        searchHistory(new IAction() {
            @Override
            public void execute(WebSearchView searchView, Object data, String callback) {
                final String query = (data instanceof String) ? (String) data: null;
                if (callback == null || callback.isEmpty() || query == null) {
                    Log.e(TAG, "Can't perform searchHistory without a query and/or a callback");
                    return; // Nothing to do without callback or data
                }

                final String result = searchView.searchHistory(query);
                final StringBuilder builder = new StringBuilder();
                builder.append(callback).append("({results:").append(result).append(",query:\"")
                        .append(query).append("\"})");
                searchView.executeJS(builder.toString());
            }
        }),

        /**
         * The extension notify it is ready
         */
        isReady(new IAction() {
            @Override
            public void execute(WebSearchView searchView, Object data, String callback) {
                searchView.extensionReady();
            }
        }),

        /**
         * Generally fired when the user tap on search result
         */
        openLink(new IAction() {
            @Override
            public void execute(WebSearchView searchView, Object data, String callback) {
                final String url = (data instanceof String) ? (String) data : null;
                final WebSearchView.CliqzCallbacks listener = searchView.mListener;
                if (url != null && listener != null) {
                    searchView.post(new Runnable() {
                        @Override
                        public void run() {
                            listener.onResultClicked(url);
                        }
                    });
                }
            }
        }),

        /**
         * The extension asks to handle the message with an external app (if available)
         */
        browserAction(new IAction() {
            @Override
            public void execute(final WebSearchView searchView, Object data, String callback) {
                final JSONObject params = (data instanceof JSONObject) ? (JSONObject) data : null;
                final String dataPar = params != null ? params.optString("data") : null;
                final String typePar = params != null ? params.optString("type") : null;
                if (dataPar == null || typePar == null) {
                    Log.e(TAG, "Can't parse the action");
                    return;
                }

                final BrowserActionTypes action = BrowserActionTypes.fromTypeString(typePar);
                final Intent intent = action.getIntent(searchView.getContext(), dataPar);
                if (intent != null) {
                    searchView.post(new Runnable() {
                        @Override
                        public void run() {
                            searchView.getContext().startActivity(intent);
                        }
                    });
                }
            }
        }),

        getTopSites(new IAction() {
            @Override
            public void execute(WebSearchView searchView, Object data, String callback) {
                if (callback == null) {
                    Log.e(TAG, "Can't perform getTopSites without a callback");
                    return; // Nothing to do without callback or data
                }

                final String result = searchView.getTopSites();
                searchView.executeJS(String.format("%s(%s)", callback, result));
            }
        }),

        autocomplete(new IAction() {
            @Override
            public void execute(WebSearchView searchView, Object data, String callback) {
                final String url = (data instanceof String) ? (String) data : null;
                if (url == null) {
                    Log.w(TAG, "No url for autocompletion");
                    return;
                }
                final WebSearchView.CliqzCallbacks listener = searchView.mListener;
                if(listener != null) {
                    searchView.post(new Runnable() {
                        @Override
                        public void run() {
                            listener.onAutocompleteUrl(url);
                        }
                    });
                }
            }
        }),

        none(new IAction() {
            @Override
            public void execute(WebSearchView searchView, Object data, String callback) {
                throw new RuntimeException("Invalid action invoked");
            }
        });

        private final IAction action;

        Action(final IAction action) {
            this.action = action;
        }

        @Override
        public void execute(WebSearchView searchView, Object data, String callback) {
            action.execute(searchView, data, callback);
        }

        static Action safeValueOf(@NonNull String name) {
            try {
                return Action.valueOf(name);
            } catch (IllegalArgumentException e) {
                Log.e(TAG, "Can't convert the given name to Action: " + name, e);
                return none;
            }
        }
    }

    private final WebSearchView searchView;

    public SearchBridge(WebSearchView searchView) {
        this.searchView = searchView;
    }

    @JavascriptInterface
    public void postMessage(String message) {
        // TODO Security checks here: be sure we are called by proper pages
        try {
            final JSONObject msg = new JSONObject(message);
            final String actionName = msg.optString("action", "none");
            final Object data = msg.opt("data");
            final String callback = msg.optString("callback");
            final Action action = Action.safeValueOf(actionName);
            action.execute(searchView, data, callback);
        } catch (JSONException e) {
            Log.w(TAG, "Can't parse message");
        }
    }
}
