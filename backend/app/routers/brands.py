from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.brand import Brand
from app.schemas.brand import BrandCreate, BrandUpdate, BrandResponse
from app.core.security import get_current_user
import cloudinary.uploader
from app.core.config import settings

router = APIRouter(prefix="/api/brands", tags=["Brands"])


@router.post("", response_model=BrandResponse, status_code=201)
def create_brand(
    payload: BrandCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    brand = Brand(**payload.model_dump(), user_id=current_user.id)
    db.add(brand)
    db.commit()
    db.refresh(brand)
    return brand


@router.get("", response_model=List[BrandResponse])
def list_brands(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Brand).filter(Brand.user_id == current_user.id).all()


@router.get("/{brand_id}", response_model=BrandResponse)
def get_brand(
    brand_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    brand = db.query(Brand).filter(Brand.id == brand_id, Brand.user_id == current_user.id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brand


@router.patch("/{brand_id}", response_model=BrandResponse)
def update_brand(
    brand_id: int,
    payload: BrandUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    brand = db.query(Brand).filter(Brand.id == brand_id, Brand.user_id == current_user.id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(brand, field, value)

    db.commit()
    db.refresh(brand)
    return brand


@router.delete("/{brand_id}", status_code=204)
def delete_brand(
    brand_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    brand = db.query(Brand).filter(Brand.id == brand_id, Brand.user_id == current_user.id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    db.delete(brand)
    db.commit()


@router.post("/{brand_id}/logo", response_model=BrandResponse)
async def upload_logo(
    brand_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    brand = db.query(Brand).filter(Brand.id == brand_id, Brand.user_id == current_user.id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Logo must be under 5MB")

    if settings.CLOUDINARY_CLOUD_NAME:
        result = cloudinary.uploader.upload(
            content,
            public_id=f"aibrandbrain/logos/brand_{brand_id}",
            resource_type="image",
            overwrite=True,
            transformation=[{"width": 400, "height": 400, "crop": "fill"}],
        )
        brand.logo_url = result["secure_url"]
    else:
        import os, aiofiles, uuid
        os.makedirs("uploads/logos", exist_ok=True)
        path = f"uploads/logos/brand_{brand_id}_{uuid.uuid4().hex[:8]}{file.filename[-4:]}"
        async with aiofiles.open(path, "wb") as f:
            await f.write(content)
        brand.logo_url = f"/{path}"

    db.commit()
    db.refresh(brand)
    return brand
