package acr.browser.lightning.app;

import android.content.Context;

import com.squareup.otto.Bus;
import com.squareup.otto.ThreadEnforcer;

import dagger.Module;
import dagger.Provides;

/**
 * Created by strider29 on 30/09/15.
 */
@Module
public class AppModule {
    private final BrowserApp app;
    private final Bus bus;

    public AppModule(BrowserApp app) {
        this.app = app;
        this.bus = new Bus(ThreadEnforcer.ANY);
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
