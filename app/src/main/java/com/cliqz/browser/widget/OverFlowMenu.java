package com.cliqz.browser.widget;

import android.content.Context;
import android.content.res.Resources;
import android.graphics.PorterDuff;
import android.support.v4.content.ContextCompat;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.widget.AdapterView;
import android.widget.BaseAdapter;
import android.widget.ImageView;
import android.widget.ListPopupWindow;
import android.widget.TextView;

import com.cliqz.browser.main.MainActivity;
import com.cliqz.browser.main.MainFragment;
import com.cliqz.browser.main.Messages;
import com.squareup.otto.Bus;

import javax.inject.Inject;

import acr.browser.lightning.R;
import butterknife.Bind;
import butterknife.ButterKnife;
import butterknife.OnClick;

import static android.view.View.MeasureSpec.makeMeasureSpec;

/**
 * Created by Ravjit on 03/02/16.
 */
public class OverFlowMenu extends ListPopupWindow{

    private static final String HEADER = "header";
    private Context context;
    private MainFragment.State state;

    @Inject
    Bus bus;

    @Bind(R.id.action_share)
    ImageView actionShareButton;

    @Bind(R.id.action_refresh)
    ImageView actionRefreshButton;

    public OverFlowMenu(Context context, MainFragment.State state) {
        super(context);
        this.context = context;
        ((MainActivity)context).mActivityComponent.inject(this);
        this.state = state;
        OverFlowMenuAdapter overFlowMenuAdapter = new OverFlowMenuAdapter();
        this.setAdapter(overFlowMenuAdapter);
        this.setOnItemClickListener(itemClickListener);
    }

    private void setWidth(View view) {
        final Resources res = context.getResources();
        final View root = getAnchorView().getRootView().findViewById(Window.ID_ANDROID_CONTENT);
        final int rootWidth = root.getWidth();
        final int rootHeight = root.getHeight();
        final int horizontalMargin = (int) res.getDimension(R.dimen.browser_menu_horizontal_margin);
        final int verticalMargin = (int) res.getDimension(R.dimen.browser_menu_vertical_margin);
        final int maxWidth = (2 * rootWidth / 3) - horizontalMargin;
        final int maxHeight = rootHeight - verticalMargin;
        view.measure(makeMeasureSpec(maxWidth, View.MeasureSpec.EXACTLY),
                makeMeasureSpec(maxHeight, View.MeasureSpec.AT_MOST));
        final int measuredWidth = view.getMeasuredWidth();
        this.setWidth(measuredWidth);
    }

    private class OverFlowMenuAdapter extends BaseAdapter {

        private String[] menuItems;

        public OverFlowMenuAdapter() {
            menuItems = context.getResources().getStringArray(R.array.overflow_menu);
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
        public boolean areAllItemsEnabled() {
            return false;
        }

        @Override
        public boolean isEnabled(int position) {
            if(position == 1 && state.equals(MainFragment.State.SHOWING_SEARCH)) {
                return false;
            } else {
                return true;
            }
        }

        @Override
        public View getView(int position, View convertView, ViewGroup parent) {
            View view = convertView;
            if(view == null) {
                LayoutInflater inflater = (LayoutInflater) context.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
                if(position == 0) {
                    view = inflater.inflate(R.layout.overflow_menu_header, parent, false);
                    OverFlowMenu.this.setWidth(view);
                    ButterKnife.bind(OverFlowMenu.this, view);
                    if(state.equals(MainFragment.State.SHOWING_SEARCH)) {
                        actionRefreshButton.setEnabled(false);
                        actionShareButton.setEnabled(false);
                        actionRefreshButton.getDrawable().setColorFilter(ContextCompat.getColor(context, R.color.hint_text),
                                PorterDuff.Mode.SRC_ATOP);
                        actionShareButton.getDrawable().setColorFilter(ContextCompat.getColor(context, R.color.hint_text),
                                PorterDuff.Mode.SRC_ATOP);
                    }
                } else {
                    view = inflater.inflate(android.R.layout.simple_list_item_1, parent, false);
                }
            }

            if(position == 0) {
                view.setTag(HEADER);
            } else {
                TextView option = (TextView) view.findViewById(android.R.id.text1);
                option.setText(menuItems[position-1]);
                view.setTag(menuItems[position-1]);
                if(position == 1 && state.equals(MainFragment.State.SHOWING_SEARCH)) {
                    option.setTextColor(ContextCompat.getColor(context, R.color.hint_text));
                }
            }
            return view;
        }

    }

    private AdapterView.OnItemClickListener itemClickListener = new AdapterView.OnItemClickListener() {
        @Override
        public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
            final String tag = view.getTag().toString();
            if (tag.equals(context.getString(R.string.action_copy)) &&
                    state.equals(MainFragment.State.SHOWING_BROWSER)) {
                bus.post(new Messages.CopyUrl());
                OverFlowMenu.this.dismiss();
            } else if (tag.equals(context.getString(R.string.settings))) {
                bus.post(new Messages.GoToSettings());
                OverFlowMenu.this.dismiss();
            } else if (tag.equals(context.getString(R.string.contact_cliqz))) {
                bus.post(new Messages.ContactCliqz());
                OverFlowMenu.this.dismiss();
            }
        }
    };

    @OnClick(R.id.action_forward)
    void onForwardClicked() {
        //TODO Trampoline changes required
    }

    @OnClick(R.id.action_refresh)
    void onRefreshClicked() {
        bus.post(new Messages.ReloadPage());
        this.dismiss();
    }

    @OnClick(R.id.action_share)
    void onShareClicked() {
        bus.post(new Messages.ShareLink());
        this.dismiss();
    }
}
