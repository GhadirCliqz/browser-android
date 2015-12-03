package com.cliqz.browser.main;

/**
 * @author Stefano Pacifici
 * @date 2015/11/24
 */
public final class Messages {
    // No instances, please
    private Messages() {}

    public static class Exit {}

    public static class GoToHistory {}

    public static class GoToSuggestions {}

    public static class OpenUrl {
        public final String url;

        public OpenUrl(String url) {
            this.url = url;
        }
    }

    public static class GoToSettings {}

    public static class UpdateTitle {}

    public static class GoToSearch {}

    public static class SearchFor {
        public final String query;

        public SearchFor(String query) {
            this.query = query;
        }
    }

    public static class BackPressed {}
}
