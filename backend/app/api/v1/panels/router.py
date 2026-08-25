"""
backend/app/api/v1/panels/router.py
─────────────────────────────────────────────────────────────────────────────
Panel processing API routes: strip splitting, panel detection, and bounding boxes.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import json
import base64
import tempfile
import httpx
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Request, Depends, UploadFile, File, Form
from fastapi.responses import JSONResponse

from api.dependencies.auth import get_current_user
from schemas.scraper import SmartSplitRequest
from schemas.project import DetectPanelsBase64Request, PanelDetectionResponse
from services.image.processing.panel_splitter import split_vertical_strip_into_panels
from services.image.panel_detection.panel_detector import run_cv_detection
from services.image.utils.image_resolver import resolve_image_to_buffer
from services.jobs import job_manager, JobType, JobStage, JobStatusResponse

logger = logging.getLogger("sonikoma.api.panels")

panels_router = APIRouter()


def _detect_helper(image_path: str, params: dict) -> List[dict]:
    """Helper to execute CV & YOLO panel detection."""
    try:
        from PIL import Image
        with Image.open(image_path) as im:
            w, h = im.size
            if w < 10 or h < 10:
                return []
    except Exception:
        pass

    panels = run_cv_detection(
        image_path=image_path,
        sensitivity=params.get("sensitivity", 30.0),
        bg_mode=params.get("background_mode", "auto"),
        min_width_pct=params.get("min_width_pct", 0.15),
        min_height_px=params.get("min_height_px", 60),
        merge_threshold=params.get("merge_threshold", 20),
        aspect_ratio_str=params.get("aspect_ratio", "free"),
        canny_low=params.get("canny_low", 20),
        canny_high=params.get("canny_high", 100),
        close_kernel_size=params.get("close_kernel_size", 15),
        auto_split=params.get("auto_split", True),
        use_yolo=params.get("use_yolo", True),
    )
    for p in panels:
        if "w" not in p and "width" in p:
            p["w"] = p["width"]
        if "h" not in p and "height" in p:
            p["h"] = p["height"]
        if "width" not in p and "w" in p:
            p["width"] = p["w"]
        if "height" not in p and "h" in p:
            p["height"] = p["h"]
    return panels


# ─── 1. Vertical Strip Splitting (Background Job) ────────────────────────────

@panels_router.post(
    "/split",
    response_model=JobStatusResponse,
    operation_id="split_vertical_strip_panels",
    summary="Split tall vertical strip into discrete panels (Creates PANEL_SPLIT Job)",
    description="Asynchronously downloads and segments a continuous webtoon/manhwa strip into individual panel images."
)
async def split_strip_panels_endpoint(body: SmartSplitRequest, current_user: dict = Depends(get_current_user)):
    if not body.url or not body.url.strip():
        raise HTTPException(status_code=400, detail="Target image URL is required.")

    job = job_manager.create_job(
        job_type=JobType.PANEL_SPLIT,
        user_id=current_user["user_id"],
        project_id=body.project_id,
        metadata={"url": body.url, "min_panel_height": body.min_panel_height}
    )

    async def _split_coro(report_progress):
        report_progress(20.0, JobStage.FETCHING.value)
        img_res = await resolve_image_to_buffer(body.url)
        img_bytes = img_res.get("data")
        if not img_bytes:
            raise Exception("Failed to fetch image URL for splitting.")

        report_progress(50.0, JobStage.SPLITTING.value)
        split_buffers = split_vertical_strip_into_panels(
            img_bytes,
            min_panel_height=body.min_panel_height or 250
        )
        report_progress(100.0, JobStage.COMPLETED.value)
        return {
            "success": True,
            "original_url": body.url,
            "extracted_panels_count": len(split_buffers),
            "panels": [f"data:image/jpeg;base64,{base64.b64encode(b).decode('utf-8')}" for b in split_buffers[:50]]
        }

    job_manager.run_in_background(job.job_id, _split_coro)
    return job.to_status_response()


# ─── 2. Unified Panel Bounding Box Detection (File Upload & Base64 JSON) ──────

def _extract_params(data: dict) -> dict:
    """Extract and normalize panel detection parameters from dict or form."""
    def _get(keys, default):
        for k in keys:
            if k in data and data[k] is not None:
                return data[k]
        return default

    def _to_float(v, default: float) -> float:
        try:
            return float(v)
        except (ValueError, TypeError):
            return default

    def _to_int(v, default: int) -> int:
        try:
            return int(v)
        except (ValueError, TypeError):
            return default

    def _to_bool(v, default: bool) -> bool:
        if isinstance(v, bool):
            return v
        if isinstance(v, (int, float)):
            return bool(v)
        if isinstance(v, str):
            return v.lower() in ("true", "1", "yes")
        return default

    return {
        "sensitivity": _to_float(_get(["sensitivity"], 30.0), 30.0),
        "background_mode": str(_get(["background_mode", "backgroundColorMode", "backgroundMode"], "auto")),
        "min_width_pct": _to_float(_get(["min_width_pct", "minAreaPct", "min_area_pct"], 0.15), 0.15),
        "min_height_px": _to_int(_get(["min_height_px", "minHeightPx"], 60), 60),
        "merge_threshold": _to_int(_get(["merge_threshold", "mergeThreshold"], 20), 20),
        "aspect_ratio": str(_get(["aspect_ratio", "aspectRatio"], "free")),
        "canny_low": _to_int(_get(["canny_low", "cannyLow"], 20), 20),
        "canny_high": _to_int(_get(["canny_high", "cannyHigh"], 100), 100),
        "close_kernel_size": _to_int(_get(["close_kernel_size", "closeKernelSize"], 15), 15),
        "auto_split": _to_bool(_get(["auto_split", "autoSplit"], True), True),
        "use_yolo": _to_bool(_get(["use_yolo", "useYolo"], True), True),
    }


@panels_router.post(
    "/detect",
    operation_id="detect_panels_in_image",
    summary="Detect panel bounding boxes in a comic image (Unified File Upload & Base64/URL JSON)",
    description="Analyzes uploaded webtoon page, URL, or base64 JSON payload and detects individual panel bounding boxes via OpenCV and YOLO."
)
async def detect_panels_upload_endpoint(request: Request):
    content_type = request.headers.get("content-type", "").lower()

    # Scenario A: Multipart Form Upload
    if "multipart/form-data" in content_type:
        image_path = None
        try:
            form = await request.form()
            file = form.get("file")
            if file and hasattr(file, "read"):
                suffix = os.path.splitext(getattr(file, "filename", ".png"))[1] or ".png"
                with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                    tmp.write(await file.read())
                    image_path = tmp.name

            if not image_path:
                raise HTTPException(status_code=400, detail="No image file provided in form data.")

            params = _extract_params(dict(form))
            panels = _detect_helper(image_path, params)
            
            img_w, img_h = 0, 0
            try:
                from PIL import Image
                with Image.open(image_path) as im:
                    img_w, img_h = im.size
            except Exception:
                pass

            return JSONResponse(content={
                "success": True,
                "panels": panels,
                "count": len(panels),
                "total_panels": len(panels),
                "imageWidth": img_w,
                "imageHeight": img_h,
                "isTallStrip": (img_h > img_w * 2) if img_w else False,
                "fallback": False,
                "message": f"Detected {len(panels)} panel(s).",
            })
        except HTTPException:
            raise
        except Exception as exc:
            logger.error(f"Panel detection failed: {exc}", exc_info=True)
            raise HTTPException(status_code=500, detail=str(exc))
        finally:
            if image_path and os.path.exists(image_path):
                try:
                    os.remove(image_path)
                except OSError:
                    pass

    # Scenario B: JSON Payload (Base64, URL, or batch URLs)
    else:
        try:
            body_dict = await request.json()
        except Exception:
            body_bytes = await request.body()
            body_dict = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}

        params = _extract_params(body_dict)

        # Batch handling if 'urls' is provided
        urls = body_dict.get("urls")
        if isinstance(urls, list) and urls:
            results = []
            for url in urls:
                single_tmp = None
                try:
                    res = await resolve_image_to_buffer(url)
                    raw = res.get("data")
                    if not raw:
                        results.append({"url": url, "success": False, "error": "Failed to resolve image data.", "panels": []})
                        continue
                    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                        tmp.write(raw)
                        single_tmp = tmp.name
                    panels = _detect_helper(single_tmp, params)
                    results.append({
                        "url": url,
                        "success": True,
                        "panels": panels,
                        "count": len(panels),
                        "total_panels": len(panels),
                        "data": {
                            "success": True,
                            "panels": panels,
                            "count": len(panels),
                        }
                    })
                except Exception as e:
                    results.append({"url": url, "success": False, "error": str(e), "panels": []})
                finally:
                    if single_tmp and os.path.exists(single_tmp):
                        try:
                            os.remove(single_tmp)
                        except OSError:
                            pass
            return JSONResponse(content={"success": True, "results": results, "count": len(results)})

        # Single image detection (base64 or URL)
        image_path = None
        try:
            b64_str = body_dict.get("image_base64") or body_dict.get("base64") or body_dict.get("image")
            img_url = body_dict.get("image_url") or body_dict.get("url")

            if b64_str:
                if "," in b64_str:
                    b64_str = b64_str.split(",", 1)[1]
                try:
                    raw = base64.b64decode(b64_str)
                except Exception:
                    raise HTTPException(status_code=422, detail="Invalid base64 image data.")

                with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                    tmp.write(raw)
                    image_path = tmp.name
            elif img_url:
                try:
                    res = await resolve_image_to_buffer(img_url)
                    raw = res.get("data")
                    if not raw:
                        raise HTTPException(status_code=400, detail="Failed to resolve image data.")
                    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                        tmp.write(raw)
                        image_path = tmp.name
                except HTTPException:
                    raise
                except Exception as e:
                    logger.error(f"[Panel Detection] Failed to resolve image URL '{img_url}': {e}")
                    raise HTTPException(status_code=400, detail=f"Failed to fetch image: {str(e)}")
            else:
                raise HTTPException(status_code=422, detail="Must provide 'image_base64', 'image_url', 'url', or multipart 'file'.")

            logger.info(f"[Panel Detection] Processing panel detection")
            logger.debug(f"[DEBUG:PanelDetect] Params: {params}")
            panels = _detect_helper(image_path, params)
            logger.info(f"[Panel Detection] Successfully detected {len(panels)} panels.")
            for idx, p in enumerate(panels):
                logger.debug(f"[DEBUG:PanelDetect] Panel #{idx+1}: id={p.get('id')} at (x={p.get('x')}, y={p.get('y')}, w={p.get('width') or p.get('w')}, h={p.get('height') or p.get('h')})")

            img_w, img_h = 0, 0
            try:
                from PIL import Image
                with Image.open(image_path) as im:
                    img_w, img_h = im.size
            except Exception:
                pass

            logger.debug(f"[DEBUG:PanelDetect] Source Image Dimensions: {img_w}x{img_h}px | isTallStrip: {(img_h > img_w * 2) if img_w else False}")

            return JSONResponse(content={
                "success": True,
                "panels": panels,
                "count": len(panels),
                "total_panels": len(panels),
                "imageWidth": img_w,
                "imageHeight": img_h,
                "isTallStrip": (img_h > img_w * 2) if img_w else False,
                "fallback": False,
                "message": f"Detected {len(panels)} panel(s).",
            })
        except HTTPException:
            raise
        except Exception as exc:
            logger.error(f"Panel detection failed: {exc}", exc_info=True)
            raise HTTPException(status_code=500, detail=str(exc))
        finally:
            if image_path and os.path.exists(image_path):
                try:
                    os.remove(image_path)
                except OSError:
                    pass
