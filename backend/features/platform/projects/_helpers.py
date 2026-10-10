"""
backend/app/api/v1/projects/_helpers.py
─────────────────────────────────────────────────────────────────────────────
Shared utilities and formatters used across project sub-modules.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Any
from urllib.parse import quote

from database.utils import unwrap_proxy_url


def wrap_proxy_url(url_str: str) -> str:
    """Ensure external image URLs are routed through the backend proxy."""
    cleaned = unwrap_proxy_url(url_str)
    if not cleaned:
        return ""
    if cleaned.startswith("http") and "/api/" not in cleaned:
        return f"/api/v1/proxy/image?url={quote(cleaned)}"
    return cleaned


def build_panel_dicts(panels: List[Any], include_original: bool = False) -> List[dict]:
    """Build DB-ready panel dicts from schema objects or raw dicts."""
    if not panels:
        return []

    built = []
    for p in panels:
        image_url = getattr(p, "image_url", None) if not isinstance(p, dict) else p.get("image_url")
        image_b64 = getattr(p, "image_base64", None) if not isinstance(p, dict) else p.get("image_base64")
        prompt = getattr(p, "prompt", None) if not isinstance(p, dict) else p.get("prompt")
        bbox = getattr(p, "bbox", None) if not isinstance(p, dict) else p.get("bbox")

        item = {
            "image_url": image_url or "",
            "image_base64": image_b64 if include_original else None,
            "prompt": prompt or "",
            "bbox": bbox,
        }
        built.append(item)

    return built
