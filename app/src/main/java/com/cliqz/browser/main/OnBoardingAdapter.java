package com.cliqz.browser.main;

import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentPagerAdapter;
import android.support.v4.view.ViewPager;

import com.cliqz.browser.utils.Telemetry;

import java.util.ArrayList;

import acr.browser.lightning.R;

/**
 * Created by Ravjit on 25/01/16.
 */
public class OnBoardingAdapter extends FragmentPagerAdapter {

    private final int[] onBoardingLayouts = new int[] {
            R.layout.on_boarding_first,
            R.layout.on_boarding_second,
    };

    private ArrayList<Fragment> onBoardingFragments = new ArrayList<>(onBoardingLayouts.length);
    private Telemetry telemetry;
    public long startTime;

    public OnBoardingAdapter(FragmentManager fragmentManager, Telemetry telemetry) {
        super(fragmentManager);
        this.telemetry = telemetry;
        startTime = System.currentTimeMillis();
        telemetry.sendOnBoardingShowSignal(0);
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
}
