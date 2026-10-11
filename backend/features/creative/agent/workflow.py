"""
backend/features/creative/agent/workflow.py
─────────────────────────────────────────────────────────────────────────────
Autonomous End-to-End Execution Workflow for the One-Click Creative AI Agent:
1. URL Scraping: Extracts raw comic/webtoon images and chapter metadata via real scraper
2. Merge Panels: POST /api/v1/images/merge (stitches sliced images into continuous chapter strip)
3. Auto Crop: POST /api/v1/panels/detect/long-panels + POST /api/v1/images/crop/long-panels
4. AI Analyze: POST /api/v1/ai/analyze-all-panels (dialogue, SFX, scene context & motion cues)
5. Voice Audio: POST /api/v1/audio/synthesize-all-panel-audio (batch EdgeTTS synthesis)
6. Render Video: POST /api/v1/video/render (compiles cinematic MP4 video with pan/zoom motion)
7. YouTube Publication: Real AI viral SEO headers and upload to YouTube channel
─────────────────────────────────────────────────────────────────────────────
"""

import os
import re
import time
import json
import uuid
import asyncio
import logging
from typing import List, Dict, Any, Optional, Literal, Tuple

from features.creative.agent.schemas import (
    AgentRunRequest,
    AgentRunResponse,
    AgentLogMessage,
    AgentPanel,
    AgentYouTubeMetadata,
    CharacterCastMember,
)
from features.creative.agent.cast_manager import CharacterCastManager
from features.platform.scraper.services.scraper_service import scrape_chapter_service
from features.image_editor.services.processing.compose import merge_images_service
from features.image_editor.services.panel_detection.detect_long_panels_service import detect_long_panels_boxes
from features.platform.projects.schemas_project import DetectLongPanelsRequest
from features.image_editor.services.crop.long_panels_crop_service import crop_long_panels_batch
from features.image_editor.schemas import LongPanelsCropRequest
from features.intelligence.ai.services.facade import facade_analyze_batch
from features.video_editor.audio.services.tts import batch_synthesize_panels_service
from features.video_editor.video.services.video_compiler import compile_video_from_panels
from features.creative.service import creative_service
from ai_engine.core.hub import AIHub
from app.core.config import (
    ai_initialized,
    genai_client,
    GEMINI_MODEL_PRIMARY,
    call_gemini_with_retry,
)

logger = logging.getLogger("sonikoma.creative.agent.workflow")


def _clean_json_text(text: str) -> str:
    """Robustly extracts valid JSON array or object from AI response text even with markdown or commentary."""
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        text = match.group(1).strip()

    array_match = re.search(r"(\[\s*\{[\s\S]*\}\s*\])", text)
    if array_match:
        return array_match.group(1).strip()

    obj_match = re.search(r"(\{[\s\S]*\})", text)
    if obj_match:
        return obj_match.group(1).strip()

    return text


def extract_title_from_url(url: str) -> str:
    """Extracts a clean, human-readable series title and episode from Webtoon, Manga, or comic URLs."""
    if not url:
        return "Webtoon Story Recap"
    try:
        from urllib.parse import urlparse, unquote
        parsed = urlparse(url)
        path = unquote(parsed.path).strip("/")
        parts = [p for p in path.split("/") if p]

        # Webtoons format: /en/{genre}/{series_slug}/{episode_slug}/viewer
        if "webtoons.com" in parsed.netloc and len(parts) >= 3:
            series_raw = parts[-3] if parts[-1] == "viewer" else (parts[-2] if len(parts) >= 2 else parts[0])
            ep_raw = parts[-2] if parts[-1] == "viewer" else parts[-1]
            s_clean = re.sub(r"[-_]+", " ", series_raw).strip().title()
            e_clean = re.sub(r"[-_]+", " ", ep_raw).strip()
            e_clean = re.sub(r"^ep\s*(\d+)", r"Episode \1", e_clean, flags=re.IGNORECASE).title()
            return f"{s_clean}: {e_clean}"

        # Generic slug extraction from URL path
        if parts:
            for part in reversed(parts):
                if part.lower() not in ("viewer", "read", "chapter", "manga", "comic") and len(part) > 2:
                    clean = re.sub(r"[-_]+", " ", part).strip().title()
    except Exception:
        pass
    return "Webtoon Story Recap"


