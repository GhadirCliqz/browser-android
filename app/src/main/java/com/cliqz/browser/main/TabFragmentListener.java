package com.cliqz.browser.main;

import android.text.Editable;
import android.view.View;

import com.cliqz.browser.main.CliqzBrowserState.Mode;
import com.cliqz.browser.webview.SearchWebView;
import com.cliqz.browser.widget.SearchBar;

import acr.browser.lightning.view.TrampolineConstants;

/**
 * @author Stefano Pacifici
 * @date 2015/11/24
 */
class TabFragmentListener implements SearchBar.Listener {
    private final TabFragment fragment;
    private int queryLength;

    public static TabFragmentListener create(TabFragment fragment) {
        return new TabFragmentListener(fragment);
    }

    private TabFragmentListener(TabFragment fragment) {
        this.fragment = fragment;
        fragment.searchBar.setListener(this);
    }

    @Override
    public void onFocusChange(View v, boolean hasFocus) {
        Mode mode = fragment.state.getMode();
        if (!hasFocus) {
            fragment.telemetry.sendURLBarBlurSignal(fragment.state.isIncognito(), mode == Mode.SEARCH ? "cards" : "web");
            fragment.hideKeyboard();
            if(mode == Mode.WEBPAGE) {
                fragment.searchBar.showTitleBar();
            }
        } else {
            fragment.bus.post(new Messages.AdjustPan());
            fragment.timings.setUrlBarFocusedTime();
            // TODO: The next two lines should be in a method
            fragment.mSearchWebView.bringToFront();
            fragment.inPageSearchBar.setVisibility(View.GONE);
            fragment.findInPage("");
            fragment.state.setMode(CliqzBrowserState.Mode.SEARCH);
            fragment.telemetry.sendURLBarFocusSignal(fragment.state.isIncognito(), mode == Mode.SEARCH ? "cards" : "web");
        }
    }

    @Override
    public void beforeTextChanged(CharSequence s, int start, int count, int after) {

    }

    @Override
    public void onTextChanged(CharSequence s, int start, int before, int count) {
        if (!fragment.searchBar.hasSearchFocus()) {
            return;
        }

        if (fragment.isHomePageShown) {
            fragment.isHomePageShown = false;
            return;
        }
        // fragment.showSearch(null);

        final String q = s.toString();
        final SearchWebView searchWebView = fragment.mSearchWebView;
        final boolean shouldSend = ((start + count) != before) ||
                !q.equalsIgnoreCase(fragment.lastQuery);
        if (searchWebView != null && shouldSend) {
            fragment.lastQuery = q;
            searchWebView.onQueryChanged(q);
        }
    }

    @Override
    public void afterTextChanged(Editable s) {
        if (fragment.timings != null) {
            fragment.timings.setLastTypedTime();
        }
    }


    @Override
    public void onTitleClicked(SearchBar searchBar) {
        final String url = fragment.mLightningView.getUrl();
        if (url != null && url.toLowerCase().startsWith(TrampolineConstants.CLIQZ_SCHEME)) {
            searchBar.setSearchText("");
        } else {
            searchBar.setSearchText(url);
        }
        fragment.mShowWebPageAgain = true;
    }

    @Override
    public void onStopClicked(SearchBar searchBar) {
        fragment.mLightningView.getWebView().stopLoading();
    }

    @Override
    public void onQueryCleared(SearchBar searchBar) {
        fragment.telemetry
                .sendCLearUrlBarSignal(fragment.isIncognito(),
                        searchBar.getSearchText().length(),
                        fragment.state.getMode() == Mode.SEARCH ? "cards" : "web");
    }
}
