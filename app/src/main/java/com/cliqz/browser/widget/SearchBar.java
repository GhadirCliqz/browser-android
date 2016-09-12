package com.cliqz.browser.widget;

import android.content.Context;
import android.graphics.drawable.Drawable;
import android.support.annotation.Nullable;
import android.support.v4.content.ContextCompat;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.AttributeSet;
import android.view.MotionEvent;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.cliqz.browser.R;
import com.cliqz.browser.main.AntiTrackingDialog;
import com.cliqz.browser.main.TrackerDetailsModel;

import java.util.ArrayList;

import acr.browser.lightning.utils.ThemeUtils;
import butterknife.Bind;
import butterknife.ButterKnife;
import butterknife.OnClick;

/**
 * Created by Ravjit on 07/12/15.
 */
public class SearchBar extends FrameLayout {

    public static final int ICON_STATE_CLEAR = 0;
    public static final int ICON_STATE_STOP = 2;
    public static final int ICON_STATE_NONE = 3;

    public interface Listener extends TextWatcher, OnFocusChangeListener {
        void onTitleClicked(SearchBar searchBar);
        void onStopClicked(SearchBar searchBar);
        void onQueryCleared(SearchBar searchBar);
    }

    @Bind(R.id.search_edit_text)
    AutocompleteEditText searchEditText;

    @Bind(R.id.title_bar)
    TextView titleBar;

    @Nullable
    @Bind(R.id.tracker_counter)
    TextView trackerCounter;

    @Nullable
    @Bind(R.id.anti_tracking_details)
    LinearLayout antiTrackingDetails;

    private final int clearIconWidth;
    private final int clearIconHeight;
    private @Nullable Listener mListener;
    private int currentIcon;

    public SearchBar(Context context) {
        this(context, null);
    }

    public SearchBar(Context context, AttributeSet attrs) {
        this(context, attrs, 0);
    }

    public SearchBar(Context context, AttributeSet attrs, int defStyle) {
        super(context, attrs, defStyle);
        inflate(getContext(), R.layout.search_bar_widget, this);
        ButterKnife.bind(this);
        final Drawable clearIcon = getResources().getDrawable(R.drawable.ic_action_delete, null);
        clearIconWidth = clearIcon.getIntrinsicWidth();
        clearIconHeight = clearIcon.getIntrinsicHeight();
        titleBar.setHeight(clearIconHeight);
        final ListenerWrapper wrapper = new ListenerWrapper();
        searchEditText.addTextChangedListener(wrapper);
        searchEditText.setOnFocusChangeListener(wrapper);
    }

    public void setListener(@Nullable  Listener listener) {
        this.mListener = listener;
    }

    public String getSearchText() {
        return searchEditText.getText().toString();
    }

    public boolean hasSearchFocus() {
        return searchEditText.hasFocus();
    }

    public String getQuery() {
        return searchEditText.getQuery();
    }

    public boolean isAutoCompleted() {
        return searchEditText.getVisibility() == VISIBLE && searchEditText.isAutocompleted();
    }

    public void requestSearchFocus() {
        searchEditText.requestFocus();
    }

    public void setSearchSelection(int length) {
        searchEditText.setSelection(length);
    }

    public void setAutocompleteText(String autocompletion) {
        searchEditText.setAutocompleteText(autocompletion);
    }

    @Override
    public boolean onInterceptTouchEvent(MotionEvent ev) {
        if (ev.getAction() != MotionEvent.ACTION_UP) {
            return super.onInterceptTouchEvent(ev);
        }
        if (antiTrackingDetails.getVisibility() == VISIBLE && ev.getX() >= antiTrackingDetails.getX()) {
            return super.onInterceptTouchEvent(ev);
        }
        if (titleBar.getVisibility() == VISIBLE) {
            final boolean compoundClicked =
                    ev.getX() > titleBar.getWidth() - titleBar.getPaddingRight() - clearIconWidth;
            if (compoundClicked && currentIcon == ICON_STATE_STOP && mListener != null) {
                mListener.onStopClicked(this);
            } else {
                if (antiTrackingDetails != null) {
                    antiTrackingDetails.setVisibility(View.GONE);
                }
                showSearchEditText();
                if (mListener != null) {
                    mListener.onTitleClicked(this);
                }
                searchEditText.requestFocus();
            }
            return true;
        }
        if (searchEditText.getVisibility() == VISIBLE) {
            final boolean compoundClicked =
                    ev.getX() > searchEditText.getWidth() - searchEditText.getPaddingRight() - clearIconWidth;
            if (compoundClicked && mListener != null) {
                showSearchEditText();
                searchEditText.setText("");
                mListener.onQueryCleared(this);
                return true;
            }
        }
        return super.onInterceptTouchEvent(ev);
    }

