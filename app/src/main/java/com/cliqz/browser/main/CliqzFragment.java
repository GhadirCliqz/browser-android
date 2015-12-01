package com.cliqz.browser.main;

import android.os.Bundle;
import android.support.annotation.Nullable;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewGroup.LayoutParams;

import com.cliqz.browser.webview.CliqzView;
import com.squareup.otto.Subscribe;

/**
 * @author Stefano Pacifici
 * @date 2015/11/30
 */
public class CliqzFragment extends FragmentWithBus implements CliqzView.CliqzCallbacks {

    private CliqzView mCliqzView = null;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        if (mCliqzView == null) {
            mCliqzView = new CliqzView(inflater.getContext());
            mCliqzView.setLayoutParams(
                    new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
            mCliqzView.setResultListener(this);
        } else {
            final ViewGroup parent = (ViewGroup) mCliqzView.getParent();
            if (parent != null) {
                parent.removeView(mCliqzView);
            }
        }
        return mCliqzView;
    }

    @Override
    public void onResume() {
        super.onResume();
        bus.register(this);
    }

    @Override
    public void onPause() {
        super.onPause();
        bus.unregister(this);
    }

    @Override
    public void onResultClicked(String url) {
        bus.post(new Messages.OpenUrl(url));
    }

    @Override
    public void onNotifyQuery(String query) {

    }

    @Override
    public void onAutocompleteUrl(String str) {

    }

    @Subscribe
    public void onQuery(Messages.SearchFor event) {
        mCliqzView.onQueryChanged(event.query);
    }
}
