from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class ContentItem(Base):
    __tablename__ = "content_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    brand_id = Column(Integer, ForeignKey("brands.id", ondelete="SET NULL"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)

    content_type = Column(String(50), nullable=False)  # script, caption, hashtags, video_script
    platform = Column(String(50), nullable=True)       # instagram, youtube, linkedin, general
    title = Column(String(500), nullable=True)

    # Generated content
    content = Column(Text, nullable=False)
    variations = Column(JSON, nullable=True)  # list of alternative versions

    # AI metadata
    prompt_used = Column(Text, nullable=True)
    model_used = Column(String(100), nullable=True)
    tokens_used = Column(Integer, nullable=True)

    status = Column(String(50), default="draft")  # draft, approved, posted, archived
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    owner = relationship("User", back_populates="content_items")
    brand = relationship("Brand", back_populates="content_items")
    product = relationship("Product", back_populates="content_items")
    scheduled_posts = relationship("ScheduledPost", back_populates="content_item")
