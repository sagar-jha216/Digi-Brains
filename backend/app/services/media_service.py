import cloudinary
import cloudinary.uploader
from fastapi import UploadFile, HTTPException
from app.core.config import settings
import uuid
from cloudinary.exceptions import Error as CloudinaryError


def _has_real_cloudinary_config() -> bool:
    values = [
        settings.CLOUDINARY_CLOUD_NAME,
        settings.CLOUDINARY_API_KEY,
        settings.CLOUDINARY_API_SECRET,
    ]
    if not all(values):
        return False

    placeholders = {
        "your_cloud_name",
        "your_api_key",
        "your_api_secret",
        "cloud_name",
        "api_key",
        "api_secret",
    }
    normalized = {str(value).strip().lower() for value in values if value}
    return not any(value in placeholders for value in normalized)

# Configure Cloudinary
if _has_real_cloudinary_config():
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
    )

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/mov", "video/avi", "video/quicktime", "video/webm"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024   # 10MB
MAX_VIDEO_SIZE = 500 * 1024 * 1024  # 500MB


async def upload_media(file: UploadFile, product_id: int, brand_id: int) -> dict:
    """Upload image or video to Cloudinary and return metadata."""
    content_type = file.content_type or ""

    if content_type in ALLOWED_IMAGE_TYPES:
        file_type = "image"
        max_size = MAX_IMAGE_SIZE
        resource_type = "image"
    elif content_type in ALLOWED_VIDEO_TYPES:
        file_type = "video"
        max_size = MAX_VIDEO_SIZE
        resource_type = "video"
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {content_type}")

    # Read file content
    content = await file.read()
    if len(content) > max_size:
        size_mb = max_size / (1024 * 1024)
        raise HTTPException(status_code=400, detail=f"File too large. Max size: {size_mb}MB")

    # If Cloudinary is missing or placeholder-configured, save locally for dev
    if not _has_real_cloudinary_config():
        return await _save_locally(file, content, file_type, product_id)

    # Upload to Cloudinary
    public_id = f"aibrandbrain/brand_{brand_id}/product_{product_id}/{uuid.uuid4().hex}"

    upload_options = {
        "public_id": public_id,
        "resource_type": resource_type,
        "overwrite": False,
    }

    if file_type == "video":
        upload_options["eager"] = [{"format": "jpg", "so": "auto"}]  # Generate thumbnail
        upload_options["eager_async"] = True

    try:
        result = cloudinary.uploader.upload(content, **upload_options)
    except CloudinaryError:
        return await _save_locally(file, content, file_type, product_id)

    thumbnail_url = None
    if file_type == "video":
        # Cloudinary video thumbnail URL
        thumbnail_url = result.get("url", "").replace("/video/upload/", "/video/upload/so_auto,w_400,h_300,c_fill/").replace(".mp4", ".jpg")

    return {
        "file_type": file_type,
        "url": result["secure_url"],
        "thumbnail_url": thumbnail_url,
        "cloudinary_public_id": result["public_id"],
        "original_filename": file.filename,
        "file_size": len(content),
        "width": result.get("width"),
        "height": result.get("height"),
        "duration_seconds": int(result.get("duration", 0)) if file_type == "video" else None,
    }


async def _save_locally(file: UploadFile, content: bytes, file_type: str, product_id: int) -> dict:
    """Fallback: save to local uploads folder (dev only)."""
    import os
    import aiofiles

    upload_dir = f"uploads/product_{product_id}"
    os.makedirs(upload_dir, exist_ok=True)
    filename = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = f"{upload_dir}/{filename}"

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    return {
        "file_type": file_type,
        "url": f"/{file_path}",
        "thumbnail_url": None,
        "cloudinary_public_id": None,
        "original_filename": file.filename,
        "file_size": len(content),
        "width": None,
        "height": None,
        "duration_seconds": None,
    }


def delete_media(cloudinary_public_id: str, file_type: str = "image"):
    """Delete media from Cloudinary."""
    if not _has_real_cloudinary_config() or not cloudinary_public_id:
        return
    resource_type = "video" if file_type == "video" else "image"
    cloudinary.uploader.destroy(cloudinary_public_id, resource_type=resource_type)
