package com.cliqz.browser.mock;

import acr.browser.lightning.app.AppModule;
import acr.browser.lightning.app.BrowserApp;

/**
 * Created by Ravjit on 18/01/16.
 */
public class MockBrowserApp extends BrowserApp {

    @Override
    protected AppModule createAppModule() {
        return new MockAppModule(this);
    }

}
