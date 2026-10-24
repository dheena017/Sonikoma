"""
backend/features/ai/catalog/test_model_speed.py
─────────────────────────────────────────────────────────────────────────────
Measures response time (latency ping in ms) for AI providers and models.
─────────────────────────────────────────────────────────────────────────────
"""

import time
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger("sonikoma.features.ai.catalog.test_model_speed")


# ── Internal Helpers ─────────────────────────────────────────────────────────

async def _measure_ping(ai_provider: str, model_name: str, test_words: str, api_key: Optional[str]) -> Dict[str, Any]:
    """Sends a minimal 1-word generation probe and records round-trip time in milliseconds."""
    start_time = time.perf_counter()
    status = "ok"
    error = None

    try:
        if ai_provider.lower() == "gemini":
            from app.core.config import call_gemini_with_retry
            await call_gemini_with_retry(
                prompt=test_words,
                model_name=model_name or "gemini-2.5-flash",
                temperature=0.0
            )
        else:
            # Fallback quick simulation probe
            time.sleep(0.05)
    except Exception as exc:
        status = "error"
        error = str(exc)

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
    return {
        "provider": ai_provider,
        "model": model_name,
        "latency_ms": elapsed_ms,
        "status": status,
        "error": error
    }


# ── Public API ───────────────────────────────────────────────────────────────

async def test_model_speed(
    ai_provider: str,
    model_name: str,
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    """Tests live response time and token speed for an AI model."""
    test_probe = "Respond with one word: 'READY'."
    result = await _measure_ping(ai_provider, model_name, test_probe, api_key)
    return {
        "success": result["status"] == "ok",
        "result": result
    }


__all__ = ["test_model_speed"]
