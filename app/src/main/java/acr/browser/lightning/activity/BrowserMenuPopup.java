package acr.browser.lightning.activity;

import android.content.res.Resources;
import android.graphics.Rect;
import android.graphics.drawable.Drawable;
import android.support.annotation.NonNull;
import android.view.LayoutInflater;
import android.view.View;
import android.view.Window;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.PopupWindow;

import com.squareup.otto.Bus;

import javax.inject.Inject;

import acr.browser.lightning.R;
import acr.browser.lightning.app.BrowserApp;
import acr.browser.lightning.database.BookmarkManager;
import acr.browser.lightning.view.LightningView;
import butterknife.Bind;
import butterknife.ButterKnife;
import butterknife.OnClick;

import static android.view.View.MeasureSpec.AT_MOST;
import static android.view.View.MeasureSpec.EXACTLY;
import static android.view.View.MeasureSpec.makeMeasureSpec;

/**
 * The dialog used as a menu, it permits us to have icons as first line in the context menu.
 * It is public to permit us to inject it.
 *
 * @author Stefano Pacifici
 * @date 2015/09/17
 */
public class BrowserMenuPopup {

    private final PopupWindow popupWindow;
    private final BrowserActivity activity;
    private final View menuContent;
    private View mAnchorView = null;

    @Bind(R.id.action_refresh)
    View refreshActionView;

    @Bind(R.id.action_add_bookmark)
    ImageView addBookmarkActionView;

    @Bind(R.id.action_forward)
    View forwardActionView;

    @Bind(R.id.browser_popup_entries)
    LinearLayout entries;

    @Inject
    Bus eventBus;

    @Inject
    BookmarkManager bookmarkManager;


    public BrowserMenuPopup(@NonNull final BrowserActivity activity) {
        final LayoutInflater layoutInflater = LayoutInflater.from(activity);

        this.activity = activity;
        this.popupWindow = new PopupWindow(activity);
        menuContent = layoutInflater.inflate(R.layout.browser_popup_menu, null);
        popupWindow.setContentView(menuContent);
        popupWindow.setFocusable(true);
        ButterKnife.bind(this, menuContent);
        BrowserApp.getAppComponent().inject(this);
        updateUI();
    }

    private LightningView getCurrentTab() {
        return activity.mTabsManager.getCurrentTab();
    }

    private void updateUI() {
        final LightningView currentTab = getCurrentTab();
        if (currentTab != null) {
            final Resources resources = activity.getResources();
            forwardActionView.setEnabled(currentTab.canGoForward());
            if (bookmarkManager.isBookmark(currentTab.getUrl())) {
                addBookmarkActionView.setImageResource(R.drawable.ic_action_expand);
            } else {
                addBookmarkActionView.setImageResource(R.drawable.ic_action_star);
            }
        }
    }

    public void setAnchorView(final View anchorView) {
        mAnchorView = anchorView;
    }

    /**
     * Show the menu anchored to the previously set anchor
     */
    public void show() {
        if (mAnchorView != null) {
            final Resources res = activity.getResources();
            final View root = mAnchorView.getRootView().findViewById(Window.ID_ANDROID_CONTENT);
            final int rootWidth = root.getWidth();
            final int rootHeight = root.getHeight();
            final int horizontalMargin = (int) res.getDimension(R.dimen.browser_menu_horizontal_margin);
            final int verticalMargin = (int) res.getDimension(R.dimen.browser_menu_vertical_margin);
            final int maxWidth = (2 * rootWidth / 3) - horizontalMargin;
            final int maxHeight = rootHeight - verticalMargin;
            menuContent.measure(makeMeasureSpec(maxWidth, EXACTLY),
                    makeMeasureSpec(maxHeight, AT_MOST));
            final int measuredWidth = menuContent.getMeasuredWidth();
            final int measuredHeight = menuContent.getMeasuredHeight();
            final Rect padding = new Rect();
            final Drawable popupBackground = popupWindow.getBackground();
            if (popupBackground != null) {
                popupBackground.getPadding(padding);
            }
            popupWindow.setWidth(measuredWidth);
            popupWindow.setHeight(measuredHeight + padding.bottom + padding.top);
            popupWindow.showAsDropDown(mAnchorView, 0, -mAnchorView.getHeight());

            updateUI();
        }
    }

    /**
     * Return the menu visibility status
     *
     * @return true if currently visible, false otherwise
     */
    public boolean isShowing() {
        return popupWindow.isShowing();
    }

    /**
     * Dismiss (hide) the menu
     */
    public void dismiss() {
        popupWindow.dismiss();
    }


    @OnClick(R.id.action_refresh)
    void onRefreshClicked() {
        dismiss();
        // menuListener.onBack();
    }

    @OnClick(R.id.action_add_bookmark)
    void onAddBookmarkClicked() {
        dismiss();
        if (activity.mBookmarkManager.isBookmark(getCurrentTab().getUrl())) {
            activity.onAction(R.id.action_add_bookmark);
        } else {
            activity.onAction(R.id.action_del_bookmark);
        }
        updateUI();
    }

    @OnClick(R.id.action_forward)
    void onForwardClicked() {
        dismiss();
        if (getCurrentTab().canGoForward()) {
            activity.onAction(R.id.action_forward);
        }
    }

    @OnClick(R.id.action_new_tab)
    void onNewTabClicked() {
        dismiss();
        activity.onAction(R.id.action_new_tab);
    }

    @OnClick(R.id.action_incognito)
    void onIncognitoClicked() {
        dismiss();
        activity.onAction(R.id.action_incognito);
    }

    @OnClick(R.id.action_share)
    void onShareClicked() {
        dismiss();
        activity.onAction(R.id.action_share);
    }

    @OnClick(R.id.action_history)
    void onHistoryClicked() {
        dismiss();
        activity.onAction(R.id.action_history);
    }

    @OnClick(R.id.action_find)
    void onFindClicked() {
        dismiss();
        activity.onAction(R.id.action_find);
    }

    @OnClick(R.id.action_copy)
    void onCopyClicked() {
        dismiss();
        activity.onAction(R.id.action_copy);
    }

    @OnClick(R.id.action_bookmarks)
    void onBookmarksClicked() {
        dismiss();
        activity.onAction(R.id.action_bookmarks);
    }

    @OnClick(R.id.action_reading_mode)
    void onReadingModeClicked() {
        dismiss();
        activity.onAction(R.id.action_reading_mode);
    }

    @OnClick(R.id.action_settings)
    void onSettingsClicked() {
        dismiss();
        activity.onAction(R.id.action_settings);
    }
}
