package com.cliqz.browser.main;

/**
 * @author Stefano Pacifici
 * @date 2015/11/24
 */
public final class Messages {
    // No instances, please
    private Messages() {}

    public static class GoToHistory {}

    public static class GoToSuggestions {}

    public static class OpenUrl {
        public final String url;

        public OpenUrl(String url) {
            this.url = url;
        }
    }

    public static class UpdateTitle {}
}
