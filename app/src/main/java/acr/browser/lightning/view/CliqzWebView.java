package acr.browser.lightning.view;

import android.app.Activity;
import android.os.Build;
import android.util.AttributeSet;
import android.view.ViewGroup;
import android.webkit.WebView;

import com.cliqz.browser.app.BrowserApp;
import com.cliqz.browser.di.components.ActivityComponent;
import com.cliqz.browser.main.Messages;
import com.squareup.otto.Bus;

import javax.inject.Inject;

/**
 * General workaround container for old phones
 *
 * @author Stefano Pacifici
 * @date 2016/03/14
 */
public class CliqzWebView extends WebView {

    @Inject
    Bus bus;

    public CliqzWebView(Activity activity) {
        this(activity, null);
    }

    public CliqzWebView(Activity activity, AttributeSet attrs) {
        this(activity, attrs, 0);
    }

    public CliqzWebView(Activity activity, AttributeSet attrs, int defStyleAttr) {
        super(activity, attrs, defStyleAttr);
        final ActivityComponent component = BrowserApp.getActivityComponent(activity);
        if (component != null) {
            component.inject(this);
        }
    }

    @Override
    public void bringToFront() {
        final ViewGroup container = (ViewGroup) getParent();
        //return if the view is already on top
        if (container.getChildAt(container.getChildCount()-1).getId() == getId()) {
            return;
        }
        super.bringToFront();
        bus.post(new Messages.AdjustResize());
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.KITKAT) {
            requestLayout();
        }
    }

    protected final void executeJS(final String js) {
        if (js != null && !js.isEmpty()) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                this.evaluateJavascript(js, null);
            } else {
                this.loadUrl("javascript:" + js);
            }
        }
    }

    public int getVerticalScrollHeight() {
        return computeVerticalScrollRange();
    }
}
