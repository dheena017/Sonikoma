"""
backend/app/services/image/providers/pollinations.py
─────────────────────────────────────────────────────────────────────────────
100% Free, zero-API-key AI image generation provider using Pollinations.ai.
Supports Anime, Manhwa, and Comic styling with seed locking for character consistency.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import uuid
import urllib.parse
import logging
import httpx
from typing import Optional, Tuple

logger = logging.getLogger("sonikoma.services.image.pollinations")

_PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "..")
)
_MEDIA_DIR = os.path.join(_PROJECT_ROOT, "data", "media")


async def generate_pollinations_image(
    prompt: str,
    width: int = 768,
    height: int = 1024,
    seed: Optional[int] = None,
    negative_prompt: Optional[str] = None,
    style_preset: str = "anime",
) -> Tuple[str, str]:
    """
    Generates an image via Pollinations.ai, saves it locally in data/media/,
    and returns (public_media_url, absolute_local_path).
    """
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
    local_path = os.path.join(_MEDIA_DIR, filename)
    public_url = f"/media/{filename}"

    logger.info(f"[Pollinations AI] Requesting generation: {width}x{height}, style='{style_preset}'...")

    async with httpx.AsyncClient(timeout=45.0) as client:
        response = await client.get(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        if response.status_code != 200:
            raise RuntimeError(
                f"Pollinations AI generation failed with HTTP {response.status_code}: {response.text[:200]}"
            )
        
        with open(local_path, "wb") as f:
            f.write(response.content)

    logger.info(f"[Pollinations AI] Successfully saved image to {public_url} ({len(response.content)} bytes)")
    return public_url, local_path
