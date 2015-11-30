package com.cliqz.browser.main;

import android.content.Intent;
import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentPagerAdapter;
import android.support.v4.view.ViewPager;
import android.support.v7.app.AppCompatActivity;
import android.view.View;
import android.view.ViewGroup;

import com.cliqz.browser.utils.Telemetry;
import com.squareup.otto.Bus;
import com.squareup.otto.Subscribe;

import javax.inject.Inject;

import acr.browser.lightning.BuildConfig;
import acr.browser.lightning.R;
import acr.browser.lightning.activity.SettingsActivity;
import acr.browser.lightning.app.BrowserApp;
import acr.browser.lightning.preference.PreferenceManager;

/**
 * Flat navigation browser
 *
 * @author Stefano Pacifici
 * @date 2015/11/23
 */
public class MainActivity extends AppCompatActivity {

    private static final String HISTORY_FRAGMENT_TAG = "history_fragment";
    private static final String SEARCH_FRAGMENT_TAG = "search_fragment";
    private static final String SUGGESTIONS_FRAGMENT_TAG = "suggestions_fragment";
    private static final String LIGHTNING_FRAGMENT_TAG = "lightning_fragment";

    private Fragment mHistoryFragment, mSearchFragment, mSuggestionsFragment, mLightningFragment;

    @Inject
    Bus bus;

    @Inject
    PreferenceManager preferenceManager;

    @Inject
    Telemetry telemetry;

    ViewPager pager;

    long startTime;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        BrowserApp.getAppComponent().inject(this);
        bus.register(this);

        mHistoryFragment = new HistoryFragment();
        mSearchFragment = new SearchFragment();
        mSuggestionsFragment = new SuggestionsFragment();

        if(!preferenceManager.getOnBoardingComplete()) {
            preferenceManager.setSessionId(telemetry.generateSessionID());
            telemetry.sendLifeCycleSignal(Telemetry.Action.INSTALL);
            telemetry.sendOnBoardingShowSignal(0);
            startTime = System.currentTimeMillis();
            preferenceManager.setVersionCode(BuildConfig.VERSION_CODE);
            setContentView(R.layout.activity_on_boarding);
            pager = (ViewPager) findViewById(R.id.viewpager);
            pager.setAdapter(new PagerAdapter(getSupportFragmentManager()));
            pager.addOnPageChangeListener(onPageChangeListener);
        } else {
            final FragmentManager fm = getSupportFragmentManager();
            fm.beginTransaction().add(android.R.id.content, mSearchFragment, SEARCH_FRAGMENT_TAG).commit();
        }

        int currentVersionCode = BuildConfig.VERSION_CODE;
        int previousVersionCode = preferenceManager.getVersionCode();
        if(currentVersionCode > previousVersionCode) {
            preferenceManager.setVersionCode(currentVersionCode);
            telemetry.sendLifeCycleSignal(Telemetry.Action.UPDATE);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        String context;
        if(mSearchFragment.isVisible()) {
            context = "cards";
        } else if(mHistoryFragment.isVisible()) {
            context = "past";
        } else if(mSuggestionsFragment.isVisible()) {
            context = "future";
        } else if(mLightningFragment!=null && mLightningFragment.isVisible()){
            context = "web";
        } else {
            context = "cards";
        }
        telemetry.sendStartingSignals(context);
    }

    @Override
    protected void onPause() {
        super.onPause();
        String context;
        if(mSearchFragment.isVisible()) {
            context = "cards";
        } else if(mHistoryFragment.isVisible()) {
            context = "past";
        } else if(mSuggestionsFragment.isVisible()) {
            context = "future";
        } else {
            context = "web";
        }
        telemetry.sendClosingSignals(context);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        bus.unregister(this);
    }

    @Subscribe
    public void goToHistory(Messages.GoToHistory event) {
        final FragmentManager fm = getSupportFragmentManager();
        fm.beginTransaction()
                .setCustomAnimations(R.anim.enter_slide_down, R.anim.exit_slide_down, R.anim.enter_slide_up, R.anim.exit_slide_up)
                .replace(android.R.id.content, mHistoryFragment, HISTORY_FRAGMENT_TAG)
                .addToBackStack(null)
                .commit();
    }

    @Subscribe
    public void goToSuggestions(Messages.GoToSuggestions event) {
        final FragmentManager fm = getSupportFragmentManager();
        fm.beginTransaction()
                .setCustomAnimations(R.anim.enter_slide_up, R.anim.exit_slide_up, R.anim.enter_slide_down, R.anim.exit_slide_down)
                .replace(android.R.id.content, mSuggestionsFragment, SUGGESTIONS_FRAGMENT_TAG)
                .addToBackStack(null)
                .commit();
    }

    @Subscribe
    public void openUrl(Messages.OpenUrl event) {
        final FragmentManager fm = getSupportFragmentManager();
        // First check if the lightning fragment is already on the back stack
        mLightningFragment  = fm.findFragmentByTag(LIGHTNING_FRAGMENT_TAG);
        if (mLightningFragment == null) {
            mLightningFragment = new LightningFragment();
        }
        ((LightningFragment)mLightningFragment).setUrl(event.url);
        fm.beginTransaction()
                .setCustomAnimations(R.anim.slide_in_from_right, R.anim.slide_out_to_left, R.anim.slide_in_from_left, R.anim.slide_out_to_right)
                .replace(android.R.id.content, mLightningFragment, LIGHTNING_FRAGMENT_TAG)
                .addToBackStack(null)
                .commit();
    }

    @Subscribe
    public void goToSettings(Messages.GoToSettings event) {
        startActivity(new Intent(this, SettingsActivity.class));
    }

    private class PagerAdapter extends FragmentPagerAdapter {

        public PagerAdapter(FragmentManager fragmentManager) {
            super(fragmentManager);
        }

        @Override
        public int getCount() {
            return 2;
        }

        @Override
        public Fragment getItem(int pos) {
            if(pos == 0) {
                return new FirstOnBoardingFragment();
            } else {
                return new SecondOnBoardingFragment();
            }
        }
    }

    ViewPager.OnPageChangeListener onPageChangeListener = new ViewPager.OnPageChangeListener() {
        @Override
        public void onPageScrolled(int position, float positionOffset, int positionOffsetPixels) {
        }

        @Override
        public void onPageSelected(int position) {
            long curTime = System.currentTimeMillis();
            telemetry.sendOnBoardingHideSignal(position^1, curTime-startTime);
            startTime = curTime;
            telemetry.sendOnBoardingShowSignal(position);
        }

        @Override
        public void onPageScrollStateChanged(int state) {

        }
    };

    public void nextScreen(View view) {
        pager.setCurrentItem(1);
    }

    public void showHomeScreen(View view) {
        ((ViewGroup)(view.getParent())).removeAllViews();
        preferenceManager.setOnBoardingComplete(true);
        long curTime = System.currentTimeMillis();
        telemetry.sendOnBoardingHideSignal(1, curTime - startTime);
        final FragmentManager fm = getSupportFragmentManager();
        fm.beginTransaction().add(android.R.id.content, mSearchFragment, SEARCH_FRAGMENT_TAG).commit();
    }
}
