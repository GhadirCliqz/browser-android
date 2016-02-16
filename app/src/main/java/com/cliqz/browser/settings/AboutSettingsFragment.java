/*
 * Copyright 2014 A.C.R. Development
 */
package com.cliqz.browser.settings;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.preference.Preference;
import android.preference.PreferenceFragment;

import acr.browser.lightning.BuildConfig;
import acr.browser.lightning.R;

public class AboutSettingsFragment extends PreferenceFragment {

    private int mCounter = 1;

    private static final String SETTINGS_VERSION = "pref_version";
    private static final String CONTACT = "pref_contact";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Load the preferences from an XML resource
        addPreferencesFromResource(R.xml.preference_about);

        Preference version = findPreference(SETTINGS_VERSION);
        version.setSummary(getVersion());
        version.setOnPreferenceClickListener(versionClickListener);
    }

    private String getVersion() {
        final String version = BuildConfig.VERSION_NAME;
        final String lightningVersion = BuildConfig.LIGHTNING_VERSION_NAME;
        return getString(R.string.about_version_format, version, lightningVersion);
    }

    private final Preference.OnPreferenceClickListener versionClickListener =
            new Preference.OnPreferenceClickListener() {
                @Override
                public boolean onPreferenceClick(Preference preference) {
                    if (mCounter < 10) {
                        mCounter++;
                        return false;
                    } else {
                        final Intent intent = new Intent(Intent.ACTION_VIEW,
                                Uri.parse("http://i.imgur.com/4lpVkTS.gif"));
                        getActivity().startActivity(intent);
                        mCounter = 0;
                        return true;
                    }
                }
            };
}
