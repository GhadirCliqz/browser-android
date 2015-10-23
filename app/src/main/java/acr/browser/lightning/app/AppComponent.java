package acr.browser.lightning.app;

import com.cliqz.browser.search.WebSearchView;
import com.cliqz.browser.webview.OpenTabsView;

import javax.inject.Singleton;

import acr.browser.lightning.activity.BrowserActivity;
import dagger.Component;

/**
 * Created by strider29 on 30/09/15.
 */
@Singleton
@Component(modules = {AppModule.class})
public interface AppComponent {

    void inject(BrowserActivity browserActivity);

    void inject(WebSearchView webSearchView);

    void inject(OpenTabsView openTabsView);
}
