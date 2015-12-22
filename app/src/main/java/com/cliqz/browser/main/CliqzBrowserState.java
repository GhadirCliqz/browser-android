package com.cliqz.browser.main;

import org.json.JSONException;
import org.json.JSONObject;

import javax.inject.Inject;
import javax.inject.Singleton;

import acr.browser.lightning.preference.PreferenceManager;

/**
 * This class keep the state of the app and help to dispatch it to the extension during init.
 *
 * @author Stefano Pacifici
 * @date 2015/12/21
 */
@Singleton
public class CliqzBrowserState {

    private final static String TIMESTAMP_LABEL = "timestamp";
    private final static String QUERY_LABEL = "q";
    private final static String CARD_LABEL = "card";
    private final static String LATITUDE_LABEL = "lat";
    private final static String LONGITUDE_LABEL = "lon";
    private final static String TITLE_LABEL = "title";
    private final static String URL_LABEL = "url";
    private static final String TIME_LABEL = "t";

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public int getCardIndex() {
        return cardIndex;
    }

    public void setCardIndex(int cardIndex) {
        this.cardIndex = cardIndex;
    }

    public float getLatitude() {
        return latitude;
    }

    public void setLatitude(float latitude) {
        this.latitude = latitude;
    }

    public float getLongitude() {
        return longitude;
    }

    public void setLongitude(float longitude) {
        this.longitude = longitude;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    private final PreferenceManager preferenceManager;

    private long timestamp = -1;
    private String query = "";
    private int cardIndex = -1;
    private float latitude = Float.MAX_VALUE;
    private float longitude = Float.MAX_VALUE;
    private String title = "";
    private String url = "";

    @Inject
    public CliqzBrowserState(PreferenceManager preferenceManager) {
        this.preferenceManager = preferenceManager;
        load();
    }

    public void load() {

        fromJSON(preferenceManager.getBrowserState());
    }

    public void store() {
        preferenceManager.setBrowserState(toJSON());
    }

    private void fromJSON(String json) {
        try {
            final JSONObject in = new JSONObject(json);
            timestamp = in.optLong(TIMESTAMP_LABEL, -1);
            query = in.optString(QUERY_LABEL, "");
            cardIndex = in.optInt(CARD_LABEL, -1);
            latitude = (float) in.optDouble(LATITUDE_LABEL, Float.MAX_VALUE);
            longitude = (float) in.optDouble(LONGITUDE_LABEL, Float.MAX_VALUE);
            title = in.optString(TITLE_LABEL, "");
            url = in. optString(URL_LABEL, "");
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    /**
     * Create a JSON representation of the app status. Used to restore the state of the extension
     * when resuming.
     *
     * @return a JSON object as String representing the persisted state
     */
    public String toJSON() {
        try {
            final JSONObject out = new JSONObject();
            out.put(TIME_LABEL, System.currentTimeMillis() - timestamp);
            out.put(TIMESTAMP_LABEL, timestamp);
            final String q = query != null ? query : "";
            out.put(QUERY_LABEL, q);
            if (cardIndex >= 0) {
                out.put(CARD_LABEL, cardIndex);
            }
            if (latitude != Float.MAX_VALUE && longitude != Float.MAX_VALUE) {
                out.put(LATITUDE_LABEL, latitude);
                out.put(LONGITUDE_LABEL, longitude);
            }
            if (title != null && !title.isEmpty()) {
                out.put(TITLE_LABEL, title);
            }
            if (url != null && !url.isEmpty()) {
                out.put(URL_LABEL, url);
            }
            return out.toString();
        } catch (JSONException e) {
            return "{}";
        }
    }
}
