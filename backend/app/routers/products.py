from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.brand import Brand
from app.models.product import Product
from app.models.media import MediaFile
from app.schemas.brand import ProductCreate, ProductUpdate, ProductResponse, MediaFileResponse
from app.core.security import get_current_user
from app.services.media_service import upload_media, delete_media

router = APIRouter(prefix="/api/products", tags=["Products"])


def _get_product_for_user(product_id: int, user_id: int, db: Session) -> Product:
    product = (
        db.query(Product)
        .join(Brand)
        .filter(Product.id == product_id, Brand.user_id == user_id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("", response_model=ProductResponse, status_code=201)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate brand belongs to user
    brand = db.query(Brand).filter(
        Brand.id == payload.brand_id if hasattr(payload, "brand_id") else True,
        Brand.user_id == current_user.id
    ).first()

    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.post("/brand/{brand_id}", response_model=ProductResponse, status_code=201)
def create_product_for_brand(
    brand_id: int,
    payload: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    brand = db.query(Brand).filter(Brand.id == brand_id, Brand.user_id == current_user.id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    product = Product(**payload.model_dump(), brand_id=brand_id)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/brand/{brand_id}", response_model=List[ProductResponse])
def list_products(
    brand_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    brand = db.query(Brand).filter(Brand.id == brand_id, Brand.user_id == current_user.id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return db.query(Product).filter(Product.brand_id == brand_id, Product.status == "active").all()


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_product_for_user(product_id, current_user.id, db)


@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = _get_product_for_user(product_id, current_user.id, db)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = _get_product_for_user(product_id, current_user.id, db)
    product.status = "archived"
    db.commit()


@router.post("/{product_id}/media", response_model=MediaFileResponse, status_code=201)
async def upload_product_media(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = _get_product_for_user(product_id, current_user.id, db)

    media_data = await upload_media(file, product_id=product.id, brand_id=product.brand_id)

    media = MediaFile(**media_data, product_id=product.id)
    db.add(media)
    db.commit()
    db.refresh(media)
    return media


@router.post("/{product_id}/media/bulk", response_model=List[MediaFileResponse], status_code=201)
async def upload_product_media_bulk(
    product_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = _get_product_for_user(product_id, current_user.id, db)
    created_media: List[MediaFile] = []

    for file in files:
        media_data = await upload_media(file, product_id=product.id, brand_id=product.brand_id)
        media = MediaFile(**media_data, product_id=product.id)
        db.add(media)
        created_media.append(media)

    db.commit()

    for media in created_media:
        db.refresh(media)

    return created_media


@router.get("/{product_id}/media", response_model=List[MediaFileResponse])
def list_product_media(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_product_for_user(product_id, current_user.id, db)
    return db.query(MediaFile).filter(MediaFile.product_id == product_id).all()


@router.delete("/{product_id}/media/{media_id}", status_code=204)
def delete_product_media(
    product_id: int,
    media_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_product_for_user(product_id, current_user.id, db)
    media = db.query(MediaFile).filter(MediaFile.id == media_id, MediaFile.product_id == product_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    delete_media(media.cloudinary_public_id, media.file_type)
    db.delete(media)
    db.commit()
