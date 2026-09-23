"""
backend/app/api/v1/ai/narration.py
─────────────────────────────────────────────────────────────────────────────
Narrative sequence generation, SFX, BGM, shorts, and midroll routes.
─────────────────────────────────────────────────────────────────────────────
"""

import json
import logging
from fastapi import APIRouter, Depends, HTTPException

from api.v1.ai._deps import get_user_gemini_key, run_md_skill
from api.dependencies.auth import get_current_user

from services.user.credit_service import get_available_credits, record_credit_transaction
from schemas.ai import (
    SFXAudioRequest,
    BGMVibeRequest,
    ShortsScriptRequest,
    SFXOverlayRequest,
    ShortsHookRequest,
    MidrollPlacementRequest,
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


@router.post("/skills/shorts-script", summary="Adapt storyboard script for YouTube Shorts/Reels")
async def get_shorts_script(body: ShortsScriptRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    try:
        summary = body.storyboard_summary.strip() if body.storyboard_summary else "Action webtoon storyline summary."
        logger.info(f"[Shorts Script Skill] Adapting script for short-form video...")
        return await run_md_skill("shorts_script_adapter", body.model, api_key=user_api_key,
                                  storyboard_summary=summary)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Shorts Script Skill Error]: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/skills/shorts-hook", summary="Generate viral retention hook for Shorts")
async def get_shorts_hook(body: ShortsHookRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    try:
        title = body.title.strip() if body.title else "Webtoon MC Story"
        event = body.key_event.strip() if body.key_event else "High stakes betrayal scene"
        logger.info(f"[Shorts Hook Skill] Generating hook for title='{title}'...")
        return await run_md_skill("shorts_retention_hook", body.model, api_key=user_api_key,
                                  title=title, key_event=event)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Shorts Hook Skill Error]: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/skills/midrolls", summary="Calculate optimal midroll ad break placements")
async def get_midrolls(body: MidrollPlacementRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    try:
        script = body.compiled_script.strip() if body.compiled_script else "00:00 - Story Intro"
        max_ads = body.max_ads if body.max_ads and body.max_ads > 0 else 3
        logger.info(f"[Midroll Placement Skill] Calculating ad slots (max={max_ads})...")
        return await run_md_skill("midroll_placement_ref", body.model, api_key=user_api_key,
                                  compiled_script=script, max_ads=max_ads)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Midroll Placement Skill Error]: {e}")
        raise HTTPException(status_code=500, detail=str(e))

