"""
backend/app/api/v1/projects/panels.py
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Project Panels & Detection routes:
- POST /{projectId}/panels â€“ Save storyboard panels for a project
- POST /detect             â€“ Detect comic bounding boxes (Multipart File upload)
- POST /detect-base64      â€“ Detect comic bounding boxes (Base64 payload)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
"""

import os
import base64
import tempfile
import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Path, Body, Depends, Request, UploadFile, File, Form, Query
from fastapi.responses import JSONResponse

try:
    from app.core.dependencies.auth import get_current_user
    from features.platform.projects.schemas_project import PanelsSaveRequest, DetectPanelsBase64Request
    from features.platform.projects.repositories import get_project, get_project_by_slug
    from features.auth.repositories import write_audit_log
    from features.platform.projects.services.project_service import ProjectService
    from features.image_editor.services.panel_detection.panel_detector import run_cv_detection
except ImportError:
    from app.core.dependencies.auth import get_current_user
    from features.platform.projects.schemas_project import PanelsSaveRequest, DetectPanelsBase64Request
    from features.platform.projects.repositories import get_project, get_project_by_slug
    from features.auth.repositories import write_audit_log
    from features.platform.projects.services.project_service import ProjectService
    from features.image_editor.services.panel_detection.panel_detector import run_cv_detection

logger = logging.getLogger("sonikoma.routes.projects.panels")
router = APIRouter()
project_service = ProjectService()


# â”€â”€ Save Project Panels â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@router.post("/{projectId}/panels", summary="Save storyboard panels for a project")
async def save_project_panels_endpoint(
    request: Request,
    projectId: str = Path(..., description="Target Chapter/Episode Project ID"),
    body: PanelsSaveRequest = Body(...),
    job_id: Optional[str] = Query(None, description="Workspace Job ID for ownership verification"),
    current_user: dict = Depends(get_current_user),
):
    try:
        project = get_project(projectId)
        if not project:
            project = get_project_by_slug(projectId)
            if project:
                projectId = project["project_id"]

        # Enforce job_id ownership boundary when caller supplies one
        if job_id and project:
            stored_job_id = project.get("job_id")
            if stored_job_id and stored_job_id != job_id:
                raise HTTPException(
                    status_code=400,
                    detail=f"job_id mismatch: panels belong to job '{stored_job_id}', not '{job_id}'.",
                )

        try:
            result = project_service.save_project_panels(
                projectId,
                body.panels,
                current_user["user_id"],
                audit_logger=write_audit_log,
                request_client=request.client.host if request.client else "127.0.0.1",
            )
        except ValueError as exc:
            logger.warning(f"[Database] Cannot save panels, project {projectId} not found.")
            raise HTTPException(status_code=404, detail="Project not found.") from exc
        except PermissionError as exc:
            raise HTTPException(status_code=403, detail="Access denied.") from exc

        logger.info(f"[Database] Saved {len(body.panels)} panels for project: {projectId}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to save panels: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to save panels: {e}")


# â”€â”€ Panel Detection Helpers & Endpoints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _detect(image_path: str, params: dict) -> List[dict]:
    return run_cv_detection(
        image_path=image_path,
        sensitivity=params["sensitivity"],
        bg_mode=params["background_mode"],
        min_width_pct=params["min_width_pct"],
        min_height_px=params["min_height_px"],
        merge_threshold=params["merge_threshold"],
        aspect_ratio_str=params["aspect_ratio"],
        canny_low=params["canny_low"],
        canny_high=params["canny_high"],
        close_kernel_size=params["close_kernel_size"],
        auto_split=params.get("auto_split", True),
        use_yolo=params.get("use_yolo", True),
    )


@router.post("/detect", summary="Detect panel bounding boxes in a comic image (file upload)")
async def detect_panels_upload(
    file: UploadFile = File(..., description="Comic/webtoon image file"),
    sensitivity: float = Form(30.0),
    background_mode: str = Form("auto"),
    min_width_pct: float = Form(0.15),
    min_height_px: int = Form(60),
    merge_threshold: int = Form(20),
    aspect_ratio: str = Form("free"),
    canny_low: int = Form(20),
    canny_high: int = Form(100),
    close_kernel_size: int = Form(5),
    auto_split: bool = Form(True),
    use_yolo: bool = Form(True),
):
    tmp_path = None
    try:
        suffix = os.path.splitext(file.filename or "image.png")[1] or ".png"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp_path = tmp.name
            content = await file.read()
            tmp.write(content)

        params = {
            "sensitivity": sensitivity,
            "background_mode": background_mode,
            "min_width_pct": min_width_pct,
            "min_height_px": min_height_px,
            "merge_threshold": merge_threshold,
            "aspect_ratio": aspect_ratio,
            "canny_low": canny_low,
            "canny_high": canny_high,
            "close_kernel_size": close_kernel_size,
            "auto_split": auto_split,
            "use_yolo": use_yolo,
        }
        panels = _detect(tmp_path, params)
        return {"success": True, "count": len(panels), "panels": panels}
    except Exception as e:
        logger.error(f"Panel detection failed: {e}", exc_info=True)
        return JSONResponse(status_code=500, content={"success": False, "detail": str(e), "panels": []})
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass


@router.post("/detect-base64", summary="Detect panel bounding boxes from a base64-encoded image")
async def detect_panels_base64(body: DetectPanelsBase64Request):
    tmp_path = None
    try:
        data = body.image_base64
        if "," in data:
            data = data.split(",", 1)[1]
        raw_bytes = base64.b64decode(data)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
            tmp_path = tmp.name
            tmp.write(raw_bytes)

        params = {
            "sensitivity": body.sensitivity,
            "background_mode": body.background_mode,
            "min_width_pct": body.min_width_pct,
            "min_height_px": body.min_height_px,
            "merge_threshold": body.merge_threshold,
            "aspect_ratio": body.aspect_ratio,
            "canny_low": body.canny_low,
            "canny_high": body.canny_high,
            "close_kernel_size": body.close_kernel_size,
            "auto_split": getattr(body, "auto_split", True),
            "use_yolo": getattr(body, "use_yolo", True),
        }
        panels = _detect(tmp_path, params)
        return {"success": True, "count": len(panels), "panels": panels}
    except Exception as e:
        logger.error(f"Base64 panel detection failed: {e}", exc_info=True)
        return JSONResponse(status_code=500, content={"success": False, "detail": str(e), "panels": []})
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass

