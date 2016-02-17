package com.cliqz.browser.widget;

import android.content.Context;
import android.content.res.Resources;
import android.graphics.PorterDuff;
import android.media.Image;
import android.support.annotation.StringRes;
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
import acr.browser.lightning.bus.BrowserEvents;
import butterknife.Bind;
import butterknife.ButterKnife;
import butterknife.OnClick;

import static android.view.View.MeasureSpec.makeMeasureSpec;

/**
 * Created by Ravjit on 03/02/16.
 */
public class OverFlowMenu extends ListPopupWindow{

    private enum Entries {
        ACTIONS(-1),
        NEW_INCOGNITO_TAB(R.string.action_incognito),
        COPY_LINK(R.string.action_copy),
        SETTINGS(R.string.settings),
        CONTACT_CLIQZ(R.string.contact_cliqz);

        final int stringID;

        Entries(@StringRes int title) {
            stringID = title;
        }
    }

    private static final Entries[] ENTRIES = new Entries[] {
            Entries.ACTIONS,
            Entries.NEW_INCOGNITO_TAB,
            Entries.COPY_LINK,
            Entries.SETTINGS,
            Entries.CONTACT_CLIQZ
    };

    private static final Entries[] INCOGNITO_ENTRIES = new Entries[] {
            Entries.ACTIONS,
            Entries.SETTINGS,
            Entries.CONTACT_CLIQZ
    };

    private static final String HEADER = "header";
    private final Context context;
    private final OverFlowMenuAdapter overFlowMenuAdapter;
    private MainFragment.State mState = MainFragment.State.SHOWING_SEARCH;
    private boolean mCanGoForward = false;
    private boolean mIncognitoMode;

    private Entries[] mEntries = ENTRIES;

    @Inject
    Bus bus;

    @Bind(R.id.action_share)
    ImageView actionShareButton;

    @Bind(R.id.action_refresh)
    ImageView actionRefreshButton;

    @Bind(R.id.action_forward)
    ImageView actionForwardButton;

    public OverFlowMenu(Context context) {
        super(context);
        this.context = context;
        ((MainActivity)context).mActivityComponent.inject(this);
        overFlowMenuAdapter = new OverFlowMenuAdapter();
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

    public MainFragment.State getBrowserState() {
        return mState;
    }

    public void setBrowserState(MainFragment.State mState) {
        this.mState = mState;
        overFlowMenuAdapter.notifyDataSetChanged();
    }

    public boolean canGoForward() {
        return mCanGoForward;
    }

    public void setCanGoForward(boolean value) {
        this.mCanGoForward = value;
        overFlowMenuAdapter.notifyDataSetChanged();
    }

    public boolean isIncognitoMode() {
        return mIncognitoMode;
    }

    public void setIncognitoMode(boolean newValue) {
        mIncognitoMode = newValue;
        mEntries = mIncognitoMode ? INCOGNITO_ENTRIES : ENTRIES;
        overFlowMenuAdapter.notifyDataSetInvalidated();
    }

    private class OverFlowMenuAdapter extends BaseAdapter {

        // private String[] menuItems;

//        public OverFlowMenuAdapter() {
//            menuItems = context.getResources().getStringArray(R.array.overflow_menu);
//        }

        @Override
        public int getCount() {
            return mEntries.length;
        }

        @Override
        public int getViewTypeCount() {
            return 2;
        }

        @Override
        public int getItemViewType(int position) {
            switch (mEntries[position]) {
                case ACTIONS:
                    return 0;
                default:
                    return 1;
            }
        }

        @Override
        public Object getItem(int position) {
            return mEntries[position];
        }

        @Override
        public long getItemId(int position) {
            return mEntries[position].ordinal();
        }

        @Override
        public boolean areAllItemsEnabled() {
            return false;
        }

        @Override
        public boolean isEnabled(int position) {
            return mEntries[position] != Entries.COPY_LINK || mState.equals(MainFragment.State.SHOWING_BROWSER);
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
                    if(mState.equals(MainFragment.State.SHOWING_SEARCH)) {
                        setButtonDisabled(actionRefreshButton);
                        //setButtonDisabled(actionShareButton);
                    } else {
                        setButtonEnabled(actionRefreshButton);
                        //setButtonEnabled(actionShareButton);
                    }
                    if (!mCanGoForward) {
                        setButtonDisabled(actionForwardButton);
                    } else {
                        setButtonEnabled(actionForwardButton);
                    }
                } else {
                    view = inflater.inflate(android.R.layout.simple_list_item_1, parent, false);
                }
            }

            if(mEntries[position] == Entries.ACTIONS) {
                view.setTag(mEntries[position]);
            } else {
                TextView option = (TextView) view.findViewById(android.R.id.text1);
                option.setText(mEntries[position].stringID);
                view.setTag(mEntries[position]);
                option.setTextColor(ContextCompat.getColor(context, R.color.black));
                if(mEntries[position] == Entries.COPY_LINK && mState.equals(MainFragment.State.SHOWING_SEARCH)) {
                    option.setTextColor(ContextCompat.getColor(context, R.color.hint_text));
                }
            }
            return view;
        }

        private void setButtonDisabled(final ImageView view) {
            view.setEnabled(false);
            final int color = ContextCompat.getColor(context, R.color.hint_text);
            view.getDrawable().setColorFilter(color, PorterDuff.Mode.SRC_ATOP);
        }

        private void setButtonEnabled(final ImageView view) {
            view.setEnabled(true);
            final int color = ContextCompat.getColor(context, R.color.black);
            view.getDrawable().setColorFilter(color, PorterDuff.Mode.SRC_ATOP);
        }

    }

    private AdapterView.OnItemClickListener itemClickListener = new AdapterView.OnItemClickListener() {
        @Override
        public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
            final Entries tag = (Entries)view.getTag();
            switch (tag) {
                case COPY_LINK:
                    if (mState.equals(MainFragment.State.SHOWING_BROWSER)) {
                        bus.post(new Messages.CopyUrl());
                        OverFlowMenu.this.dismiss();
                    }
                    break;
                case SETTINGS:
                    bus.post(new Messages.GoToSettings());
                    OverFlowMenu.this.dismiss();
                    break;
                case CONTACT_CLIQZ:
                    bus.post(new Messages.ContactCliqz());
                    OverFlowMenu.this.dismiss();
                    break;
                case NEW_INCOGNITO_TAB:
                    bus.post(new BrowserEvents.NewIncognitoTab());
                    OverFlowMenu.this.dismiss();
                    break;
            }
        }
    };

    @OnClick(R.id.action_forward)
    void onForwardClicked() {
        bus.post(new Messages.GoForward());
        this.dismiss();
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
