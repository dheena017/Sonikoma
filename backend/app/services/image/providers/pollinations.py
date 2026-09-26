"""
backend/app/services/image/providers/pollinations.py
─────────────────────────────────────────────────────────────────────────────
100% Free, zero-API-key AI image generation provider using Pollinations.ai.
Supports Anime, Manhwa, and Comic styling with seed locking for character consistency,
automatic retry with exponential backoff, and local procedural cinematic canvas fallback.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import uuid
import asyncio
import urllib.parse
import logging
from typing import Optional, Tuple
import httpx
from PIL import Image, ImageDraw

logger = logging.getLogger("sonikoma.services.image.pollinations")

_PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "..")
)
_LOCAL_MEDIA_DIR = os.path.join(_PROJECT_ROOT, "data", "local_media")
_MEDIA_DIR = os.path.join(_PROJECT_ROOT, "data", "media")


def _generate_procedural_fallback_panel(
    prompt: str,
    width: int,
    height: int,
    style_preset: str,
    local_path: str,
) -> None:
    """Creates a stylized, high-contrast dark anime/webtoon storyboard panel as a fallback."""
    img = Image.new("RGB", (width, height), color=(14, 16, 24))
    draw = ImageDraw.Draw(img)

    # Gradient-like vertical fill
    for y in range(height):
        ratio = y / max(1, height)
        if style_preset == "anime":
            r = int(18 + ratio * 35)
            g = int(20 + ratio * 20)
            b = int(40 + ratio * 60)
        elif style_preset == "manhwa":
            r = int(24 + ratio * 45)
            g = int(16 + ratio * 20)
            b = int(32 + ratio * 50)
        else:  # comic / manga
            val = int(15 + ratio * 40)
            r, g, b = val, val, val
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    # Cinematic border
    border_color = (60, 70, 110) if style_preset == "anime" else (90, 50, 100)
    draw.rectangle([10, 10, width - 11, height - 11], outline=border_color, width=3)

    # Save as webp
    img.save(local_path, "WEBP", quality=85)


async def generate_pollinations_image(
    prompt: str,
    width: int = 768,
    height: int = 1024,
    seed: Optional[int] = None,
    negative_prompt: Optional[str] = None,
    style_preset: str = "anime",
) -> Tuple[str, str]:
    """
    Generates an image via Pollinations.ai, saves it locally in data/local_media/,
    and returns (public_media_url, absolute_local_path).
    Guarantees a valid, high-quality WebP image is always written to disk.
    """
    os.makedirs(_LOCAL_MEDIA_DIR, exist_ok=True)
    os.makedirs(_MEDIA_DIR, exist_ok=True)

    # Style augmentation
    enhanced_prompt = prompt.strip()
    if style_preset == "manhwa" and "manhwa" not in enhanced_prompt.lower():
        enhanced_prompt = f"korean webtoon manhwa style, high contrast, vibrant colors, detailed line art, {enhanced_prompt}"
    elif style_preset == "anime" and "anime" not in enhanced_prompt.lower():
        enhanced_prompt = f"modern high quality anime style, cinematic lighting, sharp focus, {enhanced_prompt}"
    elif style_preset in ("comic", "manga") and "comic" not in enhanced_prompt.lower():
        enhanced_prompt = f"manga graphic novel illustration, detailed inks, dynamic framing, {enhanced_prompt}"

    encoded_prompt = urllib.parse.quote(enhanced_prompt)
    url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&nologo=true"
    if seed is not None:
        url += f"&seed={seed}"

    filename = f"gen_panel_{uuid.uuid4().hex[:10]}.webp"
    local_path = os.path.join(_LOCAL_MEDIA_DIR, filename)
    backup_path = os.path.join(_MEDIA_DIR, filename)
    public_url = f"/media/{filename}"

    logger.info(f"[Pollinations AI] Requesting generation: {width}x{height}, style='{style_preset}'...")

    # Retry loop with exponential backoff
    max_retries = 4
    content = None
    for attempt in range(1, max_retries + 1):
        status_code = None
        try:
            async with httpx.AsyncClient(timeout=40.0) as client:
                response = await client.get(
                    url,
                    headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
                )
                status_code = response.status_code
                if status_code == 200 and len(response.content) > 1000:
                    content = response.content
                    break
                else:
                    logger.warning(
                        f"[Pollinations AI] Attempt {attempt} returned HTTP {status_code}. Retrying..."
                    )
        except Exception as req_err:
            logger.warning(f"[Pollinations AI] Attempt {attempt} request error: {req_err}")

        if attempt < max_retries:
            delay = 3.0 if status_code == 429 else (1.5 * attempt)
            await asyncio.sleep(delay)

    if content:
        with open(local_path, "wb") as f:
            f.write(content)
        try:
            with open(backup_path, "wb") as f:
                f.write(content)
        except Exception:
            pass
        logger.info(f"[Pollinations AI] Successfully saved image to {public_url} ({len(content)} bytes)")
    else:
        logger.warning(
            f"[Pollinations AI] Network generation failed after {max_retries} attempts. Generating procedural canvas panel."
        )
        _generate_procedural_fallback_panel(prompt, width, height, style_preset, local_path)
        try:
            _generate_procedural_fallback_panel(prompt, width, height, style_preset, backup_path)
        except Exception:
            pass

    return public_url, local_path
