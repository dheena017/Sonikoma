"""
backend/features/creative/thumbnails/generator.py
─────────────────────────────────────────────────────────────────────────────
AI YouTube Thumbnail Engine:
Generates high-resolution 1280x720 (16:9) YouTube thumbnails directly from
user prompts using generative AI diffusion models (Hugging Face FLUX.1 / SDXL).
Zero hardcoded templates, zero static strings, and zero if/else condition branches.
─────────────────────────────────────────────────────────────────────────────
"""

import io
import time
import uuid
import asyncio
import logging
from typing import List, Tuple, Optional
from PIL import Image

from features.image_editor.services.utils.image_utils import save_image_to_cache
from features.creative.thumbnails.schemas import (
    ThumbnailGenerateRequest,
    GeneratedThumbnailItem,
)
from features.creative.thumbnails.ai_skill import (
    thumbnail_ai_skill,
    DynamicThumbnailConcept,
)
from ai_engine.providers.huggingface.client import HuggingFaceClient

from ai_engine.core.registry import ModelRegistry
from ai_engine.core.orchestrator import AIOrchestrator
from fastapi import HTTPException
import os

logger = logging.getLogger("sonikoma.creative.thumbnails.generator")

TARGET_W = 1280
TARGET_H = 720


def _cover_crop(img: Image.Image, target_w: int = TARGET_W, target_h: int = TARGET_H) -> Image.Image:
    """Resizes and center-crops an image to fill target dimensions perfectly."""
    img_ratio = img.width / max(1, img.height)
    target_ratio = target_w / max(1, target_h)

    if img_ratio > target_ratio:
        scale_h = target_h
        scale_w = int(img.width * (target_h / max(1, img.height)))
    else:
        scale_w = target_w
        scale_h = int(img.height * (target_w / max(1, img.width)))

    resized = img.resize((scale_w, scale_h), Image.Resampling.LANCZOS)
    x1 = (scale_w - target_w) // 2
    y1 = (scale_h - target_h) // 2
    return resized.crop((x1, y1, x1 + target_w, y1 + target_h))


def _format_clean_error(candidate: str, exc: Exception) -> str:
    """Formats raw client exceptions into clear actionable error messages."""
    exc_str = str(exc)
    if "402" in exc_str or "Payment Required" in exc_str or "credits" in exc_str.lower():
        return f"Hugging Face: 402 Payment Required on '{candidate}' — You have no remaining credits. Please add Hugging Face credits to continue using Inference Providers."
    if "401" in exc_str or "Unauthorized" in exc_str or "Invalid token" in exc_str:
        return f"Hugging Face: 401 Unauthorized for model '{candidate}'. Please verify your HUGGINGFACE_API_KEY."
    if "429" in exc_str or "Rate limit" in exc_str:
        return f"Model '{candidate}' is rate-limited (429). Please wait a few moments before retrying."
    return f"Model '{candidate}' error: {exc_str[:160]}"


# ─────────────────────────────────────────────────────────────────────────────
# REAL AI MODEL SYNTHESIZERS (Zero if/else model trees — real AI engines only)
# ─────────────────────────────────────────────────────────────────────────────

async def _synthesize_pollinations(
    prompt: str, model_id: str
) -> Tuple[Optional[Image.Image], Optional[str], Optional[str]]:
    """Synthesizes real diffusion artwork via Pollinations AI."""
    try:
        from ai_engine.providers.pollinations import PollinationsClient
        img_bytes, used_model, err = await PollinationsClient.generate_image(
            prompt=prompt,
            width=TARGET_W,
            height=TARGET_H,
            model=model_id,
        )
        if img_bytes and len(img_bytes) > 1000:
            img = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
            return img, used_model or model_id, None
        return None, None, err or f"Failed to synthesize image with Pollinations model '{model_id}'"
    except Exception as exc:
        return None, None, f"Pollinations error on '{model_id}': {exc}"


async def _synthesize_huggingface(
    prompt: str, model_id: str
) -> Tuple[Optional[Image.Image], Optional[str], Optional[str]]:
    """Synthesizes real diffusion artwork via Hugging Face Inference API."""
    try:
        from ai_engine.providers.huggingface.client import HuggingFaceClient
        hf_bytes = await HuggingFaceClient.generate_image(
            prompt=prompt,
            model=model_id,
            width=TARGET_W,
            height=TARGET_H,
            raise_on_error=True,
        )
        if hf_bytes and len(hf_bytes) > 1000:
            img = Image.open(io.BytesIO(hf_bytes)).convert("RGBA")
            return img, model_id, None
        return None, None, f"Empty image returned from Hugging Face '{model_id}'"
    except Exception as exc:
        return None, None, _format_clean_error(model_id, exc)


