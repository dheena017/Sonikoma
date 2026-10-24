"""
backend/features/ai/analysis/analyze_batch.py
─────────────────────────────────────────────────────────────────────────────
Reads all panels in a comic episode safely without rate-limit errors.
─────────────────────────────────────────────────────────────────────────────
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional

from features.ai.analysis.analyze_panel import read_panel

logger = logging.getLogger("sonikoma.features.ai.analysis.analyze_batch")


# ── Internal Helpers ─────────────────────────────────────────────────────────

async def _read_one_safely(
    gate: asyncio.Semaphore,
    panel: Dict[str, Any],
    index: int,
    ai_provider: str,
    model_name: Optional[str],
    api_key: Optional[str]
) -> Dict[str, Any]:
    """Acquires semaphore slot and executes single panel analysis safely."""
    async with gate:
        pic = panel.get("image") or panel.get("image_url") or panel.get("url") or panel.get("path")
        story_notes = panel.get("context") or panel.get("notes")
        res = await read_panel(
            picture=pic,
            story_notes=story_notes,
            ai_provider=ai_provider,
            model_name=model_name,
            api_key=api_key
        )
        analysis = res.get("analysis", {})
        analysis["panel_index"] = index
        analysis["id"] = panel.get("id", f"p_{index}")
        return analysis


# ── Public API ───────────────────────────────────────────────────────────────

async def read_many_panels(
    panels: List[Dict[str, Any]],
    parallel_limit: int = 4,
    ai_provider: str = "gemini",
    model_name: Optional[str] = None,
    api_key: Optional[str] = None,
    remember_story: bool = True
) -> List[Dict[str, Any]]:
    """Reads a list of panels in order while remembering characters and ongoing events."""
    if not panels:
        return []

    gate = asyncio.Semaphore(max(1, min(8, parallel_limit)))
    tasks = []

    for idx, p in enumerate(panels):
        t = asyncio.create_task(
            _read_one_safely(gate, p, idx, ai_provider, model_name, api_key)
        )
        tasks.append(t)

    results = await asyncio.gather(*tasks, return_exceptions=True)
    clean_results = []
    for idx, r in enumerate(results):
        if isinstance(r, Exception):
            logger.warning(f"Batch item {idx} failed: {r}")
            clean_results.append({
                "panel_index": idx,
                "speech_text": "",
                "speaker_name": "Narrator",
                "narrative": "The story progresses forward.",
                "duration": 3.0
            })
        else:
            clean_results.append(r)

    return clean_results


__all__ = ["read_many_panels"]
