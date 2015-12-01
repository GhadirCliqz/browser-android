package com.cliqz.browser.main;

import android.content.Context;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.support.annotation.Nullable;
import android.support.v4.app.FragmentManager;
import android.view.LayoutInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewGroup.LayoutParams;
import android.view.inputmethod.InputMethodManager;
import android.widget.ImageView;

import com.cliqz.browser.webview.CliqzView;
import com.cliqz.browser.widget.AutocompleteEditText;
import com.squareup.otto.Subscribe;

import acr.browser.lightning.R;
import butterknife.Bind;
import butterknife.ButterKnife;
import butterknife.OnClick;

/**
 * @author Stefano Pacifici
 * @date 2015/11/23
 */
public class MainFragment extends BaseFragment implements CliqzView.CliqzCallbacks {

    private static final String LIGHTNING_FRAGMENT_TAG = "lightning_fragment";
    private static final String CLIQZ_FRAGMENT_TAG = "cliqz_fragment";

    private final static int KEYBOARD_ANIMATION_DELAY = 200;

    private final Handler handler = new Handler(Looper.getMainLooper());

 //    CliqzView mCliqzView = null;

    @Bind(R.id.menu_history)
    ImageView mMenuHistory;

    @Bind(R.id.search_bar)
    AutocompleteEditText mAutocompleteEditText;

    @Override
    protected View onCreateContentView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        // We do not create anything here we will just store a reference to the container
        return null;
    }

    @Override
    public void onResume() {
        super.onResume();
        bus.register(this);
        final FragmentManager fm = getChildFragmentManager();
        CliqzFragment cliqzFragment = (CliqzFragment) fm.findFragmentByTag(CLIQZ_FRAGMENT_TAG);
        cliqzFragment = cliqzFragment != null ? cliqzFragment : new CliqzFragment();
        fm.beginTransaction().replace(R.id.content_container, cliqzFragment, CLIQZ_FRAGMENT_TAG).commit();
    }

    @Override
    public void onPause() {
        super.onPause();
        bus.unregister(this);
    }

    @Override
    protected int getMenuResource() {
        return R.menu.fragment_search_menu;
    }

    @Override
    protected boolean onMenuItemClick(MenuItem item) {
        switch (item.getItemId()) {
            case R.id.menu_suggestions:
                hideKeyboard();
                delayedPostOnBus(new Messages.GoToSuggestions());
                return true;
            case R.id.menu_settings:
                hideKeyboard();
                delayedPostOnBus(new Messages.GoToSettings());
                return true;
            default:
                return false;
        }
    }

    @Override
    protected int getFragmentTheme() {
        return R.style.Theme_Cliqz_Present;
    }

    @Nullable
    @Override
    protected View onCreateCustomToolbarView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        final View view = inflater.inflate(R.layout.fragment_search_toolbar, container, false);
        ButterKnife.bind(this, view);
        return view;
    }

    @Override
    protected void onViewCreated() {
        // Wire the search here
        MainFragmentListener.create(this);
    }

    @OnClick(R.id.menu_history)
    void historyClicked() {
        hideKeyboard();
        delayedPostOnBus(new Messages.GoToHistory());
    }

    @Override
    public void onResultClicked(String url) {
        delayedPostOnBus(new Messages.OpenUrl(url));
    }

    @Override
    public void onNotifyQuery(String query) {

    }

    @Override
    public void onAutocompleteUrl(String str) {

    }

    // Hide the keyboard, used also in SearchFragmentListener
    void hideKeyboard() {
        InputMethodManager imm = (InputMethodManager) mAutocompleteEditText.getContext()
                .getSystemService(Context.INPUT_METHOD_SERVICE);
        imm.hideSoftInputFromWindow(mAutocompleteEditText.getWindowToken(), 0);
    }

    private void delayedPostOnBus(final Object event) {
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                bus.post(event);
            }
        }, KEYBOARD_ANIMATION_DELAY);
    }

    @Subscribe
    public void openUrl(Messages.OpenUrl event) {
        final FragmentManager fm = getChildFragmentManager();
        // First check if the lightning fragment is already on the back stack
        LightningFragment fragment =
                (LightningFragment) fm.findFragmentByTag(LIGHTNING_FRAGMENT_TAG);
        if (fragment == null) {
            fragment = new LightningFragment();
        }
        fragment.setUrl(event.url);
        fm.beginTransaction()
                .setCustomAnimations(R.anim.slide_in_from_right, R.anim.slide_out_to_left, R.anim.slide_in_from_left, R.anim.slide_out_to_right)
                .replace(R.id.content_container, fragment, LIGHTNING_FRAGMENT_TAG)
                .addToBackStack(null)
                .commit();
    }

}
