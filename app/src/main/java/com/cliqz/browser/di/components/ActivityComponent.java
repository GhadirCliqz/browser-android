package com.cliqz.browser.di.components;

import com.cliqz.browser.di.annotations.PerActivity;
import com.cliqz.browser.di.modules.ActivityModule;
import com.cliqz.browser.main.FragmentWithBus;
import com.cliqz.browser.main.MainActivity;
import com.cliqz.browser.webview.BaseWebView;
import com.cliqz.browser.webview.Bridge;
import com.cliqz.browser.widget.OverFlowMenuAdapter;
import com.squareup.otto.Bus;

import acr.browser.lightning.view.LightningView;
import dagger.Component;

/**
 * Created by Ravjit on 30/12/15.
 */
@PerActivity
@Component(dependencies = {AppComponent.class}, modules = {ActivityModule.class})
public interface ActivityComponent {

    void inject(MainActivity mainActivity);

    void inject(LightningView lightningView);

    void inject(FragmentWithBus fragmentWithBus);

    void inject(Bridge bridge);

    void inject(BaseWebView searchWebView);

    void inject(OverFlowMenuAdapter overFlowMenuAdapter);

    Bus getBus();

}
