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

from common.image import create_svg_placeholder
from features.intelligence.series.repositories import ai_series_repo
from features.intelligence.series.schemas import ChapterSession, AISeriesPanel
from ai_engine.core.orchestrator import AIOrchestrator

logger = logging.getLogger("sonikoma.services.series.image")


class SeriesImageService:
    def __init__(self):
        # Base image storage directory mounted at /media
        base_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "data", "local_media", "series_images")
        )
        os.makedirs(base_dir, exist_ok=True)
        self.images_dir = base_dir

    def _get_series_images_dir(self, series_id: str) -> str:
        s_dir = os.path.join(self.images_dir, series_id)
        os.makedirs(s_dir, exist_ok=True)
        return s_dir

    def build_pollinations_url(
        self, prompt: str, width: int = 768, height: int = 1024, seed: Optional[int] = None, model: Optional[str] = None
    ) -> str:
        """Construct high-speed Pollinations.ai image URL supporting dynamic AI Core model cascade."""
        clean_prompt = prompt.replace("\n", " ").strip()
        # Cap prompt length to 600 chars — shorter prompts are faster to encode/transfer
        if len(clean_prompt) > 600:
            clean_prompt = clean_prompt[:600]

        target_model = model or AIOrchestrator.resolve_model_for_task("image_diffusion", "primary")

        encoded_prompt = urllib.parse.quote(clean_prompt)
        url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&nologo=true&enhance=false"
        if seed is not None:
            url += f"&seed={seed}"
        if target_model:
            url += f"&model={target_model}"
        return url

    def build_svg_fallback(self, title: str, subtitle: str, color_hex: str = "#6366F1", width: int = 768, height: int = 1024) -> str:
        """Generate high-contrast, polished SVG visual fallback placeholder."""
        return create_svg_placeholder(title=title, subtitle=subtitle, width=width, height=height, color_hex=color_hex)

    async def fetch_and_save_image(
        self,
        image_url: str,
        series_id: str,
        panel_id: str,
        timeout: float = 60.0
    ) -> Optional[str]:
        """Fetch remote synthetic image bytes via HTTP, save to local disk, and return web URL path."""
        s_dir = self._get_series_images_dir(series_id)
        filename = f"{panel_id}.png"
        filepath = os.path.join(s_dir, filename)

        try:
            async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
                res = await client.get(image_url)
                if res.status_code == 200 and len(res.content) > 1024:
                    with open(filepath, "wb") as f:
                        f.write(res.content)
                    return f"/media/series_images/{series_id}/{filename}"
                else:
                    logger.warning(
                        f"[SeriesImageService] HTTP {res.status_code} fetching panel {panel_id} image. Size: {len(res.content)} bytes."
                    )
        except Exception as e:
            logger.warning(f"[SeriesImageService] Network error saving image for panel {panel_id}: {e}")

        return None

    async def render_panel_image(
        self,
        series_id: str,
        panel: Optional[Any] = None,
        panel_id: Optional[str] = None,
        prompt: Optional[str] = None,
        width: int = 768,
        height: int = 1024,
        model: Optional[str] = None,
        save_local: bool = True,
        force_regenerate: bool = False,
    ) -> Any:
        """Render a single panel image using Pollinations URL with optional local caching and SVG fallback."""
        actual_panel_id = panel_id or (getattr(panel, "panel_id", None) or getattr(panel, "id", None) or "panel")
        actual_prompt = prompt or (
            getattr(panel, "image_prompt", None)
            or getattr(panel, "prompt", None)
            or getattr(panel, "description", None)
            or "Dynamic 2D manhwa panel, detailed anime illustration"
        )

        seed = int(time.time() * 1000) % 1000000 if force_regenerate else None
        url = self.build_pollinations_url(actual_prompt, width=width, height=height, model=model, seed=seed)

        final_url = url
        if save_local:
            local_url = await self.fetch_and_save_image(url, series_id, actual_panel_id, timeout=45.0)
            if local_url:
                final_url = local_url

        if panel and hasattr(panel, "image_url"):
            panel.image_url = final_url

        # Return dict if requested via single panel endpoint
        if panel_id is not None or prompt is not None or force_regenerate:
            return {
                "status": "success",
                "image_url": final_url,
                "panel_id": actual_panel_id,
                "prompt": actual_prompt,
            }

        return final_url

    async def render_chapter_panels_batch(
        self,
        series_id: str,
        chapter: ChapterSession,
        concurrency: int = 3,
        save_local: bool = True
    ) -> Dict[str, Any]:
        """Asynchronously render all panels in a chapter using a bounded concurrency semaphore."""
        sem = asyncio.Semaphore(concurrency)
        total = len(chapter.panels)
        rendered = 0
        failed = 0

        async def _worker(panel: AISeriesPanel):
            nonlocal rendered, failed
            async with sem:
                try:
                    await self.render_panel_image(series_id, panel, save_local=save_local)
                    rendered += 1
                except Exception as e:
                    logger.error(f"[SeriesImageService] Error rendering panel {panel.id}: {e}")
                    panel.image_url = self.build_svg_fallback(
                        f"Panel {panel.panel_number}",
                        panel.dialogue[:50] if panel.dialogue else "Visual placeholder"
                    )
                    failed += 1

        tasks = [_worker(p) for p in chapter.panels]
        await asyncio.gather(*tasks)

        # Persist updated panels back to database
        ai_series_repo.save_chapter(chapter)
        logger.info(
            f"[SeriesImageService] Batch render complete for chapter {chapter.id}: "
            f"{rendered}/{total} rendered, {failed} fallbacks."
        )

        return {
            "status": "completed",
            "series_id": series_id,
            "chapter_id": chapter.id,
            "total_panels": total,
            "rendered": rendered,
            "failed": failed
        }


series_image_service = SeriesImageService()
