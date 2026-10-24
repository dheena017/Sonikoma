"""
backend/features/ai/catalog/list_models.py
─────────────────────────────────────────────────────────────────────────────
Discovers and lists available AI models across providers.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
from typing import Optional, Dict, Any, List

logger = logging.getLogger("sonikoma.features.ai.catalog.list_models")


# ── Internal Helpers ─────────────────────────────────────────────────────────

def _resolve_provider_key(provider: str, api_key: Optional[str]) -> Optional[str]:
    """Finds API key from argument or environment variables."""
    if api_key and api_key.strip():
        return api_key.strip()
    key_map = {
        "gemini": "GEMINI_API_KEY",
        "openai": "OPENAI_API_KEY",
        "anthropic": "ANTHROPIC_API_KEY",
        "deepseek": "DEEPSEEK_API_KEY",
        "groq": "GROQ_API_KEY",
        "huggingface": "HUGGINGFACE_API_KEY",
    }
    env_var = key_map.get(provider.lower())
    return os.getenv(env_var) if env_var else None


async def _fetch_gemini_models(api_key: str) -> List[Dict[str, Any]]:
    """Queries Google Gemini model listing API."""
    from google import genai
    client = genai.Client(api_key=api_key)
    models = list(client.models.list())
    results = []
    for m in models:
        raw_name = m.name or ""
        clean_name = raw_name.replace("models/", "")
        lower = clean_name.lower()

        if any(k in lower for k in ["imagen", "veo", "banana"]):
            category = "Image & Video"
        elif any(k in lower for k in ["tts", "audio", "omni"]):
            category = "Audio & Speech"
        elif "embedding" in lower:
            category = "Embeddings"
        else:
            category = "Text & Multimodal"

        results.append({
            "name": clean_name,
            "displayName": getattr(m, "display_name", None) or clean_name,
            "description": getattr(m, "description", "") or "",
            "category": category,
            "inputTokenLimit": getattr(m, "input_token_limit", None),
            "outputTokenLimit": getattr(m, "output_token_limit", None),
        })
    return results


async def _fetch_openai_models(api_key: str) -> List[Dict[str, Any]]:
    """Queries OpenAI model listing endpoint."""
    import requests
    headers = {"Authorization": f"Bearer {api_key}"}
    res = requests.get("https://api.openai.com/v1/models", headers=headers, timeout=10)
    if res.status_code != 200:
        raise ValueError(f"OpenAI error {res.status_code}: {res.text}")
    data = res.json().get("data", [])
    results = []
    for m in data:
        model_id = m.get("id", "")
        results.append({
            "name": model_id,
            "displayName": model_id,
            "description": f"OpenAI model owned by {m.get('owned_by', 'openai')}",
            "category": "Text & Vision",
        })
    return results


# ── Public API ───────────────────────────────────────────────────────────────

async def get_all_ai_models(
    ai_provider: str,
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    """Returns all available models and their token limits for the chosen provider."""
    provider = ai_provider.lower().strip()
    resolved_key = _resolve_provider_key(provider, api_key)

    if not resolved_key and provider != "pollinations":
        return {
            "success": False,
            "error": f"No API key found for provider '{provider}'. Please check vault or server settings."
        }

    try:
        if provider == "gemini":
            models = await _fetch_gemini_models(resolved_key)
            return {"success": True, "provider": "gemini", "total": len(models), "models": models}
        elif provider == "openai":
            models = await _fetch_openai_models(resolved_key)
            return {"success": True, "provider": "openai", "total": len(models), "models": models}
        else:
            # Fallback to catalog registry
            from ai_engine.providers.catalog import PROVIDER_CATALOG
            catalog_entry = PROVIDER_CATALOG.get(provider, {})
            model_list = catalog_entry.get("models", [])
            return {"success": True, "provider": provider, "total": len(model_list), "models": model_list}
    except Exception as exc:
        logger.error(f"Failed to fetch models for {provider}: {exc}")
        return {"success": False, "error": str(exc), "provider": provider}


__all__ = ["get_all_ai_models"]
