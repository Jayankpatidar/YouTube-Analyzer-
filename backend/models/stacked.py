import pymongo
import sys
import json
from datetime import datetime

def get_stacked_bar_data(channel_id):
    # MongoDB connection setup
    client = pymongo.MongoClient("mongodb+srv://beingayush66:XBkWOBAG8lwXw8wA@cluster0.8f6mo.mongodb.net/")
    db = client["test"]
    collection = db["channels"]

    # Pipeline to match the channel by ID and unwind its videos
    pipeline = [
        {"$match": {"channelId": channel_id}},
        {"$unwind": "$videos"},
        {
            "$project": {
                "video_title": "$videos.title",
                "views": {"$toInt": "$videos.statistics.viewCount"},
                "likes": {"$toInt": "$videos.statistics.likeCount"},
                "comments": {"$toInt": "$videos.statistics.commentCount"},
                "publishedAt": "$videos.publishedAt"
            }
        },
        {"$sort": {"publishedAt": -1}},
        {"$limit": 10}
    ]

    try:
        data = list(collection.aggregate(pipeline))
    except Exception as e:
        return {"error": f"MongoDB query error: {e}"}
    finally:
        client.close()

    if not data:
        return {"error": f"No videos found for channel ID: {channel_id}"}

    # Prepare data
    videos = []
    views = []
    likes = []
    comments = []

    for doc in data:
        try:
            full_title = str(doc.get("video_title", "Untitled Video"))
            short_title = full_title.split("|")[0].strip() 
            videos.append(short_title[:30])  # Limit title length
            views.append(int(doc.get("views", 0)))
            likes.append(int(doc.get("likes", 0)))
            comments.append(int(doc.get("comments", 0)))
        except (ValueError, TypeError) as e:
            print(f"Data conversion error: {e}", file=sys.stderr)
            continue

    # Formatting functions
    def format_k(value):
        return f"{value/1000:.1f}K" if value >= 1000 else str(value)

    def format_m(value):
        if value >= 1_000_000:
            return f"{value/1_000_000:.1f}M"
        return f"{value/1000:.1f}K" if value >= 1000 else str(value)

    # Generate annotation data
    annotations = []
    for i, (v, l, c) in enumerate(zip(views, likes, comments)):
        total = v + l + c
        if total > 0:
            annotations.append({
                "type": "label",
                "xValue": i,
                "yValue": total,
                "content": f"{format_m(total)}",  # <--- Only show total, no V, L, C
                "font": {"size": 8},
                "backgroundColor": "rgba(255,255,255,0.8)",
                "padding": 4,
                "textAlign": "center"
            })

    # Chart.js configuration
    chart_config = {
        "type": "bar",
        "data": {
            "labels": videos,
            "datasets": [
                {
                    "label": "Views",
                    "data": views,
                    "backgroundColor": "rgba(31, 119, 180, 0.8)",
                    "borderColor": "rgba(31, 119, 180, 1)",
                    "borderWidth": 1
                },
                {
                    "label": "Likes",
                    "data": likes,
                    "backgroundColor": "rgba(44, 160, 44, 0.8)",
                    "borderColor": "rgba(44, 160, 44, 1)",
                    "borderWidth": 1
                },
                {
                    "label": "Comments",
                    "data": comments,
                    "backgroundColor": "rgba(214, 39, 40, 0.8)",
                    "borderColor": "rgba(214, 39, 40, 1)",
                    "borderWidth": 1
                }
            ]
        },
        "options": {
            "responsive": True,
            "maintainAspectRatio": False,
            "plugins": {
                "title": {
                    "display": True,
                    "text": "Video Engagement Metrics (Last 10 Videos)",
                    "font": {"size": 14},
                    "padding": {"top": 15, "bottom": 15}
                },
                "legend": {
                    "position": "right",
                    "align": "start"
                },
                "annotation": {
                    "annotations": annotations
                }
            },
            "scales": {
                "x": {
                    "title": {
                        "display": True,
                        "text": "Videos",
                        "font": {"size": 10}
                    },
                    "ticks": {
                        "autoSkip": False,
                        "maxRotation": 45,
                        "minRotation": 45
                    }
                },
                "y": {
                    "stacked": True,
                    "beginAtZero": True,
                    "title": {
                        "display": True,
                        "text": "Count",
                        "font": {"size": 10}
                    }
                }
            }
        }
    }

    return chart_config

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Channel ID is required"}))
        sys.exit(1)
    
    channel_id = sys.argv[1]
    
    try:
        result = get_stacked_bar_data(channel_id)
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(json.dumps({"error": str(e)}))