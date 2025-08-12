from pymongo import MongoClient
import json
import sys
from plotly import graph_objects as go
import plotly.io as pio

def get_funnel_chart_data(channel_id):
    client = MongoClient("mongodb+srv://beingayush66:XBkWOBAG8lwXw8wA@cluster0.8f6mo.mongodb.net/")
    db = client["test"]
    collection = db["channels"]

    pipeline = [
        {"$match": {"channelId": channel_id}},
        {"$project": {
            "subscriberCount": {"$toInt": "$statistics.subscriberCount"},
            "totalViews": {"$sum": {"$map": {
                "input": "$videos",
                "as": "video",
                "in": {"$toInt": "$$video.statistics.viewCount"}
            }}},
            "totalLikes": {"$sum": {"$map": {
                "input": "$videos",
                "as": "video",
                "in": {"$toInt": "$$video.statistics.likeCount"}
            }}},
            "totalComments": {"$sum": {"$map": {
                "input": "$videos",
                "as": "video",
                "in": {"$toInt": "$$video.statistics.commentCount"}
            }}}
        }}
    ]

    try:
        result = list(collection.aggregate(pipeline))
        if not result:
            return {"error": f"No data found for channel ID: {channel_id}"}

        metrics = result[0]
        total_views = metrics.get("totalViews", 0)
        subscriber_count = metrics.get("subscriberCount", 0)
        total_likes = metrics.get("totalLikes", 0)
        total_comments = metrics.get("totalComments", 0)

        stages = ["Views", "Subscribers", "Likes", "Comments"]
        values = [total_views, subscriber_count, total_likes, total_comments]

        fig = go.Figure(go.Funnel(
            y=stages,
            x=values,
            textinfo="value+percent initial",
            marker={"color": ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"]},
            textfont={"size": 14},
            textposition="inside"
        ))

        fig.update_layout(
            title=f"Engagement Funnel Chart",
            title_x=0.5,
            funnelmode="stack",
            showlegend=False,
            height=600
        )

        # Convert Plotly figure to JSON serializable dict
        fig_json = json.loads(pio.to_json(fig))
        return fig_json

    except Exception as e:
        return {"error": f"MongoDB query error: {e}"}
    finally:
        client.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Channel ID is required"}))
        sys.exit(1)
    channel_id = sys.argv[1]
    result = get_funnel_chart_data(channel_id)
    print(json.dumps(result, indent=2))
