"""
backend/app/services/image/panel_detection/detect_upload_service.py
─────────────────────────────────────────────────────────────────────────────
Orchestrator Service for Multipart File Uploads:
- Reads uploaded file bytes directly in memory
- Executes layout classification and appropriate panel detection
- Returns standardized PanelDetectionResponse
─────────────────────────────────────────────────────────────────────────────
"""

import io
import time
import logging
from PIL import Image
from fastapi import UploadFile

from schemas.project import (
    PanelDetectionResponse,
    DetectSmallPanelsRequest,
    DetectLongPanelsRequest
)
from services.image.panel_detection.detect_small_panels_service import detect_small_panels_boxes
from services.image.panel_detection.detect_long_panels_service import detect_long_panels_boxes

logger = logging.getLogger("sonikoma.services.panel_detection.upload")


async def detect_upload_panels(file: UploadFile) -> PanelDetectionResponse:
    """Processes uploaded multipart file in-memory."""
    start_time = time.perf_counter()

    raw_bytes = await file.read()
    if not raw_bytes:
        raise ValueError("Uploaded file is empty.")

    with Image.open(io.BytesIO(raw_bytes)) as pil_img:
        img_w, img_h = pil_img.size
        aspect_ratio = img_h / float(max(1, img_w))

    is_tall = aspect_ratio >= 2.2

    if is_tall:
        # Long panels detection
        import base64
        b64 = base64.b64encode(raw_bytes).decode("utf-8")
        req = DetectLongPanelsRequest(image_base64=b64)
        res = await detect_long_panels_boxes(req)

        return PanelDetectionResponse(
            success=True,
            panels=res.panels,
            count=len(res.panels),
            total_panels=res.total_panels,
            imageWidth=img_w,
            imageHeight=img_h,
            isTallStrip=True,
            fallback=False,
            total_speech_bubbles_count=res.total_speech_bubbles_count,
            message=f"Detected {len(res.panels)} panels in tall strip."
        )
    else:
        # Small panels detection
        import base64
        b64 = base64.b64encode(raw_bytes).decode("utf-8")
        req = DetectSmallPanelsRequest(image_base64=b64)
        res = await detect_small_panels_boxes(req)

        panels_list = [res.panel] if res.panel else res.panels
        return PanelDetectionResponse(
            success=True,
            panels=panels_list,
            count=len(panels_list),
            total_panels=len(panels_list),
            imageWidth=img_w,
            imageHeight=img_h,
            isTallStrip=False,
            fallback=False,
            total_speech_bubbles_count=res.total_speech_bubbles_count,
            message=f"Detected tight frame on small image with {res.total_speech_bubbles_count} dialogue bubbles."
        )
