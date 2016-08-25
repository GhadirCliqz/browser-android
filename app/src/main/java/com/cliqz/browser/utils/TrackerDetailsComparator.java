package com.cliqz.browser.utils;

import com.cliqz.browser.main.TrackerDetailsModel;

import java.util.Comparator;

/**
 * @author Stefano Pacifici
 * @date 2016/08/25
 */
public final class TrackerDetailsComparator implements Comparator<TrackerDetailsModel> {
    @Override
    public int compare(TrackerDetailsModel lhs, TrackerDetailsModel rhs) {
        final int count = rhs.trackerCount - lhs.trackerCount;
        return count != 0 ? count : lhs.companyName.compareToIgnoreCase(rhs.companyName);
    }
}
