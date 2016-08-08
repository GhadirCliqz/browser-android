package com.cliqz.browser.overview;

import android.content.res.Resources;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentPagerAdapter;

import com.cliqz.browser.R;
import com.cliqz.browser.app.BrowserApp;
import com.cliqz.browser.main.HistoryFragment;

/**
 * Created by Ravjit on 20/07/16.
 */
public class OverviewPagerAdapter extends FragmentPagerAdapter {

    private static final int NUM_OF_TABS = 3;
    private TabOverviewFragment tabOverviewFragment = new TabOverviewFragment();
    private HistoryFragment historyOverviewFragment = new HistoryFragment(false);
    private HistoryFragment favoritesFragment = new HistoryFragment(true);
    private final Resources resources = BrowserApp.getAppContext().getResources();

    public OverviewPagerAdapter(FragmentManager fragmentManager) {
        super(fragmentManager);
    }
    @Override
    public Fragment getItem(int position) {
        switch (position) {
            case 0:
                return tabOverviewFragment;
            case 1:
                return historyOverviewFragment;
            case 2:
                return favoritesFragment;
            default:
                return null;
        }
    }

    @Override
    public int getCount() {
        return NUM_OF_TABS;
    }

    @Override
    public CharSequence getPageTitle(int position) {
        switch (position) {
            case 0:
                return resources.getString(R.string.open_tabs);
            case 1:
                return resources.getString(R.string.history);
            case 2:
                return resources.getString(R.string.favorites);
            default:
                return null;
        }
    }
}
