package acr.browser.lightning.app;

import android.content.Context;

import com.cliqz.browser.settings.BaseSettingsFragment;
import com.cliqz.browser.main.FragmentWithBus;
import com.cliqz.browser.webview.BaseWebView;
import com.cliqz.browser.webview.Bridge;
import com.cliqz.browser.webview.TabsManagerView;
import com.cliqz.browser.widget.AutocompleteEditText;
import com.squareup.otto.Bus;

import javax.inject.Singleton;

import acr.browser.lightning.activity.BrowserActivity;
import acr.browser.lightning.activity.BrowserMenuPopup;
import acr.browser.lightning.activity.OnBoardingActivity;
import acr.browser.lightning.activity.ThemableBrowserActivity;
import acr.browser.lightning.constant.BookmarkPage;
import acr.browser.lightning.database.HistoryDatabase;
import acr.browser.lightning.dialog.LightningDialogBuilder;
import acr.browser.lightning.fragment.BookmarkSettingsFragment;
import acr.browser.lightning.fragment.BookmarksFragment;
import acr.browser.lightning.fragment.LightningPreferenceFragment;
import acr.browser.lightning.fragment.TabsFragment;
import acr.browser.lightning.object.SearchAdapter;
import acr.browser.lightning.preference.PreferenceManager;
import acr.browser.lightning.view.LightningView;
import dagger.Component;

/**
 * Created by Stefano Pacifici on 01/09/15.
 */
@Singleton
@Component(modules = {AppModule.class})
public interface AppComponent {

    void inject(OnBoardingActivity activity);

    void inject(BrowserActivity activity);

    void inject(BookmarksFragment fragment);

    void inject(BookmarkSettingsFragment fragment);

    void inject(SearchAdapter adapter);

    void inject(LightningDialogBuilder builder);

    void inject(BookmarkPage bookmarkPage);

    void inject(TabsFragment fragment);

    PreferenceManager getPreferenceManager();

    void inject(LightningPreferenceFragment fragment);

    BookmarkPage getBookmarkPage();

    Bus getBus();

    HistoryDatabase getHistoryDatabase();

    Context getApplicationContext();

    void inject(LightningView lightningView);

    void inject(ThemableBrowserActivity activity);

    void inject(BaseWebView searchWebView);

    void inject(TabsManagerView tabsManagerView);

    void inject(BrowserMenuPopup browserMenuPopup);

    void inject(BaseSettingsFragment baseSettingsFragment);

    void inject(AutocompleteEditText autocompleteEditText);

    // This is CLIQZ specific
    void inject(com.cliqz.browser.main.MainActivity mainActivity);

    // This is CLIQZ Specific too
    void inject(FragmentWithBus baseFragment);

    void inject(Bridge bridge);
}