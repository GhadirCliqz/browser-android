package com.cliqz.browser.di.components;

import com.cliqz.browser.di.modules.ActivityModule;
import com.cliqz.browser.di.modules.AppModule;
import com.cliqz.browser.main.CliqzBrowserState;
import com.cliqz.browser.settings.BaseSettingsFragment;
import com.cliqz.browser.utils.LocationCache;
import com.cliqz.browser.utils.Telemetry;
import com.cliqz.browser.utils.Timings;
import com.cliqz.browser.widget.AutocompleteEditText;

import javax.inject.Singleton;

import acr.browser.lightning.activity.BrowserMenuPopup;
import acr.browser.lightning.activity.OnBoardingActivity;
import acr.browser.lightning.activity.ThemableBrowserActivity;
import acr.browser.lightning.constant.BookmarkPage;
import acr.browser.lightning.database.BookmarkManager;
import acr.browser.lightning.database.HistoryDatabase;
import acr.browser.lightning.fragment.BookmarkSettingsFragment;
import acr.browser.lightning.fragment.LightningPreferenceFragment;
import acr.browser.lightning.object.SearchAdapter;
import acr.browser.lightning.preference.PreferenceManager;
import dagger.Component;

/**
 * Created by Stefano Pacifici on 01/09/15.
 */
@Singleton
@Component(modules = {AppModule.class})
public interface AppComponent {

    //TODO Remove classes that are not part of flat-navigation
    void inject(OnBoardingActivity activity);

    void inject(BookmarkSettingsFragment fragment);

    void inject(SearchAdapter adapter);

    void inject(BookmarkPage bookmarkPage);

    PreferenceManager getPreferenceManager();

    void inject(LightningPreferenceFragment fragment);

    BookmarkPage getBookmarkPage();

    Telemetry getTelemetry();

    LocationCache getLocationCache();

    Timings getTimings();

    CliqzBrowserState getCliqzBrowserState();

    HistoryDatabase getHistoryDatabase();

    BookmarkManager getBookmarkManager();

    void inject(ThemableBrowserActivity activity);

    void inject(BrowserMenuPopup browserMenuPopup);

    void inject(BaseSettingsFragment baseSettingsFragment);

    void inject(AutocompleteEditText autocompleteEditText);

    void inject(Telemetry telemetry);

    void inject(com.cliqz.browser.main.OnBoardingActivity onBoardingActivity);

    ActivityComponent plus(ActivityModule module);
}
