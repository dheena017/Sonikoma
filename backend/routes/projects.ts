/**
 * backend/routes/projects.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Project History and Panel management routes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Router } from "express";
import {
  db,
  insertProject,
  getAllProjects,
  getProject,
  updateProject,
  deleteProject,
  getPanels,
  insertPanel,
} from "../database/db.js";

const router = Router();

// GET all projects (project history list)
router.get("/", (req, res) => {
  try {
    const projects = getAllProjects();
    res.json({ success: true, projects });
  } catch (err: unknown) {
    res.status(500).json({ error: `Failed to fetch projects: ${err.message}` });
  }
});

// GET a single project + its panels
router.get("/:projectId", (req, res) => {
  try {
    const project = getProject(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Project not found." });
    const panels = getPanels(req.params.projectId);
    res.json({ success: true, project, panels });
  } catch (err: unknown) {
    res.status(500).json({ error: `Failed to fetch project: ${err.message}` });
  }
});

// POST — save a new project to the local database
router.post("/", (req, res) => {
  const { project_id, url, title, genre, episode, panels_count, video_url } =
    req.body;
  if (!project_id || !url) {
    return res
      .status(400)
      .json({ error: "Fields 'project_id' and 'url' are required." });
  }
  try {
    insertProject({
      project_id,
      url,
      title: title || "Untitled Webtoon",
      genre: genre || "general",
      episode: episode || "",
      status: "pending",
      panels_count: panels_count || 0,
      video_url: video_url || null,
    });
    res.json({ success: true, project_id });
  } catch (err: unknown) {
    res.status(500).json({ error: `Failed to save project: ${err.message}` });
  }
});

// POST — save all panels for a project
router.post("/:projectId/panels", (req, res) => {
  const { panels } = req.body;
  if (!panels || !Array.isArray(panels)) {
    return res.status(400).json({ error: "Field 'panels' must be an array." });
  }
  try {
    const saveMany = db.transaction((panelList: unknown[]) => {
      panelList.forEach((p, i) => {
        // Enforce length validation for AI-generated text (Rule violation check)
        const speechText = (p.speech_text || "").substring(0, 1000);
        const visualDescription = (p.visual_description || "").substring(
          0,
          2000
        );

        insertPanel({
          project_id: req.params.projectId,
          panel_index: i,
          image_url: p.image_url || "",
          original_url: p.original_image_url || null,
          speech_text: speechText,
          sfx: p.sfx || "",
          duration: p.duration || 4.5,
          motion_type: p.motion_type || "zoom_in",
          visual_description: visualDescription || null,
          brightness: p.brightness ?? null,
          contrast: p.contrast ?? null,
          saturation: p.saturation ?? null,
          grayscale: p.grayscale ? 1 : 0,
          filter_preset: p.filter_preset || null,
          bubble_method: p.bubble_method || null,
          bubble_sensitivity: p.bubble_sensitivity ?? null,
          bubble_dilation: p.bubble_dilation ?? null,
          inpaint_radius: p.inpaint_radius ?? null,
          detection_style: p.detection_style || null,
        });
      });
    });
    saveMany(panels);
    updateProject(req.params.projectId, { panels_count: panels.length });
    res.json({ success: true, saved: panels.length });
  } catch (err: unknown) {
    res.status(500).json({ error: `Failed to save panels: ${err.message}` });
  }
});

// DELETE a project
router.delete("/:projectId", (req, res) => {
  try {
    deleteProject(req.params.projectId);
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ error: `Failed to delete project: ${err.message}` });
  }
});

export default router;
