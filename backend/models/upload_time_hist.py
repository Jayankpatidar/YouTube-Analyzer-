import pymongo
import sys
import json
import pandas as pd
import pytz
from datetime import datetime

def map_to_time_interval(publish_time_utc):
    utc_time = pd.to_datetime(publish_time_utc)
    utc_time = utc_time.replace(tzinfo=pytz.utc)
    ist_time = utc_time.astimezone(pytz.timezone('Asia/Kolkata'))
    hour = ist_time.hour
    if 0 <= hour < 4:
        return "12AM - 4AM"
    elif 4 <= hour < 8:
        return "4AM - 8AM"
    elif 8 <= hour < 12:
        return "8AM - 12PM"
    elif 12 <= hour < 16:
        return "12PM - 4PM"
    elif 16 <= hour < 20:
        return "4PM - 8PM"
    else:
        return "8PM - 12AM"

def get_time_interval_recommendation(channel_id):
    client = pymongo.MongoClient("mongodb+srv://beingayush66:XBkWOBAG8lwXw8wA@cluster0.8f6mo.mongodb.net/")
    db = client["test"]
    collection = db["channels"]

    try:
        channel_doc = collection.find_one({"channelId": channel_id})

        if not channel_doc or "videos" not in channel_doc:
            return {"error": f"No videos found for channel ID: {channel_id}"}

        videos = channel_doc["videos"][:25]  # Fetch latest 25 videos

        if not videos:
            return {"error": "No videos available to analyze."}

        videos_df = pd.DataFrame(videos)
        videos_df['publishedAt'] = videos_df['publishedAt'].apply(lambda x: x if isinstance(x, str) else x.isoformat())
        videos_df['viewCount'] = videos_df['statistics'].apply(lambda x: int(x.get('viewCount', 0)))

        # Map publish time to interval
        videos_df['time_interval'] = videos_df['publishedAt'].apply(map_to_time_interval)

        # Define interval order
        interval_order = ["12AM - 4AM", "4AM - 8AM", "8AM - 12PM",
                          "12PM - 4PM", "4PM - 8PM", "8PM - 12AM"]

        videos_df['time_interval'] = pd.Categorical(videos_df['time_interval'], categories=interval_order, ordered=True)
        interval_stats = videos_df.groupby('time_interval')['viewCount'].mean().reindex(interval_order).fillna(0)

        max_view = interval_stats.max()
        best_interval = interval_stats.idxmax()

        # Prepare response
        recommendation_data = {
            "channelId": channel_id,
            "bestUploadTime": best_interval,
            "average_views_in_best_interval": max_view,
            "views_by_interval": interval_stats.to_dict()
        }

        # Optional: Save to MongoDB recommendations collection
        recommendations_collection = db["recommendations"]
        recommendations_collection.update_one(
            {"channelId": channel_id},
            {"$set": {
                "channelId": channel_id,
                "bestUploadTime": recommendation_data["bestUploadTime"],
            }},
            upsert=True
        )

        return recommendation_data

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
        result = get_time_interval_recommendation(channel_id)
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
