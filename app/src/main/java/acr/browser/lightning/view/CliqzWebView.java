package acr.browser.lightning.view;

import android.content.Context;
import android.os.Build;
import android.util.AttributeSet;
import android.webkit.WebView;

/**
 * General workaround container for old phones
 *
 * @author Stefano Pacifici
 * @date 2016/03/14
 */
public class CliqzWebView extends WebView {
    public CliqzWebView(Context context) {
        this(context, null);
    }

    public CliqzWebView(Context context, AttributeSet attrs) {
        this(context, attrs, 0);
    }

    public CliqzWebView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    @Override
    public void bringToFront() {
        super.bringToFront();
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.KITKAT) {
            requestLayout();
        }
    }
}