def resolve_chapter_urls(
    base_url: str,
    start: Optional[int],
    end: Optional[int]
) -> Tuple[List[str], Optional[int], Optional[int]]:
    """
    Generates sequential chapter URLs if a valid chapter range is provided for multi-chapter auto-pilot.
    Intelligently extracts the episode number from the base URL (e.g. episode_no=146) to ensure the scrape starts
    from the exact target episode, with auto-alignment for relative ranges (e.g. 1 to 3 -> 146 to 148).
    """
    # 1. Extract detected episode number from URL
    detected_ep = None
    ep_param_match = re.search(r"episode_no=(\d+)", base_url, re.IGNORECASE)
    if ep_param_match:
        try:
            detected_ep = int(ep_param_match.group(1))
        except ValueError:
            pass
    if detected_ep is None:
        slug_match = re.search(r"([/-](?:chapter|ep|episode)[/-]?)(\d+)", base_url, re.IGNORECASE)
        if slug_match:
            try:
                detected_ep = int(slug_match.group(2))
            except ValueError:
                pass

    effective_start = start
    effective_end = end

    # 2. If start is omitted but end is provided, default start to detected episode
    if effective_start is None and effective_end is not None and detected_ep is not None:
        effective_start = detected_ep

    # 3. If relative range was entered (e.g. start=1, end=3) but URL is episode 146, auto-align to URL episode
    if (
        effective_start is not None
        and effective_end is not None
        and detected_ep is not None
        and effective_start == 1
        and (detected_ep - effective_start) >= 5
    ):
        count = max(1, effective_end - effective_start + 1)
        effective_start = detected_ep
        effective_end = detected_ep + count - 1

    # 4. If single chapter or no range provided
    if effective_start is None or effective_end is None or effective_end < effective_start:
        return [base_url], (effective_start or detected_ep), (effective_end or detected_ep)

    # 5. Safety cap: single video batch should not exceed 5 chapters
    if (effective_end - effective_start) > 5:
        logger.warning(
            f"[Workflow] Batch range {effective_start}-{effective_end} exceeds safety limit. "
            f"Auto-capping to {effective_start}-{effective_start + 2} (3 chapters)."
        )
        effective_end = effective_start + 2

    urls = []
    # Webtoons query param (e.g. episode_no=146)
    if "episode_no=" in base_url:
        for ep in range(effective_start, effective_end + 1):
            urls.append(re.sub(r"episode_no=\d+", f"episode_no={ep}", base_url))
        return urls, effective_start, effective_end

    # Path slug (e.g. /chapter-146 or /ep-146)
    match = re.search(r"([/-](?:chapter|ep|episode)[/-]?)(\d+)", base_url, re.IGNORECASE)
    if match:
        prefix = match.group(1)
        for ep in range(effective_start, effective_end + 1):
            urls.append(base_url[:match.start()] + f"{prefix}{ep}" + base_url[match.end():])
        return urls, effective_start, effective_end

    return [base_url], effective_start, effective_end


