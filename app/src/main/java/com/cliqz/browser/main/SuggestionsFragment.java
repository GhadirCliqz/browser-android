package com.cliqz.browser.main;

import android.os.Bundle;
import android.support.annotation.Nullable;
import android.util.Log;
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
public class SuggestionsFragment extends BaseFragment {

    private ImageView mView;

    @Override
    protected View onCreateContentView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        mView = new ImageView(inflater.getContext());
        mView.setImageResource(R.drawable.reccomendations);
        mView.setScaleType(ImageView.ScaleType.FIT_XY);
        return mView;
    }

    @Override
    protected int getMenuResource() {
        return 0;
    }

    @Override
    protected boolean onMenuItemClick(MenuItem item) {
        return false;
    }

    @Override
    protected int getFragmentTheme() {
        return R.style.Theme_Cliqz_Suggestions;
    }

    @Nullable
    @Override
    protected View onCreateCustomToolbarView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_suggestions_toolbar, container, false);
        ButterKnife.bind(this, view);
        return view;
    }

    @Override
    public void onStart() {
        super.onStart();
        telemetry.sendLayerChangeSignal("future");
    }

    @OnClick(R.id.menu_search)
    void onUpClicked(){
        bus.post(new Messages.GoToSearch());
    }

    @Subscribe
    public void onBackPressed(Messages.BackPressed event) {
        bus.post(new Messages.GoToSearch());
    }
}
