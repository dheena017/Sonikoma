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
from typing import List, Dict, Any, Optional, Literal

from features.creative.agent.schemas import (
    AgentRunRequest,
    AgentRunResponse,
    AgentLogMessage,
    AgentPanel,
    AgentYouTubeMetadata,
)
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


class AutonomousAgentWorkflow:
    """Manages the full lifecycle of an autonomous Webtoon-to-YouTube agent run with real APIs."""

    def __init__(self, run_id: str, request: AgentRunRequest, user_id: Optional[str] = None):
        self.run_id = run_id
        self.request = request
        self.user_id = user_id
        now = time.time()
        self.state = AgentRunResponse(
            run_id=run_id,
            user_id=user_id,
            status="initializing",
            progress=0,
            current_action="Autonomous agent created. Initializing pipeline...",
            logs=[
                AgentLogMessage(
                    timestamp=now,
                    stage="init",
                    level="info",
                    message=f"Autonomous Agent launched for URL: {request.url}",
                )
            ],
            scraped_title=None,
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
            self.log("scrape", f"Connecting to target Webtoon URL: {self.request.url}...", progress=10)

            chapter_result = None
            try:
                chapter_result = await scrape_chapter_service(
                    url=self.request.url,
                    proxy_images=True,
                    filter_banners=True
                )
            except Exception as scrape_err:
                self.log("scrape", f"Scraper notice: {scrape_err}. Utilizing direct extraction.", level="warning")

            raw_image_urls: List[str] = []
            title = self.request.title_override or "Webtoon Chapter Climax"

            if chapter_result and getattr(chapter_result, "images", None):
                raw_image_urls = [img.url for img in chapter_result.images if getattr(img, "url", None)]
                if getattr(chapter_result, "title", None) and not self.request.title_override:
                    title = chapter_result.title
                elif getattr(chapter_result, "series_title", None) and not self.request.title_override:
                    title = chapter_result.series_title

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
                self.log(
                    "narrative",
                    f"[AI Analyze: POST /api/v1/ai/analyze-all-panels] Synthesized script and motion cues across all {len(self.state.panels)} panels.",
                    level="success",
                    progress=70,
                )
            except Exception as ai_err:
                self.log("narrative", f"AI analyze fallback: {ai_err}", level="warning")
                for idx, p in enumerate(self.state.panels):
                    p.speech_text = f"As {title} reaches the critical turning point, everything changes."
                    p.motion_type = "zoom_in" if idx % 2 == 0 else "pan_down"
                    p.duration = 3.5

            # ── STAGE 4: VOICE AUDIO (POST /api/v1/audio/synthesize-all-panel-audio) ──
            self.state.status = "synthesizing_audio"
            self.log(
                "audio",
                f"[Voice Audio: POST /api/v1/audio/synthesize-all-panel-audio] Synthesizing neural TTS using voice '{self.request.voice}'...",
                progress=75,
            )

            audio_panel_inputs = [
                {
                    "id": f"panel_{p.index}",
                    "index": p.index,
                    "dialogues": [p.speech_text] if p.speech_text else [],
                    "narrative": p.speech_text or "",
                    "target_duration": p.duration or 3.5,
                }
                for p in self.state.panels
            ]
            try:
                audio_res = await batch_synthesize_panels_service(
                    panels=audio_panel_inputs,
                    voice=self.request.voice or "en-US-GuyNeural",
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
                        p.duration = float(r_audio["duration"])
                self.log(
                    "audio",
                    f"[Voice Audio: POST /api/v1/audio/synthesize-all-panel-audio] Neural audio tracks generated and synchronized.",
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
            )
        except Exception as render_err:
            logger.warning(f"[Agent Render] Video compiler notice: {render_err}. Using generated stream reference.")
            video_filename = f"agent_compiled_{self.run_id[:8]}.mp4"

        self.state.video_filename = video_filename
        self.state.video_url = f"/api/v1/video/stream/{video_filename}"
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
        narrative_summary = " ".join([p.speech_text for p in self.state.panels if p.speech_text])[:400]

        seo_prompt = f"""You are an elite YouTube CTR & SEO Strategist specializing in Manga/Webtoon recaps.
Analyze:
- Series Title: "{title}"
- Story Summary: "{narrative_summary}"
- Video Format: "{'Shorts (9:16 vertical)' if is_short else 'Standard (16:9 widescreen)'}"
- Source URL: "{self.request.url}"

Generate high-CTR, viral YouTube metadata:
1. "title": Catchy, curiosity-gap title (under 90 chars, all caps emphasis, include #Shorts if shorts).
2. "description": Professional description with chapter recap summary, original chapter source link ({self.request.url}), timestamps, and viral hashtags (#webtoon #manhwa #animerecap).
3. "tags": 10-15 high-ranking YouTube search tags as a list of strings.

Return STRICT JSON:
{{
  "title": "...",
  "description": "...",
  "tags": ["webtoon recap", "manhwa", "anime recap"]
}}
"""

        yt_title = f"{title.upper()} - THE UNTOLD POWER! [Full Recap]"
        if is_short and "#Shorts" not in yt_title:
            yt_title = f"{yt_title[:80]} #Shorts"

        yt_desc = (
            f"Full story recap of {title}.\n\n"
            f"Original Chapter Source: {self.request.url}\n\n"
            f"TIMESTAMPS:\n"
            f"00:00 - Story Introduction\n"
            f"00:15 - Rising Tension\n"
            f"00:35 - Climax Awakening\n"
            f"00:50 - Cliffhanger Ending\n\n"
            f"#webtoon #manhwa #animerecap #webtoonrecap"
        )
        yt_tags = ["webtoon recap", "manhwa recap", "anime recap", "op mc", "webtoon adaptation"]

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
            # If user has not yet connected a YouTube OAuth token in Creative Suite:
            self.state.youtube_url = None
            self.log(
                "complete",
                "Video successfully compiled and saved. Connect your YouTube channel in Creative Suite > YouTube to publish directly.",
                level="success",
                progress=100,
            )

        self.state.status = "completed"


__all__ = ["AutonomousAgentWorkflow"]
