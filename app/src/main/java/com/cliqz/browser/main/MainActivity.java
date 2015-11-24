package com.cliqz.browser.main;

import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentManager;
import android.support.v7.app.AppCompatActivity;

import com.squareup.otto.Bus;
import com.squareup.otto.Subscribe;

import javax.inject.Inject;

import acr.browser.lightning.R;
import acr.browser.lightning.app.BrowserApp;

/**
 * Flat navigation browser
 *
 * @author Stefano Pacifici
 * @date 2015/11/23
 */
public class MainActivity extends AppCompatActivity {

    private static final String HISTORY_FRAGMENT_TAG = "history_fragment";
    private static final String SEARCH_FRAGMENT_TAG = "search_fragment";
    private static final String SUGGESTIONS_FRAGMENT_TAG = "suggestions_fragment";

    private Fragment mHistoryFragment, mSearchFragment, mSuggestionsFragment;

    @Inject
    Bus bus;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        BrowserApp.getAppComponent().inject(this);
        bus.register(this);

        mHistoryFragment = new HistoryFragment();
        mSearchFragment = new SearchFragment();
        mSuggestionsFragment = new SuggestionsFragment();

        final FragmentManager fm = getSupportFragmentManager();
        fm.beginTransaction().add(android.R.id.content, mSearchFragment, SEARCH_FRAGMENT_TAG).commit();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        bus.unregister(this);
    }

    @Subscribe
    public void goToHistory(Messages.GoToHistory event) {
        final FragmentManager fm = getSupportFragmentManager();
        fm.beginTransaction()
                .setCustomAnimations(R.anim.enter_slide_down, R.anim.exit_slide_down, R.anim.enter_slide_up, R.anim.exit_slide_up)
                .replace(android.R.id.content, mHistoryFragment, HISTORY_FRAGMENT_TAG)
                .addToBackStack(null)
                .commit();
    }

    @Subscribe
    public void goToSuggestions(Messages.GoToSuggestions event) {
        final FragmentManager fm = getSupportFragmentManager();
        fm.beginTransaction()
                .setCustomAnimations(R.anim.enter_slide_up, R.anim.exit_slide_up, R.anim.enter_slide_down, R.anim.exit_slide_down)
                .replace(android.R.id.content, mSuggestionsFragment, HISTORY_FRAGMENT_TAG)
                .addToBackStack(null)
                .commit();
    }
}
