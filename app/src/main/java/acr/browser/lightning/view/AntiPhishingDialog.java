package acr.browser.lightning.view;

import android.content.Context;
import android.content.DialogInterface;
import android.content.DialogInterface.OnClickListener;
import android.content.res.Resources;
import android.support.v7.app.AlertDialog;

import com.cliqz.browser.R;
import com.cliqz.browser.main.Messages;
import com.squareup.otto.Bus;

/**
 * Simple dialog to be shown when we detect a phishing website
 *
 * @author Stefano Pacifici
 * @date 2016/07/12
 */
class AntiPhishingDialog extends AlertDialog {

    private final Bus eventBus;

    public AntiPhishingDialog(Context context, Bus eventBus) {
        super(context);
        this.eventBus = eventBus;
        final Resources resources = context.getResources();
        setTitle(resources.getString(R.string.antiphishing_dialog_title));
        setMessage(resources.getString(R.string.antiphishing_message));
        setButton(DialogInterface.BUTTON_POSITIVE,
                resources.getString(R.string.antiphishing_walk_away), onClickListener);
        setButton(DialogInterface.BUTTON_NEGATIVE,
                resources.getString(R.string.antiphishing_ignore_danger), onClickListener);
        setCancelable(false);
    }

    private final OnClickListener onClickListener = new OnClickListener() {
        @Override
        public void onClick(DialogInterface dialog, int which) {
            switch (which) {
                case DialogInterface.BUTTON_POSITIVE:
                    eventBus.post(new Messages.BackPressed());
                    break;
                default:
                    break;
            }
            dialog.dismiss();
        }
    };
}
