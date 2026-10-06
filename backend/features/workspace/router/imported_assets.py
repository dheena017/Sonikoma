"""
backend/features/workspace/router/imported_assets.py
─────────────────────────────────────────────────────────────────────────────
FastAPI router for project asset gallery, file uploads, and media management.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import shutil
import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException

from app.core.dependencies.auth import get_optional_current_user, get_current_user
from features.workspace.schemas import AssetListResponse, AssetUploadResponse, AssetDeleteResponse, AssetItem
from features.workspace.services.imported_assets_service import imported_assets_service, format_bytes, get_asset_type

logger = logging.getLogger("sonikoma.features.workspace.imported_assets")

router = APIRouter(prefix="/imported-assets", tags=["Workspace Imported Assets"])


@router.get(
    "/list/{project_id}",
    response_model=AssetListResponse,
    summary="List all media assets for a project",
    description="Returns files stored in project assets directory including images, audio, video, and reference files."
)
async def list_project_assets(
    project_id: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)
):
    return imported_assets_service.list_assets(project_id)


@router.post(
    "/upload/{project_id}",
    response_model=AssetUploadResponse,
    summary="Upload media asset to project library"
)
async def upload_project_asset(
    project_id: str,
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    target_dir = imported_assets_service.get_project_assets_dir(project_id)
    filename = file.filename or "uploaded_asset"
    safe_filename = os.path.basename(filename)
    dest_path = os.path.join(target_dir, safe_filename)

    try:
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        logger.error(f"[Imported Assets] Failed to write file {safe_filename}: {e}")
        raise HTTPException(status_code=500, detail="Failed to write uploaded asset to storage")

    size_bytes = os.path.getsize(dest_path)
    asset = AssetItem(
        id=safe_filename,
        name=safe_filename,
        asset_type=get_asset_type(safe_filename),
        url=f"/api/v1/storage/projects/{project_id}/assets/{safe_filename}",
        size_bytes=size_bytes,
        size_formatted=format_bytes(size_bytes),
        created_at=""
    )

    return AssetUploadResponse(
        success=True,
        asset=asset,
        message=f"Asset '{safe_filename}' uploaded successfully"
    )


@router.delete(
    "/{project_id}/{asset_id}",
    response_model=AssetDeleteResponse,
    summary="Delete media asset from project library"
)
async def delete_project_asset(
    project_id: str,
    asset_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    success = imported_assets_service.delete_asset(project_id, asset_id)
    if not success:
        raise HTTPException(status_code=404, detail="Asset not found")
    return AssetDeleteResponse(
        success=True,
        asset_id=asset_id,
        message=f"Asset '{asset_id}' deleted successfully"
    )


imported_assets_router = router

__all__ = ["router", "imported_assets_router"]
