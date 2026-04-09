from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class SocialAccount(Base):
    __tablename__ = "social_accounts"

    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id", ondelete="CASCADE"), nullable=False)
    platform = Column(String(50), nullable=False)       # instagram, youtube, linkedin
    account_name = Column(String(255), nullable=True)
    account_id = Column(String(255), nullable=True)     # platform user/channel ID
    access_token = Column(Text, nullable=True)          # encrypted in production
    refresh_token = Column(Text, nullable=True)
    token_expires_at = Column(DateTime(timezone=True), nullable=True)
    is_connected = Column(Boolean, default=False)
    profile_picture_url = Column(Text, nullable=True)
    followers_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    brand = relationship("Brand", back_populates="social_accounts")
    scheduled_posts = relationship("ScheduledPost", back_populates="social_account")


class ScheduledPost(Base):
    __tablename__ = "scheduled_posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content_item_id = Column(Integer, ForeignKey("content_items.id", ondelete="SET NULL"), nullable=True)
    video_project_id = Column(Integer, ForeignKey("video_projects.id", ondelete="SET NULL"), nullable=True)
    social_account_id = Column(Integer, ForeignKey("social_accounts.id", ondelete="SET NULL"), nullable=True)

    platform = Column(String(50), nullable=False)
    caption = Column(Text, nullable=True)
    media_urls = Column(JSON, nullable=True)  # list of media URLs to post
    hashtags = Column(JSON, nullable=True)

    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    posted_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), default="scheduled")  # scheduled, posted, failed, cancelled

    # Post result from platform
    platform_post_id = Column(String(500), nullable=True)
    post_url = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    owner = relationship("User", back_populates="scheduled_posts")
    content_item = relationship("ContentItem", back_populates="scheduled_posts")
    video_project = relationship("VideoProject", back_populates="scheduled_posts")
    social_account = relationship("SocialAccount", back_populates="scheduled_posts")
    analytics = relationship("PostAnalytics", back_populates="post", uselist=False)
