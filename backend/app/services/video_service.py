import json
import os
import re
import subprocess
from io import BytesIO
from pathlib import Path
from typing import List, Optional
from uuid import uuid4

import httpx
import imageio.v2 as imageio
import numpy as np
import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageEnhance, ImageFont

from openai import OpenAI

from app.core.config import settings
from app.models.brand import Brand
from app.models.media import MediaFile
from app.models.product import Product

client = OpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
PROJECT_ROOT = Path(__file__).resolve().parents[2]
UPLOAD_ROOT = PROJECT_ROOT / "uploads" / "rendered_videos"
CREATIVE_ANGLES = [
    "pain-point solution",
    "before-and-after transformation",
    "premium lifestyle aspiration",
    "founder story credibility",
    "social proof and trust",
    "limited-time urgency",
]


def _brand_context(brand: Brand, product: Product, media_files: List[MediaFile]) -> str:
    media_summary = []
    for media in media_files[:8]:
        descriptor = media.original_filename or media.url.split("/")[-1]
        media_summary.append(f"- {media.file_type}: {descriptor}")

    features = ", ".join(product.features or [])
    benefits = ", ".join(product.benefits or [])
    return f"""
Brand: {brand.name}
Industry: {brand.industry or "Not specified"}
Tone: {brand.brand_tone or "confident and modern"}
Audience: {brand.target_audience or "broad consumer audience"}
Values: {brand.brand_values or "quality, trust, and simplicity"}
Website: {brand.website_url or "Not specified"}

Product: {product.name}
Description: {product.description or "Not specified"}
Category: {product.category or "Not specified"}
Price: {f"${product.price}" if product.price else "Not specified"}
Features: {features or "Not specified"}
Benefits: {benefits or "Not specified"}
CTA: {product.call_to_action or "Shop now"}

Available Media:
{chr(10).join(media_summary) if media_summary else "- No uploaded media"}
""".strip()


def _extract_json(text: str) -> dict:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            raise
        return json.loads(match.group(0))


def _media_urls(media_files: List[MediaFile], file_type: Optional[str] = None) -> List[str]:
    items = [media.url for media in media_files if file_type is None or media.file_type == file_type]
    return [url for url in items if url]


def _mock_video_project(
    brand: Brand,
    product: Product,
    media_files: List[MediaFile],
    platform: str,
    objective: str,
    video_style: str,
    aspect_ratio: str,
    duration_seconds: int,
) -> dict:
    image_urls = _media_urls(media_files, "image")
    video_urls = _media_urls(media_files, "video")
    primary_preview = video_urls[0] if video_urls else (image_urls[0] if image_urls else brand.logo_url)
    preview_type = "video" if video_urls else ("image" if image_urls else "storyboard")
    render_status = "rendered" if video_urls else ("storyboard_ready" if image_urls else "needs_media")
    render_provider = "existing_media" if video_urls else "mock"

    feature = (product.features or ["Premium design"])[0]
    benefit = (product.benefits or ["Makes life easier"])[0]
    cta = product.call_to_action or "Shop now"

    scenes = [
        {
            "scene_number": 1,
            "start_seconds": 0,
            "end_seconds": 6,
            "visual": f"Open with the strongest product image and bold branded typography for {product.name}.",
            "overlay_text": f"Meet {product.name}",
            "voiceover": f"Stop scrolling. {product.name} is here to upgrade your {product.category or 'everyday routine'}.",
            "media_hint": image_urls[0] if image_urls else None,
        },
        {
            "scene_number": 2,
            "start_seconds": 6,
            "end_seconds": 15,
            "visual": f"Show the product in close-up with motion on key detail: {feature}.",
            "overlay_text": feature,
            "voiceover": f"Built for people who want {benefit.lower()}, with {feature.lower()} at the center of the experience.",
            "media_hint": image_urls[1] if len(image_urls) > 1 else (image_urls[0] if image_urls else None),
        },
        {
            "scene_number": 3,
            "start_seconds": 15,
            "end_seconds": 24,
            "visual": "Cut to lifestyle usage and show the before-versus-after transformation.",
            "overlay_text": benefit,
            "voiceover": f"From first impression to daily use, it helps your audience get {benefit.lower()} without the usual friction.",
            "media_hint": image_urls[2] if len(image_urls) > 2 else (image_urls[0] if image_urls else None),
        },
        {
            "scene_number": 4,
            "start_seconds": 24,
            "end_seconds": duration_seconds,
            "visual": "End on offer, brand logo, and a clean call-to-action frame.",
            "overlay_text": cta,
            "voiceover": f"{brand.name} makes the choice easy. {cta}.",
            "media_hint": image_urls[0] if image_urls else None,
        },
    ]

    return {
        "title": f"{product.name} Launch Reel",
        "hook": f"{product.name} makes {benefit.lower()} feel effortless.",
        "storyboard": [
            "Scroll-stopping hook with hero visual",
            "Feature proof with close-up product shots",
            "Lifestyle transformation moment",
            "Strong CTA ending for conversion",
        ],
        "scenes": scenes,
        "voiceover_script": " ".join(scene["voiceover"] for scene in scenes),
        "caption": (
            f"{product.name} by {brand.name} is built for {brand.target_audience or 'people who want better results faster'}. "
            f"{product.description or benefit}. {cta}."
        ),
        "hashtags": [
            f"#{brand.name.replace(' ', '')}",
            f"#{product.name.replace(' ', '')}",
            f"#{(product.category or 'Product').replace(' ', '')}",
            "#ProductLaunch",
            "#VideoMarketing",
            "#BrandGrowth",
        ],
        "shot_plan": [
            f"Style: {video_style}",
            f"Aspect ratio: {aspect_ratio}",
            f"Duration: {duration_seconds}s",
            "Use kinetic captions for the hook and CTA",
            "Match scene cuts to upbeat music transitions",
        ],
        "source_media": image_urls + video_urls,
        "preview_url": primary_preview,
        "download_url": video_urls[0] if video_urls else None,
        "preview_type": preview_type,
        "render_status": render_status,
        "render_provider": render_provider,
        "meta": {
            "provider_mode": "mock_fallback",
            "ready_for_posting": bool(primary_preview),
            "objective": objective,
        },
    }


