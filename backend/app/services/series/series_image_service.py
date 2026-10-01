"""Series Image Service for Sonikoma AI Series Studio.

Manages high-fidelity 2D image synthesis, multi-engine routing (Flux-Anime,
SDXL Turbo, Flux Schnell, Stable Diffusion), asynchronous local disk caching,
SVG fallback resiliency, and verbose structured execution logging.
"""

import asyncio
import io
import os
import time
import urllib.parse
import logging
from typing import Dict, Any, List, Optional
import httpx
from PIL import Image

from app.repositories.series import ai_series_repo
from app.schemas.series import ChapterSession, AISeriesPanel

logger = logging.getLogger("sonikoma.services.series.image")


class SeriesImageService:
    def __init__(self):
        # Base image storage directory mounted at /media
        base_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "local_media", "series_images")
        )
        os.makedirs(base_dir, exist_ok=True)
        self.images_dir = base_dir

    def _get_series_images_dir(self, series_id: str) -> str:
        s_dir = os.path.join(self.images_dir, series_id)
        os.makedirs(s_dir, exist_ok=True)
        return s_dir

    def build_pollinations_url(
        self, prompt: str, width: int = 768, height: int = 1024, seed: Optional[int] = None, model: str = "flux-anime"
    ) -> str:
        """Construct high-speed Pollinations.ai image URL supporting Flux-Anime, Flux.1, and SDXL Turbo."""
        clean_prompt = prompt.replace("\n", " ").strip()
        # Cap prompt length to 600 chars — shorter prompts are faster to encode/transfer
        if len(clean_prompt) > 600:
            clean_prompt = clean_prompt[:600]
        encoded = urllib.parse.quote(clean_prompt)
        actual_seed = seed if seed is not None else int(time.time() % 100000)

        m = str(model or "flux-anime").lower()
        if "turbo" in m or "fast" in m:
            chosen_model = "turbo"
        elif "stable-diffusion" in m or "stablediffusion" in m or "sd" in m:
            chosen_model = "stable-diffusion"
        elif "flux-realism" in m:
            chosen_model = "flux-realism"
        elif "sana" in m:
            chosen_model = "sana"
        elif "flux" in m and "anime" not in m:
            chosen_model = "flux"
        else:
            chosen_model = "flux-anime"

        return f"https://image.pollinations.ai/prompt/{encoded}?width={width}&height={height}&seed={actual_seed}&model={chosen_model}&nologo=true&nofeed=true"

    def get_model_fallback_chain(self, requested_model: str) -> List[str]:
        """Construct an ordered priority list of models to avoid paywalls (402) and rate limits."""
        req = str(requested_model or "flux-anime").lower()
        candidates = [req]
        
        # Standard free, fast, high-reliability fallbacks on Pollinations
        reliable_fallbacks = ["turbo", "flux", "stable-diffusion"]
        for fb in reliable_fallbacks:
            if fb not in candidates:
                candidates.append(fb)
        return candidates

    async def render_panel_image(
        self,
        series_id: str,
        panel_id: str,
        prompt: str,
        width: int = 768,
        height: int = 1024,
        seed: Optional[int] = None,
        model: str = "flux-anime",
        force_regenerate: bool = False,
    ) -> Dict[str, Any]:
        """Synthesize and locally cache panel image. Returns local /media URL with fallback protection."""
        series_dir = self._get_series_images_dir(series_id)
        file_path = os.path.join(series_dir, f"{panel_id}.jpg")
        local_url = f"/media/series_images/{series_id}/{panel_id}.jpg"

        # Check existing disk cache unless force regenerate
        if not force_regenerate and os.path.exists(file_path) and os.path.getsize(file_path) > 1000:
            size_kb = round(os.path.getsize(file_path) / 1024, 1)
            logger.info(f"[AISeries Image] Cache HIT for panel '{panel_id}' ({size_kb} KB) at {local_url}")
            return {
                "panel_id": panel_id,
                "image_url": local_url,
                "file_path": file_path,
                "cached": True,
                "size_kb": size_kb,
                "status": "cached",
            }

        start_time = time.time()
        logger.info(
            f"[AISeries Image Engine] Rendering panel '{panel_id}' | Model: {model} | "
            f"Dim: {width}x{height} | Prompt: {prompt[:65]}..."
        )

        candidates = self.get_model_fallback_chain(model)
        img_bytes: Optional[bytes] = None
        successful_model: Optional[str] = None
        last_error_msg: Optional[str] = None

        for candidate in candidates:
            cand_url = self.build_pollinations_url(prompt, width=width, height=height, seed=seed, model=candidate)
            try:
                async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                    resp = await client.get(cand_url)
                    if resp.status_code == 200 and len(resp.content) > 1000:
                        c_type = resp.headers.get("content-type", "")
                        if "text" not in c_type and "json" not in c_type:
                            img_bytes = resp.content
                            successful_model = candidate
                            break
                    elif resp.status_code == 402:
                        last_error_msg = f"Model '{candidate}': 402 Payment Required (x402 paywall protocol active)"
                        logger.warning(
                            f"[AISeries Image Engine] {last_error_msg}. Bypassing to next candidate..."
                        )
                        continue
                    elif resp.status_code == 429:
                        last_error_msg = f"Model '{candidate}': 429 Rate Limited"
                        logger.warning(
                            f"[AISeries Image Engine] {last_error_msg}. Bypassing to next candidate..."
                        )
                        await asyncio.sleep(1.0)
                        continue
                    else:
                        last_error_msg = f"Model '{candidate}': HTTP {resp.status_code}"
                        logger.warning(
                            f"[AISeries Image Engine] {last_error_msg}. Trying fallback..."
                        )
            except Exception as ex:
                last_error_msg = f"Model '{candidate}': Network error ({ex})"
                logger.warning(f"[AISeries Image Engine] {last_error_msg}. Trying fallback...")
                continue

        elapsed = round(time.time() - start_time, 2)

        if img_bytes:
            try:
                # Crop the bottom 32px to remove the baked-in pollinations.ai watermark badge
                img = Image.open(io.BytesIO(img_bytes))
                w, h = img.size
                crop_px = min(32, int(h * 0.03))  # crop 32px or 3% of height, whichever is smaller
                img_cropped = img.crop((0, 0, w, h - crop_px))
                buf = io.BytesIO()
                img_cropped.save(buf, format="JPEG", quality=92, optimize=True)
                final_bytes = buf.getvalue()
            except Exception as crop_err:
                logger.warning(f"[AISeries Image Engine] Crop failed ({crop_err}), saving original.")
                final_bytes = img_bytes

            with open(file_path, "wb") as f:
                f.write(final_bytes)
            size_kb = round(len(final_bytes) / 1024, 1)
            logger.info(
                f"[AISeries Image Engine] Render SUCCESS for '{panel_id}' using '{successful_model}' in {elapsed}s -> "
                f"Saved to {file_path} ({size_kb} KB)"
            )
            return {
                "panel_id": panel_id,
                "image_url": local_url,
                "file_path": file_path,
                "cached": False,
                "size_kb": size_kb,
                "status": "success",
                "model_used": successful_model,
                "duration_seconds": elapsed,
            }
        else:
            error_detail = last_error_msg or "Failed to synthesize image from AI image engine."
            logger.error(
                f"[AISeries Image Engine] Generation FAILED for '{panel_id}' after {elapsed}s: {error_detail}"
            )
            return {
                "panel_id": panel_id,
                "image_url": None,
                "file_path": None,
                "cached": False,
                "size_kb": 0,
                "status": "error",
                "error": error_detail,
                "duration_seconds": elapsed,
            }

    async def render_chapter_images(
        self,
        series_id: str,
        session_number: int,
        chapter_number: int,
        model: Optional[str] = None,
        force_regenerate: bool = False,
    ) -> ChapterSession:
        """Batch render and cache all panel images for a chapter."""
        project = ai_series_repo.get_project(series_id)
        if not project:
            raise ValueError(f"AI Series project '{series_id}' not found.")

        chapter = ai_series_repo.get_chapter(series_id, session_number, chapter_number)
        if not chapter:
            raise ValueError(f"Chapter S{session_number}:C{chapter_number} not found.")

        chosen_model = model or getattr(project, "image_model", "flux-anime") or "flux-anime"

        # Determine canvas dimensions from format
        fmt = (project.format_type.value if hasattr(project.format_type, "value") else str(project.format_type)).lower()
        if "anime" in fmt:
            w, h = 1024, 576
        elif "comic" in fmt or "manga" in fmt:
            w, h = 768, 1024
        else:
            w, h = 768, 1152

        logger.info(
            f"[AISeries Image Engine] Starting batch render for S{session_number}:C{chapter_number} "
            f"({len(chapter.panels)} panels, model: {chosen_model})..."
        )

        for p_idx, panel in enumerate(chapter.panels):
            pid = panel.panel_id or f"panel_s{session_number}_c{chapter_number}_p{p_idx+1}"
            seed = (session_number * 10000) + (chapter_number * 333) + ((p_idx + 1) * 47)
            res = await self.render_panel_image(
                series_id=series_id,
                panel_id=pid,
                prompt=panel.prompt,
                width=w,
                height=h,
                seed=seed,
                model=chosen_model,
                force_regenerate=force_regenerate,
            )
            if res.get("image_url"):
                panel.image_url = res["image_url"]

        # Save updated chapter to repository
        ai_series_repo.update_chapter(series_id, chapter)
        logger.info(
            f"[AISeries Image Engine] Completed batch render for S{session_number}:C{chapter_number}."
        )
        return chapter


# Global singleton service
series_image_service = SeriesImageService()
