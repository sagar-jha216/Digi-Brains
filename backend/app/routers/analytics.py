from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.brand import Brand
from app.models.social import ScheduledPost, SocialAccount
from app.models.analytics import PostAnalytics
from app.models.video import VideoProject
from app.schemas.social import PostAnalyticsResponse, AnalyticsSummaryResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/summary", response_model=AnalyticsSummaryResponse)
def get_summary(
    brand_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get aggregated analytics across all posts."""
    post_query = db.query(ScheduledPost).filter(
        ScheduledPost.user_id == current_user.id,
        ScheduledPost.status == "posted",
    )
    if brand_id:
        brand = db.query(Brand).filter(Brand.id == brand_id, Brand.user_id == current_user.id).first()
        if not brand:
            raise HTTPException(status_code=404, detail="Brand not found")
        post_query = post_query.join(SocialAccount, ScheduledPost.social_account_id == SocialAccount.id).filter(SocialAccount.brand_id == brand_id)

    post_ids = [p.id for p in post_query.all()]

    if not post_ids:
        return AnalyticsSummaryResponse(
            total_posts=0, total_views=0, total_likes=0,
            total_comments=0, total_shares=0, avg_engagement_rate=0.0,
            platforms={},
        )

    analytics = db.query(PostAnalytics).filter(PostAnalytics.post_id.in_(post_ids)).all()

    totals = {
        "total_posts": len(post_ids),
        "total_views": sum(a.views for a in analytics),
        "total_likes": sum(a.likes for a in analytics),
        "total_comments": sum(a.comments for a in analytics),
        "total_shares": sum(a.shares for a in analytics),
        "avg_engagement_rate": (
            sum(a.engagement_rate for a in analytics) / len(analytics) if analytics else 0.0
        ),
    }

    # Platform breakdown
    platforms = {}
    for a in analytics:
        post = db.query(ScheduledPost).filter(ScheduledPost.id == a.post_id).first()
        platform = post.platform if post else "unknown"
        if platform not in platforms:
            platforms[platform] = {"posts": 0, "views": 0, "likes": 0, "engagement_rate": 0.0}
        platforms[platform]["posts"] += 1
        platforms[platform]["views"] += a.views
        platforms[platform]["likes"] += a.likes
        platforms[platform]["engagement_rate"] += a.engagement_rate

    for platform, data in platforms.items():
        if data["posts"] > 0:
            data["engagement_rate"] = round(data["engagement_rate"] / data["posts"], 2)

    totals["platforms"] = platforms
    top_platform = None
    if platforms:
        top_platform = max(platforms.items(), key=lambda item: (item[1]["engagement_rate"], item[1]["views"]))[0]

    avg_engagement = totals["avg_engagement_rate"]
    if avg_engagement >= 9:
        performance_label = "excellent"
    elif avg_engagement >= 5:
        performance_label = "healthy"
    elif avg_engagement >= 2.5:
        performance_label = "needs optimization"
    else:
        performance_label = "underperforming"

    recommendations = []
    if top_platform:
        recommendations.append(f"Double down on {top_platform} because it is currently your strongest channel.")
    if avg_engagement < 5:
        recommendations.append("Try shorter hooks, stronger first-frame claims, and clearer CTAs to lift engagement.")
    if totals["total_posts"] < 5:
        recommendations.append("Post more consistently this week so the optimizer has enough signal to learn.")
    if totals["total_shares"] < max(totals["total_posts"], 1):
        recommendations.append("Test more benefit-led and pain-point-led creative angles to increase shares.")

    creative_rows = (
        db.query(VideoProject.title, ScheduledPost.platform, PostAnalytics.engagement_rate, PostAnalytics.views)
        .join(ScheduledPost, ScheduledPost.video_project_id == VideoProject.id)
        .join(PostAnalytics, PostAnalytics.post_id == ScheduledPost.id)
        .filter(ScheduledPost.user_id == current_user.id)
        .order_by(PostAnalytics.engagement_rate.desc(), PostAnalytics.views.desc())
        .limit(5)
        .all()
    )

    totals["top_platform"] = top_platform
    totals["performance_label"] = performance_label
    totals["recommendations"] = recommendations[:3]
    totals["top_creatives"] = [
        {
            "title": row.title,
            "platform": row.platform,
            "engagement_rate": row.engagement_rate,
            "views": row.views,
        }
        for row in creative_rows
    ]
    return AnalyticsSummaryResponse(**totals)


@router.get("/posts/{post_id}", response_model=PostAnalyticsResponse)
def get_post_analytics(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(ScheduledPost).filter(
        ScheduledPost.id == post_id,
        ScheduledPost.user_id == current_user.id,
    ).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    analytics = db.query(PostAnalytics).filter(PostAnalytics.post_id == post_id).first()
    if not analytics:
        raise HTTPException(status_code=404, detail="No analytics data yet")
    return analytics


@router.post("/posts/{post_id}/sync")
def sync_post_analytics(
    post_id: int,
    views: int = 0,
    likes: int = 0,
    comments: int = 0,
    shares: int = 0,
    clicks: int = 0,
    reach: int = 0,
    impressions: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upsert analytics for a post (called by webhook or manual sync)."""
    post = db.query(ScheduledPost).filter(
        ScheduledPost.id == post_id,
        ScheduledPost.user_id == current_user.id,
    ).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    analytics = db.query(PostAnalytics).filter(PostAnalytics.post_id == post_id).first()
    total_interactions = likes + comments + shares + clicks
    engagement_rate = (total_interactions / reach * 100) if reach > 0 else 0.0

    if analytics:
        analytics.views = views
        analytics.likes = likes
        analytics.comments = comments
        analytics.shares = shares
        analytics.clicks = clicks
        analytics.reach = reach
        analytics.impressions = impressions
        analytics.engagement_rate = round(engagement_rate, 2)
        from datetime import datetime, timezone
        analytics.last_synced_at = datetime.now(timezone.utc)
    else:
        analytics = PostAnalytics(
            post_id=post_id,
            platform=post.platform,
            views=views,
            likes=likes,
            comments=comments,
            shares=shares,
            clicks=clicks,
            reach=reach,
            impressions=impressions,
            engagement_rate=round(engagement_rate, 2),
        )
        db.add(analytics)

    db.commit()
    return {"message": "Analytics synced"}


@router.get("/timeline")
def get_timeline(
    brand_id: int = None,
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get daily post count for the last N days (for chart display)."""
    from datetime import datetime, timezone, timedelta

    start = datetime.now(timezone.utc) - timedelta(days=days)
    query = db.query(
        func.date(ScheduledPost.posted_at).label("date"),
        func.count(ScheduledPost.id).label("posts"),
        ScheduledPost.platform,
    ).filter(
        ScheduledPost.user_id == current_user.id,
        ScheduledPost.status == "posted",
        ScheduledPost.posted_at >= start,
    ).group_by(func.date(ScheduledPost.posted_at), ScheduledPost.platform)

    rows = query.all()
    return [{"date": str(r.date), "posts": r.posts, "platform": r.platform} for r in rows]