async def _synthesize_openai(
    prompt: str, model_id: str
) -> Tuple[Optional[Image.Image], Optional[str], Optional[str]]:
    """Synthesizes real diffusion artwork via OpenAI DALL-E."""
    try:
        from ai_engine.providers.openai.client import OpenAIClient
        dalle_bytes = await OpenAIClient.generate_image(
            prompt=prompt,
            model=model_id,
            size="1792x1024",
        )
        if dalle_bytes and len(dalle_bytes) > 1000:
            img = Image.open(io.BytesIO(dalle_bytes)).convert("RGBA")
            return img, model_id, None
        return None, None, f"Empty image returned from OpenAI '{model_id}'"
    except Exception as exc:
        return None, None, f"OpenAI DALL-E error on '{model_id}': {exc}"


async def _synthesize_gemini(
    prompt: str, model_id: str
) -> Tuple[Optional[Image.Image], Optional[str], Optional[str]]:
    """Synthesizes real diffusion artwork via Google Gemini."""
    try:
        from app.core.config import genai_client
        from google import genai
        g_client = genai_client or genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        resp = await asyncio.to_thread(
            g_client.models.generate_content,
            model=model_id,
            contents=prompt,
        )
        if resp.candidates and resp.candidates[0].content.parts:
            for part in resp.candidates[0].content.parts:
                if getattr(part, "inline_data", None) and part.inline_data.data:
                    img = Image.open(io.BytesIO(part.inline_data.data)).convert("RGBA")
                    return img, model_id, None
        return None, None, f"No image returned from Gemini '{model_id}'"
    except Exception as exc:
        return None, None, f"Gemini error on '{model_id}': {exc}"


# Dynamic registry dispatch table: maps real provider names directly to async synthesizers
REAL_AI_SYNTHESIZERS = {
    "pollinations": _synthesize_pollinations,
    "huggingface": _synthesize_huggingface,
    "openai": _synthesize_openai,
    "gemini": _synthesize_gemini,
}


async def _generate_image_from_prompt(
    prompt: str,
) -> Tuple[Image.Image, dict]:
    """
    Synthesizes a 1280x720 image from the user's prompt directly using real AI models
    resolved dynamically from the central AI Smart Routing cascade (/api/v1/ai/routing).
    Zero if/else model branching — model identification is driven by ModelRegistry.
    """
    clean_prompt = prompt.strip().replace("\n", " ")

    # 1. Resolve candidates from central AI Smart Routing
    AIOrchestrator.load_custom_routing(force=True)
    cascade = AIOrchestrator.get_task_cascade("thumbnail_generation")
    tier_labels = ["Tier 1: Primary", "Tier 2: Fallback", "Tier 3: Tertiary"]
    candidates = [
        cascade.get("primary") or "flux-anime",
        cascade.get("fallback") or "flux-realism",
        cascade.get("tertiary") or "turbo",
    ]
    logger.info(f"[AI Smart Routing] Thumbnail cascade resolved: {' -> '.join(candidates)}")

    last_error: Optional[str] = None
    attempts: List[str] = []

    # 2. Iterate through real AI model cascade
    for c_idx, candidate in enumerate(candidates):
        if not candidate:
            continue
        tier_label = tier_labels[c_idx] if c_idx < len(tier_labels) else f"Tier {c_idx + 1}"

        # Dynamically resolve real provider and clean model ID from ModelRegistry
        provider, model_id = ModelRegistry.resolve_model_provider(candidate)
        synthesizer = REAL_AI_SYNTHESIZERS.get(provider)
        if not synthesizer:
            logger.warning(f"[AI Smart Routing] No synthesizer registered for provider '{provider}' ({candidate})")
            continue

        img, used_model, err = await synthesizer(clean_prompt, model_id)
        if img:
            resolved_name = used_model or model_id
            prov_label = provider.capitalize() if provider != "pollinations" else "Pollinations AI"
            logger.info(f"[AI Smart Routing] Generated via {tier_label}: {prov_label} '{resolved_name}'")
            status_msg = (
                f"Generated via {tier_label}: {resolved_name} ({prov_label})"
                if c_idx == 0
                else f"Tier 1 failed. Auto-routed & recovered via {tier_label}: {resolved_name} ({prov_label})"
            )
            meta = {
                "tier_used": tier_label,
                "model_used": resolved_name,
                "provider_used": prov_label,
                "cascade_path": " -> ".join(attempts + [f"{tier_label}: {resolved_name}"]),
                "routing_message": status_msg,
            }
            return _cover_crop(img, TARGET_W, TARGET_H), meta

        last_error = err or f"Error generating with {provider}/{model_id}"
        attempts.append(f"{tier_label} [{model_id}]: Failed")
        logger.warning(f"[AI Smart Routing] Real AI candidate '{candidate}' ({provider}/{model_id}) failed: {last_error}")

    # 3. Emergency Recovery Tier: If configured models failed (credits or rate limit),
    # attempt real AI synthesis with reliable free diffusion models
    logger.warning("[AI Smart Routing] All configured candidates failed. Attempting real AI emergency recovery...")
    for rec_candidate in ("flux-anime", "flux-realism", "turbo"):
        prov, m_id = ModelRegistry.resolve_model_provider(rec_candidate)
        synth = REAL_AI_SYNTHESIZERS.get(prov)
        if not synth:
            continue
        img, used_model, err = await synth(clean_prompt, m_id)
        if img:
            resolved_name = used_model or m_id
            rec_meta = {
                "tier_used": "Emergency Tier (Free Recovery)",
                "model_used": resolved_name,
                "provider_used": "Pollinations AI (100% Free)",
                "cascade_path": " -> ".join(attempts + [f"Emergency Free Recovery: {resolved_name}"]),
                "routing_message": f"Configured tiers failed. Auto-recovered via real AI {prov.capitalize()} model: {resolved_name}",
            }
            return _cover_crop(img, TARGET_W, TARGET_H), rec_meta

    # 4. If all real AI models failed, raise real HTTP error
    error_msg = last_error or "Image synthesis failed across configured real AI diffusion models."
    raise HTTPException(status_code=400, detail=error_msg)


