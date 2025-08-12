import pymongo
import sys
import json

def get_engagement_ratio_data(channel_id):
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

        # Prepare data
        video_titles = []
        likes_to_views_ratio = []
        comments_to_views_ratio = []

        for video in videos:
            stats = video.get('statistics', {})
            view_count = int(stats.get('viewCount', 0))
            like_count = int(stats.get('likeCount', 0))
            comment_count = int(stats.get('commentCount', 0))
            title = video.get('title', 'No Title')

            if view_count > 0:  # Avoid division by zero
                short_title = title.split("|")[0].strip()
                video_titles.append(short_title[:30])  # limit title length
                likes_to_views_ratio.append((like_count / view_count) * 100)
                comments_to_views_ratio.append((comment_count / view_count) * 100)

        if not video_titles:
            return {"error": "No videos with views found to plot."}

        # Chart.js configuration
        chart_config = {
            "type": "bar",
            "data": {
                "labels": video_titles,
                "datasets": [
                    {
                        "label": "Likes/View %",
                        "data": likes_to_views_ratio,
                        "backgroundColor": "rgba(135, 206, 250, 0.8)",  # skyblue
                        "borderColor": "rgba(135, 206, 250, 1)",
                        "borderWidth": 1
                    },
                    {
                        "label": "Comments/View %",
                        "data": comments_to_views_ratio,
                        "backgroundColor": "rgba(144, 238, 144, 0.8)",  # lightgreen
                        "borderColor": "rgba(144, 238, 144, 1)",
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
                        "text": f'Likes/Views and Comments/Views Ratio (Channel ID: {channel_id})',
                        "font": {"size": 14},
                        "padding": {"top": 15, "bottom": 15}
                    },
                    "legend": {
                        "position": "top"
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
                        "beginAtZero": True,
                        "title": {
                            "display": True,
                            "text": "Engagement Ratio (%)",
                            "font": {"size": 10}
                        }
                    }
                }
            }
        }

        return chart_config

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
        result = get_engagement_ratio_data(channel_id)
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
