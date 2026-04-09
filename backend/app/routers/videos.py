import asyncio
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core.security import get_current_user
from app.database import get_db
from app.models.brand import Brand
from app.models.media import MediaFile
from app.models.product import Product
from app.models.social import ScheduledPost, SocialAccount
from app.models.user import User
from app.models.video import VideoProject
from app.schemas.social import ScheduledPostResponse
from app.schemas.video import VideoAutoScheduleRequest, VideoBatchGenerateRequest, VideoProjectGenerateRequest, VideoProjectResponse
from app.services.video_service import build_variant_angles, generate_video_project, render_video_preview

router = APIRouter(prefix="/api/videos", tags=["Videos"])


@router.post("/generate", response_model=VideoProjectResponse, status_code=201)
def generate_video(
    payload: VideoProjectGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    brand = db.query(Brand).filter(Brand.id == payload.brand_id, Brand.user_id == current_user.id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    product = db.query(Product).filter(Product.id == payload.product_id, Product.brand_id == brand.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    media_files = (
        db.query(MediaFile)
        .filter(MediaFile.product_id == product.id)
        .order_by(MediaFile.created_at.asc())
        .all()
    )

    project_data = generate_video_project(
        brand=brand,
        product=product,
        media_files=media_files,
        platform=payload.platform,
        objective=payload.objective,
        video_style=payload.video_style,
        aspect_ratio=payload.aspect_ratio,
        duration_seconds=payload.duration_seconds,
        custom_instructions=payload.custom_instructions,
    )

    video_project = VideoProject(
        user_id=current_user.id,
        brand_id=brand.id,
        product_id=product.id,
        platform=payload.platform,
        objective=payload.objective,
        video_style=payload.video_style,
        aspect_ratio=payload.aspect_ratio,
        duration_seconds=payload.duration_seconds,
        status="draft",
        **project_data,
    )
    db.add(video_project)
    db.commit()
    db.refresh(video_project)

    if video_project.render_status != "rendered":
        rendered = asyncio.run(render_video_preview(video_project))
        for field, value in rendered.items():
            setattr(video_project, field, value)
        db.commit()
        db.refresh(video_project)
    return video_project


@router.post("/generate-batch", response_model=List[VideoProjectResponse], status_code=201)
def generate_video_batch(
    payload: VideoBatchGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    brand = db.query(Brand).filter(Brand.id == payload.brand_id, Brand.user_id == current_user.id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    product = db.query(Product).filter(Product.id == payload.product_id, Product.brand_id == brand.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    media_files = (
        db.query(MediaFile)
        .filter(MediaFile.product_id == product.id)
        .order_by(MediaFile.created_at.asc())
        .all()
    )

    projects = []
    for angle in build_variant_angles(payload.variant_count):
        project_data = generate_video_project(
            brand=brand,
            product=product,
            media_files=media_files,
            platform=payload.platform,
            objective=payload.objective,
            video_style=payload.video_style,
            aspect_ratio=payload.aspect_ratio,
            duration_seconds=payload.duration_seconds,
            custom_instructions=payload.custom_instructions,
            creative_angle=angle,
        )
        meta = dict(project_data.get("meta") or {})
        meta["creative_angle"] = angle
        project_data["meta"] = meta
        project_data["title"] = f"{product.name} - {angle.title()}"

        video_project = VideoProject(
            user_id=current_user.id,
            brand_id=brand.id,
            product_id=product.id,
            platform=payload.platform,
            objective=payload.objective,
            video_style=payload.video_style,
            aspect_ratio=payload.aspect_ratio,
            duration_seconds=payload.duration_seconds,
            status="draft",
            **project_data,
        )
        db.add(video_project)
        db.commit()
        db.refresh(video_project)

        if video_project.render_status != "rendered":
            rendered = asyncio.run(render_video_preview(video_project))
            for field, value in rendered.items():
                setattr(video_project, field, value)
            db.commit()
            db.refresh(video_project)

        projects.append(video_project)

    return projects


@router.get("", response_model=List[VideoProjectResponse])
def list_videos(
    brand_id: int = None,
    product_id: int = None,
    platform: str = None,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(VideoProject).filter(VideoProject.user_id == current_user.id)
    if brand_id:
        query = query.filter(VideoProject.brand_id == brand_id)
    if product_id:
        query = query.filter(VideoProject.product_id == product_id)
    if platform:
        query = query.filter(VideoProject.platform == platform)
    return query.order_by(VideoProject.created_at.desc()).limit(limit).all()


@router.get("/{video_id}", response_model=VideoProjectResponse)
def get_video(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    video_project = (
        db.query(VideoProject)
        .filter(VideoProject.id == video_id, VideoProject.user_id == current_user.id)
        .first()
    )
    if not video_project:
        raise HTTPException(status_code=404, detail="Video project not found")
    return video_project


@router.post("/{video_id}/render", response_model=VideoProjectResponse)
def render_video(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    video_project = (
        db.query(VideoProject)
        .filter(VideoProject.id == video_id, VideoProject.user_id == current_user.id)
        .first()
    )
    if not video_project:
        raise HTTPException(status_code=404, detail="Video project not found")

    rendered = asyncio.run(render_video_preview(video_project))
    for field, value in rendered.items():
        setattr(video_project, field, value)
    db.commit()
    db.refresh(video_project)
    return video_project


@router.post("/auto-schedule", response_model=List[ScheduledPostResponse], status_code=201)
def auto_schedule_videos(
    payload: VideoAutoScheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = (
        db.query(SocialAccount)
        .join(Brand)
        .filter(SocialAccount.id == payload.social_account_id, Brand.user_id == current_user.id)
        .first()
    )
    if not account or not account.is_connected:
        raise HTTPException(status_code=404, detail="Connected social account not found")

    projects = (
        db.query(VideoProject)
        .filter(VideoProject.user_id == current_user.id, VideoProject.id.in_(payload.video_project_ids))
        .order_by(VideoProject.created_at.asc())
        .all()
    )
    if len(projects) != len(set(payload.video_project_ids)):
        raise HTTPException(status_code=404, detail="One or more video projects were not found")

    scheduled_posts = []
    for index, project in enumerate(projects):
        schedule_time = payload.start_at + timedelta(hours=index * payload.interval_hours)
        post = ScheduledPost(
            user_id=current_user.id,
            video_project_id=project.id,
            social_account_id=account.id,
            platform=account.platform,
            caption=project.caption,
            media_urls=[project.download_url or project.preview_url] if (project.download_url or project.preview_url) else (project.source_media or [])[:4],
            hashtags=project.hashtags,
            scheduled_at=schedule_time,
            status="scheduled",
        )
        db.add(post)
        db.commit()
        db.refresh(post)
        scheduled_posts.append(post)

    return scheduled_posts