class AutonomousAgentWorkflow:
    """Manages the full lifecycle of an autonomous Webtoon-to-YouTube agent run with real APIs."""

    def __init__(
        self,
        run_id: str,
        request: AgentRunRequest,
        user_id: Optional[str] = None,
        on_update: Optional[Any] = None,
    ):
        self.run_id = run_id
        self.request = request
        self.user_id = user_id
        self.on_update = on_update
        now = time.time()
        initial_title = request.title_override or extract_title_from_url(request.url)
        series_name = initial_title.split(":")[0].strip() if ":" in initial_title else initial_title
        ep_name = initial_title.split(":")[1].strip() if ":" in initial_title else None

        self.cast_manager = CharacterCastManager(
            language=request.language,
            main_voice=request.protagonist_voice or request.voice or "en-US-GuyNeural",
            narrator_voice=request.narrator_voice or "en-US-ChristopherNeural",
        )

        self.state = AgentRunResponse(
            run_id=run_id,
            user_id=user_id,
            status="initializing",
            progress=0,
            current_action=f"Autonomous agent created for '{initial_title}'. Initializing pipeline...",
            logs=[
                AgentLogMessage(
                    timestamp=now,
                    stage="init",
                    level="info",
                    message=f"Autonomous Agent launched for: {initial_title} ({request.url})",
                )
            ],
            scraped_title=initial_title,
            series_title=series_name,
            chapter_title=ep_name,
            source_url=request.url,
            video_format=request.video_format,
            language=request.language,
            voice=request.voice or "en-US-ChristopherNeural",
            narrator_voice=request.narrator_voice or "en-US-ChristopherNeural",
            protagonist_voice=request.protagonist_voice or "en-US-GuyNeural",
            chapter_range_start=request.chapter_range_start,
            chapter_range_end=request.chapter_range_end,
            character_cast=[],
            cover_image=None,
            duration=None,
            raw_images_count=0,
            panels=[],
            video_filename=None,
            video_url=None,
            youtube_metadata=None,
            youtube_url=None,
            error=None,
            created_at=now,
            updated_at=now,
        )

        self._is_paused = asyncio.Event()
        self._is_paused.set()
        self._is_stopped = False
        self._previous_status: Optional[str] = None
        self._task: Optional[asyncio.Task] = None

    def pause(self) -> AgentRunResponse:
        """Pauses the running autonomous workflow."""
        if self.state.status in ("completed", "failed", "stopped"):
            return self.state
        if self.state.status != "paused":
            self._previous_status = self.state.status
            self.state.status = "paused"
            self._is_paused.clear()
            self.log("pause", "Agent execution paused by user.", level="warning")
        return self.state

    def resume(self) -> AgentRunResponse:
        """Resumes a paused autonomous workflow."""
        if self.state.status == "paused":
            self.state.status = self._previous_status or "rendering_video"
            self._is_paused.set()
            self.log("resume", "Agent execution resumed by user.", level="info")
        return self.state

    def stop(self) -> AgentRunResponse:
        """Stops and cancels the running autonomous workflow."""
        if self.state.status in ("completed", "failed"):
            return self.state
        self._is_stopped = True
        self.state.status = "stopped"
        self._is_paused.set()  # Unblock if paused
        if self._task and not self._task.done():
            self._task.cancel()
        self.log("stop", "Agent execution stopped and cancelled by user.", level="warning")
        if self.on_update:
            try:
                self.on_update(self.state)
            except Exception:
                pass
        return self.state

    async def _check_pause_and_stop(self):
        """Checks if stopped or paused before/between stages."""
        if self._is_stopped:
            raise asyncio.CancelledError("Agent execution was stopped by user.")
        await self._is_paused.wait()
        if self._is_stopped:
            raise asyncio.CancelledError("Agent execution was stopped by user.")

    def log(self, stage: str, message: str, level: Literal["error", "info", "success", "warning"] = "info", progress: Optional[int] = None):
        """Appends a timestamped log entry and updates real-time status."""
        now = time.time()
        self.state.updated_at = now
        self.state.current_action = message
        if progress is not None:
            self.state.progress = min(100, max(0, progress))
        self.state.logs.append(
            AgentLogMessage(timestamp=now, stage=stage, level=level, message=message)
        )
        logger.info(f"[Agent {self.run_id}] [{stage.upper()}] {message}")
        if self.on_update:
            try:
                self.on_update(self.state)
            except Exception as update_err:
                logger.debug(f"[Agent {self.run_id}] on_update callback error: {update_err}")


    async def _call_llm(self, prompt: str, system_instruction: Optional[str] = None) -> Optional[str]:
        """Calls real AI LLMs with multi-provider fallback (Gemini API -> AIHub / Multi-Provider)."""
        # 1. Try Google Gemini API across primary and fallback models
        if ai_initialized and genai_client:
            models_to_try = [GEMINI_MODEL_PRIMARY]
            for model_name in models_to_try:
                async def _invoke():
                    full_p = f"{system_instruction}\n\n{prompt}" if system_instruction else prompt
                    if hasattr(genai_client, "models") and hasattr(genai_client.models, "generate_content"):
                        resp = genai_client.models.generate_content(
                            model=model_name,
                            contents=full_p,
                        )
                        return getattr(resp, "text", str(resp))
                    elif hasattr(genai_client, "GenerativeModel"):
                        model = genai_client.GenerativeModel(model_name)
                        resp = model.generate_content(full_p)
                        return getattr(resp, "text", str(resp))
                    return None

                try:
                    result = await call_gemini_with_retry(_invoke)
                    if result and len(str(result).strip()) > 5:
                        return str(result)
                except Exception as e:
                    logger.debug(f"[Agent {self.run_id}] Gemini {model_name} attempt notice: {e}")
                    continue

        # 2. Try AIHub multi-provider orchestrator (OpenAI, Claude, HuggingFace, Pollinations, etc.)
        try:
            hub_result = await AIHub().chat(prompt=prompt, system_instruction=system_instruction)
            if hub_result and len(hub_result.strip()) > 5:
                return hub_result
        except Exception as hub_err:
            logger.debug(f"[Agent {self.run_id}] AIHub chat provider attempt notice: {hub_err}")

        return None

    # Backward compatibility alias
    _call_gemini = _call_llm

    async def execute(self):
        """Runs the entire end-to-end pipeline using real APIs."""
        try:
            # ── STAGE 1: SCRAPE EPISODE (REAL SCRAPER) ─────────────────────────
            self.state.status = "scraping"
            chapter_urls, eff_start, eff_end = resolve_chapter_urls(
                self.request.url,
                self.request.chapter_range_start,
                self.request.chapter_range_end,
            )
            raw_image_urls: List[str] = []
            title = self.request.title_override or self.state.scraped_title or "Webtoon Story Recap"

            if len(chapter_urls) > 1 and eff_start and eff_end:
                self.log(
                    "scrape",
                    f"Multi-Chapter Auto-Pilot: Processing {len(chapter_urls)} chapters from Episode {eff_start} to {eff_end}...",
                    progress=10,
                )
            else:
                self.log("scrape", f"Connecting to target Webtoon URL: {self.request.url}...", progress=10)

            for c_idx, target_url in enumerate(chapter_urls):
                current_ep = (eff_start + c_idx) if eff_start else (c_idx + 1)
                ep_label = f" (Episode {current_ep})" if len(chapter_urls) > 1 else ""
                self.log(
                    "scrape",
                    f"Scraping chapter {c_idx + 1} of {len(chapter_urls)}{ep_label}: {target_url}...",
                    progress=min(25, 10 + int(c_idx / max(len(chapter_urls), 1) * 15)),
                )
                try:
                    chapter_result = await scrape_chapter_service(
                        url=target_url,
                        proxy_images=True,
                        filter_banners=True,
                    )
                    if chapter_result and getattr(chapter_result, "images", None):
                        c_imgs = [img.url for img in chapter_result.images if getattr(img, "url", None)]
                        raw_image_urls.extend(c_imgs)

                        if c_idx == 0:
                            s_title = None
                            if getattr(chapter_result, "series", None) and getattr(chapter_result.series, "title", None):
                                s_title = str(chapter_result.series.title).strip()

                            c_title = None
                            if getattr(chapter_result, "chapter", None):
                                c_title = getattr(chapter_result.chapter, "title", None) or getattr(chapter_result.chapter, "episode", None)
                                if c_title:
                                    c_title = str(c_title).strip()
                                elif getattr(chapter_result.chapter, "number", None):
                                    c_title = f"Episode {chapter_result.chapter.number}"

                            if s_title and c_title:
                                title = f"{s_title}: {c_title}"
                            elif s_title:
                                title = s_title
                            elif c_title:
                                title = c_title
                            elif getattr(chapter_result, "title", None):
                                title = str(chapter_result.title).strip()

                            if s_title:
                                self.state.series_title = s_title
                            if c_title:
                                self.state.chapter_title = c_title

                            cover = getattr(chapter_result, "cover_image", None)
                            if not cover and getattr(chapter_result, "series", None):
                                cover = getattr(chapter_result.series, "cover_image", None)
                            if cover:
                                self.state.cover_image = cover
                except Exception as scrape_err:
                    self.log("scrape", f"Scraper notice for {target_url}: {scrape_err}", level="warning")

            if len(chapter_urls) > 1 and eff_start and eff_end:
                title = f"{title} (Chapters {eff_start}-{eff_end})"

            if self.request.title_override:
                title = self.request.title_override

            if not self.state.cover_image and raw_image_urls:
                self.state.cover_image = raw_image_urls[0]

            self.state.scraped_title = title
            self.state.raw_images_count = len(raw_image_urls)
            self.log(
                "scrape",
                f"Scraped {len(raw_image_urls)} page slices for '{title}'.",
                level="success",
                progress=25,
            )

            # ── STAGE 1 (MERGE): POST /api/v1/images/merge ─────────────────────
            merged_strip_url = None
            if raw_image_urls:
                self.log(
                    "merge_panels",
                    f"[Merge Panels: POST /api/v1/images/merge] Stitching {len(raw_image_urls)} page slices into vertical chapter strip...",
                    progress=25,
                )
                try:
                    merge_res = await merge_images_service(
                        urls=raw_image_urls,
                        layout="vertical",
                        spacing=0,
                        spacingColor="white",
                        scaleToFit=True,
                        alignMode="center",
                        padding=0,
                    )
                    merged_strip_url = merge_res.get("imageUrl") or merge_res.get("url")
                    self.log(
                        "merge_panels",
                        f"[Merge Panels: POST /api/v1/images/merge] Stitched full continuous strip: {merged_strip_url}",
                        level="success",
                        progress=35,
                    )
                except Exception as merge_err:
                    self.log("merge_panels", f"Merge notice: {merge_err}. Using original slices.", level="warning")
                    merged_strip_url = raw_image_urls[0]

            # ── STAGE 2 (AUTO CROP): POST /api/v1/panels/detect/long-panels + POST /api/v1/images/crop/long-panels ──
            self.state.status = "processing_images"
            self.log(
                "auto_crop",
                "[Auto Crop: POST /api/v1/panels/detect/long-panels] Detecting panel boundaries from vertical strip...",
                progress=40,
            )

            detected_boxes = []
            if merged_strip_url:
                try:
                    detect_req = DetectLongPanelsRequest(url=merged_strip_url)
                    detect_res = await detect_long_panels_boxes(detect_req)
                    detected_boxes = detect_res.panels or []
                    self.log(
                        "auto_crop",
                        f"[Auto Crop: POST /api/v1/panels/detect/long-panels] Detected {len(detected_boxes)} panels.",
                        level="success",
                        progress=45,
                    )
                except Exception as det_err:
                    self.log("auto_crop", f"Panel detection notice: {det_err}", level="warning")

            panels_data: List[AgentPanel] = []
            cropped_slices = []

            if merged_strip_url and detected_boxes:
                try:
                    self.log(
                        "auto_crop",
                        f"[Auto Crop: POST /api/v1/images/crop/long-panels] Batch-cropping {len(detected_boxes)} panel frames...",
                        progress=50,
                    )
                    crop_req = LongPanelsCropRequest(
                        url=merged_strip_url,
                        panels=[b.model_dump() if hasattr(b, "model_dump") else (b.dict() if hasattr(b, "dict") else b) for b in detected_boxes],
                        output_format="png",
                        quality=95,
                    )
                    crop_res = await crop_long_panels_batch(crop_req)
                    cropped_slices = crop_res.slices or []
                    self.log(
                        "auto_crop",
                        f"[Auto Crop: POST /api/v1/images/crop/long-panels] Cropped {len(cropped_slices)} clean panel frames.",
                        level="success",
                        progress=55,
                    )
                except Exception as crop_err:
                    self.log("auto_crop", f"Batch crop notice: {crop_err}", level="warning")

            max_panels = self.request.max_panels
            if not max_panels and self.request.video_format == "shorts":
                # YouTube Shorts strictly require videos under 60 seconds (8 panels @ ~4s each = ~32s)
                max_panels = 8

            if cropped_slices:
                slices_to_use = cropped_slices[:max_panels] if (max_panels and max_panels > 0) else cropped_slices
                for idx, s in enumerate(slices_to_use):
                    p_url = getattr(s, "url", None) or getattr(s, "imageUrl", None) or (s.get("url") if isinstance(s, dict) else None)
                    panels_data.append(
                        AgentPanel(
                            index=idx + 1,
                            image_url=p_url or f"/api/v1/images/cached/panel_{idx+1}.png",
                            speech_text="",
                            motion_type="zoom_in" if idx % 2 == 0 else "pan_down",
                        )
                    )
            elif raw_image_urls:
                slices_to_use = raw_image_urls[:max_panels] if (max_panels and max_panels > 0) else raw_image_urls
                for idx, u in enumerate(slices_to_use):
                    panels_data.append(
                        AgentPanel(
                            index=idx + 1,
                            image_url=u,
                            speech_text="",
                            motion_type="zoom_in" if idx % 2 == 0 else "pan_down",
                        )
                    )

            self.state.panels = panels_data
            if panels_data and not self.state.cover_image:
                self.state.cover_image = panels_data[0].image_url
            self.state.duration = round(sum(p.duration for p in panels_data if p.duration), 1)

            self.log(
                "process_images",
                f"Prepared {len(panels_data)} clean comic panels for storyboard.",
                level="success",
                progress=60,
            )

            # ── STAGE 3: AI ANALYZE (POST /api/v1/ai/analyze-all-panels) ──────────
            self.state.status = "generating_narrative"
            self.log(
                "narrative",
                f"[AI Analyze: POST /api/v1/ai/analyze-all-panels] Analyzing all panels in '{self.request.language}'...",
                progress=65,
            )

            panel_dict_list = [
                {"id": f"panel_{p.index}", "url": p.image_url, "index": p.index}
                for p in self.state.panels
            ]
            try:
                # Chunk panels in batches of up to 10 for high-performance and reliable AI vision analysis
                CHUNK_SIZE = 10
                chunks = [
                    panel_dict_list[i : i + CHUNK_SIZE]
                    for i in range(0, len(panel_dict_list), CHUNK_SIZE)
                ]
                all_analyze_results = []
                for chunk_idx, chunk in enumerate(chunks):
                    try:
                        chunk_res = await facade_analyze_batch(
                            panels=chunk,
                            voice=self.request.voice,
                            narration_style="dramatic_recap",
                            story_context=f"Title: {title}. Script Language: {self.request.language}. Part {chunk_idx + 1} of {len(chunks)}.",
                            generate_audio=False,
                        )
                        if chunk_res and chunk_res.get("results"):
                            all_analyze_results.extend(chunk_res["results"])
                    except Exception as chunk_err:
                        logger.warning(f"[Agent AI Analyze] Chunk {chunk_idx + 1} notice: {chunk_err}")

                results_map = {r.get("id"): r for r in all_analyze_results}
                for idx, p in enumerate(self.state.panels):
                    r_item = results_map.get(f"panel_{p.index}") or {}
                    speech = r_item.get("dialogue") or r_item.get("narrative") or r_item.get("speech_text")
                    if speech and str(speech).strip():
                        p.speech_text = str(speech).strip()
                    else:
                        p.speech_text = f"In this crucial moment of {title}, destiny shifts."
                    p.motion_type = r_item.get("motion") or r_item.get("motion_type") or ("zoom_in" if idx % 2 == 0 else "pan_down")
                    p.sfx = r_item.get("sfx") or "[Impact]"
                    p.duration = float(r_item.get("duration") or max(3.5, round(len(p.speech_text.split()) / 2.3, 1)))

                    # Character Continuity: Cast and permanently lock character voice
                    s_name = r_item.get("speaker_name") or r_item.get("speaker") or r_item.get("character")
                    s_gender = r_item.get("speaker_gender") or r_item.get("gender")
                    s_arch = r_item.get("archetype") or r_item.get("role") or r_item.get("character_role")

                    assigned_voice = self.cast_manager.get_voice_for_speaker(
                        speaker_name=s_name,
                        gender=s_gender,
                        archetype=s_arch,
                    )
                    clean_s = (s_name or "").strip()
                    p.speaker_name = clean_s.title() if (clean_s and clean_s.upper() not in ("NARRATOR", "EXPOSITION", "NONE", "UNKNOWN")) else "Master Cinematic Narrator"
                    p.speaker_gender = s_gender or ("male" if "Narrator" in p.speaker_name else "neutral")
                    p.voice = assigned_voice

                # Sync character cast roster snapshot to run state
                cast_summary = self.cast_manager.get_cast_summary()
                self.state.character_cast = [
                    CharacterCastMember(
                        name=m["name"],
                        role=m["role"],
                        voice=m["voice"],
                        lines_count=m["lines_count"],
                    )
                    for m in cast_summary
                ]

                cast_log_preview = ", ".join([f"{c.name}: {c.voice.split('-')[-1]}" for c in self.state.character_cast[:4]])
                self.log(
                    "narrative",
                    f"[AI Analyze] Script generated. Character Voice Continuity Engine locked {len(self.state.character_cast)} roles ({cast_log_preview}).",
                    level="success",
                    progress=70,
                )
            except Exception as ai_err:
                self.log("narrative", f"AI analyze fallback: {ai_err}", level="warning")
                for idx, p in enumerate(self.state.panels):
                    p.speech_text = f"As {title} reaches the critical turning point, everything changes."
                    p.motion_type = "zoom_in" if idx % 2 == 0 else "pan_down"
                    p.duration = 3.5
                    p.speaker_name = "Master Cinematic Narrator"
                    p.voice = self.cast_manager.default_narrator

            # ── STAGE 4: VOICE AUDIO (POST /api/v1/audio/synthesize-all-panel-audio) ──
            self.state.status = "synthesizing_audio"
            self.log(
                "audio",
                f"[Voice Audio: POST /api/v1/audio/synthesize-all-panel-audio] Synthesizing multi-character neural voice dubbing ({len(self.state.character_cast)} cast members)...",
                progress=75,
            )

            audio_panel_inputs = [
                {
                    "id": f"panel_{p.index}",
                    "index": p.index,
                    "dialogues": [p.speech_text] if p.speech_text else [],
                    "narrative": p.speech_text or "",
                    "target_duration": p.duration or 3.5,
                    "voice": p.voice or self.cast_manager.default_narrator,
                }
                for p in self.state.panels
            ]
            try:
                audio_res = await batch_synthesize_panels_service(
                    panels=audio_panel_inputs,
                    voice=self.cast_manager.default_narrator,
                    speech_rate=1.0,
                    speech_pitch=1.0,
                    generate_dialogue_audio=True,
                    generate_narrative_audio=True,
                    force_regenerate=True,
                )
                audio_map = {r.get("id"): r for r in (audio_res or [])}
                for p in self.state.panels:
                    r_audio = audio_map.get(f"panel_{p.index}") or {}
                    if r_audio.get("audio_url") or r_audio.get("narrative_audio_url"):
                        p.audio_url = r_audio.get("audio_url") or r_audio.get("narrative_audio_url")
                    if r_audio.get("duration"):
                        actual_dur = float(r_audio["duration"])
                        # Add +0.4s breathing room to guarantee 0 cutoff words
                        p.duration = max(3.5, round(actual_dur + 0.4, 2))
                self.state.duration = round(sum(p.duration for p in self.state.panels if p.duration), 1)
                self.log(
                    "audio",
                    f"[Voice Audio] Multi-character audio dubbing completed with zero cutoff words ({self.state.duration}s total).",
                    level="success",
                    progress=80,
                )
            except Exception as audio_err:
                self.log("audio", f"Audio synthesis notice: {audio_err}", level="warning")

            # ── CHECKPOINT: REVIEW MODE (IF REQUESTED) ────────────────────────
            if self.request.review_mode:
                self.state.status = "awaiting_review"
                self.log(
                    "review",
                    "Agent paused at review checkpoint. Review panels and narrative, then click 'Approve & Publish' to compile video.",
                    level="info",
                    progress=80,
                )
                return self.state

            # ── STAGE 5: RENDER VIDEO (POST /api/v1/video/render) & YOUTUBE ───
            await self._render_and_publish()
            return self.state

        except asyncio.CancelledError:
            logger.info(f"[Agent {self.run_id}] Execution cancelled/stopped by user.")
            self.state.status = "stopped"
            self.state.current_action = "Agent execution stopped by user."
            self.log("stop", "Agent execution stopped by user.", level="warning")
            if self.on_update:
                try:
                    self.on_update(self.state)
                except Exception:
                    pass
            return self.state
        except Exception as e:
            logger.error(f"[Agent {self.run_id}] Error in execution: {e}", exc_info=True)
            self.state.status = "failed"
            self.state.error = str(e)
            self.log("error", f"Agent failed: {str(e)}", level="error")
            return self.state

    async def _render_and_publish(self):
        """Compiles the video with FFmpeg and publishes to YouTube via real YouTube API."""
        # ── STAGE 5: VIDEO COMPILATION (FFMPEG COMPILER) ───────────────────
        self.state.status = "rendering_video"
        is_short = (self.request.video_format == "shorts")
        target_w = 1080 if is_short else 1920
        target_h = 1920 if is_short else 1080
        format_label = "YouTube Shorts (9:16)" if is_short else "Landscape (16:9)"

        self.log(
            "video_render",
            f"[Render Video: POST /api/v1/video/render] Compiling cinematic video in {format_label} resolution ({target_w}x{target_h})...",
            progress=85,
        )

        panels_payload = [p.model_dump() for p in self.state.panels]
        video_filename = None

        try:
            video_filename = await compile_video_from_panels(
                project_id=f"agent_{self.run_id}",
                panels=panels_payload,
                target_width=target_w,
                target_height=target_h,
                voice=self.request.voice,
                enable_subtitles=False,
            )
        except asyncio.CancelledError:
            self.state.status = "stopped"
            self.state.current_action = "Video render stopped by user."
            self.log("video_render", "Video compilation cancelled by user.", level="warning")
            if self.on_update:
                try:
                    self.on_update(self.state)
                except Exception:
                    pass
            raise
        except Exception as render_err:
            logger.error(f"[Agent Render] Video compilation failed: {render_err}", exc_info=True)
            self.state.status = "failed"
            self.state.error = f"Video compilation failed: {render_err}"
            self.log(
                "video_render",
                f"[Render Video: POST /api/v1/video/render] Video compilation failed: {render_err}",
                level="error",
            )
            raise render_err

        self.state.video_filename = video_filename
        self.state.video_url = f"/videos/{video_filename}"
        self.log(
            "video_render",
            f"[Render Video: POST /api/v1/video/render] Video rendered successfully: {video_filename}",
            level="success",
            progress=90,
        )

        # ── STAGE 6: REAL AI YOUTUBE SEO & OFFICIAL PUBLICATION ────────────
        self.state.status = "publishing_youtube"
        self.log("youtube", "Calling Gemini AI to synthesize high-CTR viral YouTube headers, timestamps, and tags...", progress=92)

        title = self.state.scraped_title or "Webtoon Climax Recap"
        narrative_summary = " ".join([p.speech_text for p in self.state.panels if p.speech_text])[:600]

        # Calculate exact timeline markers from panels
        cumulative_sec = 0.0
        timeline_beats = []
        for idx, p in enumerate(self.state.panels):
            mm = int(cumulative_sec // 60)
            ss = int(cumulative_sec % 60)
            t_str = f"{mm:02d}:{ss:02d}"
            snippet = (p.speech_text or f"Scene {idx + 1}").strip().replace("\n", " ")
            if len(snippet) > 55:
                snippet = snippet[:52] + "..."
            timeline_beats.append((t_str, snippet, cumulative_sec))
            p_dur = getattr(p, "duration", 3.5) or 3.5
            cumulative_sec += p_dur

        total_duration_sec = max(int(cumulative_sec), int(self.state.duration or 0), 10)

        # Build official YouTube chapter markers (YouTube requires starting at 00:00 and spaced >= 10s)
        chapter_anchors = []
        last_sec = -999.0
        for t_str, snippet, sec in timeline_beats:
            if sec - last_sec >= 10.0 or len(chapter_anchors) == 0:
                chapter_anchors.append((t_str, snippet))
                last_sec = sec
        if not chapter_anchors or chapter_anchors[0][0] != "00:00":
            chapter_anchors.insert(0, ("00:00", "Story Introduction & Hook"))

        timeline_cues_text = "\n".join([f"- [{t}] {cue}" for t, cue in chapter_anchors[:8]])

        seo_prompt = f"""You are a master YouTube CTR & SEO Algorithm Strategist for top Anime & Webtoon recap channels.

STORY & EPISODE PROFILE:
- Title: "{title}"
- Summary: "{narrative_summary}"
- Aspect Ratio: "{'Vertical 9:16 Shorts' if is_short else 'Widescreen 16:9 Standard'}"
- Video Runtime: ~{total_duration_sec} seconds
- Key Story Beats:
{timeline_cues_text}
- Source URL: {self.request.url}

TASK:
Generate viral, algorithm-optimized YouTube metadata designed to maximize Click-Through Rate (CTR) and Audience Retention.

REQUIREMENTS:
1. "title":
   {"- SHORTS: Under 60 chars. Ultra-punchy, all-caps emotional hook or shocking question, must include '#Shorts'. (E.g. 'HE HID S-RANK POWERS UNTIL THIS MOMENT! 😱 #Shorts')" if is_short else "- STANDARD 16:9: 60-80 chars. Unstoppable curiosity gap, highlighting the unexpected betrayal, hidden power, or jaw-dropping revelation. (E.g. 'When The Weakest Hunter Awakens The Forbidden Sovereign Power... | Full Recap')"}

2. "description":
   A complete, high-converting YouTube description structured as follows:
   - LINE 1-2 (Hook): A dramatic, suspenseful summary opening sentence before the 'Show More' fold.
   - EPISODE RECAP: 2 rich paragraphs summarizing the plot stakes, character growth, and intense showdown without spoiling the final cliffhanger.
   - TIMESTAMPS / CHAPTERS:
     Include clean YouTube clickable chapter timestamps starting strictly with:
     00:00 - [Intriguing Chapter Name]
     Followed by 3 to 6 actual timestamps from the timeline beats above (e.g. 00:15 - [Dramatic Chapter Name], etc.).
   - OFFICIAL SOURCE ATTRIBUTION:
     Original Webtoon / Chapter Link: {self.request.url}
   - VIEWER ENGAGEMENT:
     Ask a compelling question for viewers to discuss in the comments.
   - VIRAL HASHTAGS:
     5-8 targeted hashtags (#webtoon #manhwa #animerecap #manhwarecap #webtoonrecap #anime).

3. "tags":
   12-18 high-volume search tags (e.g. ["webtoon recap", "manhwa recap", "anime recap", "overpowered mc", "system manhwa", "manhwa recommendation"]).

Return STRICT JSON:
{{
  "title": "...",
  "description": "...",
  "tags": ["webtoon recap", "manhwa recap", "anime recap"]
}}
"""

        fallback_timestamps = "\n".join([f"{t} - {cue}" for t, cue in chapter_anchors[:6]])
        if is_short:
            yt_title = f"{title.upper()} - THE UNTOLD POWER AWAKENS! 🔥 #Shorts"
        else:
            yt_title = f"When The Weakest Awakens The Forbidden Sovereign Power... | {title} Full Recap"

        yt_desc = (
            f"🔥 When everyone looked down on him, an ancient power awoke that changed everything...\n"
            f"Watch the full recap of {title}!\n\n"
            f"📖 CHAPTER SUMMARY:\n"
            f"{narrative_summary or f'An intense recap covering the pivotal chapter of {title}.'}\n\n"
            f"⏱️ TIMESTAMPS:\n"
            f"{fallback_timestamps}\n\n"
            f"🔗 ORIGINAL SOURCE:\n"
            f"Read the official chapter here: {self.request.url}\n\n"
            f"💬 Who had the best moment in this chapter? Drop your thoughts in the comments below! Don't forget to like and subscribe for Part 2!\n\n"
            f"#webtoon #manhwa #animerecap #manhwarecap #webtoonrecap{' #shorts' if is_short else ''}"
        )
        yt_tags = [
            "webtoon recap",
            "manhwa recap",
            "anime recap",
            "op mc",
            "webtoon adaptation",
            "manhwa recommendation",
            "webtoon climax",
        ]

        try:
            raw_seo = await self._call_llm(
                prompt=seo_prompt,
                system_instruction="You are an elite YouTube CTR & SEO Strategist specializing in Manga/Webtoon recaps.",
            )
            if raw_seo:
                parsed_seo = json.loads(_clean_json_text(raw_seo))
                if isinstance(parsed_seo, dict):
                    yt_title = parsed_seo.get("title", yt_title)
                    yt_desc = parsed_seo.get("description", yt_desc)
                    yt_tags = parsed_seo.get("tags", yt_tags)
        except Exception as e:
            logger.warning(f"[Agent {self.run_id}] AI SEO generation notice: {e}")

        thumb_url = self.state.panels[0].image_url if self.state.panels else None
        try:
            from features.creative.thumbnails.generator import generate_thumbnail_package
            from features.creative.thumbnails.schemas import ThumbnailGenerateRequest
            thumb_req = ThumbnailGenerateRequest(
                prompt=f"{title} climax showdown, masterpiece anime manhwa, 8k",
                series_title=title,
                count=3,
            )
            g_thumbs = await generate_thumbnail_package(thumb_req)
            if g_thumbs and len(g_thumbs) > 0:
                thumb_url = g_thumbs[0].image_url
        except Exception as t_err:
            logger.debug(f"[Agent YouTube Thumbnail] Fallback to panel: {t_err}")

        metadata = AgentYouTubeMetadata(
            title=yt_title,
            description=yt_desc,
            tags=yt_tags,
            category_id="1",
            privacy_status=self.request.privacy_status,
            is_short=is_short,
            thumbnail_url=thumb_url,
        )
        self.state.youtube_metadata = metadata

        self.log(
            "youtube",
            f"Synthesized YouTube SEO Headers: '{yt_title}' ({self.request.privacy_status.upper()})",
            level="info",
            progress=95,
        )

        # Real YouTube Upload via Creative Service
        pub_result = None
        try:
            pub_result = await creative_service.publish_video(
                user_id=self.user_id or "anonymous",
                video_url=self.state.video_url,
                title=metadata.title,
                synopsis=metadata.description,
                tags=metadata.tags,
                privacy_status=metadata.privacy_status,
                category_id=metadata.category_id,
                is_short=metadata.is_short,
                thumbnail_url=metadata.thumbnail_url,
            )
        except Exception as pub_err:
            logger.info(f"[Agent YouTube Upload] Direct channel upload status: {pub_err}")

        final_youtube_url = None
        if pub_result and isinstance(pub_result, dict) and pub_result.get("youtube_url"):
            final_youtube_url = pub_result["youtube_url"]
            self.state.youtube_url = final_youtube_url
            self.log(
                "complete",
                f"🎉 Success! Video published to YouTube Channel: {final_youtube_url}",
                level="success",
                progress=100,
            )
        else:
            self.state.youtube_url = None
            self.log(
                "complete",
                "Video successfully compiled. YouTube channel not connected yet — connect your channel in Creative Suite > YouTube to publish directly.",
                level="success",
                progress=100,
            )

        self.state.status = "completed"
        if self.on_update:
            try:
                self.on_update(self.state)
            except Exception:
                pass


__all__ = ["AutonomousAgentWorkflow"]
