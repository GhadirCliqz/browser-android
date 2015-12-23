/*
 * Copyright 2014 A.C.R. Development
 */
package com.cliqz.browser.settings;

import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.preference.CheckBoxPreference;
import android.preference.Preference;

import acr.browser.lightning.R;
import acr.browser.lightning.constant.Constants;

public class GeneralSettingsFragment extends BaseSettingsFragment {

    private static final String SETTINGS_ADS = "cb_ads";
    private static final String SETTINGS_IMAGES = "cb_images";
    private static final String SETTINGS_SEARCHENGINE = "search";
    // private static final String SETTINGS_DRAWERTABS = "cb_drawertabs";
    // private static final String SETTINGS_BROWSER_IMPORT = "import_browser_bookmark";

    private Activity mActivity;

    private static final int API = Build.VERSION.SDK_INT;
    // private Preference searchengine;
    private CheckBoxPreference cbAds, cbImages; // , cbDrawerTabs;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Load the preferences from an XML resource
        addPreferencesFromResource(R.xml.preference_general);

        mActivity = getActivity();

        initPrefs();
    }

    private void initPrefs() {
        // mPreferenceManager storage
        // Preference importBrowserpref = findPreference(SETTINGS_BROWSER_IMPORT);
        // searchengine = findPreference(SETTINGS_SEARCHENGINE);

        cbAds = (CheckBoxPreference) findPreference(SETTINGS_ADS);
        cbImages = (CheckBoxPreference) findPreference(SETTINGS_IMAGES);
        // cbDrawerTabs = (CheckBoxPreference) findPreference(SETTINGS_DRAWERTABS);

        // importBrowserpref.setOnPreferenceClickListener(this);
        // searchengine.setOnPreferenceClickListener(this);
        cbAds.setOnPreferenceChangeListener(this);
        cbImages.setOnPreferenceChangeListener(this);
        // cbDrawerTabs.setOnPreferenceChangeListener(this);

        if (API >= 19) {
            mPreferenceManager.setFlashSupport(0);
        }

        // setSearchEngineSummary(mPreferenceManager.getSearchChoice());

        int flashNum = mPreferenceManager.getFlashSupport();
        boolean imagesBool = mPreferenceManager.getBlockImagesEnabled();

        cbAds.setEnabled(Constants.FULL_VERSION);

        cbImages.setChecked(imagesBool);
        cbAds.setChecked(Constants.FULL_VERSION && mPreferenceManager.getAdBlockEnabled());
        // cbDrawerTabs.setChecked(mPreferenceManager.getShowTabsInDrawer(true));
    }

    /* private void searchDialog() {
        AlertDialog.Builder picker = new AlertDialog.Builder(mActivity);
        picker.setTitle(getResources().getString(R.string.title_search_engine));
        CharSequence[] chars = {getResources().getString(R.string.custom_url), "Google",
                "Ask", "Bing", "Yahoo", "StartPage", "StartPage (Mobile)",
                "DuckDuckGo (Privacy)", "DuckDuckGo Lite (Privacy)", "Baidu (Chinese)",
                "Yandex (Russian)"};

        int n = mPreferenceManager.getSearchChoice();

        picker.setSingleChoiceItems(chars, n, new DialogInterface.OnClickListener() {

            @Override
            public void onClick(DialogInterface dialog, int which) {
                mPreferenceManager.setSearchChoice(which);
                setSearchEngineSummary(which);
            }
        });
        picker.setNeutralButton(getResources().getString(R.string.action_ok),
                new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                    }
                });
        picker.show();
    }

    private void searchUrlPicker() {
        final AlertDialog.Builder urlPicker = new AlertDialog.Builder(mActivity);
        urlPicker.setTitle(getResources().getString(R.string.custom_url));
        final EditText getSearchUrl = new EditText(mActivity);
        String mSearchUrl = mPreferenceManager.getSearchUrl();
        getSearchUrl.setText(mSearchUrl);
        urlPicker.setView(getSearchUrl);
        urlPicker.setPositiveButton(getResources().getString(R.string.action_ok),
                new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        String text = getSearchUrl.getText().toString();
                        mPreferenceManager.setSearchUrl(text);
                        searchengine.setSummary(getResources().getString(R.string.custom_url) + ": "
                                + text);
                    }
                });
        urlPicker.show();
    } */

    /* private void setSearchEngineSummary(int which) {
        switch (which) {
            case 0:
                searchUrlPicker();
                break;
            case 1:
                searchengine.setSummary("Google");
                break;
            case 2:
                searchengine.setSummary("Ask");
                break;
            case 3:
                searchengine.setSummary("Bing");
                break;
            case 4:
                searchengine.setSummary("Yahoo");
                break;
            case 5:
                searchengine.setSummary("StartPage");
                break;
            case 6:
                searchengine.setSummary("StartPage (Mobile)");
                break;
            case 7:
                searchengine.setSummary("DuckDuckGo");
                break;
            case 8:
                searchengine.setSummary("DuckDuckGo Lite");
                break;
            case 9:
                searchengine.setSummary("Baidu");
                break;
            case 10:
                searchengine.setSummary("Yandex");
        }
    } */

    @Override
    public boolean onPreferenceClick(Preference preference) {
        switch (preference.getKey()) {
//            case SETTINGS_SEARCHENGINE:
//                searchDialog();
//                return true;
//            case SETTINGS_BROWSER_IMPORT:
//                try {
//                    mBookmarkManager.importBookmarksFromBrowser(getActivity());
//                } catch (Exception e) {
//                    e.printStackTrace();
//                }
//                return true;
            default:
                return false;
        }
    }

    @Override
    public boolean onPreferenceChange(Preference preference, Object newValue) {
        // switch preferences
        switch (preference.getKey()) {
            case SETTINGS_ADS:
                mPreferenceManager.setAdBlockEnabled((Boolean) newValue);
                cbAds.setChecked((Boolean) newValue);
                return true;
            case SETTINGS_IMAGES:
                mPreferenceManager.setBlockImagesEnabled((Boolean) newValue);
                cbImages.setChecked((Boolean) newValue);
                return true;
//            case  SETTINGS_DRAWERTABS:
//                mPreferenceManager.setShowTabsInDrawer((Boolean) newValue);
//                cbDrawerTabs.setChecked((Boolean) newValue);
            default:
                return false;
        }
    }
}
