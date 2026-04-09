from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from app.database import get_db
from app.models.user import User
from app.models.brand import Brand
from app.models.social import SocialAccount, ScheduledPost
from app.models.video import VideoProject
from app.schemas.social import (
    SocialAccountResponse,
    SchedulePostRequest,
    ScheduledPostResponse,
)
from app.core.security import get_current_user
from app.services.analytics_service import upsert_generated_analytics

router = APIRouter(prefix="/api/social", tags=["Social"])


# ─── Social Accounts ──────────────────────────────────────────────────────────

@router.get("/accounts", response_model=List[SocialAccountResponse])
def list_accounts(
    brand_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(SocialAccount)
        .join(Brand)
        .filter(Brand.user_id == current_user.id)
    )
    if brand_id:
        query = query.filter(SocialAccount.brand_id == brand_id)
    return query.all()


@router.post("/accounts/connect", response_model=SocialAccountResponse, status_code=201)
def connect_account(
    brand_id: int,
    platform: str,
    account_name: str,
    access_token: str,
    account_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Connect a social media account (provide token from OAuth flow)."""
    brand = db.query(Brand).filter(Brand.id == brand_id, Brand.user_id == current_user.id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    # Upsert — one account per platform per brand
    existing = db.query(SocialAccount).filter(
        SocialAccount.brand_id == brand_id,
        SocialAccount.platform == platform,
    ).first()

    if existing:
        existing.access_token = access_token
        existing.account_name = account_name
        existing.account_id = account_id
        existing.is_connected = True
        db.commit()
        db.refresh(existing)
        return existing

    account = SocialAccount(
        brand_id=brand_id,
        platform=platform,
        account_name=account_name,
        account_id=account_id,
        access_token=access_token,
        is_connected=True,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.delete("/accounts/{account_id}", status_code=204)
def disconnect_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = (
        db.query(SocialAccount)
        .join(Brand)
        .filter(SocialAccount.id == account_id, Brand.user_id == current_user.id)
        .first()
    )
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    account.is_connected = False
    account.access_token = None
    db.commit()


# ─── Scheduling ───────────────────────────────────────────────────────────────

@router.post("/schedule", response_model=ScheduledPostResponse, status_code=201)
def schedule_post(
    payload: SchedulePostRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = (
        db.query(SocialAccount)
        .join(Brand)
        .filter(SocialAccount.id == payload.social_account_id, Brand.user_id == current_user.id)
        .first()
    )
    if not account:
        raise HTTPException(status_code=404, detail="Social account not found")
    if not account.is_connected:
        raise HTTPException(status_code=400, detail="Social account is not connected")

    if payload.scheduled_at <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="scheduled_at must be in the future")

    if payload.video_project_id:
        video_project = db.query(VideoProject).filter(
            VideoProject.id == payload.video_project_id,
            VideoProject.user_id == current_user.id,
        ).first()
        if not video_project:
            raise HTTPException(status_code=404, detail="Video project not found")

    post = ScheduledPost(
        user_id=current_user.id,
        content_item_id=payload.content_item_id,
        video_project_id=payload.video_project_id,
        social_account_id=payload.social_account_id,
        platform=payload.platform,
        caption=payload.caption,
        media_urls=payload.media_urls,
        hashtags=payload.hashtags,
        scheduled_at=payload.scheduled_at,
        status="scheduled",
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@router.get("/schedule", response_model=List[ScheduledPostResponse])
def list_scheduled_posts(
    status: str = None,
    platform: str = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ScheduledPost).filter(ScheduledPost.user_id == current_user.id)
    if status:
        query = query.filter(ScheduledPost.status == status)
    if platform:
        query = query.filter(ScheduledPost.platform == platform)
    return query.order_by(ScheduledPost.scheduled_at.desc()).limit(limit).all()


@router.delete("/schedule/{post_id}", status_code=204)
def cancel_scheduled_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(ScheduledPost).filter(
        ScheduledPost.id == post_id,
        ScheduledPost.user_id == current_user.id,
        ScheduledPost.status == "scheduled",
    ).first()
    if not post:
        raise HTTPException(status_code=404, detail="Scheduled post not found or already published")
    post.status = "cancelled"
    db.commit()


@router.post("/schedule/{post_id}/publish-now", response_model=ScheduledPostResponse)
async def publish_now(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Immediately publish a scheduled post."""
    from app.services.social_service import publish_post
    from datetime import timezone

    post = db.query(ScheduledPost).filter(
        ScheduledPost.id == post_id,
        ScheduledPost.user_id == current_user.id,
    ).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    account = db.query(SocialAccount).filter(SocialAccount.id == post.social_account_id).first()
    if not account or not account.is_connected:
        raise HTTPException(status_code=400, detail="Social account not connected")

    try:
        result = await publish_post(post, account)
        post.status = "posted"
        post.posted_at = datetime.now(timezone.utc)
        post.platform_post_id = result.get("platform_post_id")
        post.post_url = result.get("post_url")
        db.commit()
        upsert_generated_analytics(db, post)
    except Exception as e:
        post.status = "failed"
        post.error_message = str(e)[:500]
        db.commit()
        raise HTTPException(status_code=502, detail=f"Publishing failed: {str(e)}")

    db.commit()
    db.refresh(post)
    return post
