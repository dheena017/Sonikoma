"""
backend/features/image/router/layers.py
─────────────────────────────────────────────────────────────────────────────
Panel Layer Separation Router:
- AI Layer Decomposition: Background, character(s), aura/effects, text, and SFX
- Chronological OCR, SAM/U-2-Net mask isolation, and inpainting
- Multi-panel strip and single-panel decomposition
─────────────────────────────────────────────────────────────────────────────
"""

import os
import uuid
import base64
import logging
import tempfile
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException

from features.image.schemas import ProcessLayersRequest
from features.image.layer_separation import (
    process_layers,
    extract_panel_layers_service,
)
from features.image.layer_separation.inpainting import create_blank_webp
import features.image.utils as img_utils

logger = logging.getLogger("sonikoma.features.image.router.layers")
router = APIRouter()


def _create_fallback_layers(url: str) -> Dict[str, Any]:
    """Generates transparent placeholder fallback layers if AI separation fails."""
    blank_data_url = f"data:image/webp;base64,{base64.b64encode(create_blank_webp(100, 100)).decode('utf-8')}"
    return {
        "background_url": url,
        "character_url": blank_data_url,
        "text_url": blank_data_url,
    }


@router.post("/process-layers/{panel_id}", summary="Process and decompose comic panel into layers")
@router.post("/process-layers", summary="Process and decompose comic panel into layers")
async def process_layers_endpoint(
    body: ProcessLayersRequest,
    panel_id: Optional[str] = None,
):
    """
    Decomposes a panel image into layered components:
    - Background environment layer
    - Isolated character layer(s)
    - Speech & dialogue text layer
    - Visual effects & SFX layers
    """
    target_panel_id = (
        str(panel_id)
        if panel_id is not None
        else (str(body.panel_id) if body.panel_id else uuid.uuid4().hex[:8])
    )

    if not body.url or not body.url.strip():
        raise HTTPException(status_code=400, detail="Missing image URL")

    # 1. Resolve image buffer from URL / path / base64
    try:
        resolved = await img_utils.resolve_image_to_buffer(body.url)
        data_bytes = resolved.get("data")
        if not data_bytes:
            raise ValueError("Empty image buffer resolved from URL")
    except Exception as exc:
        logger.error(f"[process-layers] Error resolving image from '{body.url}': {exc}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Failed to resolve image URL: {str(exc)}")

    # 2. Save to temporary file for CV2 & PyTorch models
    tmp_path: Optional[str] = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp.write(data_bytes)
            tmp_path = tmp.name

        # 3. Multi-panel split mode vs direct single-panel separation
        if body.split_panels:
            result = await extract_panel_layers_service(target_panel_id, tmp_path)
            return result
        else:
            try:
                layers_data = await process_layers(tmp_path, target_panel_id)
                return {
                    "success": True,
                    "panel_id": target_panel_id,
                    "layers": layers_data,
                }
            except Exception as proc_err:
                logger.warning(
                    f"[process-layers] AI Separation failed for panel {target_panel_id}: {proc_err}. Using fallback.",
                    exc_info=True,
                )
                fallback = _create_fallback_layers(body.url)
                return {
                    "success": True,
                    "panel_id": target_panel_id,
                    "layers": fallback,
                    "warning": f"AI layer separation fallback: {str(proc_err)}",
                }
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass
