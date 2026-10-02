"""
backend/app/api/v1/projects/crud.py
─────────────────────────────────────────────────────────────────────────────
Core Project CRUD routes:
- GET    /                   – List & filter projects with pagination
- POST   /                   – Create a new project entry
- GET    /public/{project_id} – Public project view (no auth required)
- PUT    /{projectId}        – Update project metadata & state
- POST   /{projectId}/promote – Promote temporary workspace to saved project
- DELETE /{projectId}        – Delete single project and panels
- POST   /batch-delete       – Bulk delete multiple projects
- GET    /{project_id_or_slug} – Retrieve single project with panels
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Path, Body, Depends, Query

try:
    from app.api.dependencies.auth import get_current_user  # noqa: I001
    from app.schemas.project import (
        ProjectCreateRequest,
        ProjectUpdateRequest,
        BatchDeleteRequest,
    )
    from app.repositories.project import (
        get_all_projects,
        get_project,
        get_project_by_slug,
        get_panels,
        delete_panels,
        delete_project,
    )
    from app.services.project.project_service import (
        ProjectService,
        sync_project_to_supabase,
    )
    from app.api.v1.projects._helpers import wrap_proxy_url
except ImportError:
    from api.dependencies.auth import get_current_user
    from schemas.project import (
        ProjectCreateRequest,
        ProjectUpdateRequest,
        BatchDeleteRequest,
    )
    from repositories.project import (
        get_all_projects,
        get_project,
        get_project_by_slug,
        get_panels,
        delete_panels,
        delete_project,
    )
    from services.project.project_service import (
        ProjectService,
        sync_project_to_supabase,
    )
    from api.v1.projects._helpers import wrap_proxy_url

logger = logging.getLogger("sonikoma.routes.projects.crud")
router = APIRouter()
project_service = ProjectService()


# ── List Projects ─────────────────────────────────────────────────────────

@router.get("/", summary="Get all projects with filtering and pagination")
async def get_projects_endpoint(
    search: Optional[str] = Query(None, description="Search projects by title, author, or genre"),
    status: Optional[str] = Query(None, description="Filter by status (Draft, Ready, etc.)"),
    series_id: Optional[str] = Query(None, description="Filter by parent series/project ID"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of projects to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    sort_by: str = Query("created_at", description="Sort column: created_at, title, episode, panels_count"),
    order: str = Query("desc", description="Sort direction: asc or desc"),
    current_user: dict = Depends(get_current_user),
):
    try:
        logger.info(
            f"[Database] Fetching project histories for user "
            f"{current_user['user_id']} from local SQLite..."
        )
        projects = get_all_projects(user_id=current_user["user_id"])
        if search:
            q = search.lower()
            projects = [
                p for p in projects
                if q in (p.get("title") or "").lower()
                or q in (p.get("author") or "").lower()
                or q in (p.get("genre") or "").lower()
            ]
        if status:
            projects = [p for p in projects if (p.get("status") or "").lower() == status.lower()]
        if series_id:
            projects = [p for p in projects if p.get("series_id") == series_id or p.get("project_id") == series_id]

        reverse = order.lower() == "desc"
        if sort_by in ("created_at", "title", "episode", "panels_count"):
            projects.sort(key=lambda x: str(x.get(sort_by) or ""), reverse=reverse)

        total = len(projects)
        paginated = projects[offset:offset + limit]

        for proj in paginated:
            if proj.get("cover_image"):
                proj["cover_image"] = wrap_proxy_url(proj["cover_image"])
            elif proj.get("first_panel_image"):
                proj["cover_image"] = wrap_proxy_url(proj["first_panel_image"])
        logger.info(f"[Database] Retrieved {len(paginated)} of {total} projects.")
        return {"success": True, "total": total, "projects": paginated}
    except Exception as e:
        logger.error(f"Failed to fetch projects: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch projects: {e}")


# ── Create Project ────────────────────────────────────────────────────────

@router.post("/", summary="Create a new project entry")
async def create_project_endpoint(
    body: ProjectCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        result = project_service.create_project(body, current_user["user_id"])
        logger.info(f"[Database] Created project {body.project_id}: '{body.title}'")
        return result
    except Exception as e:
        logger.error(f"Failed to save project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to save project: {e}")


# ── Public Project View ───────────────────────────────────────────────────

@router.get("/public/{project_id}", summary="Get a project publicly (no auth)")
async def get_public_project_endpoint(project_id: str = Path(..., description="Project ID")):
    try:
        project = get_project(project_id) or get_project_by_slug(project_id)
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
        scraped_images = []
        if project.get("scraped_images") and isinstance(project["scraped_images"], list):
            scraped_images = [wrap_proxy_url(img) for img in project["scraped_images"] if img]
        if not scraped_images:
            audio_set = project.get("audio_settings") or {}
            if isinstance(audio_set, dict):
                scraped_images_raw = audio_set.get("scraped_images")
                if isinstance(scraped_images_raw, list):
                    scraped_images = [wrap_proxy_url(img) for img in scraped_images_raw if img]
        if not scraped_images and (project.get("url") or project.get("original_url")):
            try:
                from repositories.scraper import get_latest_scrape_session
                target_url = project.get("url") or project.get("original_url")
                sess = get_latest_scrape_session(target_url)
                if sess and sess.get("image_urls"):
                    scraped_images = [wrap_proxy_url(img) for img in sess["image_urls"] if img]
            except Exception:
                pass
        public_project = dict(project)
        public_project.pop("job_id", None)
        return {"success": True, "project": public_project, "panels": panels, "scraped_images": scraped_images}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch public project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch public project: {e}")


# ── Update Project ────────────────────────────────────────────────────────

@router.put("/{projectId}", summary="Update project metadata and panels")
async def update_project_details_endpoint(
    projectId: str = Path(..., description="Target Project ID"),
    body: ProjectUpdateRequest = Body(...),
    current_user: dict = Depends(get_current_user),
):
    try:
        sync_project_to_supabase(projectId, body, current_user["user_id"])

        project = get_project(projectId)
        if not project:
            project = get_project_by_slug(projectId)
            if project:
                projectId = project["project_id"]

        try:
            result = project_service.update_project_details(projectId, body, current_user["user_id"])
        except PermissionError as exc:
            raise HTTPException(status_code=403, detail="Access denied.") from exc

        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update project: {e}")


# ── Promote Temporary Project ─────────────────────────────────────────────

@router.post("/{projectId}/promote", summary="Promote temporary workspace project to permanent saved status")
async def promote_project_endpoint(
    projectId: str = Path(..., description="Target Project ID"),
    current_user: dict = Depends(get_current_user),
):
    try:
        logger.info(f"[Database] Promoting project {projectId} from temp to permanent status.")
        try:
            return project_service.promote_project(projectId, current_user["user_id"])
        except PermissionError as exc:
            raise HTTPException(status_code=403, detail="Access denied.") from exc
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to promote project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to promote project: {e}")


# ── Delete Projects ───────────────────────────────────────────────────────

@router.delete("/{projectId}", summary="Delete a project and its panels")
async def delete_single_project_endpoint(
    projectId: str = Path(..., description="Target Project ID to delete"),
    current_user: dict = Depends(get_current_user),
):
    try:
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
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete project: {e}")


@router.post("/batch-delete", summary="Bulk delete multiple projects")
async def batch_delete_projects_endpoint(
    body: BatchDeleteRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        deleted_count = 0
        for pid in body.project_ids:
            project = get_project(pid)
            if project and project.get("user_id") == current_user["user_id"]:
                delete_project(pid)
                deleted_count += 1
        return {"success": True, "deleted_count": deleted_count}
    except Exception as e:
        logger.error(f"Failed to batch delete projects: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to batch delete projects: {e}")


# ── Single Project Read ───────────────────────────────────────────────────

@router.get("/{project_id_or_slug}", summary="Get a project and its panels")
async def get_single_project_endpoint(
    project_id_or_slug: str = Path(..., description="Project ID or Slug"),
    job_id: Optional[str] = Query(None, description="Optional Workspace Job ID context"),
    current_user: dict = Depends(get_current_user),
):
    try:
        project = get_project(project_id_or_slug) or get_project_by_slug(project_id_or_slug)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found.")
        if project.get("user_id") != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied.")
        if job_id and project.get("job_id") and project["job_id"] != job_id:
            raise HTTPException(
                status_code=400,
                detail=f"Job ID mismatch: project '{project['project_id']}' belongs to job '{project['job_id']}', not '{job_id}'."
            )
        project_id = project["project_id"]
        if project.get("cover_image"):
            project["cover_image"] = wrap_proxy_url(project["cover_image"])
        elif project.get("first_panel_image"):
            project["cover_image"] = wrap_proxy_url(project["first_panel_image"])
        panels = get_panels(project_id)
        for p in panels:
            if p.get("image_url"):
                p["image_url"] = wrap_proxy_url(p["image_url"])
        scraped_images = []
        if project.get("scraped_images") and isinstance(project["scraped_images"], list):
            scraped_images = [wrap_proxy_url(img) for img in project["scraped_images"] if img]
        if not scraped_images:
            audio_set = project.get("audio_settings") or {}
            if isinstance(audio_set, dict):
                scraped_images_raw = audio_set.get("scraped_images")
                if isinstance(scraped_images_raw, list):
                    scraped_images = [wrap_proxy_url(img) for img in scraped_images_raw if img]
        if not scraped_images and (project.get("url") or project.get("original_url")):
            try:
                from repositories.scraper import get_latest_scrape_session
                target_url = project.get("url") or project.get("original_url")
                sess = get_latest_scrape_session(target_url)
                if sess and sess.get("image_urls"):
                    scraped_images = [wrap_proxy_url(img) for img in sess["image_urls"] if img]
            except Exception:
                pass
        return {"success": True, "project": project, "panels": panels, "scraped_images": scraped_images}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch project: {e}")
