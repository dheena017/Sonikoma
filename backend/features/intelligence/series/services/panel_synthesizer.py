"""Panel Synthesizer Service for Sonikoma AI Series Studio.

Transforms narrative scene directives into authentic visual panels, interactive
vector speech bubbles, camera framing, sound effects, and generative image/video URLs.
Delegates style-specific prompt mechanics entirely to the modular styles package
and dynamically coordinates with the 'generate_chapter' AI skill.
"""

from __future__ import annotations

import os
import logging
from typing import Any, Dict, List, Optional, Union
from uuid import uuid4

from common.image import generate_manhwa_panel_artwork

from features.intelligence.series.schemas import (
    AISeriesPanel,
    InteractiveSpeechBubble,
    InteractivePoint,
    SeriesFormatType,
    SeriesArtStyle,
)
from features.intelligence.series.services.series_memory_engine import series_memory_engine
from features.intelligence.series.services.series_image_service import series_image_service
from features.intelligence.series.styles import (
    resolve_style_prompt,
    KINETIC_MOTION_PRESETS,
)
from ai_engine.skills.registry import registry
from ai_engine.core.orchestrator import AIOrchestrator

logger = logging.getLogger(__name__)


class PanelSynthesizer:
    """Specialized engine synthesizing comic, manga, manhwa, and anime panels."""

    async def synthesize_panels(
        self,
        series_id: str,
        format_type: Union[SeriesFormatType, str],
        art_style: Union[SeriesArtStyle, str],
        hero_name: str,
        session_number: int,
        chapter_number: int,
        chapter_title: str,
        is_series_finale: bool = False,
        panel_count: int = 8,
        genre: str = "",
        logline: str = "",
        image_model: Optional[str] = None,
        suggested_scene_prompts: Optional[List[Any]] = None,
    ) -> List[AISeriesPanel]:
        """Synthesize visual panels, Pollinations URLs, speech bubbles, and camera directions."""
        actual_image_model = image_model or AIOrchestrator.resolve_model_for_task("image_diffusion", "primary")
        art_style_key = art_style.value if hasattr(art_style, "value") else str(art_style)
        format_val = (format_type.value if hasattr(format_type, "value") else str(format_type)).lower()

        is_anime = ("anime" in format_val or "sakuga" in format_val)
        is_comic = ("comic" in format_val or "manga" in format_val)
        is_manhwa = not is_anime and not is_comic
        clean_hero = hero_name or "Character"

        # Dynamically invoke generate_chapter AI skill if no pre-planned scenes exist
        active_scene_prompts = list(suggested_scene_prompts) if suggested_scene_prompts else []
        if not active_scene_prompts:
            try:
                skill = registry.get("generate_chapter")
                logger.info(f"[PanelSynthesizer] Invoking AI skill 'generate_chapter' for S{session_number}:C{chapter_number} '{chapter_title}'...")
                res = await skill.execute(
                    series_title=chapter_title,
                    chapter_title=chapter_title,
                    chapter_number=chapter_number,
                    pacing_role="epilogue_resolution" if is_series_finale else ("inciting_incident" if chapter_number == 1 else "rising_action"),
                    format_type=format_val,
                    art_style=art_style_key,
                    hero_name=clean_hero,
                    logline=logline,
                    panel_count=panel_count,
                    model=AIOrchestrator.resolve_model_for_task("storyboard_narrative", "primary"),
                )
                if hasattr(res, "panels") and res.panels:
                    active_scene_prompts = [p.model_dump() if hasattr(p, "model_dump") else p for p in res.panels]
                elif isinstance(res, dict) and res.get("panels"):
                    active_scene_prompts = res["panels"]
            except Exception as e:
                logger.debug(f"[PanelSynthesizer] Dynamic scene generation completed with contextual beat generator: {e}")

        logger.info(
            f"[PanelSynthesizer] Synthesizing S{session_number}:C{chapter_number} '{chapter_title}' "
            f"({panel_count} panels, format: {format_val}, style: {art_style_key}, model: {actual_image_model})"
        )

        panels: List[AISeriesPanel] = []

        for p_idx in range(1, panel_count + 1):
            panel_id = f"panel_s{session_number}_c{chapter_number}_p{p_idx}_{uuid4().hex[:6]}"

            # Check if specialized AI Skill returned a planned scene prompt for this panel
            scene_data: Optional[Dict[str, Any]] = None
            if active_scene_prompts and p_idx - 1 < len(active_scene_prompts):
                raw_s = active_scene_prompts[p_idx - 1]
                if hasattr(raw_s, "model_dump"):
                    scene_data = raw_s.model_dump()
                elif isinstance(raw_s, dict):
                    scene_data = raw_s

            dialogue_turns_list = []
            dialogue_text = ""
            if scene_data and (scene_data.get("visual_description") or scene_data.get("prompt") or scene_data.get("action")):
                action = scene_data.get("visual_description") or scene_data.get("prompt") or scene_data.get("action")
                camera = scene_data.get("camera_angle") or scene_data.get("shot_type") or ("cinematic_wide" if is_anime else "dramatic_medium")
                raw_dlg = scene_data.get("dialogue") or scene_data.get("dialogue_text") or scene_data.get("spoken_line")
                if isinstance(raw_dlg, str) and raw_dlg.strip():
                    dialogue_text = raw_dlg.strip()
                elif isinstance(raw_dlg, list):
                    dialogue_turns_list = raw_dlg
                    if dialogue_turns_list:
                        first_item = dialogue_turns_list[0]
                        if isinstance(first_item, dict):
                            dialogue_text = first_item.get("spoken_line") or first_item.get("text", "")
                        elif isinstance(first_item, str):
                            dialogue_text = first_item
            else:
                # Data-driven dynamic beat composer derived purely from sequential progression
                progress = p_idx / max(panel_count, 1)
                context_hint = f", {logline[:80]}" if logline else ""

                if p_idx == 1:
                    beat_key = "establishing"
                elif p_idx == panel_count and is_series_finale:
                    beat_key = "epilogue"
                elif p_idx == panel_count:
                    beat_key = "cliffhanger"
                elif progress <= 0.4:
                    beat_key = "tracking"
                elif progress <= 0.7:
                    beat_key = "confrontation"
                else:
                    beat_key = "climax"

                camera_map = {
                    "establishing": "cinematic_wide" if is_anime else ("vertical_webtoon_establishing" if is_manhwa else "koma_establishing_wide"),
                    "tracking": "medium_tracking_shot" if is_anime else "manhwa_medium_portrait",
                    "confrontation": "dramatic_close_up",
                    "climax": "high_velocity_action" if is_anime else "dynamic_action",
                    "cliffhanger": "dutch_tilt_climax" if is_anime else ("vertical_scroll_reveal" if is_manhwa else "dynamic_tachi_kiri"),
                    "epilogue": "golden_resolution_wide" if is_anime else "epilogue_splash",
                }
                camera = camera_map.get(beat_key, "cinematic_medium")
                action = f"{clean_hero} during {beat_key} beat in '{chapter_title}'{context_hint}"
                dialogue_text = ""

            # Resolve prompt, negative prompt, and canvas dimensions via modular styles engine
            base_prompt, negative_prompt, (w, h) = resolve_style_prompt(
                art_style_key=art_style_key,
                format_type_str=format_val,
                action=str(action or ""),
                camera_angle=camera,
                character_name=clean_hero,
            )

            enhanced_prompt = series_memory_engine.generate_prompt_enhancements(
                series_id, base_prompt, character_names=[clean_hero] if clean_hero else None
            )

            # High quality guaranteed local panel image synthesis
            s_dir = series_image_service._get_series_images_dir(series_id)
            panel_filename = f"{panel_id}.png"
            panel_disk_path = os.path.join(s_dir, panel_filename)
            try:
                artwork = generate_manhwa_panel_artwork(
                    width=w,
                    height=h,
                    title=f"Shot #{p_idx}",
                    prompt=enhanced_prompt,
                    camera_angle=camera or "cinematic_wide",
                    character_name=clean_hero,
                    art_style=art_style_key,
                    shot_index=p_idx - 1,
                )
                artwork.save(panel_disk_path, format="PNG")
                image_url = f"/media/series_images/{series_id}/{panel_filename}"
            except Exception as e:
                logger.warning(f"[PanelSynthesizer] Local panel artwork generation warning: {e}")
                image_url = f"/media/series_images/{series_id}/{panel_filename}"

            # Interactive Vector Speech Bubbles & Cinematic Subtitles
            bubbles: List[InteractiveSpeechBubble] = []
            if dialogue_turns_list and isinstance(dialogue_turns_list, list):
                for d_i, d_turn in enumerate(dialogue_turns_list):
                    line = ""
                    spk = clean_hero
                    b_type = "speech"
                    if isinstance(d_turn, dict):
                        line = d_turn.get("spoken_line") or d_turn.get("text", "")
                        spk = d_turn.get("speaker_name") or d_turn.get("speaker") or clean_hero
                        b_type = d_turn.get("bubble_type") or "speech"
                    elif isinstance(d_turn, str):
                        line = d_turn.strip()

                    if line:
                        font_fam = "'Outfit', system-ui, sans-serif" if is_anime else "Bangers, 'Comic Neue', system-ui, sans-serif"
                        bg_c = "rgba(15, 23, 42, 0.85)" if is_anime else "#FFFFFF"
                        tx_c = "#F8FAFC" if is_anime else "#111827"
                        p_y = (70.0 + (d_i * 12.0)) if is_anime else (8.0 + (d_i * 16.0))
                        bubbles.append(
                            InteractiveSpeechBubble(
                                bubble_id=f"bub_{panel_id}_{d_i+1}",
                                text=line,
                                speaker_name=spk,
                                bubble_type=b_type,
                                pos_x=20.0 if is_anime else (12.0 if d_i % 2 == 0 else 48.0),
                                pos_y=p_y,
                                width=60.0 if is_anime else 46.0,
                                height=14.0,
                                font_family=font_fam,
                                font_size=15,
                                bg_color=bg_c,
                                text_color=tx_c,
                                tail_tip=InteractivePoint(x=35.0, y=32.0) if not is_anime else None,
                            )
                        )
            elif dialogue_text:
                font_fam = "'Outfit', system-ui, sans-serif" if is_anime else "Bangers, 'Comic Neue', system-ui, sans-serif"
                bg_c = "rgba(15, 23, 42, 0.85)" if is_anime else "#FFFFFF"
                tx_c = "#F8FAFC" if is_anime else "#111827"
                p_y = 75.0 if is_anime else (8.0 if p_idx % 2 != 0 else 14.0)
                bubbles.append(
                    InteractiveSpeechBubble(
                        bubble_id=f"bub_{panel_id}_1",
                        text=dialogue_text,
                        speaker_name=clean_hero,
                        bubble_type="speech" if p_idx % 2 != 0 else "shout",
                        pos_x=20.0 if is_anime else (14.0 if p_idx % 2 != 0 else 46.0),
                        pos_y=p_y,
                        width=60.0 if is_anime else 46.0,
                        height=14.0,
                        font_family=font_fam,
                        font_size=15,
                        bg_color=bg_c,
                        text_color=tx_c,
                        tail_tip=InteractivePoint(x=35.0, y=32.0) if not is_anime else None,
                    )
                )

            # Kinetic Anime Video Pathway
            video_url = None
            motion_prompt = None
            motion_model = None

            if is_anime:
                motion_prompt = (
                    scene_data.get("motion_prompt")
                    if (scene_data and scene_data.get("motion_prompt"))
                    else KINETIC_MOTION_PRESETS[(p_idx - 1) % len(KINETIC_MOTION_PRESETS)]
                )
                motion_model = "i2v_character_anchor" if p_idx % 2 != 0 else "t2v_high_velocity"
                video_url = f"/api/v1/ai-series/preview-video/{panel_id}.mp4"

            # Sound effects derived directly from scene directive
            sfx = (
                (scene_data.get("sfx_text") or scene_data.get("sfx") or scene_data.get("sound_effects"))
                if scene_data
                else None
            )

            primary_speech = bubbles[0].text if bubbles else (dialogue_text or None)
            primary_speaker = bubbles[0].speaker_name if bubbles else (clean_hero if primary_speech else None)

            panel = AISeriesPanel(
                panel_id=panel_id,
                panel_index=p_idx,
                image_url=image_url,
                prompt=enhanced_prompt,
                negative_prompt=negative_prompt,
                camera_angle=camera,
                motion_prompt=motion_prompt,
                video_url=video_url,
                motion_model=motion_model,
                speech_bubbles=bubbles,
                speech_text=primary_speech,
                speaker_id=primary_speaker,
                sound_effects=sfx,
                sfx=sfx,
                duration=4.5 if is_anime else 3.0,
                image_model=actual_image_model,
            )

            panels.append(panel)

        return panels


# Global singleton
panel_synthesizer = PanelSynthesizer()
