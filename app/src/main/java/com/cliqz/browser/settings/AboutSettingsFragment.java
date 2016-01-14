/*
 * Copyright 2014 A.C.R. Development
 */
package com.cliqz.browser.settings;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.preference.Preference;
import android.preference.PreferenceFragment;
import android.text.Html;

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

        Preference contact = findPreference(CONTACT);
        contact.setOnPreferenceClickListener(contactClickListener);
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

    private final Preference.OnPreferenceClickListener contactClickListener =
            new Preference.OnPreferenceClickListener() {
                @Override
                public boolean onPreferenceClick(Preference preference) {
                    final Uri to = Uri.parse(getString(R.string.mail_to_feedback_at_cliqz_com));
                    final Intent intent = new Intent(Intent.ACTION_SENDTO, to);
                    intent.putExtra(Intent.EXTRA_TEXT, new StringBuilder()
                                    .append("\n")
                                    .append("Feedback für CLIQZ for Android (")
                                    .append(BuildConfig.VERSION_NAME)
                                    .append("), auf ")
                                    .append(Build.MODEL)
                                    .append(" (")
                                    .append(Build.VERSION.SDK_INT)
                                    .append(")")
                                    .toString()
                    );
                    startActivity(Intent.createChooser(intent, getString(R.string.contact_cliqz)));
                    return true;
                }
            };
}
