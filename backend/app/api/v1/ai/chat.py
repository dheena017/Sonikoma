"""
backend/app/api/v1/ai/chat.py
─────────────────────────────────────────────────────────────────────────────
Script dramatization, character bio, voice casting, copyright scrub routes.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, Depends

from api.v1.ai._deps import get_user_gemini_key, run_md_skill
from backend.schemas.ai import (
    DramatizeRequest,
    CharacterBioRequest,
    VoiceCastingRequest,
    CopyrightScrubRequest,
    CopyrightScrubBatchRequest,
    ThumbnailRequest,
    ThumbnailLayoutRequest,
    SeriesIntroHookRequest,
    TitleABRequest,
    ThumbnailVisualRequest,
    GenerateThumbnailRequest,
    SEORequest,
    NarrativePacingRequest,
)

logger = logging.getLogger("sonikoma.api.ai.chat")
router = APIRouter()


@router.post("/skills/dramatize")
async def dramatize_script(body: DramatizeRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    return await run_md_skill("script_dramatization", body.model, api_key=user_api_key,
                              raw_ocr_text=body.raw_ocr_text, genre=body.genre, scene_context=body.scene_context)


@router.post("/skills/character-bio")
async def get_character_bio(body: CharacterBioRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    return await run_md_skill("character_bio_profiler", body.model, api_key=user_api_key,
                              dialogue=body.dialogue)


@router.post("/skills/voice-cast")
async def get_voice_cast(body: VoiceCastingRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    return await run_md_skill("voice_casting", body.model, api_key=user_api_key,
                              character_name=body.character_name,
                              dialogue_sample=body.dialogue_sample,
                              visual_description=body.visual_description)


@router.post("/skills/copyright-scrub")
async def get_copyright_scrub(body: CopyrightScrubRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    return await run_md_skill("copyright_scrubber", body.model, api_key=user_api_key, text=body.text)


@router.post("/skills/copyright-scrub-batch")
async def get_copyright_scrub_batch(body: CopyrightScrubBatchRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    results = []
    for t in body.texts:
        res = await run_md_skill("copyright_scrubber", body.model, api_key=user_api_key, text=t)
        results.append({"text": t, "success": True, "data": res})
    return {"success": True, "results": results}


@router.post("/skills/thumbnail")
async def get_thumbnail_concept(body: ThumbnailRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    return await run_md_skill("thumbnail_concept", body.model, api_key=user_api_key,
                              title=body.title, genre=body.genre, plot_point=body.plot_point)


@router.post("/skills/thumbnail-layout")
async def get_thumbnail_layout(body: ThumbnailLayoutRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    return await run_md_skill("thumbnail_layout", body.model, api_key=user_api_key,
                              thumbnail_concept=body.thumbnail_concept, main_character=body.main_character)


@router.post("/skills/thumbnail-visual")
async def get_thumbnail_visual(body: ThumbnailVisualRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    return await run_md_skill("thumbnail_visual_comp", body.model, api_key=user_api_key,
                              thumbnail_concept=body.thumbnail_concept)


@router.post("/skills/generate-thumbnail")
async def generate_thumbnail_variation(body: GenerateThumbnailRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    return {"success": True, "url": "/api/image/cached/default"}


@router.post("/skills/intro-hook")
async def get_intro_hook(body: SeriesIntroHookRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    return await run_md_skill("series_intro_hook", body.model, api_key=user_api_key,
                              title=body.title, premise_summary=body.premise_summary, genre=body.genre)


@router.post("/skills/title-ab")
async def get_title_ab(body: TitleABRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    return await run_md_skill("title_ab_tester", body.model, api_key=user_api_key,
                              title=body.title, key_climax_event=body.key_climax_event)


@router.post("/skills/seo")
async def get_seo_metadata(body: SEORequest, user_api_key: dict = Depends(get_user_gemini_key)):
    return await run_md_skill("video_seo_metadata", body.model, api_key=user_api_key,
                              title=body.title, genre=body.genre, storyboard_summary=body.storyboard_summary)


@router.post("/skills/pacing")
async def get_pacing(body: NarrativePacingRequest, user_api_key: dict = Depends(get_user_gemini_key)):
    return await run_md_skill("narrative_pace_controller", body.model, api_key=user_api_key,
                              visual_description=body.visual_description,
                              speech_text=body.speech_text, sfx=body.sfx)
