import pymongo
import sys
import json

def get_reach_data(channel_id):
    # MongoDB connection setup
    client = pymongo.MongoClient("mongodb+srv://beingayush66:XBkWOBAG8lwXw8wA@cluster0.8f6mo.mongodb.net/")
    db = client["test"]
    collection = db["channels"]

    try:
        # Fetch the channel document
        channel_doc = collection.find_one({"channelId": channel_id})

        if not channel_doc or "videos" not in channel_doc:
            return {"error": f"No videos found for channel ID: {channel_id}"}

        videos = channel_doc["videos"][-25:]  # Last 25 videos
        total_subscribers = int(channel_doc.get("statistics", {}).get("subscriberCount", 0))

        # Process video data
        video_stats = []
        for video in videos:
            stats = video.get('statistics', {})
            video_stats.append({
                "title": video.get("title", "No Title")[:30],  # Truncate title
                "views": int(stats.get("viewCount", 0)),
                "likes": int(stats.get("likeCount", 0)),
                "comments": int(stats.get("commentCount", 0))
            })

        if not video_stats:
            return {"error": "No video statistics available"}

        # Find top performing video
        top_video = max(video_stats, key=lambda x: x["views"])
        reach_pct = (top_video['views'] / total_subscribers * 100) if total_subscribers > 0 else 0

        # Chart.js configuration
        chart_config = {
            "type": "bar",
            "data": {
                "labels": ["Views", "Likes", "Comments", "Reach (%)"],
                "datasets": [{
                    "label": "Top Video Metrics",
                    "data": [
                        top_video['views'],
                        top_video['likes'],
                        top_video['comments'],
                        reach_pct
                    ],
                    "backgroundColor": [
                        "rgba(135, 206, 250, 0.8)",  # Views - skyblue
                        "rgba(144, 238, 144, 0.8)",   # Likes - lightgreen
                        "rgba(255, 165, 0, 0.8)",     # Comments - orange
                        "rgba(147, 112, 219, 0.8)"    # Reach - mediumpurple
                    ],
                    "borderColor": [
                        "rgba(135, 206, 250, 1)",
                        "rgba(144, 238, 144, 1)",
                        "rgba(255, 165, 0, 1)",
                        "rgba(147, 112, 219, 1)"
                    ],
                    "borderWidth": 1
                }]
            },
            "options": {
                "responsive": True,
                "maintainAspectRatio": False,
                "plugins": {
                    "title": {
                        "display": True,
                        "text": f"Top Performing Video Metrics: {top_video['title']}...",
                        "font": {"size": 14},
                        "padding": {"top": 15, "bottom": 15}
                    },
                    "tooltip": {
                        "callbacks": {
                            "label": "function(context) {"
                                     "  let label = context.dataset.label || '';"
                                     "  if(label) label += ': ';"
                                     "  if(context.parsed.y >= 1000) {"
                                     "    label += context.parsed.y.toLocaleString();"
                                     "  } else {"
                                     "    label += context.parsed.y.toFixed(2);"
                                     "  }"
                                     "  return label;"
                                     "}"
                        }
                    }
                },
                "scales": {
                    "x": {
                        "title": {
                            "display": True,
                            "text": "Metrics",
                            "font": {"size": 12}
                        }
                    },
                    "y": {
                        "beginAtZero": True,
                        "title": {
                            "display": True,
                            "text": "Count/Percentage",
                            "font": {"size": 12}
                        },
                        "ticks": {
                            "callback": "function(value) {"
                                       "  return value >= 1000 "
                                       "    ? value.toLocaleString() "
                                       "    : value.toFixed(2);"
                                       "}"
                        }
                    }
                }
            }
        }

        return chart_config

    except Exception as e:
        return {"error": f"Database error: {str(e)}"}
    finally:
        client.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Channel ID is required"}))
        sys.exit(1)

    try:
        result = get_reach_data(sys.argv[1])
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(json.dumps({"error": str(e)}))