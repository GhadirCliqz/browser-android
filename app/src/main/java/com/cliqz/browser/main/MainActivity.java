package com.cliqz.browser.main;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Parcelable;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentPagerAdapter;
import android.support.v4.app.FragmentTransaction;
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

import java.util.ArrayList;

import javax.inject.Inject;

import acr.browser.lightning.BuildConfig;
import acr.browser.lightning.R;
import acr.browser.lightning.activity.SettingsActivity;
import acr.browser.lightning.app.BrowserApp;
import acr.browser.lightning.bus.BrowserEvents;
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

        // Ignore intent if we are being recreated
        final Intent intent = savedInstanceState == null ? getIntent() : null;
        final String url = (intent != null) && (Intent.ACTION_VIEW.equals(intent.getAction())) ?
                intent.getDataString() : null;
        if (url != null && Patterns.WEB_URL.matcher(url).matches()) {
            setIntent(null);
            final Bundle args = new Bundle();
            args.putString("URL", url);
            mMainFragment.setArguments(args);
        }

        if(!preferenceManager.getOnBoardingComplete()) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
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
        bus.register(this);
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
        bus.unregister(this);
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
    public void openLinkInNewTab(BrowserEvents.OpenUrlInNewTab event) {
        createNewTabWithUrl(event.url);
    }

    @Subscribe
    public void createWindow(BrowserEvents.CreateWindow event) {
        createNewTabWithUrl(event.url);
//        // TODO: Temporary workaround, we want to open a new activity!
//        bus.post(new CliqzMessages.OpenLink(event.url));
    }

    private void createNewTabWithUrl(String url) {
        final Intent intent = new Intent(getBaseContext(), MainActivity.class);
        intent.setAction(Intent.ACTION_VIEW);
        intent.setData(Uri.parse(url));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                | Intent.FLAG_ACTIVITY_NEW_DOCUMENT);
        startActivity(intent);
    }

    @Subscribe
    public void goToHistory(Messages.GoToHistory event) {
        telemetry.resetBackNavigationVariables(-1);
        final FragmentManager fm = getSupportFragmentManager();
        final FragmentTransaction transaction = fm.beginTransaction();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            transaction.
                    setCustomAnimations(R.anim.enter_slide_down, R.anim.exit_slide_down,
                            R.anim.enter_slide_up, R.anim.exit_slide_up);
        } else {
            transaction.setCustomAnimations(R.anim.fade_in, R.anim.fade_out,
                    R.anim.fade_in, R.anim.fade_out);
        }
        transaction.replace(CONTENT_VIEW_ID, mHistoryFragment, HISTORY_FRAGMENT_TAG)
                .addToBackStack(null)
                .commit();
    }

    @Subscribe
    public void goToSuggestions(Messages.GoToSuggestions event) {
        telemetry.resetBackNavigationVariables(-1);
        final FragmentManager fm = getSupportFragmentManager();
        final FragmentTransaction transaction = fm.beginTransaction();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            transaction.
                    setCustomAnimations(R.anim.enter_slide_down, R.anim.exit_slide_down,
                            R.anim.enter_slide_up, R.anim.exit_slide_up);
        } else {
            transaction.setCustomAnimations(R.anim.fade_in, R.anim.fade_out,
                    R.anim.fade_in, R.anim.fade_out);
        }
        transaction.replace(CONTENT_VIEW_ID, mFreshTabFragment, SUGGESTIONS_FRAGMENT_TAG)
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
        final String query = event.query;
        if (event.query != null) {
            fm.addOnBackStackChangedListener(new FragmentManager.OnBackStackChangedListener() {
                @Override
                public void onBackStackChanged() {
                    fm.removeOnBackStackChangedListener(this);
                    bus.post(new CliqzMessages.NotifyQuery(query));
                }
            });
        }
    }

    @Subscribe
    public void exit(Messages.Exit event) {
        finish();
    }

    @Subscribe
    public void copyData(CliqzMessages.CopyData event) {
        ClipboardManager clipboard = (ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
        ClipData clip = ClipData.newPlainText("label", event.data);
        clipboard.setPrimaryClip(clip);
    }

    private class PagerAdapter extends FragmentPagerAdapter {

        private final int[] onBoardingLayouts = new int[] {
                R.layout.on_boarding_first,
                R.layout.on_boarding_second,
                R.layout.on_boarding_third
        };
        private ArrayList<Fragment> onBoardingFragments = new ArrayList<>(onBoardingLayouts.length);

        public PagerAdapter(FragmentManager fragmentManager) {
            super(fragmentManager);
            for (int layout: onBoardingLayouts) {
                final int finalLayout = layout;
                onBoardingFragments.add(new OnBoardingFragment() {
                    @Override
                    protected int getLayout() {
                        return finalLayout;
                    }
                });
            }
        }

        @Override
        public int getCount() {
            return onBoardingFragments.size();
        }

        @Override
        public Fragment getItem(int pos) {
            return onBoardingFragments.get(pos);
        }
    }

    ViewPager.OnPageChangeListener onPageChangeListener = new ViewPager.OnPageChangeListener() {
        @Override
        public void onPageScrolled(int position, float positionOffset, int positionOffsetPixels) {
        }

        @Override
        public void onPageSelected(int position) {
            long curTime = System.currentTimeMillis();
            telemetry.sendOnBoardingHideSignal(curTime-startTime);
            startTime = curTime;
            telemetry.sendOnBoardingShowSignal(position);
        }

        @Override
        public void onPageScrollStateChanged(int state) {

        }
    };

    public void nextScreen(View view) {
        final int page = pager.getCurrentItem() + 1;
        pager.setCurrentItem(page);
    }

    public void showHomeScreen(View view) {
        ((ViewGroup)(view.getParent())).removeAllViews();
        preferenceManager.setOnBoardingComplete(true);
        long curTime = System.currentTimeMillis();
        telemetry.sendOnBoardingHideSignal(curTime - startTime);
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_FULL_USER);
        createAppShortcutOnHomeScreen();
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
        String name = "";
        if (mMainFragment != null && mMainFragment.isVisible()) {
            if (((MainFragment)mMainFragment).mState == MainFragment.State.SHOWING_BROWSER) {
                name = "web";
            } else {
                name = "cards";
            }
        } else if (mHistoryFragment != null && mHistoryFragment.isVisible()) {
            name = "past";
        } else if (mFreshTabFragment != null && mFreshTabFragment.isVisible()) {
            name = "future";
        } else {
            name = "web";
        }
        return name;
    }
}
