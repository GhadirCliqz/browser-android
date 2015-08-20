/*
 * Copyright 2014 A.C.R. Development
 */
package acr.browser.lightning.activity;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.support.v7.widget.Toolbar;
import android.view.MenuItem;
import android.view.View;
import android.widget.TextView;

import java.util.Locale;

import acr.browser.lightning.BuildConfig;
import acr.browser.lightning.R;

public class AboutSettingsActivity extends ThemableSettingsActivity {

	private int mEasterEggCounter;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.about_settings);

		Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
		setSupportActionBar(toolbar);
		getSupportActionBar().setDisplayHomeAsUpEnabled(true);

		initialize();
	}

	private void initialize() {
		final String version = getString(R.string.about_version_format,
				BuildConfig.VERSION_NAME, BuildConfig.LIGHTNING_VERSION_NAME);
		TextView versionCode = (TextView) findViewById(R.id.versionCode);
		versionCode.setText(version);
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item) {
		finish();
		return true;
	}

	public void onContactClicked(View view) {
		final Uri mailToUri = Uri.parse(
				String.format(Locale.getDefault(),
						"mailto:%s?subject=%s",
						getString(R.string.feedback_at_cliqz_dot_com),
						getString(R.string.feedback_mail_subject)
				)
		);
		final Intent emailIntent = new Intent(Intent.ACTION_SENDTO);
		emailIntent.setData(mailToUri);
		startActivity(Intent.createChooser(emailIntent, getString(R.string.contact_cliqz)));
	}

	public void onVersionClicked(View view) {
		mEasterEggCounter++;
		if (mEasterEggCounter == 10) {
			startActivity(new Intent(Intent.ACTION_VIEW,
					Uri.parse("http://img-9gag-fun.9cache.com/photo/a0YZw3q_700b.jpg"), this,
					MainActivity.class));
			finish();
			mEasterEggCounter = 0;
		}
	}

	public void showUrl(View view) {
		final String url = (String) view.getTag();
		startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url), this, MainActivity.class));
		finish();
	}
}
