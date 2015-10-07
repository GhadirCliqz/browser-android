package acr.browser.lightning.app;

import android.content.Context;

import com.squareup.otto.Bus;

import dagger.Module;
import dagger.Provides;

/**
 * Created by Ravijt on 30/09/15.
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
    public Bus provideBus() {
        return bus;
    }
}
