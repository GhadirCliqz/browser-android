package com.cliqz.browser.utils;

import android.Manifest;
import android.content.Context;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.util.Log;

import com.anthonycr.grant.PermissionsManager;

import javax.inject.Inject;
import javax.inject.Singleton;

/**
 * @author Stefano Pacifici
 * @date 2015/11/17
 */
@Singleton
public class LocationCache implements LocationListener {

    private static final String TAG = LocationCache.class.getSimpleName();
    private static final long TWO_MINUTES = 120000l;
    private static final float FORTY_METERS = 40.0f;

    private final LocationManager locationManager;
    private final Context context;

    private Location mLastLocation = null;

    @Inject
    LocationCache(@NonNull Context context) {
        this.context = context;
        locationManager = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
    }

    public void start() {
        if (PermissionsManager.hasPermission(context, Manifest.permission.ACCESS_FINE_LOCATION)) {
            try {
                locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER,
                        TWO_MINUTES, FORTY_METERS, this);
                mLastLocation = getLastLocation();
            } catch (SecurityException e) {
                Log.e(TAG, "Check permissions");
            }
        }
    }

    public void stop() {
        try {
            locationManager.removeUpdates(this);
        } catch (SecurityException e) {
            // Nothing to do here we, we don't care about this
        }
    }

    @Nullable
    public Location getLastLocation() {
        return mLastLocation;
    }

    @Override
    public void onLocationChanged(Location location) {
        if (mLastLocation == null || isBetterThan(location, mLastLocation)) {
            mLastLocation = location;
        }
    }

    private boolean isBetterThan(@NonNull Location location, @NonNull Location oldLocation) {
        // Check whether the new location fix is newer or older
        long timeDelta = location.getTime() - oldLocation.getTime();
        final boolean isSignificantlyNewer = timeDelta > TWO_MINUTES;
        final boolean isSignificantlyOlder = timeDelta < -TWO_MINUTES;
        final boolean isNewer = timeDelta > 0;

        // If it's been more than two minutes since the current location, use the new location
        // because the user has likely moved
        if (isSignificantlyNewer) {
            return true;
            // If the new location is more than two minutes older, it must be worse
        } else if (isSignificantlyOlder) {
            return false;
        }

        // Check whether the new location fix is more or less accurate
        final int accuracyDelta = (int) (location.getAccuracy() - oldLocation.getAccuracy());
        final boolean isLessAccurate = accuracyDelta > 0;
        final boolean isMoreAccurate = accuracyDelta < 0;
        final boolean isSignificantlyLessAccurate = accuracyDelta > 200;

        // Check if the old and new location are from the same provider

        final String provider = location.getProvider();
        final String oldProvider = oldLocation.getProvider();
        final boolean isFromSameProvider = provider == null ? oldProvider == null :
                provider.equals(oldProvider);

        // Determine location quality using a combination of timeliness and accuracy
        if (isMoreAccurate) {
            return true;
        } else if (isNewer && !isLessAccurate) {
            return true;
        } else if (isNewer && !isSignificantlyLessAccurate && isFromSameProvider) {
            return true;
        }
        return false;
    }

    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {

    }

    @Override
    public void onProviderEnabled(String provider) {

    }

    @Override
    public void onProviderDisabled(String provider) {

    }
}
