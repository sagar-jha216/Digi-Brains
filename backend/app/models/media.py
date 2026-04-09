from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class MediaFile(Base):
    __tablename__ = "media_files"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    file_type = Column(String(20), nullable=False)  # image, video
    original_filename = Column(String(255), nullable=True)
    cloudinary_public_id = Column(String(500), nullable=True)
    url = Column(Text, nullable=False)
    thumbnail_url = Column(Text, nullable=True)
    file_size = Column(BigInteger, nullable=True)  # bytes
    duration_seconds = Column(Integer, nullable=True)  # for videos
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    product = relationship("Product", back_populates="media_files")
