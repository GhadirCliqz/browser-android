/*
 * Copyright 2014 A.C.R. Development
 */
package acr.browser.lightning.database;

import android.graphics.Bitmap;
import android.support.annotation.NonNull;

public class HistoryItem implements Comparable<HistoryItem> {

    // private variables
    private int mId = 0;
    private String mUrl = "";
    private String mTitle = "";
    private String mFolder = "";
    private Bitmap mBitmap = null;
    private int mImageId = 0;
    private int mOrder = 0;
    private long mTimestamp;
    private boolean mIsFolder = false;

    // Empty constructor
    public HistoryItem() {

    }

    public HistoryItem(HistoryItem item) {
        this.mUrl = item.mUrl;
        this.mTitle = item.mTitle;
        this.mFolder = item.mFolder;
        this.mOrder = item.mOrder;
        this.mIsFolder = item.mIsFolder;
        this.mTimestamp = item.mTimestamp;
    }

    // constructor
    public HistoryItem(int id, String url, String title) {
        this.mId = id;
        this.mUrl = url;
        this.mTitle = title;
        this.mBitmap = null;
        this.mTimestamp = System.currentTimeMillis();
    }

    // constructor
    public HistoryItem(String url, String title) {
        this.mUrl = url;
        this.mTitle = title;
        this.mBitmap = null;
        this.mTimestamp = System.currentTimeMillis();
    }

    // constructor
    public HistoryItem(String url, String title, int imageId) {
        this.mUrl = url;
        this.mTitle = title;
        this.mBitmap = null;
        this.mImageId = imageId;
        this.mTimestamp = System.currentTimeMillis();
    }

    public StringBuilder toJsonString(final StringBuilder sb) {
        if (mUrl != null /*&& !url.isEmpty() && (
                        (title.toLowerCase(locale).contains(q)) ||
                                (url.toLowerCase(locale).contains(q))
                        )*/) {
            final String title;
            if (mTitle.contains("\"")) {
                title = mTitle.replace("\"", "\\\"");
            } else {
                title = mTitle;
            }
            sb.append("{\"title\":\"")
                    .append(title)
                    .append("\",\"url\":\"")
                    .append(mUrl)
                    .append("\",\"timestamp\":")
                    .append(mTimestamp)
                    .append(", \"score\": 0}");
        }
        return sb;
    }

    // getting ID
    public int getId() {
        return this.mId;
    }

    public int getImageId() {
        return this.mImageId;
    }

    // setting id
    public void setID(int id) {
        this.mId = id;
    }

    public void setImageId(int id) {
        this.mImageId = id;
    }

    public void setBitmap(Bitmap image) {
        mBitmap = image;
    }

    public void setFolder(String folder) {
        mFolder = (folder == null) ? "" : folder;
    }

    public void setOrder(int order) {
        mOrder = order;
    }

    public int getOrder() {
        return mOrder;
    }

    public String getFolder() {
        return mFolder;
    }

    public Bitmap getBitmap() {
        return mBitmap;
    }

    // getting name
    public String getUrl() {
        return this.mUrl;
    }

    // setting name
    public void setUrl(String url) {
        this.mUrl = (url == null) ? "" : url;
    }

    // getting phone number
    public String getTitle() {
        return this.mTitle;
    }

    // getting the timestamp
    public long getTimestamp() {
        return mTimestamp;
    }

    // setting phone number
    public void setTitle(String title) {
        this.mTitle = (title == null) ? "" : title;
    }

    public void setIsFolder(boolean isFolder) {
        mIsFolder = isFolder;
    }

    public void setTimestamp(long timestamp) {
        mTimestamp = timestamp;
    }

    public boolean isFolder() {
        return mIsFolder;
    }

    @Override
    public String toString() {
        return mTitle;
    }

    @Override
    public int compareTo(@NonNull HistoryItem another) {
        return mTitle.compareTo(another.mTitle);
    }

    @Override
    public boolean equals(Object o) {

        if (this == o) {
            return true;
        }
        if (o == null || ((Object) this).getClass() != o.getClass()) {
            return false;
        }

        HistoryItem that = (HistoryItem) o;

        if (mId != that.mId) {
            return false;
        }
        if (mImageId != that.mImageId) {
            return false;
        }
        if (mBitmap != null ? !mBitmap.equals(that.mBitmap) : that.mBitmap != null) {
            return false;
        }
        return mTitle.equals(that.mTitle) && mUrl.equals(that.mUrl);
    }

    @Override
    public int hashCode() {

        int result = mId;
        result = 31 * result + mUrl.hashCode();
        result = 31 * result + mTitle.hashCode();
        result = 31 * result + (mBitmap != null ? mBitmap.hashCode() : 0);
        result = 31 * result + mImageId;

        return result;
    }
}
