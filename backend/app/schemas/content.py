from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class ContentGenerateRequest(BaseModel):
    brand_id: int
    product_id: int
    content_type: str  # script, caption, hashtags, video_script
    platform: Optional[str] = "general"  # instagram, youtube, linkedin, general
    tone_override: Optional[str] = None
    custom_instructions: Optional[str] = None
    num_variations: Optional[int] = 1


class ContentItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: int
    user_id: int
    brand_id: Optional[int]
    product_id: Optional[int]
    content_type: str
    platform: Optional[str]
    title: Optional[str]
    content: str
    variations: Optional[List[str]]
    model_used: Optional[str]
    tokens_used: Optional[int]
    status: str
    created_at: datetime


class ContentUpdateRequest(BaseModel):
    content: Optional[str] = None
    status: Optional[str] = None
    title: Optional[str] = None
