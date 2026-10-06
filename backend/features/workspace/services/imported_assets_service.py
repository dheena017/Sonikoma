"""
backend/features/workspace/services/imported_assets_service.py
─────────────────────────────────────────────────────────────────────────────
Service layer for project imported assets storage, discovery, and file management.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import uuid
import datetime
import logging
from typing import List, Dict, Any, Optional

from app.core.config import STORAGE_DIR
from features.workspace.schemas import AssetItem, AssetListResponse
from common.utils.formatting import format_bytes, get_asset_type

logger = logging.getLogger("sonikoma.features.workspace.imported_assets")


class ImportedAssetsService:
    @staticmethod
    def get_project_assets_dir(project_id: str) -> str:
        d = os.path.join(STORAGE_DIR, "projects", project_id, "assets")
        os.makedirs(d, exist_ok=True)
        return d

    @classmethod
    def list_assets(cls, project_id: str) -> AssetListResponse:
        assets_dir = cls.get_project_assets_dir(project_id)
        items: List[AssetItem] = []

        if os.path.exists(assets_dir):
            for fn in os.listdir(assets_dir):
                fp = os.path.join(assets_dir, fn)
                if os.path.isfile(fp):
                    st = os.stat(fp)
                    c_date = datetime.datetime.fromtimestamp(st.st_mtime, datetime.timezone.utc).isoformat()
                    a_type = get_asset_type(fn)
                    items.append(
                        AssetItem(
                            id=fn,
                            name=fn,
                            asset_type=a_type,
                            url=f"/api/v1/storage/projects/{project_id}/assets/{fn}",
                            size_bytes=st.st_size,
                            size_formatted=format_bytes(st.st_size),
                            created_at=c_date
                        )
                    )

        return AssetListResponse(
            success=True,
            project_id=project_id,
            total_assets=len(items),
            assets=sorted(items, key=lambda a: a.created_at, reverse=True)
        )

    @classmethod
    def delete_asset(cls, project_id: str, asset_id: str) -> bool:
        assets_dir = cls.get_project_assets_dir(project_id)
        target = os.path.join(assets_dir, asset_id)
        if os.path.exists(target) and os.path.isfile(target):
            os.remove(target)
            return True
        return False


imported_assets_service = ImportedAssetsService()

__all__ = [
    "format_bytes",
    "get_asset_type",
    "ImportedAssetsService",
    "imported_assets_service",
]
