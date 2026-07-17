"""
api/v1/projects/router.py
─────────────────────────────────────────────────────────────────────────────
Primary project router: read and delete routes.
Mounts sub-routers from create, update, files, and settings modules.
─────────────────────────────────────────────────────────────────────────────
"""

import logging

from fastapi import APIRouter, HTTPException, Path, Depends

from routes.auth_routes import get_current_user
from repositories.project_repository import (
    get_all_projects,
    get_project,
    get_project_by_slug,
    get_panels,
    delete_panels,
    delete_project,
)
from api.v1.projects._helpers import wrap_proxy_url
from api.v1.projects import create, update, files, settings

logger = logging.getLogger("sonikoma.routes.projects.router")

# ── Primary router ────────────────────────────────────────────────────────
project_router = APIRouter()

# Mount sub-routers
project_router.include_router(create.router)
project_router.include_router(update.router)
project_router.include_router(settings.router)


# ── Panel detection has its own logical prefix ────────────────────────────
# Mounted separately by the caller so /api/panels/detect works correctly.
panel_router = files.router


# ── Read routes ───────────────────────────────────────────────────────────


@project_router.get("", summary="Get all projects")
async def get_projects(current_user: dict = Depends(get_current_user)):
    try:
        logger.info(
            f"[Database] Fetching project histories for user "
            f"{current_user['user_id']} from local SQLite..."
        )
        projects = get_all_projects(user_id=current_user["user_id"])

        for proj in projects:
            if proj.get("cover_image"):
                proj["cover_image"] = wrap_proxy_url(proj["cover_image"])
            elif proj.get("first_panel_image"):
                proj["cover_image"] = wrap_proxy_url(proj["first_panel_image"])

        logger.info(f"[Database] Retrieved {len(projects)} projects.")
        return {"success": True, "projects": projects}
    except Exception as e:
        logger.error(f"Failed to fetch projects: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch projects: {e}"
        )


@project_router.get(
    "/public/{project_id}", summary="Get a project publicly (no auth required)"
)
async def get_public_project(project_id: str = Path(..., description="Project ID")):
    try:
        logger.info(
            f"[Database] Public query for project details and panels: {project_id}"
        )
        project = get_project(project_id)
        if not project:
            project = get_project_by_slug(project_id)

        if not project:
            raise HTTPException(status_code=404, detail="Project not found.")

        if project.get("cover_image"):
            project["cover_image"] = wrap_proxy_url(project["cover_image"])
        elif project.get("first_panel_image"):
            project["cover_image"] = wrap_proxy_url(project["first_panel_image"])

        panels = get_panels(project["project_id"])
        for p in panels:
            if p.get("image_url"):
                p["image_url"] = wrap_proxy_url(p["image_url"])

        logger.info(
            f"[Database] Public project {project_id} found with {len(panels)} panels."
        )
        return {"success": True, "project": project, "panels": panels}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch public project: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch public project: {e}"
        )


@project_router.get(
    "/{project_id_or_slug}", summary="Get a project and its panels"
)
async def get_single_project(
    project_id_or_slug: str = Path(..., description="Project ID or Slug"),
    current_user: dict = Depends(get_current_user),
):
    try:
        logger.info(
            f"[Database] Querying project details and panels for: {project_id_or_slug}"
        )
        project = get_project(project_id_or_slug)
        if not project:
            project = get_project_by_slug(project_id_or_slug)

        if not project:
            raise HTTPException(status_code=404, detail="Project not found.")

        if project.get("user_id") != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied.")

        project_id = project["project_id"]

        if project.get("cover_image"):
            project["cover_image"] = wrap_proxy_url(project["cover_image"])
        elif project.get("first_panel_image"):
            project["cover_image"] = wrap_proxy_url(project["first_panel_image"])

        panels = get_panels(project_id)
        for p in panels:
            if p.get("image_url"):
                p["image_url"] = wrap_proxy_url(p["image_url"])

        logger.info(
            f"[Database] Project {project_id_or_slug} found with {len(panels)} panels."
        )
        return {"success": True, "project": project, "panels": panels}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch project: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch project: {e}"
        )


@project_router.delete(
    "/{projectId}", summary="Delete a project and its panels"
)
async def delete_single_project(
    projectId: str = Path(...),
    current_user: dict = Depends(get_current_user),
):
    try:
        logger.info(f"[Database] Deleting project and panels for: {projectId}")
        project = get_project(projectId)
        if not project:
            project = get_project_by_slug(projectId)
            if project:
                projectId = project["project_id"]

        if not project:
            raise HTTPException(status_code=404, detail="Project not found.")

        if project.get("user_id") != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied.")

        delete_panels(projectId)
        delete_project(projectId)
        logger.info(f"[Database] Deleted project and panels successfully: {projectId}")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete project: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to delete project: {e}"
        )
