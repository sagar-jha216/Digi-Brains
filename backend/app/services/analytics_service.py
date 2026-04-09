import hashlib
from typing import Optional

from sqlalchemy.orm import Session

from app.models.analytics import PostAnalytics
from app.models.social import ScheduledPost


def _score_from_post(post: ScheduledPost) -> int:
    base = f"{post.id}|{post.platform}|{post.caption or ''}|{' '.join(post.hashtags or [])}|{len(post.media_urls or [])}"
    digest = hashlib.sha256(base.encode("utf-8")).hexdigest()
    return int(digest[:8], 16)


def upsert_generated_analytics(db: Session, post: ScheduledPost) -> PostAnalytics:
    seed = _score_from_post(post)
    hook_strength = min(len((post.caption or "").split()), 30)
    hashtag_count = len(post.hashtags or [])
    media_bonus = 1.35 if any((url or "").lower().endswith((".mp4", ".mov", ".avi", ".webm")) for url in (post.media_urls or [])) else 1.0
    multi_asset_bonus = 1 + min(len(post.media_urls or []), 4) * 0.08
    platform_boost = {
        "instagram": 1.1,
        "youtube": 1.35,
        "linkedin": 0.9,
    }.get(post.platform, 1.0)

    reach = int((900 + (seed % 4200) + hook_strength * 22 + hashtag_count * 18) * media_bonus * multi_asset_bonus * platform_boost)
    impressions = int(reach * (1.08 + ((seed >> 3) % 20) / 100))
    views = int(reach * (0.78 + ((seed >> 5) % 15) / 100))
    likes = max(int(views * (0.04 + ((seed >> 7) % 6) / 100)), 8)
    comments = max(int(likes * (0.09 + ((seed >> 11) % 6) / 100)), 2)
    shares = max(int(likes * (0.12 + ((seed >> 13) % 8) / 100)), 1)
    clicks = max(int(reach * (0.01 + ((seed >> 17) % 8) / 1000)), 1)
    total_interactions = likes + comments + shares + clicks
    engagement_rate = round((total_interactions / reach) * 100, 2) if reach > 0 else 0.0

    analytics = db.query(PostAnalytics).filter(PostAnalytics.post_id == post.id).first()
    if analytics:
        analytics.views = views
        analytics.likes = likes
        analytics.comments = comments
        analytics.shares = shares
        analytics.clicks = clicks
        analytics.reach = reach
        analytics.impressions = impressions
        analytics.engagement_rate = engagement_rate
    else:
        analytics = PostAnalytics(
            post_id=post.id,
            platform=post.platform,
            views=views,
            likes=likes,
            comments=comments,
            shares=shares,
            clicks=clicks,
            reach=reach,
            impressions=impressions,
            engagement_rate=engagement_rate,
        )
        db.add(analytics)

    db.commit()
    db.refresh(analytics)
    return analytics
