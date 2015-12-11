package com.cliqz.browser.main;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.Parcelable;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentPagerAdapter;
import android.support.v4.view.ViewPager;
import android.support.v7.app.AppCompatActivity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;

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

    private MainFragment mMainFragment;
    private HistoryFragment mHistoryFragment;
    private SuggestionsFragment mSuggestionsFragment;

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

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            final Window window = getWindow();
            window.setFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS,
                    WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        }

        bus.register(this);
        if(!preferenceManager.getOnBoardingComplete()) {
            setupApp();
            setContentView(R.layout.activity_on_boarding);
            pager = (ViewPager) findViewById(R.id.viewpager);
            pager.setAdapter(new PagerAdapter(getSupportFragmentManager()));
            pager.addOnPageChangeListener(onPageChangeListener);
        } else {
            final FragmentManager fm = getSupportFragmentManager();
            fm.beginTransaction().add(android.R.id.content, mMainFragment = new MainFragment(), SEARCH_FRAGMENT_TAG).commit();
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
        String context = "";
        if (mMainFragment != null && mMainFragment.isVisible()) {
            if (mMainFragment.mState == MainFragment.State.SHOWING_BROWSER) {
                context = "web";
            } else {
                context = "cards";
            }
        } else if (mHistoryFragment != null && mHistoryFragment.isVisible()) {
            context = "past";
        } else if (mSuggestionsFragment != null && mSuggestionsFragment.isVisible()) {
            context = "future";
        }
        if(!context.isEmpty()) {
            telemetry.sendStartingSignals(context);
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        String context = "";
        if (mMainFragment != null && mMainFragment.isVisible()) {
            if (mMainFragment.mState == MainFragment.State.SHOWING_BROWSER) {
                context = "web";
            } else {
                context = "cards";
            }
        } else if (mHistoryFragment != null && mHistoryFragment.isVisible()) {
            context = "past";
        } else if (mSuggestionsFragment != null && mSuggestionsFragment.isVisible()) {
            context = "future";
        }
        if(!context.isEmpty()) {
            telemetry.sendClosingSignals(Telemetry.Action.CLOSE, context);
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        bus.unregister(this);
        String context = "";
        if (mMainFragment != null && mMainFragment.isVisible()) {
            if (mMainFragment.mState == MainFragment.State.SHOWING_BROWSER) {
                context = "web";
            } else {
                context = "cards";
            }
        } else if (mHistoryFragment != null && mHistoryFragment.isVisible()) {
            context = "past";
        } else if (mSuggestionsFragment != null && mSuggestionsFragment.isVisible()) {
            context = "future";
        }
        if(!context.isEmpty()) {
            telemetry.sendClosingSignals(Telemetry.Action.KILL, context);
        }
    }

    @Override
    public void onBackPressed() {
        bus.post(new Messages.BackPressed());
    }

    @Subscribe
    public void goToHistory(Messages.GoToHistory event) {
        final FragmentManager fm = getSupportFragmentManager();
        fm.beginTransaction()
                .setCustomAnimations(R.anim.enter_slide_down, R.anim.exit_slide_down, R.anim.enter_slide_up, R.anim.exit_slide_up)
                .replace(android.R.id.content, mHistoryFragment = new HistoryFragment(), HISTORY_FRAGMENT_TAG)
                .addToBackStack(null)
                .commit();
    }

    @Subscribe
    public void goToSuggestions(Messages.GoToSuggestions event) {
        final FragmentManager fm = getSupportFragmentManager();
        fm.beginTransaction()
                .setCustomAnimations(R.anim.enter_slide_up, R.anim.exit_slide_up, R.anim.enter_slide_down, R.anim.exit_slide_down)
                .replace(android.R.id.content, mSuggestionsFragment = new SuggestionsFragment(), SUGGESTIONS_FRAGMENT_TAG)
                .addToBackStack(null)
                .commit();
    }

    @Subscribe
    public void goToSettings(Messages.GoToSettings event) {
        startActivity(new Intent(this, SettingsActivity.class));
    }

    @Subscribe
    public void goToSearch(Messages.GoToSearch event) {
        final FragmentManager fm = getSupportFragmentManager();
        fm.popBackStack();
    }

    @Subscribe
    public void exit(Messages.Exit event) {
        finish();
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
        fm.beginTransaction().add(android.R.id.content, mMainFragment = new MainFragment(), SEARCH_FRAGMENT_TAG).commit();
    }

    private void setupApp() {
        createShortCut();
        preferenceManager.setSessionId(telemetry.generateSessionID());
        preferenceManager.setVersionCode(BuildConfig.VERSION_CODE);
        startTime = System.currentTimeMillis();
        telemetry.sendLifeCycleSignal(Telemetry.Action.INSTALL);
        telemetry.sendOnBoardingShowSignal(0);
    }

    private void createShortCut(){
        Intent shortCutIntent = new Intent("com.android.launcher.action.INSTALL_SHORTCUT");
        shortCutIntent.putExtra("duplicate", false);
        shortCutIntent.putExtra(Intent.EXTRA_SHORTCUT_NAME, getString(R.string.cliqz_app_name));
        Parcelable icon = Intent.ShortcutIconResource.fromContext(getApplicationContext(), R.mipmap.ic_launcher);
        shortCutIntent.putExtra(Intent.EXTRA_SHORTCUT_ICON_RESOURCE, icon);
        shortCutIntent.putExtra(Intent.EXTRA_SHORTCUT_INTENT, new Intent(getApplicationContext(), MainActivity.class));
        sendBroadcast(shortCutIntent);
    }
}
