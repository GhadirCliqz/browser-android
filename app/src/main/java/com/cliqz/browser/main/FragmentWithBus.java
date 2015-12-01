package com.cliqz.browser.main;

import android.support.v4.app.Fragment;

import com.squareup.otto.Bus;

import javax.inject.Inject;

import acr.browser.lightning.app.BrowserApp;

/**
 * @author Stefano Pacifici
 * @date 2015/11/30
 */
public abstract class FragmentWithBus extends Fragment {

    @Inject
    Bus bus;

    public FragmentWithBus() {
        super();
        BrowserApp.getAppComponent().inject(this);
    }
}
