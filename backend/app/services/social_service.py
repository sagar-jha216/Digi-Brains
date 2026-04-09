"""
Social Media Automation Service
Handles posting to Instagram (Graph API), YouTube Data API v3, LinkedIn API.
"""
import httpx
from uuid import uuid4
from typing import Optional, List
from datetime import datetime
from app.models.social import SocialAccount, ScheduledPost
from app.core.config import settings


# ─── INSTAGRAM (Meta Graph API) ───────────────────────────────────────────────

async def post_to_instagram(
    account: SocialAccount,
    caption: str,
    media_urls: List[str],
    is_video: bool = False,
) -> dict:
    """Post an image or video to Instagram via Meta Graph API."""
    base_url = "https://graph.facebook.com/v19.0"
    ig_user_id = account.account_id
    token = account.access_token

    async with httpx.AsyncClient(timeout=60) as client:
        if is_video:
            # Step 1: Create video container
            create_resp = await client.post(
                f"{base_url}/{ig_user_id}/media",
                params={
                    "media_type": "REELS",
                    "video_url": media_urls[0],
                    "caption": caption,
                    "access_token": token,
                },
            )
        elif len(media_urls) > 1:
            # Carousel post
            item_ids = []
            for url in media_urls[:10]:  # Instagram max 10
                r = await client.post(
                    f"{base_url}/{ig_user_id}/media",
                    params={"image_url": url, "is_carousel_item": True, "access_token": token},
                )
                r.raise_for_status()
                item_ids.append(r.json()["id"])

            create_resp = await client.post(
                f"{base_url}/{ig_user_id}/media",
                params={
                    "media_type": "CAROUSEL",
                    "children": ",".join(item_ids),
                    "caption": caption,
                    "access_token": token,
                },
            )
        else:
            # Single image
            create_resp = await client.post(
                f"{base_url}/{ig_user_id}/media",
                params={"image_url": media_urls[0], "caption": caption, "access_token": token},
            )

        create_resp.raise_for_status()
        container_id = create_resp.json()["id"]

        # Step 2: Publish container
        publish_resp = await client.post(
            f"{base_url}/{ig_user_id}/media_publish",
            params={"creation_id": container_id, "access_token": token},
        )
        publish_resp.raise_for_status()
        post_id = publish_resp.json()["id"]

        return {
            "platform_post_id": post_id,
            "post_url": f"https://www.instagram.com/p/{post_id}/",
        }


# ─── YOUTUBE (Data API v3) ────────────────────────────────────────────────────

async def post_to_youtube(
    account: SocialAccount,
    title: str,
    description: str,
    video_url: str,
    tags: Optional[List[str]] = None,
) -> dict:
    """Upload a video to YouTube."""
    # YouTube requires OAuth2 — access_token must be a valid Google OAuth token
    async with httpx.AsyncClient(timeout=300) as client:
        # First download the video from our CDN URL
        video_response = await client.get(video_url)
        video_response.raise_for_status()
        video_content = video_response.content

        headers = {
            "Authorization": f"Bearer {account.access_token}",
            "Content-Type": "application/json",
        }

        # Insert video metadata
        metadata = {
            "snippet": {
                "title": title[:100],
                "description": description,
                "tags": tags or [],
                "categoryId": "22",  # People & Blogs
            },
            "status": {"privacyStatus": "public"},
        }

        # Use resumable upload
        init_resp = await client.post(
            "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
            headers={**headers, "X-Upload-Content-Type": "video/mp4", "X-Upload-Content-Length": str(len(video_content))},
            json=metadata,
        )
        init_resp.raise_for_status()
        upload_url = init_resp.headers["Location"]

        # Upload video bytes
        upload_resp = await client.put(
            upload_url,
            content=video_content,
            headers={"Content-Type": "video/mp4"},
        )
        upload_resp.raise_for_status()
        video_id = upload_resp.json()["id"]

        return {
            "platform_post_id": video_id,
            "post_url": f"https://www.youtube.com/watch?v={video_id}",
        }


# ─── LINKEDIN (API v2) ────────────────────────────────────────────────────────

async def post_to_linkedin(
    account: SocialAccount,
    text: str,
    media_url: Optional[str] = None,
) -> dict:
    """Post text or image to LinkedIn."""
    person_urn = f"urn:li:person:{account.account_id}"
    headers = {
        "Authorization": f"Bearer {account.access_token}",
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
    }

    async with httpx.AsyncClient(timeout=60) as client:
        post_body = {
            "author": person_urn,
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {"text": text[:3000]},
                    "shareMediaCategory": "NONE" if not media_url else "IMAGE",
                }
            },
            "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"},
        }

        if media_url:
            # Register image upload
            register_resp = await client.post(
                "https://api.linkedin.com/v2/assets?action=registerUpload",
                headers=headers,
                json={
                    "registerUploadRequest": {
                        "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
                        "owner": person_urn,
                        "serviceRelationships": [{"relationshipType": "OWNER", "identifier": "urn:li:userGeneratedContent"}],
                    }
                },
            )
            register_resp.raise_for_status()
            upload_data = register_resp.json()
            asset = upload_data["value"]["asset"]
            upload_url = upload_data["value"]["uploadMechanism"]["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]["uploadUrl"]

            # Upload image
            img_resp = await client.get(media_url)
            await client.put(upload_url, content=img_resp.content, headers={"Authorization": f"Bearer {account.access_token}"})

            post_body["specificContent"]["com.linkedin.ugc.ShareContent"]["shareMediaCategory"] = "IMAGE"
            post_body["specificContent"]["com.linkedin.ugc.ShareContent"]["media"] = [
                {"status": "READY", "media": asset}
            ]

        post_resp = await client.post("https://api.linkedin.com/v2/ugcPosts", headers=headers, json=post_body)
        post_resp.raise_for_status()
        post_id = post_resp.headers.get("x-restli-id", post_resp.json().get("id", ""))

        return {
            "platform_post_id": post_id,
            "post_url": f"https://www.linkedin.com/feed/update/{post_id}/",
        }


# ─── Dispatcher ───────────────────────────────────────────────────────────────

async def publish_post(post: ScheduledPost, account: SocialAccount) -> dict:
    """Route post to the correct platform handler."""
    caption = post.caption or ""
    media_urls = post.media_urls or []
    hashtags = post.hashtags or []
    full_caption = caption + "\n\n" + " ".join(hashtags) if hashtags else caption
    token = account.access_token or ""

    if settings.ENVIRONMENT != "production" or token.startswith(("mock_", "demo_", "test_")):
        post_id = f"{post.platform}_{uuid4().hex[:12]}"
        base_urls = {
            "instagram": "https://www.instagram.com/p/",
            "youtube": "https://www.youtube.com/watch?v=",
            "linkedin": "https://www.linkedin.com/feed/update/",
        }
        return {
            "platform_post_id": post_id,
            "post_url": f"{base_urls.get(post.platform, 'https://example.com/post/')}{post_id}",
            "mode": "mock_publish",
        }

    if post.platform == "instagram":
        is_video = any(u.endswith((".mp4", ".mov", ".avi")) for u in media_urls)
        return await post_to_instagram(account, full_caption, media_urls, is_video)

    elif post.platform == "youtube":
        return await post_to_youtube(
            account,
            title=caption[:100] or "New Video",
            description=full_caption,
            video_url=media_urls[0] if media_urls else "",
            tags=hashtags,
        )

    elif post.platform == "linkedin":
        return await post_to_linkedin(account, full_caption, media_urls[0] if media_urls else None)

    else:
        raise ValueError(f"Unsupported platform: {post.platform}")
