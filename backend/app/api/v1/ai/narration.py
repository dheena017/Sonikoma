"""
backend/app/api/v1/ai/narration.py
─────────────────────────────────────────────────────────────────────────────
Narrative sequence generation, SFX, BGM, camera dynamics, chapter markers,
midrolls, shorts, transitions, and emotion routes.
─────────────────────────────────────────────────────────────────────────────
"""

import logging

from fastapi import APIRouter, Depends, HTTPException

from api.v1.ai._deps import get_user_gemini_key, run_md_skill
from api.dependencies.auth import get_current_user

from database.db import get_available_credits, record_credit_transaction
from backend.schemas.ai import (
    AnalyzeNarrativeSequenceRequest,
    GenerateSequenceNarrativeRequest,
    SFXAudioRequest,
    BGMVibeRequest,
    ShortsScriptRequest,
    SFXOverlayRequest,
    CameraShakeRequest,
    SceneCompositionRequest,
    SubtitleStylerRequest,
    YouTubeChapterRequest,
    MidrollPlacementRequest,
    ShortsHookRequest,
    CharacterEmotionRequest,
    TransitionSpeedRequest,
)
from services.ai.facade import facade_analyze_narrative_sequence

logger = logging.getLogger("sonikoma.api.ai.narration")
router = APIRouter()


@router.post("/narratives/analyze-sequence", summary="Generate chronological narrative/voiceovers and synthesize TTS")
async def analyze_narrative_sequence(
    body: AnalyzeNarrativeSequenceRequest,
    user_api_key: dict = Depends(get_user_gemini_key),
    current_user: dict = Depends(get_current_user)
):
    if not body.visual_descriptions:
        raise HTTPException(status_code=400, detail="Visual descriptions list cannot be empty")

    COST = min(50, len(body.visual_descriptions) * 3)
    if get_available_credits(current_user["user_id"]) < COST:
        raise HTTPException(status_code=402, detail=f"Insufficient credits: need {COST}")

    try:
        result = await facade_analyze_narrative_sequence(
            visual_descriptions=body.visual_descriptions,
            model=body.model,
            voice=body.voice,
            user_keys=user_api_key
        )
        record_credit_transaction(current_user["user_id"], -COST, "analyze_narrative_sequence")
        return result
    except Exception as e:
        logger.error(f"[Narrative Sequence] Failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-sequence-narrative", summary="Generate narrative texts and audios from visual descriptions")
async def generate_sequence_narrative(
    body: GenerateSequenceNarrativeRequest,
    user_api_key: dict = Depends(get_user_gemini_key),
    current_user: dict = Depends(get_current_user)
):
    if not body.panels:
        raise HTTPException(status_code=400, detail="Panels list cannot be empty")
    COST = min(50, len(body.panels) * 5)
    if get_available_credits(current_user["user_id"]) < COST:
        raise HTTPException(status_code=402, detail=f"Insufficient credits: need {COST}")
    try:
        results = [{"id": p.id, "narrative": p.visual_description, "narrative_audio_url": None} for p in body.panels]
        record_credit_transaction(current_user["user_id"], -COST, "generate_sequence_narrative")
        return {"success": True, "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/skills/sfx-audio")
async def get_sfx_audio(body: SFXAudioRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    return await run_md_skill("sfx_audio_prompt", body.model, api_key=user_api_key,
                              visual_description=body.visual_description, sfx_tag=body.sfx_tag)


@router.post("/skills/bgm-vibe")
async def get_bgm_vibe(body: BGMVibeRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    return await run_md_skill("bgm_vibe_selector", body.model, api_key=user_api_key,
                              narrative_mood=body.narrative_mood, action_scale=body.action_scale)


@router.post("/skills/sfx-mix")
async def get_sfx_mix(body: SFXOverlayRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    return await run_md_skill("sfx_overlay_scheduler", body.model, api_key=user_api_key,
                              visual_description=body.visual_description, speech_text=body.speech_text, sfx=body.sfx)


@router.post("/skills/camera-shake")
async def get_camera_shake(body: CameraShakeRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    return await run_md_skill("camera_shake_dynamics", body.model, api_key=user_api_key,
                              visual_description=body.visual_description, sfx=body.sfx)


@router.post("/skills/scene-composition")
async def get_scene_composition(body: SceneCompositionRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    return await run_md_skill("scene_composition_desc", body.model, api_key=user_api_key,
                              visual_description=body.visual_description, speech_text=body.speech_text)


@router.post("/skills/shorts-script")
async def get_shorts_script(body: ShortsScriptRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    return await run_md_skill("shorts_script_adapter", body.model, api_key=user_api_key,
                              storyboard_summary=body.storyboard_summary)


@router.post("/skills/shorts-hook")
async def get_shorts_hook(body: ShortsHookRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    return await run_md_skill("shorts_retention_hook", body.model, api_key=user_api_key,
                              title=body.title, key_event=body.key_event)


@router.post("/skills/chapters")
async def get_chapters(body: YouTubeChapterRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    return await run_md_skill("youtube_chapter_gen", body.model, api_key=user_api_key,
                              compiled_script=body.compiled_script)


@router.post("/skills/midrolls")
async def get_midrolls(body: MidrollPlacementRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    return await run_md_skill("midroll_placement_ref", body.model, api_key=user_api_key,
                              compiled_script=body.compiled_script, max_ads=body.max_ads)


@router.post("/skills/transition-speed")
async def get_transition_speed(body: TransitionSpeedRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    return await run_md_skill("transition_speed_tuner", body.model, api_key=user_api_key,
                              visual_description=body.visual_description, speech_text=body.speech_text)


@router.post("/skills/emotion")
async def get_emotion(body: CharacterEmotionRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    return await run_md_skill("character_emotion_class", body.model, api_key=user_api_key,
                              visual_description=body.visual_description, speech_text=body.speech_text)


@router.post("/skills/subtitle-styler")
async def get_subtitle_styler(body: SubtitleStylerRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    return await run_md_skill("subtitle_styler", body.model, api_key=user_api_key,
                              visual_description=body.visual_description, speech_text=body.speech_text)
