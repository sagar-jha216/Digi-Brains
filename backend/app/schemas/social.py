from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class SocialAccountResponse(BaseModel):
    id: int
    brand_id: int
    platform: str
    account_name: Optional[str]
    account_id: Optional[str]
    is_connected: bool
    profile_picture_url: Optional[str]
    followers_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class SchedulePostRequest(BaseModel):
    content_item_id: Optional[int] = None
    video_project_id: Optional[int] = None
    social_account_id: int
    platform: str
    caption: Optional[str] = None
    media_urls: Optional[List[str]] = None
    hashtags: Optional[List[str]] = None
    scheduled_at: datetime


class ScheduledPostResponse(BaseModel):
    id: int
    user_id: int
    content_item_id: Optional[int]
    video_project_id: Optional[int]
    social_account_id: Optional[int]
    platform: str
    caption: Optional[str]
    media_urls: Optional[List[str]]
    hashtags: Optional[List[str]]
    scheduled_at: datetime
    posted_at: Optional[datetime]
    status: str
    platform_post_id: Optional[str]
    post_url: Optional[str]
    error_message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class PostAnalyticsResponse(BaseModel):
    id: int
    post_id: int
    platform: str
    views: int
    likes: int
    comments: int
    shares: int
    clicks: int
    reach: int
    impressions: int
    engagement_rate: float
    last_synced_at: datetime

    class Config:
        from_attributes = True


class AnalyticsSummaryResponse(BaseModel):
    total_posts: int
    total_views: int
    total_likes: int
    total_comments: int
    total_shares: int
    avg_engagement_rate: float
    platforms: dict
    top_platform: Optional[str] = None
    performance_label: Optional[str] = None
    recommendations: List[str] = []
    top_creatives: List[dict] = []
