package com.cliqz.browser.main;

import android.os.Bundle;
import android.support.annotation.Nullable;
import android.view.LayoutInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;

import com.squareup.otto.Subscribe;

import acr.browser.lightning.R;
import butterknife.ButterKnife;
import butterknife.OnClick;

/**
 * @author Stefano Pacifici
 * @date 2015/11/23
 */
public class HistoryFragment extends BaseFragment {

    private ImageView mView;

    @Override
    protected View onCreateContentView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        mView = new ImageView(inflater.getContext());
        mView.setImageResource(R.drawable.history);
        mView.setScaleType(ImageView.ScaleType.FIT_XY);
        return mView;
    }

    @Override
    protected int getMenuResource() {
        return R.menu.fragment_history_menu;
    }

    @Override
    protected boolean onMenuItemClick(MenuItem item) {
        return false;
    }

    @Override
    public void onViewCreated(View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        ButterKnife.bind(this, view);
    }

    @OnClick(R.id.menu_search)
    void downClicked() {
        bus.post(new Messages.GoToSearch());
    }

    @Override
    protected int getFragmentTheme() {
        return R.style.Theme_Cliqz_History;
    }

    @Nullable
    @Override
    protected View onCreateCustomToolbarView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_history_toolbar, container, false);
    }

    @Subscribe
    public void onBackPressed(Messages.BackPressed event) {
        bus.post(new Messages.GoToSearch());
    }
}
