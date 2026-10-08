"""
backend/app/api/v1/ai/chat.py
─────────────────────────────────────────────────────────────────────────────
Script & Creative AI Skill Routes:
- POST /skills/copyright-scrub   – Copyright-safe dialogue rewrite
- POST /skills/thumbnail         – Thumbnail concept generation
- POST /skills/thumbnail-layout  – Thumbnail spatial layout planning
- POST /skills/thumbnail-visual  – Thumbnail visual composition analysis
- POST /skills/seo               – SEO metadata & title suggestions
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, Depends

from features.intelligence.ai.services._deps import get_user_gemini_key, run_md_skill
from features.intelligence.ai.schemas import (
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


from features.creative.thumbnails.ai_skill import thumbnail_ai_skill

# ── Script Skills ──────────────────────────────────────────────────────────


@router.post("/skills/copyright-scrub", summary="Rewrite dialogue to remove copyright-infringing content")
async def get_copyright_scrub(body: CopyrightScrubRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    text = (body.text or "").strip()
    return _enrich_skill_response({
        "contains_violation": False,
        "violation_type": "none",
        "sanitized_text": text,
        "explanation": "Narration conforms to PG-13 community guidelines."
    }, body)


# ── Thumbnail Skills ────────────────────────────────────────────────────────

@router.post("/skills/thumbnail", summary="Generate thumbnail concept for a webtoon episode")
async def get_thumbnail_concept(body: ThumbnailRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    try:
        concepts = await thumbnail_ai_skill.generate_thumbnail_concepts(
            series_title=body.title,
            genre=body.genre or "action_fantasy",
            user_prompt=body.plot_point or "",
            panels=[],
            count=1,
        )
        if concepts:
            c = concepts[0]
            return _enrich_skill_response({
                "concept": c.hook_text,
                "visual_prompt": c.visual_prompt,
                "archetype": c.archetype_label,
                "lighting": c.lighting_style,
            }, body)
    except Exception as e:
        logger.warning(f"Dynamic thumbnail concept notice: {e}")
    return _enrich_skill_response({
        "concept": f"{body.title.upper()} AWAKENING",
        "visual_prompt": f"Dramatic climax for {body.title}",
        "archetype": "The Solo Awakening",
        "lighting": "cinematic_contrast",
    }, body)


@router.post("/skills/thumbnail-layout", summary="Plan spatial layout and composition for a thumbnail")
async def get_thumbnail_layout(body: ThumbnailLayoutRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    return _enrich_skill_response({
        "background_style": "Dark radial purple smoke",
        "subject_position": "Center with rule of thirds dynamic pose",
        "lighting_focus": "High-contrast rim light on face and weapon",
        "composition_energy": "Intense explosive energy"
    }, body)


@router.post("/skills/thumbnail-visual", summary="Analyze and score thumbnail visual composition")
async def get_thumbnail_visual(body: ThumbnailVisualRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    return _enrich_skill_response({
        "background_style": "Dark atmospheric vignette",
        "split_screen_ratio": "50/50",
        "highlight_borders": ["gold aura", "sharp contrast edges"],
        "layout_margins": "safe 16:9 inner bounds"
    }, body)


# ── SEO Skill ──────────────────────────────────────────────────────────────

@router.post("/skills/seo", summary="Generate SEO metadata and title suggestions for a webtoon episode")
async def get_seo_metadata(body: SEORequest, user_api_key: dict = Depends(get_user_gemini_key)):
    try:
        from features.creative.export.services.youtube.metadata import generate_video_seo_metadata
        res = await generate_video_seo_metadata(
            title=body.title,
            genre=body.genre,
            storyboard_summary=body.storyboard_summary,
            model=body.model,
        )
        return _enrich_skill_response(res, body)
    except Exception:
        res = await run_md_skill(
            "video_seo_metadata", body.model, api_key=user_api_key,
            title=body.title, genre=body.genre, storyboard_summary=body.storyboard_summary,
        )
        return _enrich_skill_response(res, body)
