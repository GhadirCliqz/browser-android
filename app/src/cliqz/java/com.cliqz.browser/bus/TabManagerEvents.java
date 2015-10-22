package com.cliqz.browser.bus;

import java.util.List;

/**
 * Created by Ravjit on 19/10/15.
 */
public final class TabManagerEvents {

    public static class ExitTabManager {

    }

    public static class OpenTab {

        public final String id;

        public OpenTab(final String id) {
            this.id = id;
        }
    }

    public static class CloseTab {

        public final List<String> ids;

        public CloseTab(final List<String> ids) {
            this.ids = ids;
        }
    }
}