async def _read_media_bytes(url: str) -> bytes:
    if url.startswith("/uploads/"):
        local_path = PROJECT_ROOT / url.lstrip("/")
        return local_path.read_bytes()

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.content


def _canvas_size(aspect_ratio: str) -> tuple[int, int]:
    return {
        "9:16": (1088, 1920),
        "1:1": (1088, 1088),
        "16:9": (1920, 1088),
    }.get(aspect_ratio, (1088, 1920))


def _synthesize_voiceover(voiceover_text: str, output_path: Path) -> bool:
    if not voiceover_text.strip():
        return False

    if client:
        try:
            with client.audio.speech.with_streaming_response.create(
                model="gpt-4o-mini-tts",
                voice="coral",
                input=voiceover_text[:2000],
                instructions="Speak like a polished product marketing narrator. Keep the pacing clear, energetic, and trustworthy.",
                response_format="wav",
            ) as response:
                response.stream_to_file(output_path)
            if output_path.exists() and output_path.stat().st_size > 0:
                return True
        except Exception:
            pass

    if os.name != "nt":
        return False

    script = (
        "Add-Type -AssemblyName System.Speech; "
        f"$text = Get-Content -Raw '{str(output_path.with_suffix('.txt'))}'; "
        "$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer; "
        "$speaker.SelectVoice('Microsoft Zira Desktop'); "
        "$speaker.Rate = 0; "
        f"$speaker.SetOutputToWaveFile('{str(output_path)}'); "
        "$speaker.Speak($text); "
        "$speaker.Dispose();"
    )

    text_path = output_path.with_suffix(".txt")
    text_path.write_text(voiceover_text, encoding="utf-8")
    try:
        completed = subprocess.run(
            ["powershell", "-NoProfile", "-Command", script],
            check=False,
            capture_output=True,
            text=True,
            timeout=120,
        )
        return completed.returncode == 0 and output_path.exists()
    finally:
        if text_path.exists():
            text_path.unlink()


def _mux_audio(video_path: Path, audio_path: Path, output_path: Path) -> bool:
    if not audio_path.exists():
        return False

    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    completed = subprocess.run(
        [
            ffmpeg_exe,
            "-y",
            "-i",
            str(video_path),
            "-i",
            str(audio_path),
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-shortest",
            str(output_path),
        ],
        check=False,
        capture_output=True,
        text=True,
        timeout=120,
    )
    return completed.returncode == 0 and output_path.exists()


