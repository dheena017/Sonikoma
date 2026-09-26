"""
backend/app/services/series/series_orchestrator.py
─────────────────────────────────────────────────────────────────────────────
Progressive Multi-Chapter Series Generation Orchestrator:
Prioritizes Chapter 1 for instant viewing, while background workers stream
Chapters 2 to 25 with real-time multi-stage loading updates.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import uuid
import json
import asyncio
import logging
from typing import Dict, Any, List, Optional

from schemas.series import CreateSeriesRequest, CharacterDNA
from repositories.project.series import (
    create_series,
    add_chapter_to_series,
    update_chapter_progress,
    update_chapter_media,
    get_series,
    get_chapters_for_series,
)
from repositories.project.panels import insert_panels
from services.image.providers.pollinations import generate_pollinations_image
from services.video.video_compiler import compile_video_from_panels
from app.core.config import call_gemini_with_retry, genai_client, ai_initialized
try:
    from google.genai import types
except Exception:
    types = None

logger = logging.getLogger("sonikoma.services.series.orchestrator")


async def generate_series_arc(
    title: str,
    synopsis: str,
    genre: str,
    medium_type: str,
    total_chapters: int,
    character_cast: Optional[List[CharacterDNA]] = None,
    pacing: str = "standard",
) -> Dict[str, Any]:
    """Calls Gemini to write a cohesive seasonal arc across all chapters."""
    panel_density_map = {"quick": 8, "standard": 14, "epic": 20}
    panels_per_ch = panel_density_map.get(pacing, 14)

    prompt = f"""
    Create a complete, uncompromised {total_chapters}-chapter story arc for a new {medium_type.upper()} series.
    Title: "{title}"
    Genre: {genre}
    Synopsis: "{synopsis}"
    Total Chapters: {total_chapters}
    Panels per chapter: ~{panels_per_ch}

    Format strictly as valid JSON adhering to this structure:
    {{
      "series_title": "{title}",
      "logline": "1-sentence hook",
      "genre": "{genre}",
      "character_cast": [
        {{
          "id": "char_hero",
          "name": "Protagonist",
          "role": "protagonist",
          "visual_prompt": "messy black hair, silver eyes, dark coat, solo leveling style",
          "voice_tone": "confident, youthful"
        }}
      ],
      "chapters": [
        {{
          "chapter_number": 1,
          "title": "Chapter 1: The Awakening",
          "synopsis": "Plot summary for chapter 1",
          "cliffhanger": "Ending hook for chapter 1",
          "panel_outlines": [
            {{
              "panel_index": 1,
              "visual_prompt": "Action visual description of panel 1",
              "speech_text": "Character dialogue or speech",
              "narrative": "Narrative voiceover text",
              "motion_type": "zoom_in"
            }}
          ]
        }}
      ]
    }}
    Ensure all {total_chapters} chapters are generated with a beginning, rising conflict, climax, and conclusive story ending.
    """

    if ai_initialized and genai_client:
        try:
            config_args = {"response_mime_type": "application/json"}
            if types and hasattr(types, "ThinkingConfig"):
                config_args["thinking_config"] = types.ThinkingConfig(thinking_budget=0)
            config = types.GenerateContentConfig(**config_args) if types else None

            response = await call_gemini_with_retry(
                lambda: genai_client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=[prompt],
                    config=config,
                )
            )
            raw_text = response.text.strip()
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
            return json.loads(raw_text.strip())
        except Exception as e:
            logger.warning(f"[Series Orchestrator] Gemini story generation failed: {e}. Using intelligent fallback arc.")

    # Intelligent fallback story arc if API key is absent or fails
    fallback_cast = [
        {
            "id": "char_hero",
            "name": "Ash",
            "role": "protagonist",
            "visual_prompt": "young warrior with dark hair, glowing violet runes on arm, sharp resolute gaze",
            "voice_tone": "determined"
        }
    ]
    fallback_chapters = []
    for ch_idx in range(1, total_chapters + 1):
        if ch_idx == 1:
            ch_title = "The Awakening"
            syn = f"The inciting incident where the protagonist awakens a hidden legacy in {title}."
            cliff = "A dark shadow appears on the horizon."
        elif ch_idx == total_chapters:
            ch_title = "The Final Convergence"
            syn = f"The ultimate climax and final battle of {title}, resolving all conflict."
            cliff = "Peace returns as a new era begins."
        elif ch_idx <= total_chapters // 2:
            ch_title = f"Trials of Ascent (Part {ch_idx})"
            syn = f"Overcoming dangerous obstacles and gathering allies in {title}."
            cliff = "An unexpected betrayal shakes the team."
        else:
            ch_title = f"The Gathering Storm (Part {ch_idx})"
            syn = f"Preparing for the unavoidable confrontation in {title}."
            cliff = "The enemy forces launch an overwhelming assault."

        panels = []
        for p_idx in range(1, panels_per_ch + 1):
            panels.append({
                "panel_index": p_idx,
                "visual_prompt": f"Dramatic {medium_type} scene, panel {p_idx} of {ch_title}, vibrant lighting",
                "speech_text": "We cannot back down now!" if p_idx % 2 == 1 else "Prepare for impact!",
                "narrative": f"Moment {p_idx} unfolds in the heart of the battlefield.",
                "motion_type": "zoom_in" if p_idx % 2 == 1 else "pan_down"
            })

        fallback_chapters.append({
            "chapter_number": ch_idx,
            "title": f"Chapter {ch_idx}: {ch_title}",
            "synopsis": syn,
            "cliffhanger": cliff,
            "panel_outlines": panels
        })

    return {
        "series_title": title,
        "logline": synopsis[:120],
        "genre": genre,
        "character_cast": fallback_cast,
        "chapters": fallback_chapters
    }


async def process_single_chapter(
    series_id: str,
    chapter_id: str,
    chapter_data: Dict[str, Any],
    medium_type: str,
    voice_language: str,
    image_model: str,
    is_priority: bool = False,
) -> None:
    """Processes panels, artwork, audio, and compiles a single chapter session."""
    ch_num = chapter_data.get("chapter_number", 1)
    ch_title = chapter_data.get("title", f"Chapter {ch_num}")
    panels_outlines = chapter_data.get("panel_outlines", [])

    logger.info(f"[Series Orchestrator] Starting processing Chapter {ch_num} ({ch_title}) [Priority: {is_priority}]")
    update_chapter_progress(chapter_id, 15.0, "Scripting complete. Generating panel artwork...", "generating_art")

    generated_panels = []
    total_p = len(panels_outlines)
    aspect_w, aspect_h = (1024, 576) if medium_type == "anime" else (768, 1024)

    for idx, p_out in enumerate(panels_outlines):
        prompt = p_out.get("visual_prompt", f"Anime scene panel {idx + 1}")
        try:
            pub_url, _ = await generate_pollinations_image(
                prompt=prompt,
                width=aspect_w,
                height=aspect_h,
                style_preset=medium_type,
            )
        except Exception as img_err:
            logger.warning(f"[Series Orchestrator] Panel {idx + 1} image generation error: {img_err}. Using fallback.")
            pub_url = f"/placeholder_{idx + 1}.webp"

        generated_panels.append({
            "id": idx + 1,
            "panel_index": idx + 1,
            "image_url": pub_url,
            "speech_text": p_out.get("speech_text", ""),
            "narrative": p_out.get("narrative", ""),
            "motion_type": p_out.get("motion_type", "zoom_in"),
            "duration": 3.0,
            "sfx": "",
            "brightness": 1.0,
            "contrast": 1.0,
            "saturation": 1.0,
            "grayscale": 0,
            "smart_crop": 0,
            "is_sanitized": 0,
        })

        # Update progress during art generation
        progress_val = 15.0 + ((idx + 1) / max(1, total_p)) * 50.0
        update_chapter_progress(
            chapter_id,
            round(progress_val, 1),
            f"Generating artwork (Panel {idx + 1}/{total_p})...",
            "generating_art"
        )

    # Save panels in DB
    try:
        insert_panels(chapter_id, generated_panels)
    except Exception as db_err:
        logger.error(f"[Series Orchestrator] Failed to save panels in DB: {db_err}")

    # Compile media based on medium type
    video_url = None
    webtoon_strips = None
    comic_pages = None

    if medium_type == "anime":
        update_chapter_progress(chapter_id, 75.0, "Synthesizing voices & compiling 1080p video...", "rendering")
        try:
            video_filename = await compile_video_from_panels(
                project_id=chapter_id,
                panels=generated_panels,
                voice="en-US-GuyNeural" if voice_language == "en-US" else voice_language,
                enable_dialogue_audio=False,
                enable_narrative_audio=True,
            )
            video_url = f"/videos/{video_filename}"
        except Exception as v_err:
            logger.error(f"[Series Orchestrator] Video compilation failed for Chapter {ch_num}: {v_err}")
    elif medium_type == "manhwa":
        update_chapter_progress(chapter_id, 85.0, "Stitching vertical webtoon strip...", "rendering")
        webtoon_strips = [p["image_url"] for p in generated_panels]
    else:  # comic / manga
        update_chapter_progress(chapter_id, 85.0, "Composing comic grid layouts...", "rendering")
        comic_pages = [{"page_number": 1, "panel_ids": [p["id"] for p in generated_panels]}]

    update_chapter_media(
        chapter_id=chapter_id,
        video_url=video_url,
        webtoon_strip_urls=webtoon_strips,
        comic_pages=comic_pages,
        panels_count=len(generated_panels),
        status="ready"
    )
    logger.info(f"[Series Orchestrator] Chapter {ch_num} is READY! (video={video_url}, strips={len(webtoon_strips or [])})")


async def run_progressive_series_pipeline(series_id: str, request: CreateSeriesRequest, user_id: str) -> None:
    """
    Main progressive orchestrator:
    1. Generates the full season storyline.
    2. Prioritizes Chapter 1 in Turbo Mode.
    3. Streams Chapters 2..N in the background.
    """
    logger.info(f"[Series Orchestrator] >>> Starting Series Pipeline: '{request.title}' ({request.total_chapters} chapters)")

    try:
        # Step 1: Generate Full Story Arc
        story_arc = await generate_series_arc(
            title=request.title,
            synopsis=request.synopsis,
            genre=request.genre,
            medium_type=request.medium_type,
            total_chapters=request.total_chapters,
            character_cast=request.character_cast,
            pacing=request.pacing,
        )

        chapters_outline = story_arc.get("chapters", [])
        existing_chaps = get_chapters_for_series(series_id)
        chap_id_map = {c.get("episode_number"): c.get("id") for c in existing_chaps}

        # Step 2: TURBO CHAPTER 1
        if chapters_outline:
            ch1_data = chapters_outline[0]
            ch1_id = chap_id_map.get("1") or existing_chaps[0]["id"]
            await process_single_chapter(
                series_id=series_id,
                chapter_id=ch1_id,
                chapter_data=ch1_data,
                medium_type=request.medium_type,
                voice_language=request.voice_language,
                image_model=request.image_model,
                is_priority=True,
            )

        # Step 3: BACKGROUND STREAMING FOR CHAPTERS 2..N
        for ch_idx in range(1, len(chapters_outline)):
            ch_data = chapters_outline[ch_idx]
            ep_num = str(ch_data.get("chapter_number", ch_idx + 1))
            ch_id = chap_id_map.get(ep_num)
            if not ch_id and ch_idx < len(existing_chaps):
                ch_id = existing_chaps[ch_idx]["id"]

            if ch_id:
                await process_single_chapter(
                    series_id=series_id,
                    chapter_id=ch_id,
                    chapter_data=ch_data,
                    medium_type=request.medium_type,
                    voice_language=request.voice_language,
                    image_model=request.image_model,
                    is_priority=False,
                )

        logger.info(f"[Series Orchestrator] Successfully completed all {request.total_chapters} chapters for '{request.title}'!")

    except Exception as pipe_err:
        logger.error(f"[Series Orchestrator] Pipeline fatal error: {pipe_err}", exc_info=True)


def create_and_start_series(request: CreateSeriesRequest, user_id: str) -> Dict[str, Any]:
    """Synchronously creates Series & Chapter rows in DB and dispatches background pipeline."""
    series_id = f"ser_{uuid.uuid4().hex[:10]}"

    create_series(
        series_id=series_id,
        user_id=user_id,
        title=request.title,
        author="AI Studio Creator",
        genre=request.genre,
        synopsis=request.synopsis,
        medium_type=request.medium_type,
        image_model=request.image_model,
        voice_language=request.voice_language,
        character_dna=[c.model_dump() for c in (request.character_cast or [])],
        total_chapters=request.total_chapters,
        slug=series_id,
    )

    created_chapters = []
    for ch_num in range(1, request.total_chapters + 1):
        chap_id = f"{series_id}_ch{ch_num}"
        initial_status = "scripting" if ch_num == 1 else "pending"
        initial_stage = "Starting Chapter 1 Priority Generation..." if ch_num == 1 else "Queued in background"
        initial_prog = 5.0 if ch_num == 1 else 0.0

        add_chapter_to_series(
            chapter_id=chap_id,
            series_id=series_id,
            episode_number=str(ch_num),
            title=f"Chapter {ch_num}",
            synopsis="Storyline being outlined by AI Director...",
            status=initial_status,
            progress_percent=initial_prog,
            current_stage_label=initial_stage,
            job_id=f"job_{chap_id}",
        )
        created_chapters.append({
            "id": chap_id,
            "chapter_number": ch_num,
            "title": f"Chapter {ch_num}",
            "status": initial_status,
            "progress_percent": initial_prog,
            "current_stage_label": initial_stage,
        })

    # Dispatch background pipeline
    asyncio.create_task(run_progressive_series_pipeline(series_id, request, user_id))

    return {
        "success": True,
        "series_id": series_id,
        "title": request.title,
        "medium_type": request.medium_type,
        "total_chapters": request.total_chapters,
        "chapters": created_chapters,
        "message": "Series created successfully. Chapter 1 priority generation is underway!",
    }
