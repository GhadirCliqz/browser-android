package com.cliqz.browser.helper;

import android.content.Intent;
import android.net.Uri;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;

import butterknife.ButterKnife;
import butterknife.OnClick;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        ButterKnife.bind(this);
    }

    @OnClick(R.id.open_url_action)
    void onOpenUrl() {
        final Intent intent = new Intent();
        intent.setAction(Intent.ACTION_VIEW);
        intent.setData(Uri.parse("https://cdn.cliqz.com/mobile/browser/tests/testpage.html"));
        final Intent chooser = Intent.createChooser(intent, getString(R.string.select_a_browser));
        startActivity(chooser);
    }
}
