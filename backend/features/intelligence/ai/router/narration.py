"""
backend/app/api/v1/ai/narration.py
─────────────────────────────────────────────────────────────────────────────
AI Narration & Audio Script Routes:
- POST /skills/sfx-audio      – Generate SFX prompt for a panel or batch
- POST /skills/bgm-vibe       – Recommend background music vibe
- POST /skills/sfx-mix        – Schedule SFX overlays across scene
- POST /skills/series-arc     – Architect series arc (manhwa, comic, anime)
- POST /skills/series-arc/manhwa – Korean Webtoon Manhwa arc
- POST /skills/series-arc/comic  – Japanese Manga & Graphic Comic arc
- POST /skills/series-arc/anime  – Cinematic Sakuga Anime arc
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, Depends, HTTPException

from features.intelligence.ai.services._deps import get_user_gemini_key, run_md_skill
from features.intelligence.ai.schemas import (
    SFXAudioRequest,
    BGMVibeRequest,
    SFXOverlayRequest,
    SeriesArcRequest,
)

logger = logging.getLogger("sonikoma.api.ai.narration")
router = APIRouter()


@router.post("/skills/sfx-audio", summary="Generate SFX audio prompt")
async def get_sfx_audio(body: SFXAudioRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    try:
        # 1. Batch panels workflow
        if body.panels and len(body.panels) > 0:
            logger.info(f"[SFX Audio Skill] Mapping SFX for {len(body.panels)} panels...")
            results = []
            default_tags = ["[Impact]", "[Whoosh]", "[Rumble]", "[Clang]", "[Wind Echo]", "[Action Boom]"]
            for idx, p in enumerate(body.panels):
                desc = (p.visual_description or f"Panel {idx + 1} scene").strip()
                sfx_suggestion = default_tags[idx % len(default_tags)]
                try:
                    res = await run_md_skill("sfx_audio_prompt", body.model, api_key=user_api_key,
                                             visual_description=desc, sfx_tag=p.sfx or sfx_suggestion)
                    if isinstance(res, dict) and "sfx" in res:
                        sfx_suggestion = res["sfx"]
                    elif isinstance(res, dict) and "prompt" in res:
                        sfx_suggestion = f"[{res['prompt'][:30]}]"
                except Exception as skill_err:
                    pass

                results.append({
                    "id": p.id,
                    "sfx": sfx_suggestion,
                    "visual_description": desc
                })
            return {"success": True, "panels": results}

        # 2. Single panel request workflow
        desc = body.visual_description.strip() if body.visual_description else "Action panel visual"
        sfx = body.sfx_tag.strip() if body.sfx_tag else "[Action SFX]"
        logger.info(f"[SFX Audio Skill] Generating prompt for sfx_tag='{sfx}'...")
        res = await run_md_skill("sfx_audio_prompt", body.model, api_key=user_api_key,
                                 visual_description=desc, sfx_tag=sfx)
        return {"success": True, "result": res}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[SFX Audio Skill Error]: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/skills/bgm-vibe", summary="Recommend background music vibe")
async def get_bgm_vibe(body: BGMVibeRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    try:
        mood = body.narrative_mood.strip() if body.narrative_mood else "tense action"
        scale = body.action_scale.strip() if body.action_scale else "high"
        logger.info(f"[BGM Vibe Skill] Recommending music for mood='{mood}', scale='{scale}'...")
        return await run_md_skill("bgm_vibe_selector", body.model, api_key=user_api_key,
                                  narrative_mood=mood, action_scale=scale)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[BGM Vibe Skill Error]: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/skills/sfx-mix", summary="Schedule SFX overlays across scene")
async def get_sfx_mix(body: SFXOverlayRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    try:
        desc = body.visual_description.strip() if body.visual_description else "Dramatic comic panel"
        speech = body.speech_text.strip() if body.speech_text else ""
        sfx = body.sfx.strip() if body.sfx else "[Impact]"
        logger.info(f"[SFX Mix Skill] Scheduling audio overlay...")
        return await run_md_skill("sfx_overlay_scheduler", body.model, api_key=user_api_key,
                                  visual_description=desc, speech_text=speech, sfx=sfx)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[SFX Mix Skill Error]: {e}")
        raise HTTPException(status_code=500, detail=str(e))




# ── AI Series Arc Director Skills (Manhwa, Comic/Manga, Anime) ────────────────

@router.post("/skills/series-arc", summary="Architect series arc using selected format skill (manhwa, comic_manga, anime)")
async def direct_series_arc(body: SeriesArcRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    fmt = (body.format_type or "manhwa").lower()
    if fmt in ("anime", "anime_sakuga"):
        skill_name = "series_arc_anime"
    elif fmt in ("comic_manga", "comic", "manga"):
        skill_name = "series_arc_comic"
    else:
        skill_name = "series_arc_manhwa"

    logger.info(f"[Series Arc Skill] Invoking skill '{skill_name}' for title='{body.title}' (format='{fmt}')...")
    return await run_md_skill(
        skill_name,
        body.model,
        api_key=user_api_key,
        title=body.title,
        logline=body.logline or "",
        genre=body.genre or "action_fantasy",
        art_style=body.art_style or "default",
        total_sessions=body.total_sessions or 1,
        chapters_per_session=body.chapters_per_session or 5,
        panels_per_chapter=body.panels_per_chapter or 8,
        pacing=body.pacing or "dynamic",
        dialogue_density=body.dialogue_density or "balanced",
    )


@router.post("/skills/series-arc/manhwa", summary="Architect authentic Korean Webtoon Manhwa vertical-scroll series")
async def direct_series_arc_manhwa(body: SeriesArcRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    logger.info(f"[Series Arc Manhwa Skill] Invoking 'series_arc_manhwa' for title='{body.title}'...")
    return await run_md_skill(
        "series_arc_manhwa",
        body.model,
        api_key=user_api_key,
        title=body.title,
        logline=body.logline or "",
        genre=body.genre or "action_fantasy",
        art_style=body.art_style or "manhwa_action_hunter",
        total_sessions=body.total_sessions or 1,
        chapters_per_session=body.chapters_per_session or 5,
        panels_per_chapter=body.panels_per_chapter or 8,
        pacing=body.pacing or "dynamic",
        dialogue_density=body.dialogue_density or "balanced",
    )


@router.post("/skills/series-arc/comic", summary="Architect authentic Japanese Manga & Graphic Comic series")
async def direct_series_arc_comic(body: SeriesArcRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    logger.info(f"[Series Arc Comic Skill] Invoking 'series_arc_comic' for title='{body.title}'...")
    return await run_md_skill(
        "series_arc_comic",
        body.model,
        api_key=user_api_key,
        title=body.title,
        logline=body.logline or "",
        genre=body.genre or "action_fantasy",
        art_style=body.art_style or "manga_shonen_jump",
        total_sessions=body.total_sessions or 1,
        chapters_per_session=body.chapters_per_session or 5,
        panels_per_chapter=body.panels_per_chapter or 8,
        pacing=body.pacing or "dynamic",
        dialogue_density=body.dialogue_density or "balanced",
    )


@router.post("/skills/series-arc/anime", summary="Architect authentic Cinematic 24fps Sakuga Anime series")
async def direct_series_arc_anime(body: SeriesArcRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    logger.info(f"[Series Arc Anime Skill] Invoking 'series_arc_anime' for title='{body.title}'...")
    return await run_md_skill(
        "series_arc_anime",
        body.model,
        api_key=user_api_key,
        title=body.title,
        logline=body.logline or "",
        genre=body.genre or "action_fantasy",
        art_style=body.art_style or "anime_ufotable_cinematic",
        total_sessions=body.total_sessions or 1,
        chapters_per_session=body.chapters_per_session or 5,
        panels_per_chapter=body.panels_per_chapter or 8,
        pacing=body.pacing or "dynamic",
        dialogue_density=body.dialogue_density or "balanced",
    )


