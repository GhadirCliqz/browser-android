package acr.browser.lightning.view;

import android.annotation.TargetApi;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.net.MailTo;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Build;
import android.os.Message;
import android.support.annotation.NonNull;
import android.support.v7.app.AlertDialog;
import android.text.InputType;
import android.text.method.PasswordTransformationMethod;
import android.util.Log;
import android.webkit.HttpAuthHandler;
import android.webkit.SslErrorHandler;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.LinearLayout;

import com.cliqz.browser.main.Messages;
import com.squareup.otto.Bus;

import java.io.ByteArrayInputStream;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;

import acr.browser.lightning.R;
import acr.browser.lightning.app.BrowserApp;
import acr.browser.lightning.bus.BrowserEvents;
import acr.browser.lightning.constant.Constants;
import acr.browser.lightning.utils.AdBlock;
import acr.browser.lightning.utils.IntentUtils;
import acr.browser.lightning.utils.ProxyUtils;
import acr.browser.lightning.utils.Utils;

/**
 * @author Stefano Pacifici based on Anthony C. Restaino's code
 * @date 2015/09/22
 */
class LightningWebClient extends WebViewClient {

    private static final String CLIQZ_SCHEME = "cliqz";
    private static final String CLIQZ_TRAMPOLINE_AUTHORITY = "trampoline";
    private static final String CLIQZ_TRAMPOLINE_FORWARD = "/goto.html";
    private static final String CLIQZ_TRAMPOLINE_SEARCH = "/search.html";

    private final Activity mActivity;
    private final LightningView mLightningView;
    private final AdBlock mAdBlock;
    private final Bus mEventBus;
    private final IntentUtils mIntentUtils;
    private final WebView mWebView;

    LightningWebClient(Activity activity, LightningView lightningView) {
        mActivity = activity;
        mLightningView = lightningView;
        mAdBlock = AdBlock.getInstance(activity);
        mAdBlock.updatePreference();
        mEventBus = BrowserApp.getAppComponent().getBus();
        mIntentUtils = new IntentUtils(activity);
        mWebView = lightningView.getWebView();
    }

