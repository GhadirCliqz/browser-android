package com.cliqz.browser.mock;

import com.cliqz.browser.di.modules.AppModule;

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
