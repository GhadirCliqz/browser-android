package com.cliqz.browser.main;

import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.os.Parcelable;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentPagerAdapter;
import android.support.v4.view.ViewPager;
import android.support.v7.app.AppCompatActivity;
import android.util.Patterns;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewGroup.LayoutParams;
import android.view.Window;
import android.view.WindowManager;

import com.cliqz.browser.utils.LocationCache;
import com.cliqz.browser.utils.Telemetry;
import com.cliqz.browser.utils.Timings;
import com.cliqz.browser.webview.CliqzMessages;
import com.cliqz.browser.widget.MainViewContainer;
import com.squareup.otto.Bus;
import com.squareup.otto.Subscribe;

import javax.inject.Inject;

import acr.browser.lightning.BuildConfig;
import acr.browser.lightning.R;
import acr.browser.lightning.activity.SettingsActivity;
import acr.browser.lightning.app.BrowserApp;
import acr.browser.lightning.preference.PreferenceManager;

import static android.view.ViewGroup.LayoutParams.MATCH_PARENT;

/**
 * Flat navigation browser
 *
 * @author Stefano Pacifici
 * @date 2015/11/23
 */
public class MainActivity extends AppCompatActivity {

    private final static String TAG = MainActivity.class.getSimpleName();

    private static final String HISTORY_FRAGMENT_TAG = "history_fragment";
    private static final String SUGGESTIONS_FRAGMENT_TAG = "suggestions_fragment";
    static final String SEARCH_FRAGMENT_TAG = "search_fragment";

    private static final int CONTENT_VIEW_ID = R.id.main_activity_content;

    private static final String SAVED_STATE = TAG + ".SAVED_STATE";

    private FreshTabFragment mFreshTabFragment;
    private MainFragment mMainFragment;
    private HistoryFragment mHistoryFragment;

    @Inject
    Bus bus;

    @Inject
    PreferenceManager preferenceManager;

    @Inject
    Telemetry telemetry;

    @Inject
    CliqzBrowserState state;

    @Inject
    LocationCache locationCache;

    @Inject
    Timings timings;

    private ViewPager pager;

    // Used for telemetry
    private long startTime;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        BrowserApp.getAppComponent().inject(this);
        bus.register(this);

        // Restore state
        if (savedInstanceState != null) {
            final CliqzBrowserState oldState =
                    (CliqzBrowserState) savedInstanceState.getSerializable(SAVED_STATE);
            if (oldState != null) {
                state.copyFrom(oldState);
            }
        }