    @TargetApi(Build.VERSION_CODES.LOLLIPOP)
    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        final WebResourceResponse cliqzResponse = handleCliqzUrl(view, request.getUrl());
        return cliqzResponse != null ? cliqzResponse : super.shouldInterceptRequest(view, request);
    }

    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
        final WebResourceResponse cliqzResponse = handleCliqzUrl(view, Uri.parse(url));
        return cliqzResponse != null ? cliqzResponse : super.shouldInterceptRequest(view, url);
    }

    private WebResourceResponse handleCliqzUrl(WebView view, Uri uri) {
        if (!CLIQZ_SCHEME.equals(uri.getScheme())) {
            return null;
        }

        final String path = uri.getPath();
        if (CLIQZ_TRAMPOLINE_AUTHORITY.equals(uri.getAuthority())) {
            if (CLIQZ_TRAMPOLINE_FORWARD.equals(uri.getPath())) {
                final Resources resources = view.getResources();
                final WebResourceResponse response =
                        new WebResourceResponse("text/html", "UTF-8",
                                resources.openRawResource(R.raw.trampoline_forward));
                return response;
            }
            if (CLIQZ_TRAMPOLINE_SEARCH.equals(uri.getPath())) {
                final String query = uri.getQueryParameter("q");
                mLightningView.telemetry.sendBackPressedSignal("web", "cards", query.length());
                view.post(new Runnable() {
                    @Override
                    public void run() {
                        mEventBus.post(new Messages.ShowSearch(query));
                    }
                });
                final WebResourceResponse response =
                        new WebResourceResponse("test/plain", "UTF-8",
                                new ByteArrayInputStream("OK".getBytes()));
                return response;
            }
        }
        return null;
    }

    @TargetApi(Build.VERSION_CODES.KITKAT)
    @Override
    public void onPageFinished(WebView view, String url) {
        if (view.isShown()) {
            mEventBus.post(new BrowserEvents.UpdateUrl(url,true));
            view.postInvalidate();
        }
        if (view.getTitle() == null || view.getTitle().isEmpty()
                || view.getTitle().contains(Constants.CLIQZ_TRAMPOLINE)) {
            mLightningView.mTitle.setTitle(mActivity.getString(R.string.untitled));
        } else {
            mLightningView.mTitle.setTitle(view.getTitle());
        }
        mEventBus.post(new Messages.UpdateTitle());
        if (Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT &&
                mLightningView.getInvertePage()) {
            view.evaluateJavascript(Constants.JAVASCRIPT_INVERT_PAGE, null);
        }
        mEventBus.post(new BrowserEvents.TabsChanged());
    }

    @Override
    public void onPageStarted(WebView view, String url, Bitmap favicon) {
        if(mLightningView.telemetry.backPressed) {
            if(!url.contains(Constants.CLIQZ_TRAMPOLINE)) {
                if(mLightningView.telemetry.showingCards) {
                    mLightningView.telemetry.sendBackPressedSignal("cards", "web", url.length());
                    mLightningView.telemetry.showingCards = false;
                } else {
                    mLightningView.telemetry.sendBackPressedSignal("web", "web", url.length());
                }
            }
            mLightningView.telemetry.backPressed = false;
        }

        mLightningView.mTitle.setFavicon(null);
        if (mLightningView.isShown()) {
            mEventBus.post(new BrowserEvents.UpdateUrl(url, false));
            mEventBus.post(new BrowserEvents.ShowActionBar());
        }
        mEventBus.post(new BrowserEvents.TabsChanged());
    }

    @Override
    public void onReceivedHttpAuthRequest(final WebView view, @NonNull final HttpAuthHandler handler,
                                          final String host, final String realm) {

        AlertDialog.Builder builder = new AlertDialog.Builder(mActivity);
        final EditText name = new EditText(mActivity);
        final EditText password = new EditText(mActivity);
        LinearLayout passLayout = new LinearLayout(mActivity);
        passLayout.setOrientation(LinearLayout.VERTICAL);

        passLayout.addView(name);
        passLayout.addView(password);

        name.setHint(mActivity.getString(R.string.hint_username));
        name.setSingleLine();
        password.setInputType(InputType.TYPE_TEXT_VARIATION_PASSWORD);
        password.setSingleLine();
        password.setTransformationMethod(new PasswordTransformationMethod());
        password.setHint(mActivity.getString(R.string.hint_password));
        builder.setTitle(mActivity.getString(R.string.title_sign_in));
        builder.setView(passLayout);
        builder.setCancelable(true)
                .setPositiveButton(mActivity.getString(R.string.title_sign_in),
                        new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int id) {
                                String user = name.getText().toString();
                                String pass = password.getText().toString();
                                handler.proceed(user.trim(), pass.trim());
                                Log.d(Constants.TAG, "Request Login");

                            }
                        })
                .setNegativeButton(mActivity.getString(R.string.action_cancel),
                        new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int id) {
                                handler.cancel();

                            }
                        });
        AlertDialog alert = builder.create();
        alert.show();

    }

    private boolean mIsRunning = false;
    private float mZoomScale = 0.0f;

    @TargetApi(Build.VERSION_CODES.KITKAT)
    @Override
    public void onScaleChanged(final WebView view, final float oldScale, final float newScale) {
        if (view.isShown() && mLightningView.mPreferences.getTextReflowEnabled() &&
                Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
            if (mIsRunning)
                return;
            if (Math.abs(mZoomScale - newScale) > 0.01f) {
                mIsRunning = view.postDelayed(new Runnable() {

                    @Override
                    public void run() {
                        mZoomScale = newScale;
                        view.evaluateJavascript(Constants.JAVASCRIPT_TEXT_REFLOW, null);
                        mIsRunning = false;
                    }

                }, 100);
            }

        }
    }

    private static List<Integer> getAllSslErrorMessageCodes(SslError error) {
        List<Integer> errorCodeMessageCodes = new ArrayList<>();

        if (error.hasError(SslError.SSL_DATE_INVALID)) {
            errorCodeMessageCodes.add(R.string.message_certificate_date_invalid);
        }
        if (error.hasError(SslError.SSL_EXPIRED)) {
            errorCodeMessageCodes.add(R.string.message_certificate_expired);
        }
        if (error.hasError(SslError.SSL_IDMISMATCH)) {
            errorCodeMessageCodes.add(R.string.message_certificate_domain_mismatch);
        }
        if (error.hasError(SslError.SSL_NOTYETVALID)) {
            errorCodeMessageCodes.add(R.string.message_certificate_not_yet_valid);
        }
        if (error.hasError(SslError.SSL_UNTRUSTED)) {
            errorCodeMessageCodes.add(R.string.message_certificate_untrusted);
        }
        if (error.hasError(SslError.SSL_INVALID)) {
            errorCodeMessageCodes.add(R.string.message_certificate_invalid);
        }

        return errorCodeMessageCodes;
    }

    @Override
    public void onReceivedSslError(WebView view, @NonNull final SslErrorHandler handler, SslError error) {
        List<Integer> errorCodeMessageCodes = getAllSslErrorMessageCodes(error);

        StringBuilder stringBuilder = new StringBuilder();
        for (Integer messageCode : errorCodeMessageCodes) {
            stringBuilder.append(" - ").append(mActivity.getString(messageCode)).append('\n');
        }
        String alertMessage =
                mActivity.getString(R.string.message_insecure_connection, stringBuilder.toString());

        AlertDialog.Builder builder = new AlertDialog.Builder(mActivity);
        builder.setTitle(mActivity.getString(R.string.title_warning));
        builder.setMessage(alertMessage)
                .setCancelable(true)
                .setPositiveButton(mActivity.getString(R.string.action_yes),
                        new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int id) {
                                handler.proceed();
                            }
                        })
                .setNegativeButton(mActivity.getString(R.string.action_no),
                        new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int id) {
                                handler.cancel();
                            }
                        });
        builder.create().show();
    }

    @Override
    public void onFormResubmission(WebView view, @NonNull final Message dontResend, final Message resend) {
        AlertDialog.Builder builder = new AlertDialog.Builder(mActivity);
        builder.setTitle(mActivity.getString(R.string.title_form_resubmission));
        builder.setMessage(mActivity.getString(R.string.message_form_resubmission))
                .setCancelable(true)
                .setPositiveButton(mActivity.getString(R.string.action_yes),
                        new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int id) {
                                resend.sendToTarget();
                            }
                        })
                .setNegativeButton(mActivity.getString(R.string.action_no),
                        new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int id) {
                                dontResend.sendToTarget();
                            }
                        });
        AlertDialog alert = builder.create();
        alert.show();
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, String url) {
        // Check if configured proxy is available
        if (!ProxyUtils.getInstance().isProxyReady(view.getContext())) {
            // User has been notified
            return true;
        }

        if (mLightningView.mIsIncognitoTab) {
            return super.shouldOverrideUrlLoading(view, url);
        }
        if (url.startsWith("about:")) {
            return super.shouldOverrideUrlLoading(view, url);
        }
        if (url.contains("mailto:")) {
            MailTo mailTo = MailTo.parse(url);
            Intent i = Utils.newEmailIntent(mailTo.getTo(), mailTo.getSubject(),
                    mailTo.getBody(), mailTo.getCc());
            mActivity.startActivity(i);
            view.reload();
            return true;
        } else if (url.startsWith("intent://")) {
            Intent intent;
            try {
                intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME);
            } catch (URISyntaxException ex) {
                return false;
            }
            if (intent != null) {
                intent.addCategory(Intent.CATEGORY_BROWSABLE);
                intent.setComponent(null);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.ICE_CREAM_SANDWICH_MR1) {
                    intent.setSelector(null);
                }
                try {
                    mActivity.startActivity(intent);
                } catch (ActivityNotFoundException e) {
                    Log.e(Constants.TAG, "ActivityNotFoundException");
                }
                return true;
            }
        }
        // CLIQZ! We do not want to open external app from our browser, so we return false here
        // boolean startActivityForUrl = mIntentUtils.startActivityForUrl(view, url);
         if(!url.contains(Constants.CLIQZ_TRAMPOLINE) && mLightningView.clicked) {
             mLightningView.clicked = false;
             mLightningView.telemetry.sendNavigationSignal(url.length());
         }
        // return startActivityForUrl;
        return false;
    }
}