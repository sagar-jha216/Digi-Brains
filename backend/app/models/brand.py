from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Brand(Base):
    __tablename__ = "brands"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    industry = Column(String(100), nullable=True)
    brand_tone = Column(String(100), nullable=True)  # professional, casual, humorous, inspirational
    target_audience = Column(Text, nullable=True)
    brand_colors = Column(JSON, nullable=True)  # ["#FF5733", "#33FF57"]
    brand_values = Column(Text, nullable=True)
    website_url = Column(String(500), nullable=True)
    logo_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    owner = relationship("User", back_populates="brands")
    products = relationship("Product", back_populates="brand", cascade="all, delete-orphan")
    content_items = relationship("ContentItem", back_populates="brand")
    social_accounts = relationship("SocialAccount", back_populates="brand", cascade="all, delete-orphan")
    video_projects = relationship("VideoProject", back_populates="brand")
