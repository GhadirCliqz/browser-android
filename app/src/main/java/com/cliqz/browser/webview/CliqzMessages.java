package com.cliqz.browser.webview;

/**
 * These messages replace older callback mechanism with a more generic message passing. We were
 * calling the callback inside the bridge, but the bridge should not be so dependant on the type
 * of the webview he is related to (especially since we reuse the same bridge for the freshtab).
 *
 * @author Stefano Pacifici
 * @date 2015/12/10
 */
public class CliqzMessages {

    // No instances please
    private CliqzMessages() {}

    /**
     * Autocomplete callback from the extension
     */
    public static final class Autocomplete {
        public final String completion;

        public Autocomplete(String completion) {
            this.completion = completion;
        }
    }

    /**
     * The extension notify us it want to change the query string in the url bar
     *
     * TODO Is this still used?
     */
    public static final class NotifyQuery {
        public final String query;

        public NotifyQuery(String query) {
            this.query = query;
        }
    }

    /**
     * More generic message than open search result! Used by the FreshTab to open suggested article
     * or history element and by the search to open result pages.
     */
    public static final class OpenLink {
        public final String url;

        public OpenLink(String url) {
            this.url = url;
        }
    }
}
