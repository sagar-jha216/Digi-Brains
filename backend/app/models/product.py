from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=True)
    category = Column(String(100), nullable=True)
    features = Column(JSON, nullable=True)  # list of feature strings
    benefits = Column(JSON, nullable=True)  # list of benefit strings
    call_to_action = Column(String(255), nullable=True)
    status = Column(String(50), default="active")  # active, archived
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    brand = relationship("Brand", back_populates="products")
    media_files = relationship("MediaFile", back_populates="product", cascade="all, delete-orphan")
    content_items = relationship("ContentItem", back_populates="product")
    video_projects = relationship("VideoProject", back_populates="product")
