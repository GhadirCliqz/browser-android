package com.cliqz.browser.main;

import android.support.v4.app.Fragment;

import com.cliqz.browser.utils.Telemetry;
import com.cliqz.browser.utils.Timings;
import com.squareup.otto.Bus;

import javax.inject.Inject;

import acr.browser.lightning.app.BrowserApp;
import acr.browser.lightning.preference.PreferenceManager;

/**
 * A fragment with a bus that register/unregister itself (children) to it automatically
 *
 * @author Stefano Pacifici
 * @date 2015/11/30
 */
public abstract class FragmentWithBus extends Fragment {

    @Inject
    Bus bus;

    @Inject
    Telemetry telemetry;

    @Inject
    Timings timings;

    public FragmentWithBus() {
        super();
        BrowserApp.getAppComponent().inject(this);
    }

    @Override
    public void onPause() {
        super.onPause();
        bus.unregister(this);
    }

    @Override
    public void onResume() {
        super.onResume();
        bus.register(this);
    }

}
