/*
 * Copyright 2014 A.C.R. Development
 */
package acr.browser.lightning.database;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import java.util.ArrayList;
import java.util.List;

import javax.inject.Inject;
import javax.inject.Singleton;

import acr.browser.lightning.R;
import dagger.Provides;

@Singleton
public class HistoryDatabase extends SQLiteOpenHelper {

    // All Static variables
    // Database Version
    private static final int DATABASE_VERSION = 3;

    // Database Name
    private static final String DATABASE_NAME = "historyManager";

    // HistoryItems table name
    private static final String TABLE_HISTORY = "history";

    // HistoryItems Table Columns names
    private static final String KEY_ID = "id";
    private static final String KEY_URL = "url";
    private static final String KEY_TITLE = "title";
    private static final String KEY_TIME_VISITED = "time";
    private static final String KEY_COUNT_VISITED = "visits";

    private SQLiteDatabase mDatabase;

    @Inject
    public HistoryDatabase(Context context) {
        super(context.getApplicationContext(), DATABASE_NAME, null, DATABASE_VERSION);
        mDatabase = this.getWritableDatabase();
    }

    // Creating Tables
    @Override
    public void onCreate(SQLiteDatabase db) {
        String CREATE_HISTORY_TABLE = "CREATE TABLE " + TABLE_HISTORY + '(' + KEY_ID
                + " INTEGER PRIMARY KEY," + KEY_URL + " TEXT," + KEY_TITLE + " TEXT,"
                + KEY_TIME_VISITED + " INTEGER" + ", " + KEY_COUNT_VISITED + " INTEGER)";
        db.execSQL(CREATE_HISTORY_TABLE);
        final String CREATE_HISTORY_INDEX_URL = "CREATE INDEX IF NOT EXISTS urlIndex ON " +
                TABLE_HISTORY + "(" + KEY_URL + " COLLATE NOCASE)";
        db.execSQL(CREATE_HISTORY_INDEX_URL);
        final String CREATE_VISITS_INDEX = "CREATE INDEX IF NOT EXISTS countIndex ON " +
                TABLE_HISTORY + "(" + KEY_COUNT_VISITED + ")";
        db.execSQL(CREATE_VISITS_INDEX);


    }

