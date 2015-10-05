package acr.browser.lightning.bus;

/**
 * Created by strider29 on 30/09/15.
 */
public final class AutoCompleteEvents {

    public static class SetAutoCompleteUrl {

        public final String url;

        public SetAutoCompleteUrl(final String url) {
            this.url = url;
        }
    }
}

