"""Arc Architect Service for Sonikoma AI Series Studio.

Directs multi-session story architecture, character DNA generation, world bible
creation, and chapter scheduling with guaranteed epilogue closure.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional
from uuid import uuid4

from features.intelligence.series.schemas import (
    CreateAISeriesRequest,
    CharacterDNA,
    SeriesSession,
    ChapterSession,
    AISeriesPanel,
    GenerationPriority,
    ProjectStatus,
)
from features.intelligence.series.services.series_memory_engine import series_memory_engine
from features.intelligence.series.services.panel_synthesizer import panel_synthesizer
from ai_engine.skills.registry import registry
from ai_engine.core.orchestrator import AIOrchestrator

logger = logging.getLogger(__name__)


class ArcArchitect:
    """Specialized engine architecting series arcs, cast, lore, and chapter structure."""

    async def architect_series_arc(
        self, req: CreateAISeriesRequest, series_id: str
    ) -> tuple[List[CharacterDNA], Dict[str, Any], List[SeriesSession]]:
        """Create multi-session architecture with guaranteed 0-cliffhanger epilogue resolution using format-specific AI skill."""
        fmt_str = (req.format_type.value if hasattr(req.format_type, "value") else str(req.format_type)).lower()

        clean_title = req.title.strip()
        title_tokens = clean_title.split() if clean_title else []
        clean_word = title_tokens[0].rstrip(",.:;!?") if title_tokens else "Awakening"
        genre_str = (getattr(req, "genre", "") or "").lower()
        req_theme_str = f"{clean_title} {genre_str} {req.logline or ''}".lower()
        concept_summary = (req.logline or req.synopsis or clean_title).strip()

        # Derive dynamic character, world, and lore foundations directly from user input
        hero_candidate = clean_word if clean_word.lower() not in ("the", "a", "an", "of", "in", "and", "to") else "Protagonist"
        default_hero_name = hero_candidate
        default_hero_desc = (
            f"Lead protagonist of '{clean_title}', {genre_str} character with distinctive expressive features, "
            f"stylish hairstyle, iconic attire suited for {genre_str or 'the journey'}, and a determined presence."
        )
        default_hero_palette = "Thematic tones with radiant signature accents"

        default_rival_name = f"Rival of {default_hero_name}"
        default_rival_desc = (
            f"Primary rival and foil to {default_hero_name} in '{clean_title}', sharp contrasting attire, "
            f"commanding presence, piercing gaze, and formidable abilities."
        )
        default_rival_palette = "Contrasting bold dark and metallic tones"

        default_setting = f"The World of {clean_title}"
        default_rules = [
            f"The primary conflict centers on: {concept_summary[:120]}.",
            f"Power dynamics and faction conflicts in {clean_title} are driven by {genre_str or 'the overarching struggle'}.",
        ]

        if fmt_str in ("anime", "anime_sakuga"):
            skill_name = "series_arc_anime"
            format_medium = "anime"
        elif fmt_str in ("comic_manga", "comic", "manga"):
            skill_name = "series_arc_comic"
            format_medium = "comic_manga"
        else:  # Manhwa
            skill_name = "series_arc_manhwa"
            format_medium = "manhwa"

        # Attempt invocation of specialized AI prompt skill
        ai_data: Optional[Dict[str, Any]] = None
        try:
            skill = registry.get(skill_name)
            logger.info(f"[ArcArchitect] Executing specialized skill '{skill_name}' for format '{format_medium}' (Title: '{req.title}')...")
            raw_output = await skill.execute(
                title=req.title,
                logline=req.logline or req.synopsis or "",
                genre=getattr(req, "genre", "action_fantasy") or "action_fantasy",
                art_style=req.art_style.value if hasattr(req.art_style, "value") else str(req.art_style),
                total_sessions=req.total_sessions,
                chapters_per_session=req.chapters_per_session,
                panels_per_chapter=getattr(req, "panels_per_chapter", 8) or 8,
                pacing=req.pacing.value if hasattr(req.pacing, "value") else str(req.pacing),
                dialogue_density=req.dialogue_density.value if hasattr(req.dialogue_density, "value") else str(req.dialogue_density),
                model=getattr(req, "storyboard_model", None) or AIOrchestrator.resolve_model_for_task("storyboard_narrative", "primary"),
            )
            if hasattr(raw_output, "model_dump"):
                ai_data = raw_output.model_dump()
            elif isinstance(raw_output, dict):
                ai_data = raw_output
            elif isinstance(raw_output, str) and raw_output.strip():
                try:
                    ai_data = json.loads(raw_output)
                except Exception:
                    from ai_engine.skills.utils import extract_json
                    clean_str = extract_json(raw_output)
                    if clean_str:
                        try:
                            ai_data = json.loads(clean_str)
                        except Exception as e2:
                            logger.warning(f"[ArcArchitect] Secondary JSON parse error: {e2}")
            if ai_data:
                logger.info(
                    f"[ArcArchitect] Specialized skill '{skill_name}' successfully generated series blueprint "
                    f"({len(ai_data.get('sessions', []))} seasons, {len(ai_data.get('cast', []))} cast members)."
                )
        except Exception as e:
            logger.warning(f"[ArcArchitect] Note: AI skill '{skill_name}' execution completed with fallback blueprint: {e}")

        # Construct or Parse Cast
        cast: List[CharacterDNA] = []
        if ai_data and isinstance(ai_data.get("cast"), list) and len(ai_data["cast"]) > 0:
            for c_raw in ai_data["cast"]:
                cid = c_raw.get("character_id") or f"char_{uuid4().hex[:6]}"
                c_name = c_raw.get("name") or "Character"
                c_role = c_raw.get("role") or "supporting"
                c_summary = c_raw.get("visual_summary") or c_name
                v_prof = c_raw.get("voice_profile") or {}
                voice_id = (
                    v_prof.get("voice_name")
                    if isinstance(v_prof, dict)
                    else (getattr(v_prof, "voice_name", None) if v_prof else None)
                )
                c_gender = c_raw.get("gender")
                if not c_gender:
                    lower_info = f"{c_name} {c_summary}".lower()
                    if any(w in lower_info for w in ["girl", "woman", "female", "queen", "princess", "lady", "she", "her", "mother", "sister"]):
                        c_gender = "female"
                    else:
                        c_gender = "male"

                cast.append(
                    CharacterDNA(
                        character_id=cid,
                        name=c_name,
                        role=c_role,
                        gender=c_gender,
                        visual_summary=c_summary,
                        hair_color=c_raw.get("hair_color"),
                        eye_color=c_raw.get("eye_color"),
                        clothing_palette=c_raw.get("clothing_palette"),
                        signature_traits=c_raw.get("signature_traits", []),
                        voice_id=voice_id,
                    )
                )

        if not cast:
            hero_gender = "female" if any(w in default_hero_desc.lower() for w in ["female", "woman", "girl", "queen", "princess"]) else "male"
            hero_char = CharacterDNA(
                character_id=f"char_{uuid4().hex[:6]}",
                name=default_hero_name,
                role="protagonist",
                gender=hero_gender,
                visual_summary=default_hero_desc,
                hair_color=None,
                eye_color=None,
                clothing_palette=default_hero_palette,
                signature_traits=[f"{genre_str} style" if genre_str else "distinctive presence"],
            )
            rival_char = CharacterDNA(
                character_id=f"char_{uuid4().hex[:6]}",
                name=default_rival_name,
                role="antagonist",
                gender="male",
                visual_summary=default_rival_desc,
                hair_color=None,
                eye_color=None,
                clothing_palette="Contrasting palette",
                signature_traits=["commanding presence"],
            )
            cast = [hero_char, rival_char]

        # Construct World Bible
        if ai_data and isinstance(ai_data.get("world_bible"), dict):
            world_bible = ai_data["world_bible"]
        else:
            world_bible = {
                "setting_name": default_setting,
                "lore_rules": default_rules,
                "unresolved_mysteries": [
                    f"The true origin behind the events of {clean_title}",
                    f"The hidden truth that links {cast[0].name} to {cast[1].name if len(cast) > 1 else 'the central conflict'}",
                ],
            }

        # Register mysteries into memory engine for guaranteed 0-cliffhanger epilogue
        unresolved = world_bible.get("unresolved_mysteries") or []
        for mystery in unresolved:
            series_memory_engine.record_unresolved_thread(series_id, mystery)

        # Build Sessions & Chapters
        sessions: List[SeriesSession] = []
        total_sessions = req.total_sessions
        chapters_per_session = req.chapters_per_session
        panels_per_chapter = getattr(req, "panels_per_chapter", 8) or 8

        ai_sessions_dict: Dict[int, Any] = {}
        if ai_data and isinstance(ai_data.get("sessions"), list):
            for s_item in ai_data["sessions"]:
                s_num = s_item.get("session_number", 1)
                ai_sessions_dict[s_num] = s_item

        for s_idx in range(1, total_sessions + 1):
            is_final_session = (s_idx == total_sessions)
            ai_s_data = ai_sessions_dict.get(s_idx, {})
            session_title = ai_s_data.get("session_title") or f"Season {s_idx}: {clean_title}"
            session_theme = ai_s_data.get("session_theme") or f"Narrative arc exploring the progression of {clean_title}."

            ai_chapters_dict: Dict[int, Any] = {}
            if isinstance(ai_s_data.get("chapters"), list):
                for c_item in ai_s_data["chapters"]:
                    c_num = c_item.get("chapter_number", 1)
                    ai_chapters_dict[c_num] = c_item

            session_chapters: List[ChapterSession] = []

            for c_idx in range(1, chapters_per_session + 1):
                is_series_finale = is_final_session and (c_idx == chapters_per_session)
                chap_id = f"chap_s{s_idx}_c{c_idx}_{uuid4().hex[:6]}"
                ai_c_data = ai_chapters_dict.get(c_idx, {})

                if ai_c_data.get("chapter_title"):
                    chap_title = ai_c_data["chapter_title"]
                    pacing_role = ai_c_data.get("pacing_role", "rising_action")
                    summary = ai_c_data.get("summary", "")
                elif is_series_finale:
                    pacing_role = "epilogue_resolution"
                    chap_title = f"Finale: {clean_title} Resolution"
                    summary = f"All conflicts in '{clean_title}' reach resolution with definitive narrative closure."
                elif c_idx == 1 and s_idx == 1:
                    pacing_role = "inciting_incident"
                    chap_title = f"Chapter 1: {clean_title}"
                    summary = f"Introduction to {cast[0].name} as events in '{clean_title}' begin: {concept_summary[:120]}."
                elif c_idx == chapters_per_session:
                    pacing_role = "climax"
                    chap_title = f"Season {s_idx} Climax: {clean_title}"
                    summary = f"High-stakes confrontation reaching peak intensity in '{clean_title}'."
                else:
                    pacing_role = "rising_action"
                    chap_title = f"Chapter {c_idx}: {clean_title}"
                    summary = f"{cast[0].name} advances through the next phase of '{clean_title}'."

                # Turbo First Chapter: Chapter 1 is synthesized immediately with full panels,
                # while subsequent chapters retain generated outlines and synthesize on demand.
                is_first_chapter = (s_idx == 1 and c_idx == 1)
                should_synthesize_now = (
                    req.generation_priority == GenerationPriority.BACKGROUND_FULL_SERIES
                    or is_first_chapter
                )

                panels: List[AISeriesPanel] = []
                chapter_status = ProjectStatus.DRAFT

                if should_synthesize_now:
                    suggested_scenes = ai_c_data.get("suggested_scene_prompts") or []
                    panels = await panel_synthesizer.synthesize_panels(
                        series_id=series_id,
                        format_type=req.format_type,
                        art_style=req.art_style,
                        hero_name=cast[0].name,
                        session_number=s_idx,
                        chapter_number=c_idx,
                        chapter_title=chap_title,
                        is_series_finale=is_series_finale,
                        panel_count=panels_per_chapter,
                        genre=getattr(req, "genre", ""),
                        logline=getattr(req, "logline", ""),
                        image_model=getattr(req, "image_model", None) or AIOrchestrator.resolve_model_for_task("image_diffusion", "primary"),
                        suggested_scene_prompts=suggested_scenes,
                    )
                    chapter_status = ProjectStatus.COMPLETED

                chapter = ChapterSession(
                    chapter_id=chap_id,
                    session_number=s_idx,
                    chapter_number=c_idx,
                    title=chap_title,
                    pacing_role=pacing_role,
                    summary=summary,
                    panels=panels,
                    status=chapter_status,
                    is_series_finale=is_series_finale,
                    guaranteed_resolution_notes=(
                        "Mandatory Epilogue: Resolves all mysteries and character fates without cliffhangers."
                        if is_series_finale else None
                    ),
                )
                session_chapters.append(chapter)


            sessions.append(
                SeriesSession(
                    session_number=s_idx,
                    title=session_title,
                    summary=session_theme,
                    chapters=session_chapters,
                )
            )

        return cast, world_bible, sessions


# Global singleton
arc_architect = ArcArchitect()