    public void showSearchEditText() {
        searchEditText.setVisibility(VISIBLE);
        titleBar.setVisibility(GONE);
    }

    public void showTitleBar() {
        titleBar.setVisibility(VISIBLE);
        searchEditText.setVisibility(GONE);
        if (antiTrackingDetails != null) {
            antiTrackingDetails.setVisibility(View.VISIBLE);
        }

    }

    public void setTitle(String title) {
        titleBar.setText(title);
    }

    public void setSearchText(String text) {
        searchEditText.setText(text);
    }

    public void showKeyBoard() {
        InputMethodManager inputMethodManager = (InputMethodManager) getContext()
                .getSystemService(Context.INPUT_METHOD_SERVICE);
        inputMethodManager.showSoftInput(searchEditText, InputMethodManager.SHOW_IMPLICIT);
    }

    public void hideKeyboard() {
        InputMethodManager inputMethodManager = (InputMethodManager) getContext()
                .getSystemService(Context.INPUT_METHOD_SERVICE);
        inputMethodManager.hideSoftInputFromWindow(searchEditText.getWindowToken(), 0);
    }

    public void switchIcon(int type) {
        currentIcon = type;
        Drawable icon;
        switch (type) {
            case ICON_STATE_CLEAR:
                icon = ThemeUtils.getThemedDrawable(getContext(), R.drawable.ic_action_delete, true);
                break;
//            case RELOAD:
//                icon = ThemeUtils.getLightThemedDrawable(getContext(), R.drawable.ic_action_refresh);
//                break;
            case ICON_STATE_STOP:
                icon = ThemeUtils.getThemedDrawable(getContext(), R.drawable.ic_action_delete, true);
                break;
            case ICON_STATE_NONE:
                icon = null;
                break;
            default:
                icon = ThemeUtils.getThemedDrawable(getContext(), R.drawable.ic_action_delete, true);
        }
        titleBar.setCompoundDrawablesWithIntrinsicBounds(null, null, icon, null);
    }

    /**
     * Updates the color of the search bar depending on the mode of the tab
     * @param isIncognito True if the current tab is in incognito mode
     */
    public void setStyle(boolean isIncognito) {
        if (isIncognito) {
            searchEditText.setTextColor(ContextCompat.getColor(getContext(), R.color.url_bar_text_color_incognito));
            searchEditText.setBackgroundColor(ContextCompat.getColor(getContext(), R.color.url_bar_bg_incognito));
            titleBar.setTextColor(ContextCompat.getColor(getContext(), R.color.url_bar_text_color_incognito));
            titleBar.setBackgroundColor(ContextCompat.getColor(getContext(), R.color.url_bar_bg_incognito));
        } else {
            searchEditText.setTextColor(ContextCompat.getColor(getContext(), R.color.url_bar_text_color_normal));
            searchEditText.setBackgroundColor(ContextCompat.getColor(getContext(), R.color.url_bar_bg_normal));
            titleBar.setTextColor(ContextCompat.getColor(getContext(), R.color.url_bar_text_color_normal));
            titleBar.setBackgroundColor(ContextCompat.getColor(getContext(), R.color.url_bar_bg_normal));
        }
        final Drawable icon = ThemeUtils.getThemedDrawable(getContext(), R.drawable.ic_action_delete, true);
        searchEditText.setCompoundDrawablesWithIntrinsicBounds(null, null, icon, null);
        titleBar.setCompoundDrawablesWithIntrinsicBounds(null, null, icon, null);
    }

    public void setAntiTrackingDetailsVisibility(int visibility) {
        if (antiTrackingDetails != null) {
            antiTrackingDetails.setVisibility(visibility);
        }
    }

    public void setTrackerCount(int count) {
        if (trackerCounter != null) {
            trackerCounter.setText(Integer.toString(count));
        }
    }


    private class ListenerWrapper implements TextWatcher, OnFocusChangeListener {

        @Override
        public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            if (mListener != null) {
                mListener.beforeTextChanged(s, start, count, after);
            }
        }

        @Override
        public void onTextChanged(CharSequence s, int start, int before, int count) {
            if (mListener != null) {
                mListener.onTextChanged(s, start, before, count);
            }
        }

        @Override
        public void afterTextChanged(Editable s) {
            if (mListener != null) {
                mListener.afterTextChanged(s);
            }
        }

        @Override
        public void onFocusChange(View v, boolean hasFocus) {
            if (mListener != null) {
                mListener.onFocusChange(searchEditText, hasFocus);
            }

            if (hasFocus) {
                post(new Runnable() {
                    @Override
                    public void run() {
                        showKeyBoard();
                    }
                });
            }
        }
    }
}
