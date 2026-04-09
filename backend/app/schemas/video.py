from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class VideoScene(BaseModel):
    scene_number: int
    start_seconds: int
    end_seconds: int
    visual: str
    overlay_text: str
    voiceover: str
    media_hint: Optional[str] = None


class VideoProjectGenerateRequest(BaseModel):
    brand_id: int
    product_id: int
    platform: str = "instagram"
    objective: str = "product launch"
    video_style: str = "ugc"
    aspect_ratio: str = "9:16"
    duration_seconds: int = Field(default=30, ge=15, le=90)
    custom_instructions: Optional[str] = None
    creative_angle: Optional[str] = None


class VideoBatchGenerateRequest(VideoProjectGenerateRequest):
    variant_count: int = Field(default=3, ge=2, le=6)


class VideoAutoScheduleRequest(BaseModel):
    video_project_ids: List[int]
    social_account_id: int
    start_at: datetime
    interval_hours: int = Field(default=24, ge=1, le=168)


class VideoProjectResponse(BaseModel):
    id: int
    user_id: int
    brand_id: Optional[int]
    product_id: Optional[int]
    title: str
    platform: str
    objective: str
    video_style: str
    aspect_ratio: str
    duration_seconds: int
    hook: Optional[str]
    storyboard: Optional[List[str]]
    scenes: List[VideoScene] = []
    voiceover_script: Optional[str]
    caption: Optional[str]
    hashtags: List[str] = []
    shot_plan: List[str] = []
    source_media: List[str] = []
    preview_url: Optional[str]
    download_url: Optional[str]
    preview_type: str
    render_status: str
    render_provider: str
    status: str
    meta: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True
