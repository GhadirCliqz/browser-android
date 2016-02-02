package com.cliqz.browser.widget;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.BaseAdapter;
import android.widget.ImageView;
import android.widget.ListAdapter;
import android.widget.TextView;
import android.widget.Toast;

import com.cliqz.browser.main.MainActivity;
import com.cliqz.browser.main.Messages;
import com.squareup.otto.Bus;

import javax.inject.Inject;

import acr.browser.lightning.R;
import butterknife.Bind;
import butterknife.ButterKnife;
import butterknife.OnClick;

/**
 * Created by Ravjit on 02/02/16.
 */
public class OverFlowMenuAdapter extends BaseAdapter {

    private Context context;
    private String[] menuItems;

    @Inject
    Bus bus;

    public OverFlowMenuAdapter(Context context) {
        this.context = context;
        menuItems = context.getResources().getStringArray(R.array.overflow_menu);
        ((MainActivity)context).mActivityComponent.inject(this);
    }

    @Override
    public int getCount() {
        return menuItems.length + 1;  //+1 for header
    }

    @Override
    public int getViewTypeCount() {
        return 2;
    }

    @Override
    public int getItemViewType(int position) {
        return (position == 0) ? 0 : 1;
    }

    @Override
    public Object getItem(int position) {
        return null;
    }

    @Override
    public long getItemId(int position) {
        return 0;
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        View view = convertView;
        if(view == null) {
            LayoutInflater inflater = (LayoutInflater) context.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
            if(position == 0) {
                view = inflater.inflate(R.layout.overflow_menu_header, parent, false);
                ButterKnife.bind(this, view);
            } else {
                view = inflater.inflate(android.R.layout.simple_list_item_1, parent, false);
            }
        }

        if(position == 0) {
            view.setTag("header");
        } else {
            TextView option = (TextView) view.findViewById(android.R.id.text1);
            option.setText(menuItems[position-1]);
            view.setTag(menuItems[position-1]);
        }
        return view;
    }

    @OnClick(R.id.action_forward)
    void onForwardClicked() {
        //TODO Trampoline changes required
    }

    @OnClick(R.id.action_refresh)
    void onRefreshClicked() {
        bus.post(new Messages.ReloadPage());
    }

    @OnClick(R.id.action_share)
    void onShareClicked() {
        bus.post(new Messages.ShareLink());
    }

}
