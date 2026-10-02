"""
backend/app/api/v1/ai/chat.py
─────────────────────────────────────────────────────────────────────────────
Script & Creative AI Skill Routes:
- POST /skills/dramatize         – Script dramatization from raw OCR text
- POST /skills/voice-cast        – Character voice casting suggestions
- POST /skills/copyright-scrub   – Copyright-safe dialogue rewrite
- POST /skills/thumbnail         – Thumbnail concept generation
- POST /skills/thumbnail-layout  – Thumbnail spatial layout planning
- POST /skills/thumbnail-visual  – Thumbnail visual composition analysis
- POST /skills/seo               – SEO metadata & title suggestions
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, Depends

from app.api.v1.ai._deps import get_user_gemini_key, run_md_skill
from app.schemas.ai import (
    DramatizeRequest,
    VoiceCastingRequest,
    CopyrightScrubRequest,
    ThumbnailRequest,
    ThumbnailLayoutRequest,
    ThumbnailVisualRequest,
    SEORequest,
)

logger = logging.getLogger("sonikoma.api.ai.chat")
router = APIRouter()


def _enrich_skill_response(res: dict, body) -> dict:
    """Attach job_id / project_id to skill response if provided in body."""
    if isinstance(res, dict):
        if getattr(body, "job_id", None) and "job_id" not in res:
            res["job_id"] = body.job_id
        if getattr(body, "project_id", None) and "project_id" not in res:
            res["project_id"] = body.project_id
    return res


# ── Script Skills ──────────────────────────────────────────────────────────

@router.post("/skills/dramatize", summary="Dramatize script from raw OCR panel text")
async def dramatize_script(body: DramatizeRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    res = await run_md_skill(
        "script_dramatization", body.model, api_key=user_api_key,
        raw_ocr_text=body.raw_ocr_text, genre=body.genre, scene_context=body.scene_context,
    )
    return _enrich_skill_response(res, body)


@router.post("/skills/voice-cast", summary="Suggest voice cast for a character based on dialogue & appearance")
async def get_voice_cast(body: VoiceCastingRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    res = await run_md_skill(
        "voice_casting", body.model, api_key=user_api_key,
        character_name=body.character_name,
        dialogue_sample=body.dialogue_sample,
        visual_description=body.visual_description,
    )
    return _enrich_skill_response(res, body)


@router.post("/skills/copyright-scrub", summary="Rewrite dialogue to remove copyright-infringing content")
async def get_copyright_scrub(body: CopyrightScrubRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    res = await run_md_skill("copyright_scrubber", body.model, api_key=user_api_key, text=body.text)
    return _enrich_skill_response(res, body)


# ── Thumbnail Skills ────────────────────────────────────────────────────────

@router.post("/skills/thumbnail", summary="Generate thumbnail concept for a webtoon episode")
async def get_thumbnail_concept(body: ThumbnailRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    res = await run_md_skill(
        "thumbnail_concept", body.model, api_key=user_api_key,
        title=body.title, genre=body.genre, plot_point=body.plot_point,
    )
    return _enrich_skill_response(res, body)


@router.post("/skills/thumbnail-layout", summary="Plan spatial layout and composition for a thumbnail")
async def get_thumbnail_layout(body: ThumbnailLayoutRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    res = await run_md_skill(
        "thumbnail_layout", body.model, api_key=user_api_key,
        thumbnail_concept=body.thumbnail_concept, main_character=body.main_character,
    )
    return _enrich_skill_response(res, body)


@router.post("/skills/thumbnail-visual", summary="Analyze and score thumbnail visual composition")
async def get_thumbnail_visual(body: ThumbnailVisualRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    res = await run_md_skill(
        "thumbnail_visual_comp", body.model, api_key=user_api_key,
        thumbnail_concept=body.thumbnail_concept,
    )
    return _enrich_skill_response(res, body)


# ── SEO Skill ──────────────────────────────────────────────────────────────

@router.post("/skills/seo", summary="Generate SEO metadata and title suggestions for a webtoon episode")
async def get_seo_metadata(body: SEORequest, user_api_key: dict = Depends(get_user_gemini_key)):
    res = await run_md_skill(
        "video_seo_metadata", body.model, api_key=user_api_key,
        title=body.title, genre=body.genre, storyboard_summary=body.storyboard_summary,
    )
    return _enrich_skill_response(res, body)
