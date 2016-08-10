package com.cliqz.browser.main;

import android.content.Context;
import android.graphics.PorterDuff;
import android.support.v4.content.ContextCompat;
import android.support.v7.widget.RecyclerView;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import com.cliqz.browser.R;

import java.util.ArrayList;

/**
 * Created by Ravjit on 02/08/16.
 */
public class TrackersListAdapter extends RecyclerView.Adapter<TrackersListAdapter.ViewHolder> {

    private final ArrayList<TrackerDetailsModel> trackerDetails;
    private final boolean isIncognito;
    private final Context context;

    public TrackersListAdapter(ArrayList<TrackerDetailsModel> trackerDetails, boolean isIncognito,
                               Context context) {
        this.trackerDetails = trackerDetails;
        this.isIncognito = isIncognito;
        this.context = context;
    }

    @Override
    public ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        final LayoutInflater inflater = LayoutInflater.from(parent.getContext());
        final View view = inflater.inflate(R.layout.tracker_details_list_item, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(ViewHolder holder, int position) {
        final int textColor = isIncognito ? R.color.normal_tab_primary_color : R.color.incognito_tab_primary_color;
        holder.trackerName.setText(trackerDetails.get(position).companyName);
        holder.trackerCount.setText(Integer.toString(trackerDetails.get(position).trackerCount));
        holder.trackerName.setTextColor(ContextCompat.getColor(context, textColor));
        holder.trackerCount.setTextColor(ContextCompat.getColor(context, textColor));
        holder.infoImage.getDrawable().setColorFilter(ContextCompat.getColor(context, textColor), PorterDuff.Mode.SRC_ATOP);
    }

    @Override
    public int getItemCount() {
        return trackerDetails.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {

        public final TextView trackerName;
        public final TextView trackerCount;
        public final ImageView infoImage;

        public ViewHolder(View view) {
            super(view);
            trackerName = (TextView) view.findViewById(R.id.tracker_name);
            trackerCount = (TextView) view.findViewById(R.id.tracker_count);
            infoImage = (ImageView) view.findViewById(R.id.info);
        }
    }
}
