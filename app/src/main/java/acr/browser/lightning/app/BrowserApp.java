package acr.browser.lightning.app;

import android.app.Application;
import android.content.Context;

import com.squareup.leakcanary.LeakCanary;

public class BrowserApp extends Application {

    private static Context context;
    private static AppComponent appComponent;

    @Override
    public void onCreate() {
        super.onCreate();
        context = getApplicationContext();
        LeakCanary.install(this);
        buildDependencyGraph();
    }

    public static Context getAppContext() {
        return context;
    }

    public static AppComponent getAppComponent() {
        return appComponent;
    }

    private void buildDependencyGraph() {
        appComponent = DaggerAppComponent.builder().appModule(new AppModule(this)).build();
    }

}
