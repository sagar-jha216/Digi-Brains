from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class VideoProject(Base):
    __tablename__ = "video_projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    brand_id = Column(Integer, ForeignKey("brands.id", ondelete="SET NULL"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)

    title = Column(String(255), nullable=False)
    platform = Column(String(50), nullable=False, default="instagram")
    objective = Column(String(100), nullable=False, default="product launch")
    video_style = Column(String(100), nullable=False, default="ugc")
    aspect_ratio = Column(String(20), nullable=False, default="9:16")
    duration_seconds = Column(Integer, nullable=False, default=30)

    hook = Column(Text, nullable=True)
    storyboard = Column(JSON, nullable=True)
    scenes = Column(JSON, nullable=True)
    voiceover_script = Column(Text, nullable=True)
    caption = Column(Text, nullable=True)
    hashtags = Column(JSON, nullable=True)
    shot_plan = Column(JSON, nullable=True)

    source_media = Column(JSON, nullable=True)
    preview_url = Column(Text, nullable=True)
    download_url = Column(Text, nullable=True)
    preview_type = Column(String(20), nullable=False, default="storyboard")
    render_status = Column(String(50), nullable=False, default="storyboard_ready")
    render_provider = Column(String(50), nullable=False, default="mock")

    status = Column(String(50), nullable=False, default="draft")
    meta = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="video_projects")
    brand = relationship("Brand", back_populates="video_projects")
    product = relationship("Product", back_populates="video_projects")
    scheduled_posts = relationship("ScheduledPost", back_populates="video_project")
