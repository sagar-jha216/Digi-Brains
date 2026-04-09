from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Any
from datetime import datetime


class BrandCreate(BaseModel):
    name: str
    description: Optional[str] = None
    industry: Optional[str] = None
    brand_tone: Optional[str] = None
    target_audience: Optional[str] = None
    brand_colors: Optional[List[str]] = None
    brand_values: Optional[str] = None
    website_url: Optional[str] = None


class BrandUpdate(BrandCreate):
    name: Optional[str] = None


class BrandResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str]
    industry: Optional[str]
    brand_tone: Optional[str]
    target_audience: Optional[str]
    brand_colors: Optional[List[str]]
    brand_values: Optional[str]
    website_url: Optional[str]
    logo_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# --- Product ---
class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    features: Optional[List[str]] = None
    benefits: Optional[List[str]] = None
    call_to_action: Optional[str] = None


class ProductUpdate(ProductCreate):
    name: Optional[str] = None


class MediaFileResponse(BaseModel):
    id: int
    file_type: str
    url: str
    thumbnail_url: Optional[str]
    original_filename: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ProductResponse(BaseModel):
    id: int
    brand_id: int
    name: str
    description: Optional[str]
    price: Optional[float]
    category: Optional[str]
    features: Optional[List[str]]
    benefits: Optional[List[str]]
    call_to_action: Optional[str]
    status: str
    media_files: List[MediaFileResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True
