"""
backend/features/image_editor/services/layer_separation/layer_storage.py
─────────────────────────────────────────────────────────────────────────────
Panel Layer Storage & Persistence Service:
- Cloud-native persistence: uploads multi-character layers to Supabase Storage
- Local developer persistence: writes layers to local media directory
- Generates uniform layer metadata schema and asset URLs
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, List

from database.config import MEDIA_DIR
from database.supabase import upload_to_supabase_bucket

logger = logging.getLogger("sonikoma.services.image.layer_separation.layer_storage")

ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower().strip()
LOCAL_MEDIA_ROOT = MEDIA_DIR
LOCAL_MEDIA_URL_PREFIX = "/media"


def persist_panel_layers(
    panel_id: str,
    bg_bytes: bytes,
    effects_bytes: bytes,
    text_bytes: bytes,
    sfx_bytes: bytes,
    char_layers: List[Dict[str, Any]],
    text_nodes: List[Dict[str, Any]],
    motion_presets: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Persists decomposed PNG layers either to Supabase (in production)
    or to the local media directory (in development).

    Args:
        panel_id: Unique panel identifier.
        bg_bytes: Encoded PNG background bytes.
        effects_bytes: Encoded PNG aura/effects bytes.
        text_bytes: Encoded PNG speech/dialogue bytes.
        sfx_bytes: Encoded PNG sound effects bytes.
        char_layers: List of individual character layer dicts.
        text_nodes: Structured OCR text nodes.
        motion_presets: Parallax 3D camera and depth config.

    Returns:
        Structured dictionary containing URLs for all layers, text nodes, and motion presets.
    """
    folder_prefix = f"layers/{panel_id}/"

    # Production Mode: Upload to Supabase Storage
    if ENVIRONMENT == "production":
        logger.info(f"[Layer Storage] ENVIRONMENT=production — uploading layers to Supabase (panel_id={panel_id})")
        bg_url = upload_to_supabase_bucket(bg_bytes, "panels", f"{folder_prefix}bg.png", "image/png") or ""
        effects_url = upload_to_supabase_bucket(effects_bytes, "panels", f"{folder_prefix}effects.png", "image/png") or ""
        sfx_url = upload_to_supabase_bucket(sfx_bytes, "panels", f"{folder_prefix}sfx.png", "image/png") or ""
        text_url = upload_to_supabase_bucket(text_bytes, "panels", f"{folder_prefix}text.png", "image/png") or ""

        char_urls: List[str] = []
        char_metadata: List[Dict[str, Any]] = []
        for c_item in char_layers:
            fname = c_item["filename"]
            c_url = upload_to_supabase_bucket(c_item["bytes"], "panels", f"{folder_prefix}{fname}", "image/png")
            if c_url is not None:
                char_urls.append(c_url)
                char_metadata.append({
                    "id": f"char_{c_item['char_num']}",
                    "name": c_item["name"],
                    "url": c_url,
                    "index": 2 + len(char_metadata),
                })

    # Development / Local Mode: Save to local filesystem
    else:
        local_panel_dir = os.path.join(LOCAL_MEDIA_ROOT, "panels", "layers", panel_id)
        os.makedirs(local_panel_dir, exist_ok=True)
        logger.info(f"[Layer Storage] ENVIRONMENT={ENVIRONMENT} — saving layers locally at {local_panel_dir}")

        local_files = {
            "bg.png": bg_bytes,
            "effects.png": effects_bytes,
            "sfx.png": sfx_bytes,
            "text.png": text_bytes,
        }
        for c_item in char_layers:
            local_files[c_item["filename"]] = c_item["bytes"]

        for fname, data_bytes in local_files.items():
            out_path = os.path.join(local_panel_dir, fname)
            with open(out_path, "wb") as f:
                f.write(data_bytes)

        bg_url = f"{LOCAL_MEDIA_URL_PREFIX}/panels/layers/{panel_id}/bg.png"
        effects_url = f"{LOCAL_MEDIA_URL_PREFIX}/panels/layers/{panel_id}/effects.png"
        sfx_url = f"{LOCAL_MEDIA_URL_PREFIX}/panels/layers/{panel_id}/sfx.png"
        text_url = f"{LOCAL_MEDIA_URL_PREFIX}/panels/layers/{panel_id}/text.png"

        char_urls = []
        char_metadata = []
        for c_item in char_layers:
            c_url = f"{LOCAL_MEDIA_URL_PREFIX}/panels/layers/{panel_id}/{c_item['filename']}"
            char_urls.append(c_url)
            char_metadata.append({
                "id": f"char_{c_item['char_num']}",
                "name": c_item["name"],
                "url": c_url,
                "index": 2 + len(char_metadata),
            })

    all_layers_meta = [
        {"id": "bg", "name": "Background Environment", "url": bg_url, "index": 0},
        {"id": "effects", "name": "Visual Effects & Aura", "url": effects_url, "index": 1},
    ] + char_metadata + [
        {"id": "sfx", "name": "Sound Effects & UI", "url": sfx_url, "index": 2 + len(char_metadata)},
        {"id": "text", "name": "Dialogue & Speech", "url": text_url, "index": 3 + len(char_metadata)},
    ]

    return {
        "background_url": bg_url,
        "effects_url": effects_url,
        "character_url": char_urls[0] if char_urls else "",
        "character_urls": char_urls,
        "sfx_url": sfx_url,
        "text_url": text_url,
        "text_nodes": text_nodes,
        "motion_presets": motion_presets,
        "all_layers": all_layers_meta,
    }


__all__ = ["persist_panel_layers"]
