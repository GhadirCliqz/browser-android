package com.cliqz.browser.utils;

import android.content.Context;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FilenameFilter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.ObjectInputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;

import acr.browser.lightning.constant.Constants;
import acr.browser.lightning.preference.PreferenceManager;

/**
 * Created by Ravjit on 23/11/15.
 */
public class HttpHandler implements Runnable {

    private static final String HEADER_CONTENT_TYPE = "Content-Type";
    private static final String HEADER_CONTENT_ENCODING = "Content-Encoding";
    private static final String ENCODING_GZIP = "gzip";
    private static final String TYPE_JSON = "application/json";
    private Context context;
    private PreferenceManager mPreferenceManager;

    public HttpHandler(PreferenceManager mPreferenceManager, Context context) {
        this.mPreferenceManager = mPreferenceManager;
        this.context = context;
    }

    @Override
    public void run() {
        File directory = context.getFilesDir();
        File[] telemetryLogs = directory.listFiles(new FilenameFilter() {
            @Override
            public boolean accept(File dir, String filename) {
                return filename.startsWith(Constants.TELEMETRY_LOG_PREFIX);
            }
        });

        for(File file : telemetryLogs) {
            FileInputStream fileInputStream = null;
            try {
                fileInputStream = new FileInputStream(file);
                ObjectInputStream objectInputStream = new ObjectInputStream(fileInputStream);
                ArrayList<HashMap<String,Object>> signalList =
                    (ArrayList<HashMap<String,Object>>)objectInputStream.readObject();
                objectInputStream.close();
                fileInputStream.close();
                try {
                    pushTelemetry(new JSONArray(signalList).toString());
                    file.delete();
                } catch (Exception e) {
                    Log.e(Constants.TAG, "Failed to post telemetry to server", e);
                }
            } catch (IOException e) {
                e.printStackTrace();
            } catch (ClassNotFoundException e) {
                e.printStackTrace();
            }
        }
    }

    private void pushTelemetry(String postMessage) throws Exception {
            URL url = new URL("https://logging.cliqz.com");
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
            int responseCode = httpURLConnection.getResponseCode();
            String responseMessage = "";
            if(responseCode == 200) {
                DataInputStream dataInputStream = new DataInputStream(httpURLConnection.getInputStream());
                BufferedReader lines = new BufferedReader(new InputStreamReader(dataInputStream, "UTF-8"));
                while (true) {
                    String line = lines.readLine();
                    if(line == null) {
                        break;
                    } else {
                        responseMessage+=line;
                    }
                }
                JSONObject response = new JSONObject(responseMessage);
                if(response.has("new_session")) {
                    mPreferenceManager.setSessionId(response.getString("new_session"));
                }
            } else {
                throw new RuntimeException("Failed");
            }
    }

}