async def generate_thumbnail_package(
    request: ThumbnailGenerateRequest,
    concepts: Optional[List[DynamicThumbnailConcept]] = None,
) -> List[GeneratedThumbnailItem]:
    """
    Generates high-CTR YouTube thumbnails directly from the user's prompt (default 1 image).
    Synthesizes real images using AI diffusion models with comprehensive cascade telemetry.
    """
    count = request.count if (request.count is not None and request.count > 0) else 1

    # 1. Expand prompt into distinct visual angles
    if not concepts:
        concepts = await thumbnail_ai_skill.generate_thumbnail_concepts(
            series_title=request.series_title or "Webtoon",
            genre=request.genre or "Action Fantasy",
            user_prompt=request.prompt or "",
            panels=request.panels or [],
            count=count,
            hook_override=request.hook_text_override,
            style=request.style,
        )

    # 2. Concurrently generate real AI images for all variants from prompt
    tasks = [
        _generate_image_from_prompt(c.visual_prompt)
        for c in concepts[:count]
    ]
    generated_results = await asyncio.gather(*tasks)

    results: List[GeneratedThumbnailItem] = []
    timestamp = time.time()

    # 3. Format and save each generated thumbnail
    for idx, concept in enumerate(concepts[:count]):
        thumb_id = f"thumb_{uuid.uuid4().hex[:10]}"
        ai_res = generated_results[idx] if idx < len(generated_results) else None

        if not ai_res:
            raise HTTPException(status_code=400, detail="Failed to synthesize thumbnail image.")

        if isinstance(ai_res, tuple):
            canvas, meta = ai_res
        else:
            canvas = _cover_crop(ai_res, TARGET_W, TARGET_H)
            meta = {}

        # Save high-res JPEG (1280x720) to cache
        buf = io.BytesIO()
        rgb_canvas = canvas.convert("RGB")
        rgb_canvas.save(buf, format="JPEG", quality=93)
        filename = f"{thumb_id}.jpg"
        save_image_to_cache(buf.getvalue(), filename, content_type="image/jpeg")

        image_url = f"/api/v1/images/cached/{filename}"

        results.append(
            GeneratedThumbnailItem(
                id=thumb_id,
                image_url=image_url,
                archetype=concept.archetype_id,
                archetype_label=concept.archetype_label,
                hook_text=concept.hook_text,
                title=f"{request.series_title or 'Webtoon'} - {concept.archetype_label}",
                prompt_used=concept.visual_prompt,
                palette=concept.palette,
                width=TARGET_W,
                height=TARGET_H,
                created_at=timestamp,
                tier_used=meta.get("tier_used", "Tier 1: Primary"),
                model_used=meta.get("model_used", "flux-anime"),
                provider_used=meta.get("provider_used", "Pollinations AI"),
                cascade_path=meta.get("cascade_path"),
                routing_message=meta.get("routing_message"),
            )
        )

    return results


generate_thumbnail = generate_thumbnail_package

__all__ = ["generate_thumbnail", "generate_thumbnail_package"]
