package com.cliqz.browser.main;

import android.content.Intent;
import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentActivity;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentPagerAdapter;
import android.support.v4.view.ViewPager;
import android.view.View;

import acr.browser.lightning.R;

public class OnBoardingActivity extends FragmentActivity {

    ViewPager pager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_on_boarding);
        getActionBar().hide();
        pager = (ViewPager) findViewById(R.id.viewpager);
        pager.setAdapter(new PagerAdapter(getSupportFragmentManager()));
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

    public void nextScreen(View view) {
        pager.setCurrentItem(1);
    }

    public void launchMain(View view) {
        Intent intent = new Intent(OnBoardingActivity.this, com.cliqz.browser.main.MainActivity.class);
        startActivity(intent);
        finish();
    }

}