def _fit_cover(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    width, height = size
    ratio = max(width / image.width, height / image.height)
    resized = image.resize((int(image.width * ratio), int(image.height * ratio)))
    left = max((resized.width - width) // 2, 0)
    top = max((resized.height - height) // 2, 0)
    return resized.crop((left, top, left + width, top + height))


def _load_font(size: int) -> ImageFont.ImageFont:
    for candidate in ["arial.ttf", "segoeui.ttf", "calibri.ttf"]:
        try:
            return ImageFont.truetype(candidate, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def _wrap_text(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, max_width: int) -> List[str]:
    words = text.split()
    if not words:
        return []

    lines: List[str] = []
    current = words[0]
    for word in words[1:]:
        trial = f"{current} {word}"
        if draw.textlength(trial, font=font) <= max_width:
            current = trial
        else:
            lines.append(current)
            current = word
    lines.append(current)
    return lines


async def render_video_preview(video_project) -> dict:
    media_urls = [url for url in (video_project.source_media or []) if url]
    image_urls = [url for url in media_urls if not url.lower().endswith((".mp4", ".mov", ".avi", ".webm"))]
    if not image_urls:
        return {
            "preview_url": video_project.preview_url,
            "download_url": video_project.download_url,
            "preview_type": video_project.preview_type,
            "render_status": video_project.render_status,
            "render_provider": video_project.render_provider,
            "meta": {
                **(video_project.meta or {}),
                "render_error": "No image media available for renderer",
            },
        }

    canvas_size = _canvas_size(video_project.aspect_ratio)
    title_font = _load_font(74 if video_project.aspect_ratio == "9:16" else 54)
    body_font = _load_font(42 if video_project.aspect_ratio == "9:16" else 34)
    small_font = _load_font(30)

    scene_sources = list(video_project.scenes or [])
    if not scene_sources:
        return {
            "preview_url": video_project.preview_url,
            "download_url": video_project.download_url,
            "preview_type": video_project.preview_type,
            "render_status": video_project.render_status,
            "render_provider": video_project.render_provider,
            "meta": {
                **(video_project.meta or {}),
                "render_error": "No scenes available for renderer",
            },
        }

    UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
    frames: List[Image.Image] = []
    durations: List[int] = []

    for index, scene in enumerate(scene_sources):
        media_hint = scene.get("media_hint")
        source_url = media_hint if media_hint in image_urls else image_urls[index % len(image_urls)]
        raw_bytes = await _read_media_bytes(source_url)
        image = Image.open(BytesIO(raw_bytes)).convert("RGB")
        frame = _fit_cover(image, canvas_size)
        frame = ImageEnhance.Contrast(frame).enhance(1.08)

        overlay = Image.new("RGBA", canvas_size, (7, 12, 23, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        width, height = canvas_size

        overlay_draw.rectangle((0, int(height * 0.58), width, height), fill=(5, 10, 20, 175))
        overlay_draw.rectangle((0, 0, width, 180), fill=(5, 10, 20, 110))
        overlay_draw.rounded_rectangle((48, 52, 260, 108), radius=26, fill=(12, 198, 255, 210))
        overlay_draw.text((72, 66), f"SCENE {scene.get('scene_number', index + 1)}", fill=(5, 10, 20), font=small_font)

        frame = Image.alpha_composite(frame.convert("RGBA"), overlay)
        draw = ImageDraw.Draw(frame)

        hook_lines = _wrap_text(draw, scene.get("overlay_text") or video_project.hook or video_project.title, title_font, width - 96)
        voice_lines = _wrap_text(draw, scene.get("voiceover") or "", body_font, width - 96)

        y = int(height * 0.62)
        for line in hook_lines[:2]:
            draw.text((48, y), line, font=title_font, fill=(255, 255, 255))
            y += title_font.size + 6

        y += 16
        for line in voice_lines[:4]:
            draw.text((48, y), line, font=body_font, fill=(214, 226, 238))
            y += body_font.size + 6

        draw.text((48, height - 72), video_project.title, font=small_font, fill=(120, 223, 255))
        frames.append(frame.convert("P", palette=Image.ADAPTIVE))
        durations.append(max(scene.get("end_seconds", 5) - scene.get("start_seconds", 0), 2) * 1000)

    asset_id = uuid4().hex[:8]
    gif_name = f"video_project_{video_project.id}_{asset_id}.gif"
    gif_path = UPLOAD_ROOT / gif_name
    frames[0].save(
        gif_path,
        save_all=True,
        append_images=frames[1:],
        loop=0,
        duration=durations,
        optimize=False,
        disposal=2,
    )

    mp4_name = f"video_project_{video_project.id}_{asset_id}.mp4"
    mp4_path = UPLOAD_ROOT / mp4_name
    fps = 12
    with imageio.get_writer(str(mp4_path), fps=fps, codec="libx264", format="FFMPEG", pixelformat="yuv420p") as writer:
        for frame, duration_ms in zip(frames, durations):
            rgb = frame.convert("RGB")
            repeat = max(int(round((duration_ms / 1000) * fps)), 1)
            array = np.array(rgb)
            for _ in range(repeat):
                writer.append_data(array)

    voiceover_text = (video_project.voiceover_script or "").strip()
    wav_name = f"video_project_{video_project.id}_{asset_id}.wav"
    wav_path = UPLOAD_ROOT / wav_name
    final_mp4_name = f"video_project_{video_project.id}_{asset_id}_vo.mp4"
    final_mp4_path = UPLOAD_ROOT / final_mp4_name
    has_voiceover = _synthesize_voiceover(voiceover_text, wav_path)
    voiceover_muxed = has_voiceover and _mux_audio(mp4_path, wav_path, final_mp4_path)

    gif_url = f"/uploads/rendered_videos/{gif_name}"
    mp4_url = f"/uploads/rendered_videos/{final_mp4_name if voiceover_muxed else mp4_name}"
    return {
        "preview_url": mp4_url,
        "download_url": mp4_url,
        "preview_type": "video",
        "render_status": "rendered",
        "render_provider": "pillow_mp4_voice_renderer" if voiceover_muxed else "pillow_mp4_renderer",
        "meta": {
            **(video_project.meta or {}),
            "render_mode": "animated_gif_mp4_voiceover" if voiceover_muxed else "animated_gif_and_mp4",
            "frame_count": len(frames),
            "preview_asset": gif_url,
            "download_asset": mp4_url,
            "voiceover_included": voiceover_muxed,
            "voiceover_source": "openai_gpt-4o-mini-tts_or_windows_system_speech" if voiceover_muxed else None,
        },
    }


def generate_video_project(
    brand: Brand,
    product: Product,
    media_files: List[MediaFile],
    platform: str,
    objective: str,
    video_style: str,
    aspect_ratio: str,
    duration_seconds: int,
    custom_instructions: Optional[str] = None,
    creative_angle: Optional[str] = None,
) -> dict:
    if not client:
        return _mock_video_project(
            brand=brand,
            product=product,
            media_files=media_files,
            platform=platform,
            objective=objective,
            video_style=video_style,
            aspect_ratio=aspect_ratio,
            duration_seconds=duration_seconds,
        )

    prompt = f"""
You are an expert direct-response creative strategist.
Create a launch-ready social video concept as JSON for a single product.

Return valid JSON with these keys only:
title, hook, storyboard, scenes, voiceover_script, caption, hashtags, shot_plan, meta

Rules:
- storyboard: array of 4 short bullet strings
- scenes: array of 4 scene objects with keys scene_number, start_seconds, end_seconds, visual, overlay_text, voiceover, media_hint
- hashtags: array of 6-10 hashtag strings
- shot_plan: array of 4-6 practical production notes
- meta: object with keys creative_angle, editor_notes, confidence
- Keep the final caption platform-ready for {platform}
- Keep the total duration close to {duration_seconds} seconds
- Adapt tone and visuals to the provided brand context
""".strip()

    user_input = f"""
Context:
{_brand_context(brand, product, media_files)}

Platform: {platform}
Objective: {objective}
Style: {video_style}
Creative Angle: {creative_angle or "best-performing conversion angle"}
Aspect Ratio: {aspect_ratio}
Duration: {duration_seconds} seconds
Additional Instructions: {custom_instructions or "None"}
""".strip()

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.7,
        max_tokens=1800,
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": user_input},
        ],
    )

    payload = _extract_json(response.choices[0].message.content or "{}")
    mock = _mock_video_project(
        brand=brand,
        product=product,
        media_files=media_files,
        platform=platform,
        objective=objective,
        video_style=video_style,
        aspect_ratio=aspect_ratio,
        duration_seconds=duration_seconds,
    )

    mock.update({
        "title": payload.get("title") or mock["title"],
        "hook": payload.get("hook") or mock["hook"],
        "storyboard": payload.get("storyboard") or mock["storyboard"],
        "scenes": payload.get("scenes") or mock["scenes"],
        "voiceover_script": payload.get("voiceover_script") or mock["voiceover_script"],
        "caption": payload.get("caption") or mock["caption"],
        "hashtags": payload.get("hashtags") or mock["hashtags"],
        "shot_plan": payload.get("shot_plan") or mock["shot_plan"],
        "meta": {
            **(mock.get("meta") or {}),
            **(payload.get("meta") or {}),
            "provider_mode": "openai_strategy",
            "model": "gpt-4o-mini",
        },
    })
    return mock


def build_variant_angles(requested_count: int) -> List[str]:
    angles = CREATIVE_ANGLES[:]
    return angles[:requested_count]
