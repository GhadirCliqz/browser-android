package com.cliqz.browser.main;

import android.Manifest;
import android.app.ActivityManager;
import android.app.AlertDialog;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentTransaction;
import android.support.v4.view.ViewPager;
import android.support.v7.app.AppCompatActivity;
import android.util.Patterns;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewGroup.LayoutParams;
import android.view.Window;
import android.view.WindowManager;
import android.widget.CheckBox;
import android.widget.CompoundButton;

import com.cliqz.browser.di.components.ActivityComponent;
import com.cliqz.browser.di.components.DaggerActivityComponent;
import com.cliqz.browser.di.modules.ActivityModule;
import com.cliqz.browser.utils.LocationCache;
import com.cliqz.browser.utils.Telemetry;
import com.cliqz.browser.utils.Timings;
import com.cliqz.browser.webview.CliqzMessages;
import com.cliqz.browser.widget.MainViewContainer;
import com.squareup.otto.Bus;
import com.squareup.otto.Subscribe;

import java.util.List;

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

    public ActivityComponent mActivityComponent;

    private static final String HISTORY_FRAGMENT_TAG = "history_fragment";
    private static final String SUGGESTIONS_FRAGMENT_TAG = "suggestions_fragment";
    static final String SEARCH_FRAGMENT_TAG = "search_fragment";
    private static final String CUSTOM_VIEW_FRAGMENT_TAG = "custom_view_fragment";
    private static final String LOCATION_PERMISSION = Manifest.permission.ACCESS_FINE_LOCATION;

    private static final int CONTENT_VIEW_ID = R.id.main_activity_content;

    private static final String SAVED_STATE = TAG + ".SAVED_STATE";

    public MainFragment mMainFragment;
    private FreshTabFragment mFreshTabFragment;
    private HistoryFragment mHistoryFragment;
    private OnBoardingAdapter onBoardingAdapter;
    private ViewPager pager;

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

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        mActivityComponent = DaggerActivityComponent.builder()
                .appComponent(BrowserApp.getAppComponent())
                .activityModule(new ActivityModule(this))
                .build();
        mActivityComponent.inject(this);
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
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
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
            preferenceManager.setSessionId(telemetry.generateSessionID());
            preferenceManager.setVersionCode(BuildConfig.VERSION_CODE);
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
            setContentView(R.layout.activity_on_boarding);
            onBoardingAdapter = new OnBoardingAdapter(getSupportFragmentManager(), telemetry);
            pager = (ViewPager) findViewById(R.id.viewpager);
            pager.setAdapter(onBoardingAdapter);
            pager.addOnPageChangeListener(onBoardingAdapter.onPageChangeListener);
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
        //Ask for "Dangerous Permissions" on runtime
        if(Build.VERSION.SDK_INT > Build.VERSION_CODES.LOLLIPOP_MR1) {
            if(preferenceManager.getLocationEnabled() &&
                    checkSelfPermission(LOCATION_PERMISSION) != PackageManager.PERMISSION_GRANTED) {
                final String[] permissions = {LOCATION_PERMISSION}; //Array of permissions needed
                final int requestCode = 1; //Used to identify the request in the callback onRequestPermissionsResult(Not used)
                requestPermissions(permissions, requestCode);
            }
        }
        locationCache.start();
        if(!locationCache.isGPSEnabled()
                && !preferenceManager.getNeverAskGPSPermission()
                && preferenceManager.getOnBoardingComplete()
                && preferenceManager.getLocationEnabled()) {
            showGPSPermissionDialog();
        }
    }

    private void showGPSPermissionDialog() {
        LayoutInflater inflater = LayoutInflater.from(this);
        View dialogLayout = inflater.inflate(R.layout.dialog_gps_permission, null);
        CheckBox dontShowAgain = (CheckBox) dialogLayout.findViewById(R.id.skip);
        final AlertDialog.Builder builder = new AlertDialog.Builder(this);
        final String action = Settings.ACTION_LOCATION_SOURCE_SETTINGS;
        final String message = getResources().getString(R.string.gps_permission);
        builder.setView(dialogLayout);
        builder.setMessage(message)
                .setPositiveButton("OK",
                        new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int which) {
                                startActivity(new Intent(action));
                                dialog.dismiss();
                            }
                        })
                .setNegativeButton("Cancel",
                        new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int which) {
                                dialog.cancel();
                            }
                        });
        builder.create().show();
        dontShowAgain.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                preferenceManager.setNeverAskGPSPermission(isChecked);
            }
        });
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
        intent.addFlags(Intent.FLAG_ACTIVITY_MULTIPLE_TASK
                | Intent.FLAG_ACTIVITY_NEW_DOCUMENT);
        startActivity(intent);
    }

    @Subscribe
    public void showCustomView(BrowserEvents.ShowCustomView event) {
        final CustomViewFragment fragment = CustomViewFragment.create(event.view, event.callback);
        fragment.show(getSupportFragmentManager(), CUSTOM_VIEW_FRAGMENT_TAG);
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
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            ActivityManager activityManager = (ActivityManager) getSystemService(ACTIVITY_SERVICE);
            List<ActivityManager.AppTask> cliqzTasks = activityManager.getAppTasks();
            if (cliqzTasks.size() > 1) {
                cliqzTasks.get(1).moveToFront();
            }
            finishAndRemoveTask();
        } else {
            finish();
        }
    }

    @Subscribe
    public void copyData(CliqzMessages.CopyData event) {
        ClipboardManager clipboard = (ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
        ClipData clip = ClipData.newPlainText("label", event.data);
        clipboard.setPrimaryClip(clip);
    }

    public void nextScreen(View view) {
        final int page = pager.getCurrentItem() + 1;
        pager.setCurrentItem(page);
    }

    public void onBoardingDone(View view) {
        ((ViewGroup)(view.getParent())).removeAllViews();
        preferenceManager.setOnBoardingComplete(true);
        long curTime = System.currentTimeMillis();
        telemetry.sendOnBoardingHideSignal(curTime - onBoardingAdapter.startTime);
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_FULL_USER);
        // Send telemetry "installed" signal
        telemetry.sendLifeCycleSignal(Telemetry.Action.INSTALL);
        setupContentView();
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
