import pymongo
import sys
import json
import numpy as np
import re

# --- Helper function to parse ISO 8601 duration (e.g., PT5M30S) to seconds ---
def parse_iso8601_duration(duration_str):
    """
    Parse an ISO 8601 duration string into total seconds.
    Supports formats like PT#H#M#S, e.g. PT1H2M30S, PT5M, PT45S.
    """
    pattern = re.compile(
        r'PT'              # starts with 'PT'
        r'(?:(\d+)H)?'     # hours
        r'(?:(\d+)M)?'     # minutes
        r'(?:(\d+)S)?'     # seconds
    )
    match = pattern.match(duration_str)
    if not match:
        return 0
    hours = int(match.group(1)) if match.group(1) else 0
    minutes = int(match.group(2)) if match.group(2) else 0
    seconds = int(match.group(3)) if match.group(3) else 0
    total_seconds = hours * 3600 + minutes * 60 + seconds
    return total_seconds

def get_time_duration_data(channel_id):
    # MongoDB connection setup
    client = pymongo.MongoClient("mongodb+srv://beingayush66:XBkWOBAG8lwXw8wA@cluster0.8f6mo.mongodb.net/")
    db = client["test"]
    collection = db["channels"]

    try:
        # Fetch the channel document
        channel_doc = collection.find_one({"channelId": channel_id})

        if not channel_doc or "videos" not in channel_doc:
            return {"error": f"No videos found for channel ID: {channel_id}"}

        videos = channel_doc["videos"]

        # Parse durations and collect in a list
        durations_seconds = []
        video_views = []  # To store views for each video

        for video in videos:
            duration_iso = video.get("duration", "")
            view_count_str = video.get("statistics", {}).get("viewCount", "0")
            if duration_iso:
                seconds = parse_iso8601_duration(duration_iso)
                durations_seconds.append(seconds)
                try:
                    view_count = int(view_count_str)
                except ValueError:
                    view_count = 0
                video_views.append(view_count)

        if not durations_seconds:
            return {"error": "No valid video durations found."}

        # Define duration intervals (in seconds)
        bins = [0, 60, 600, 1200, 1800, 2400, 3000, 3600, float('inf')]  # 0-1min, 1-10min, 10-20min, etc.
        bin_labels = ['0-1 min(Short)', '1-10 min', '10-20 min', '20-30 min', '30-40 min', '40-50 min', '50-60 min', '1+ hour']

        # Count the number of videos and total views in each interval
        hist, bin_edges = np.histogram(durations_seconds, bins=bins)
        views_per_bin = np.zeros(len(bins)-1)  # To store total views per bin

        for i, duration in enumerate(durations_seconds):
            # Find the bin for the current video
            bin_index = np.digitize(duration, bins) - 1
            views_per_bin[bin_index] += video_views[i]

        # Find the bin with the most views
        max_views = np.max(views_per_bin)
        best_bin_index = np.argmax(views_per_bin)

        # Prepare the response data
        response_data = {
            "channelId": channel_id,
            "bestDuration": bin_labels[best_bin_index],
            "total_views": max_views,
            "duration_distribution": dict(zip(bin_labels, hist.tolist())),
            "views_per_duration": dict(zip(bin_labels, views_per_bin.tolist()))
        }

        recommendations_collection = db["recommendations"]
        recommendations_collection.update_one(
            {"channelId": channel_id},
            {"$set": {
                "channelId": channel_id,
                "bestDuration": response_data["bestDuration"],
            }},
            upsert=True
        )

        return response_data

    except Exception as e:
        return {"error": f"MongoDB query error: {e}"}
    finally:
        client.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Channel ID is required"}))
        sys.exit(1)

    channel_id = sys.argv[1]

    try:
        result = get_time_duration_data(channel_id)
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
