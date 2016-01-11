package com.cliqz.browser.di.modules;

import com.cliqz.browser.di.annotations.PerActivity;
import com.squareup.otto.Bus;

import dagger.Module;
import dagger.Provides;

/**
 * Created by Ravjit on 30/12/15.
 */
@Module
public class ActivityModule {

    @Provides
    @PerActivity
    Bus provideBus() {
        return new Bus();
    }

}
