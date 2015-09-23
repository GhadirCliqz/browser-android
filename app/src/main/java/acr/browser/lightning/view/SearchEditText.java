package acr.browser.lightning.view;

import android.content.Context;
import android.util.AttributeSet;
import android.view.KeyEvent;
import android.widget.EditText;

/**
 * Created by strider29 on 22/09/15.
 */
public class SearchEditText extends EditText {

    public SearchEditText(Context context, AttributeSet attributeSet) {

        super(context,attributeSet);
    }

    @Override
    public boolean onKeyPreIme (int keyCode, KeyEvent event) {
        if(keyCode == KeyEvent.KEYCODE_BACK && this.hasFocus()) {
            this.clearFocus();
        }
        return super.onKeyPreIme(keyCode, event);
    }
}
