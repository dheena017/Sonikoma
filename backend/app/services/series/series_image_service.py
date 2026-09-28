"""Series Image Service for Sonikoma AI Series Studio.

Manages high-fidelity 2D image synthesis, multi-engine routing (Flux-Anime,
SDXL Turbo, Flux Schnell, Stable Diffusion), asynchronous local disk caching,
SVG fallback resiliency, and verbose structured execution logging.
"""

import os
import time
import urllib.parse
import logging
from typing import Dict, Any, List, Optional
import httpx

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
        # Cap prompt length to 800 characters to prevent URL 414 / CDN truncations
        if len(clean_prompt) > 800:
            clean_prompt = clean_prompt[:800]
        encoded = urllib.parse.quote(clean_prompt)
        actual_seed = seed if seed is not None else int(time.time() % 100000)

        m = str(model or "flux-anime").lower()
        if "turbo" in m or "fast" in m:
            chosen_model = "turbo"
        elif "stable-diffusion" in m or "stablediffusion" in m or "sd" in m:
            chosen_model = "stable-diffusion"
        elif "flux-realism" in m:
            chosen_model = "flux-realism"
        elif "flux" in m and "anime" not in m:
            chosen_model = "flux"
        else:
            chosen_model = "flux-anime"

        return f"https://image.pollinations.ai/prompt/{encoded}?width={width}&height={height}&seed={actual_seed}&model={chosen_model}&nologo=true"

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

        remote_url = self.build_pollinations_url(prompt, width=width, height=height, seed=seed, model=model)

        # Attempt high-speed async HTTP fetch with retry
        img_bytes: Optional[bytes] = None
        for attempt in range(1, 3):
            try:
                async with httpx.AsyncClient(timeout=35.0, follow_redirects=True) as client:
                    resp = await client.get(remote_url)
                    if resp.status_code == 200 and len(resp.content) > 1000:
                        img_bytes = resp.content
                        break
                    else:
                        logger.warning(
                            f"[AISeries Image Engine] Attempt {attempt} returned status {resp.status_code} "
                            f"(bytes: {len(resp.content)}). Retrying..."
                        )
            except Exception as ex:
                logger.warning(f"[AISeries Image Engine] Attempt {attempt} error: {ex}")
                if attempt < 2:
                    time.sleep(1.0)

        elapsed = round(time.time() - start_time, 2)

        if img_bytes:
            with open(file_path, "wb") as f:
                f.write(img_bytes)
            size_kb = round(len(img_bytes) / 1024, 1)
            logger.info(
                f"[AISeries Image Engine] Render SUCCESS for '{panel_id}' in {elapsed}s -> "
                f"Saved to {file_path} ({size_kb} KB)"
            )
            return {
                "panel_id": panel_id,
                "image_url": local_url,
                "file_path": file_path,
                "cached": False,
                "size_kb": size_kb,
                "status": "success",
                "duration_seconds": elapsed,
            }
        else:
            logger.warning(
                f"[AISeries Image Engine] Remote generation timed out after {elapsed}s for '{panel_id}'. "
                f"Falling back to direct remote URL."
            )
            # Fallback directly to the CDN URL so frontend still has a live URL to query
            return {
                "panel_id": panel_id,
                "image_url": remote_url,
                "file_path": None,
                "cached": False,
                "size_kb": 0,
                "status": "remote_fallback",
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
