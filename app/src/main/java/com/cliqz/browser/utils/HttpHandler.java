package com.cliqz.browser.utils;

import android.os.AsyncTask;
import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

import acr.browser.lightning.constant.Constants;
import acr.browser.lightning.preference.PreferenceManager;

/**
 * Created by Ravjit on 23/11/15.
 */
public class HttpHandler extends AsyncTask {

    private static final String HEADER_CONTENT_TYPE = "Content-Type";
    private static final String HEADER_CONTENT_ENCODING = "Content-Encoding";
    private static final String ENCODING_GZIP = "gzip";
    private static final String TYPE_JSON = "application/json";
    private String responseMessage;
    private int responseCode;

    PreferenceManager mPreferenceManager;
    public HttpHandler(PreferenceManager mPreferenceManager) {
        this.mPreferenceManager = mPreferenceManager;
    }

    @Override
    protected Object doInBackground(Object[] params) {

        try {
            URL url = new URL("https://logging.cliqz.com");
            String postMessage = (String) params[0];
            HttpURLConnection httpURLConnection = (HttpURLConnection) url.openConnection();
            httpURLConnection.setRequestMethod("POST");
            httpURLConnection.setDoOutput(true);
            httpURLConnection.setUseCaches(false);
            httpURLConnection.setConnectTimeout(10000);
            httpURLConnection.setReadTimeout(10000);
            httpURLConnection.setRequestProperty(HEADER_CONTENT_TYPE, TYPE_JSON);
            //TODO uncomment when decompression implemented in server
            // httpURLConnection.setRequestProperty(HEADER_CONTENT_ENCODING, ENCODING_GZIP);
            httpURLConnection.connect();
            DataOutputStream dataOutputStream = new DataOutputStream(httpURLConnection.getOutputStream());
            dataOutputStream.writeBytes(postMessage);
            dataOutputStream.close();
            responseCode = httpURLConnection.getResponseCode();
            if(responseCode == 200) {
                DataInputStream dataInputStream = new DataInputStream(httpURLConnection.getInputStream());
                BufferedReader lines = new BufferedReader(new InputStreamReader(dataInputStream, "UTF-8"));
                responseMessage = "";
                while (true) {
                    String line = lines.readLine();
                    if(line == null) {
                        break;
                    } else {
                        responseMessage+=line;
                    }
                }
            } else {
                responseMessage = null;
                Log.e(Constants.TAG, "Error posting data. Server response code: "
                        + Integer.toString(responseCode));
            }
        } catch (IOException e) {
            Log.e(Constants.TAG, "IOException in HttpHandler", e);
        }
        return null;
    }

    @Override
    protected void onPostExecute(Object o) {
        if(responseMessage != null) {
            try {
                JSONObject response = new JSONObject(responseMessage);
                if(response.has("new_session")) {
                    mPreferenceManager.setSessionId(response.getString("new_session"));
                }
            } catch (JSONException e) {
                Log.e(Constants.TAG, "JSONException in HttpHandler", e);
            }
        }
        super.onPostExecute(o);
    }
}
