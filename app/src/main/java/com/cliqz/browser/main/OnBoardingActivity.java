package com.cliqz.browser.main;

import android.os.Bundle;
import android.support.v4.view.ViewPager;
import android.support.v7.app.AppCompatActivity;
import android.view.View;

import com.cliqz.browser.utils.Telemetry;

import javax.inject.Inject;

import acr.browser.lightning.R;
import acr.browser.lightning.app.BrowserApp;

/**
 * Created by Ravjit on 25/01/16.
 */
public class OnBoardingActivity extends AppCompatActivity{

    private OnBoardingAdapter onBoardingAdapter;
    private ViewPager viewPager;

    @Inject
    Telemetry telemetry;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        BrowserApp.getAppComponent().inject(this);
        setContentView(R.layout.activity_on_boarding);
        viewPager = (ViewPager) findViewById(R.id.viewpager);
        onBoardingAdapter = new OnBoardingAdapter(getSupportFragmentManager(), telemetry);
        viewPager.setAdapter(onBoardingAdapter);
        viewPager.addOnPageChangeListener(onBoardingAdapter.onPageChangeListener);
    }

    public void nextScreen(View view) {
        final int page = viewPager.getCurrentItem() + 1;
        viewPager.setCurrentItem(page);
    }

    public void onBoardingDone(View view) {
        telemetry.sendOnBoardingHideSignal(System.currentTimeMillis() - onBoardingAdapter.startTime);
        finish();
    }
}
