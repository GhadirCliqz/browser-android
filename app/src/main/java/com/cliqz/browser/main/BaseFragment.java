package com.cliqz.browser.main;

import android.os.Bundle;
import android.support.annotation.MenuRes;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.support.v7.widget.Toolbar;
import android.view.LayoutInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewGroup.LayoutParams;
import android.widget.FrameLayout;

import com.squareup.otto.Bus;

import javax.inject.Inject;

import acr.browser.lightning.R;
import acr.browser.lightning.app.AppComponent;
import acr.browser.lightning.app.BrowserApp;

/**
 * @author Stefano Pacifici
 * @date 2015/11/23
 */
public abstract class BaseFragment extends Fragment {

    private ViewGroup mContentContainer;
    private Toolbar mToolbar;
    private View mCustomToolbarView;

    @Inject
    Bus bus;

    public BaseFragment() {
        super();
        BrowserApp.getAppComponent().inject(this);
    }

    @Nullable
    @Override
    public final View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        final View view = inflater.inflate(R.layout.fragment_base, container, false);
        mToolbar = (Toolbar) view.findViewById(R.id.toolbar);
        mContentContainer = (ViewGroup) view.findViewById(R.id.content_container);
        final View content = onCreateContentView(inflater, mContentContainer, savedInstanceState);
        mContentContainer.addView(content, new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
        mCustomToolbarView = onCreateCustomToolbarView(inflater, mToolbar, savedInstanceState);
        if (mCustomToolbarView != null) {
            mToolbar.addView(mCustomToolbarView);
        }
        final int menuResId = getMenuResource();
        if (menuResId != 0) {
            mToolbar.inflateMenu(menuResId);
        }
        mToolbar.setOnMenuItemClickListener(new Toolbar.OnMenuItemClickListener() {
            @Override
            public boolean onMenuItemClick(MenuItem item) {
                return BaseFragment.this.onMenuItemClick(item);
            }
        });
        onViewCreated();
        return view;
    }

    /**
     * Should return the content view of the children (of this class) fragments
     * @param inflater
     * @param container
     * @param savedInstanceState
     * @return the content view
     */
    @NonNull
    protected abstract View onCreateContentView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState);

    /**
     * Return the resource used to render the actions in the toolbar
     * @return the resource id associated with a menu
     */
    @MenuRes
    protected abstract int getMenuResource();

    /**
     * Handle actions in the toolbar
     * @param item
     * @return true if the action was handled, false otherwise
     */
    protected abstract boolean onMenuItemClick(MenuItem item);

    /**
     * The custom view to use for the toolbar
     * @param inflater
     * @param container
     * @param savedInstanceState
     * @return a custom view or null
     */
    @Nullable
    protected abstract View onCreateCustomToolbarView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState);

    /**
     * Override this to get notified when the view has been created
     */
    protected void onViewCreated() {}
}
