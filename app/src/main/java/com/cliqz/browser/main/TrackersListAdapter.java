package com.cliqz.browser.main;

import android.support.v7.widget.RecyclerView;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import com.cliqz.browser.R;

import java.util.ArrayList;

/**
 * Created by Ravjit on 02/08/16.
 */
public class TrackersListAdapter extends RecyclerView.Adapter<TrackersListAdapter.ViewHolder> {

    private final ArrayList<TrackerDetailsModel> trackerDetails;

    public TrackersListAdapter(ArrayList<TrackerDetailsModel> trackerDetails) {
        this.trackerDetails = trackerDetails;
    }

    @Override
    public ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        final LayoutInflater inflater = LayoutInflater.from(parent.getContext());
        final View view = inflater.inflate(R.layout.tracker_details_list_item, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(ViewHolder holder, int position) {
        holder.trackerName.setText(trackerDetails.get(position).companyName);
        holder.trackerCount.setText(Integer.toString(trackerDetails.get(position).trackerCount));
    }

    @Override
    public int getItemCount() {
        return trackerDetails.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {

        public final TextView trackerName;
        public final TextView trackerCount;

        public ViewHolder(View view) {
            super(view);
            trackerName = (TextView) view.findViewById(R.id.tracker_name);
            trackerCount = (TextView) view.findViewById(R.id.tracker_count);
        }
    }
}
