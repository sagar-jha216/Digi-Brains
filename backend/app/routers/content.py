from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.brand import Brand
from app.models.product import Product
from app.models.content import ContentItem
from app.schemas.content import ContentGenerateRequest, ContentItemResponse, ContentUpdateRequest
from app.core.security import get_current_user
from app.services.ai_service import generate_content

router = APIRouter(prefix="/api/content", tags=["Content"])


@router.post("/generate", response_model=ContentItemResponse, status_code=201)
def generate(
    payload: ContentGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    brand = db.query(Brand).filter(Brand.id == payload.brand_id, Brand.user_id == current_user.id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    product = db.query(Product).filter(Product.id == payload.product_id, Product.brand_id == brand.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    result = generate_content(
        brand=brand,
        product=product,
        content_type=payload.content_type,
        platform=payload.platform or "general",
        tone_override=payload.tone_override,
        custom_instructions=payload.custom_instructions,
        num_variations=payload.num_variations or 1,
    )

    content_item = ContentItem(
        user_id=current_user.id,
        brand_id=brand.id,
        product_id=product.id,
        content_type=payload.content_type,
        platform=payload.platform,
        title=f"{product.name} - {payload.content_type.replace('_', ' ').title()} ({payload.platform})",
        content=result["content"],
        variations=result["variations"],
        model_used=result["model_used"],
        tokens_used=result["tokens_used"],
        prompt_used=result["prompt_used"],
        status="draft",
    )
    db.add(content_item)
    db.commit()
    db.refresh(content_item)
    return content_item


@router.get("", response_model=List[ContentItemResponse])
def list_content(
    brand_id: int = None,
    product_id: int = None,
    content_type: str = None,
    platform: str = None,
    status: str = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ContentItem).filter(ContentItem.user_id == current_user.id)

    if brand_id:
        query = query.filter(ContentItem.brand_id == brand_id)
    if product_id:
        query = query.filter(ContentItem.product_id == product_id)
    if content_type:
        query = query.filter(ContentItem.content_type == content_type)
    if platform:
        query = query.filter(ContentItem.platform == platform)
    if status:
        query = query.filter(ContentItem.status == status)

    return query.order_by(ContentItem.created_at.desc()).offset(offset).limit(limit).all()


@router.get("/{content_id}", response_model=ContentItemResponse)
def get_content(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(ContentItem).filter(ContentItem.id == content_id, ContentItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Content not found")
    return item


@router.patch("/{content_id}", response_model=ContentItemResponse)
def update_content(
    content_id: int,
    payload: ContentUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(ContentItem).filter(ContentItem.id == content_id, ContentItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Content not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{content_id}", status_code=204)
def delete_content(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(ContentItem).filter(ContentItem.id == content_id, ContentItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Content not found")
    db.delete(item)
    db.commit()


@router.post("/{content_id}/approve", response_model=ContentItemResponse)
def approve_content(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(ContentItem).filter(ContentItem.id == content_id, ContentItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Content not found")
    item.status = "approved"
    db.commit()
    db.refresh(item)
    return item
