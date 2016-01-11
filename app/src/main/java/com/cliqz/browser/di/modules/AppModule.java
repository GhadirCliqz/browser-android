package com.cliqz.browser.di.modules;

import android.content.Context;

import com.cliqz.browser.utils.Telemetry;
import com.squareup.otto.Bus;

import javax.inject.Singleton;

import acr.browser.lightning.app.BrowserApp;
import acr.browser.lightning.database.BookmarkManager;
import acr.browser.lightning.preference.PreferenceManager;
import dagger.Module;
import dagger.Provides;

/**
 * Created by Stefano Pacifici on 01/09/15.
 */
@Module
public class AppModule {
    private final BrowserApp app;
    private final Bus bus;

    public AppModule(BrowserApp app) {
        this.app = app;
        this.bus = new Bus();
    }

    @Provides
    public Context provideContext() {
        return app.getApplicationContext();
    }

    @Provides
    @Singleton
    public BookmarkManager provideBookmarkManager() {
        return new BookmarkManager(app.getApplicationContext());
    }

    @Provides
    @Singleton
    Telemetry provideTelemetry() {
        return new Telemetry(app.getApplicationContext());
    }

    @Provides
    @Singleton
    public PreferenceManager providePreferenceManager() {
        return new PreferenceManager(app);
    }
}