        // Translucent status bar only on selected platforms
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            final Window window = getWindow();
            window.setFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS,
                    WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        }

        mFreshTabFragment = new FreshTabFragment();
        mHistoryFragment = new HistoryFragment();
        mMainFragment = new MainFragment();

        final Intent intent = getIntent();
        final String url = (intent != null) && (intent.getAction() == Intent.ACTION_VIEW) ?
                intent.getDataString() : null;
        if (url != null && Patterns.WEB_URL.matcher(url).matches()) {
            setIntent(null);
            final Bundle args = new Bundle();
            args.putString("URL", url);
            mMainFragment.setArguments(args);
        }

        if(!preferenceManager.getOnBoardingComplete()) {
            createAppShortcutOnHomeScreen();
            setContentView(R.layout.activity_on_boarding);
            pager = (ViewPager) findViewById(R.id.viewpager);
            pager.setAdapter(new PagerAdapter(getSupportFragmentManager()));
            pager.addOnPageChangeListener(onPageChangeListener);
        } else {
            setupContentView();
        }

        // Telemetry (were we updated?)
        int currentVersionCode = BuildConfig.VERSION_CODE;
        int previousVersionCode = preferenceManager.getVersionCode();
        if(currentVersionCode > previousVersionCode) {
            preferenceManager.setVersionCode(currentVersionCode);
            telemetry.sendLifeCycleSignal(Telemetry.Action.UPDATE);
        }
    }

    private void setupContentView() {
        final MainViewContainer content = new MainViewContainer(this);
        content.setFitsSystemWindows(true);
        content.setBackgroundColor(Color.WHITE);
        final LayoutParams params = new LayoutParams(MATCH_PARENT, MATCH_PARENT);
        content.setId(CONTENT_VIEW_ID);
        setContentView(content, params);
        final FragmentManager fm = getSupportFragmentManager();
        fm.beginTransaction().add(CONTENT_VIEW_ID, mMainFragment, SEARCH_FRAGMENT_TAG).commit();
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        // Handle configuration changes
        super.onConfigurationChanged(newConfig);
    }

    @Override
    protected void onResume() {
        super.onResume();
        final String name = getCurrentVisibleFragmentName();
        timings.setAppStartTime();
        if(!name.isEmpty()) {
            telemetry.sendStartingSignals(name);
        }
        locationCache.start();
    }

    @Override
    protected void onPause() {
        super.onPause();
        String context = getCurrentVisibleFragmentName();
        timings.setAppStopTime();
        if(!context.isEmpty()) {
            telemetry.sendClosingSignals(Telemetry.Action.CLOSE, context);
        }
        locationCache.stop();
        state.setTimestamp(System.currentTimeMillis());
        state.setMode(mMainFragment.mState == MainFragment.State.SHOWING_SEARCH ?
                CliqzBrowserState.Mode.SEARCH : CliqzBrowserState.Mode.WEBPAGE);
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        outState.putSerializable(SAVED_STATE, state);
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        bus.unregister(this);
        String context = getCurrentVisibleFragmentName();
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
        telemetry.resetBackNavigationVariables(-1);
        final FragmentManager fm = getSupportFragmentManager();
        fm.beginTransaction()
                .setCustomAnimations(R.anim.enter_slide_down, R.anim.exit_slide_down, R.anim.enter_slide_up, R.anim.exit_slide_up)
                .replace(CONTENT_VIEW_ID, mHistoryFragment, HISTORY_FRAGMENT_TAG)
                .addToBackStack(null)
                .commit();
    }

    @Subscribe
    public void goToSuggestions(Messages.GoToSuggestions event) {
        telemetry.resetBackNavigationVariables(-1);
        final FragmentManager fm = getSupportFragmentManager();
        fm.beginTransaction()
                .setCustomAnimations(R.anim.enter_slide_up, R.anim.exit_slide_up, R.anim.enter_slide_down, R.anim.exit_slide_down)
                .replace(CONTENT_VIEW_ID, mFreshTabFragment, SUGGESTIONS_FRAGMENT_TAG)
                .addToBackStack(null)
                .commit();
    }

    @Subscribe
    public void goToLink(Messages.GoToLink event) {
        final FragmentManager fm = getSupportFragmentManager();
        final String url = event.url;
        fm.popBackStack();
        fm.addOnBackStackChangedListener(new FragmentManager.OnBackStackChangedListener() {
            @Override
            public void onBackStackChanged() {
                fm.removeOnBackStackChangedListener(this);
                bus.post(new CliqzMessages.OpenLink(url));
            }
        });
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
        setupContentView();
    }

    private void createAppShortcutOnHomeScreen() {
        // Create the shortcut on the home screen
        Intent shortCutIntent = new Intent("com.android.launcher.action.INSTALL_SHORTCUT");
        shortCutIntent.putExtra("duplicate", false);
        shortCutIntent.putExtra(Intent.EXTRA_SHORTCUT_NAME, getString(R.string.cliqz_app_name));
        Parcelable icon = Intent.ShortcutIconResource.fromContext(getApplicationContext(), R.mipmap.ic_launcher);
        shortCutIntent.putExtra(Intent.EXTRA_SHORTCUT_ICON_RESOURCE, icon);
        shortCutIntent.putExtra(Intent.EXTRA_SHORTCUT_INTENT, new Intent(getApplicationContext(), MainActivity.class));
        sendBroadcast(shortCutIntent);

        // Send telemetry "installed" signal
        preferenceManager.setSessionId(telemetry.generateSessionID());
        preferenceManager.setVersionCode(BuildConfig.VERSION_CODE);
        startTime = System.currentTimeMillis();
        telemetry.sendLifeCycleSignal(Telemetry.Action.INSTALL);
        telemetry.sendOnBoardingShowSignal(0);
    }

    //returns screen that is visible
    private String getCurrentVisibleFragmentName() {
        String context = "";
        if (mMainFragment != null && mMainFragment.isVisible()) {
            if (((MainFragment)mMainFragment).mState == MainFragment.State.SHOWING_BROWSER) {
                context = "web";
            } else {
                context = "cards";
            }
        } else if (mHistoryFragment != null && mHistoryFragment.isVisible()) {
            context = "past";
        } else if (mFreshTabFragment != null && mFreshTabFragment.isVisible()) {
            context = "future";
        }
        return context;
    }
}