    // Upgrading database
    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        if (oldVersion == 2) {
            db.execSQL("ALTER TABLE " + TABLE_HISTORY + " ADD " + KEY_COUNT_VISITED + " INTEGER");
            final String CREATE_VISITS_INDEX = "CREATE INDEX IF NOT EXISTS countIndex ON " +
                    TABLE_HISTORY + "(" + KEY_COUNT_VISITED + ")";
            db.execSQL(CREATE_VISITS_INDEX);
        } else {
            // Drop older table if it exists
            db.execSQL("DROP TABLE IF EXISTS " + TABLE_HISTORY);
            // Create tables again
            onCreate(db);
        }
    }

    public synchronized void deleteHistory() {
        mDatabase.delete(TABLE_HISTORY, null, null);
        mDatabase.close();
        mDatabase = this.getWritableDatabase();
    }

    private synchronized boolean isClosed() {
        return mDatabase == null || !mDatabase.isOpen();
    }

    @Override
    public synchronized void close() {
        if (mDatabase != null) {
            mDatabase.close();
            mDatabase = null;
        }
        super.close();
    }

    private void openIfNecessary() {
        if (isClosed()) {
            mDatabase = this.getWritableDatabase();
        }
    }

    public synchronized void deleteHistoryItem(String url) {
        openIfNecessary();
        mDatabase.delete(TABLE_HISTORY, KEY_URL + " = ?", new String[]{url});
    }

    public synchronized void visitHistoryItem(@NonNull String url, @Nullable String title) {
        openIfNecessary();
        Cursor q = mDatabase.query(false, TABLE_HISTORY, new String[]{KEY_URL, KEY_COUNT_VISITED},
                KEY_URL + " = ?", new String[]{url}, null, null, null, "1");
        if (q.getCount() > 0) {
            q.moveToFirst();
            final ContentValues values = new ContentValues();
            values.put(KEY_TITLE, title == null ? "" : title);
            values.put(KEY_TIME_VISITED, System.currentTimeMillis());
            values.put(KEY_COUNT_VISITED, q.getInt(1) + 1);
            mDatabase.update(TABLE_HISTORY, values, KEY_URL + " = ?", new String[]{url});

        } else {
            addHistoryItem(new HistoryItem(url, title == null ? "" : title));
        }
        q.close();
    }

    public synchronized List<HistoryItem> getTopSites(int limit) {
        openIfNecessary();
        if (limit < 1) {
            limit = 1;
        } else if (limit > 100) {
            limit = 100;
        }
        List<HistoryItem> itemList = new ArrayList<>();
        String selectQuery = "SELECT * FROM " + TABLE_HISTORY + " ORDER BY " + KEY_COUNT_VISITED
                + " DESC LIMIT " + limit;

        Cursor cursor = mDatabase.rawQuery(selectQuery, null);
        int counter = 0;
        if (cursor.moveToFirst()) {
            do {
                final HistoryItem item = new HistoryItem();
                item.setUrl(cursor.getString(1));
                item.setTitle(cursor.getString(2));
                item.setTimestamp(cursor.getLong(3));
                item.setImageId(R.drawable.ic_history);
                itemList.add(item);
                counter++;
            } while (cursor.moveToNext() && counter < 100);
        }
        cursor.close();
        return itemList;

    }

    private synchronized void addHistoryItem(@NonNull HistoryItem item) {
        openIfNecessary();
        ContentValues values = new ContentValues();
        values.put(KEY_URL, item.getUrl());
        values.put(KEY_TITLE, item.getTitle());
        values.put(KEY_TIME_VISITED, System.currentTimeMillis());
        mDatabase.insert(TABLE_HISTORY, null, values);
    }

    synchronized String getHistoryItem(String url) {
        openIfNecessary();
        Cursor cursor = mDatabase.query(TABLE_HISTORY, new String[]{KEY_ID, KEY_URL, KEY_TITLE},
                KEY_URL + " = ?", new String[]{url}, null, null, null, null);
        String m = null;
        if (cursor != null) {
            cursor.moveToFirst();
            m = cursor.getString(0);

            cursor.close();
        }
        return m;
    }

    public synchronized List<HistoryItem> findItemsContaining(@Nullable String search, int limit) {
        openIfNecessary();
        if (limit <= 0) {
            limit = 5;
        }
        List<HistoryItem> itemList = new ArrayList<>(limit);
        if (search == null) {
            return itemList;
        }
        String selectQuery = "SELECT * FROM " + TABLE_HISTORY + " WHERE " + KEY_TITLE + " LIKE '%"
                + search + "%' OR " + KEY_URL + " LIKE '%" + search + "%' " + "ORDER BY "
                + KEY_TIME_VISITED + " DESC LIMIT " + limit;
        Cursor cursor = mDatabase.rawQuery(selectQuery, null);

        int n = 0;
        if (cursor.moveToFirst()) {
            do {
                HistoryItem item = new HistoryItem();
                item.setUrl(cursor.getString(1));
                item.setTitle(cursor.getString(2));
                item.setTimestamp(cursor.getLong(3));
                item.setImageId(R.drawable.ic_history);
                itemList.add(item);
                n++;
            } while (cursor.moveToNext() && n < limit);
        }
        cursor.close();
        return itemList;
    }

    public synchronized List<HistoryItem> getLastHundredItems() {
        openIfNecessary();
        List<HistoryItem> itemList = new ArrayList<>(100);
        String selectQuery = "SELECT * FROM " + TABLE_HISTORY + " ORDER BY " + KEY_TIME_VISITED
                + " DESC";

        Cursor cursor = mDatabase.rawQuery(selectQuery, null);
        int counter = 0;
        if (cursor.moveToFirst()) {
            do {
                HistoryItem item = new HistoryItem();
                item.setUrl(cursor.getString(1));
                item.setTitle(cursor.getString(2));
                item.setTimestamp(cursor.getLong(3));
                item.setImageId(R.drawable.ic_history);
                itemList.add(item);
                counter++;
            } while (cursor.moveToNext() && counter < 100);
        }
        cursor.close();
        return itemList;
    }

    public synchronized List<HistoryItem> getAllHistoryItems() {
        openIfNecessary();
        List<HistoryItem> itemList = new ArrayList<>();
        String selectQuery = "SELECT  * FROM " + TABLE_HISTORY + " ORDER BY " + KEY_TIME_VISITED
                + " DESC";

        Cursor cursor = mDatabase.rawQuery(selectQuery, null);

        if (cursor.moveToFirst()) {
            do {
                HistoryItem item = new HistoryItem();
                item.setUrl(cursor.getString(1));
                item.setTitle(cursor.getString(2));
                item.setTimestamp(cursor.getLong(3));
                item.setImageId(R.drawable.ic_history);
                itemList.add(item);
            } while (cursor.moveToNext());
        }
        cursor.close();
        return itemList;
    }

    public synchronized int getHistoryItemsCount() {
        openIfNecessary();
        String countQuery = "SELECT * FROM " + TABLE_HISTORY;
        Cursor cursor = mDatabase.rawQuery(countQuery, null);
        int n = cursor.getCount();
        cursor.close();
        return n;
    }

    public synchronized HistoryItem getFirstHistoryItem() {
        openIfNecessary();
        HistoryItem firstHistoryItem = null;
        String selectQuery = "SELECT * FROM " + TABLE_HISTORY + " ORDER BY " + KEY_TIME_VISITED
                + " ASC LIMIT 1";

        Cursor cursor = mDatabase.rawQuery(selectQuery, null);

        if(cursor.moveToFirst()) {
            firstHistoryItem = new HistoryItem();
            firstHistoryItem.setUrl(cursor.getString(1));
            firstHistoryItem.setTitle(cursor.getString(2));
            firstHistoryItem.setTimestamp(cursor.getLong(3));
            firstHistoryItem.setImageId(R.drawable.ic_history);
        }
        return firstHistoryItem;
    }
}
