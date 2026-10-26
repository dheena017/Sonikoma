import type { Project, OnboardingTask } from "../types";
import { useProjectStore } from "@/features/platform/projects/store/useProjectStore";

/* ─────────────────────────────────────────────────────────────
 * 1. Authentication & API Headers
 * ───────────────────────────────────────────────────────────── */

/**
 * Retrieve the active authentication token from localStorage or sessionStorage.
 */
export function getStoredAuthToken(): string {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("sonikoma_token") ||
    sessionStorage.getItem("sonikoma_token") ||
    ""
  );
}

/**
 * Construct standard Authorization HTTP headers if a bearer token exists.
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getStoredAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* ─────────────────────────────────────────────────────────────
 * 2. Routing & Navigation
 * ───────────────────────────────────────────────────────────── */

/**
 * Navigate to an internal route using the application router or browser history.
 */
export function navigateToDashboardPath(targetPath: string): void {
  if (typeof window === "undefined") return;

  const appNav = (window as unknown as { navigateTo?: (path: string) => void }).navigateTo;
  if (typeof appNav === "function") {
    appNav(targetPath);
  } else {
    window.history.pushState({}, "", targetPath);
    window.dispatchEvent(new Event("popstate"));
  }
}

/**
 * Format deep link URL for launching a project directly in the storyboard editor.
 */
export function buildProjectEditorUrl(project: Project): string {
  const { project_id, job_id, series_slug, chapter_slug } = project;
  const queryParams = new URLSearchParams({ project_id });
  if (job_id) queryParams.set("job_id", job_id);

  if (series_slug && chapter_slug) {
    return `/scraper/editor/series/${series_slug}/chapters/${chapter_slug}?${queryParams.toString()}`;
  }

  return `/scraper/editor?${queryParams.toString()}`;
}

/* ─────────────────────────────────────────────────────────────
 * 3. Project Store & Asset Extraction
 * ───────────────────────────────────────────────────────────── */

interface RawProjectPayload {
  project?: {
    audio_settings?: {
      scraped_images?: string[];
    };
  };
  scraped_images?: string[];
  panels?: Array<{ image_url?: string }>;
}

/**
 * Extract panel image URLs safely from a project payload.
 */
export function extractProjectScrapedImages(data: RawProjectPayload): string[] {
  const savedImages = data?.scraped_images;
  if (Array.isArray(savedImages) && savedImages.length > 0) {
    return savedImages;
  }

  const audioSettingsImages = data?.project?.audio_settings?.scraped_images;
  if (Array.isArray(audioSettingsImages) && audioSettingsImages.length > 0) {
    return audioSettingsImages;
  }

  return (data?.panels || [])
    .map((p) => p.image_url)
    .filter((url): url is string => Boolean(url));
}

/**
 * Pre-fetch a project's full details and load it into the global project store.
 */
export async function fetchAndActivateProject(projectId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/v1/projects/${projectId}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) return false;

    const data = await res.json();
    const scrapedImages = extractProjectScrapedImages(data);

    useProjectStore.getState().setActiveProject({
      project: data.project,
      panels: data.panels || [],
      scrapedImages,
    });

    return true;
  } catch (err) {
    console.error(`Failed to activate project ${projectId}:`, err);
    return false;
  }
}

/* ─────────────────────────────────────────────────────────────
 * 4. Metrics & State Derivations
 * ───────────────────────────────────────────────────────────── */

/**
 * Filter projects by query matching title or URL.
 */
export function filterProjectsByQuery(projects: Project[], query: string): Project[] {
  const q = query.trim().toLowerCase();
  if (!q) return projects;

  return projects.filter(
    (p) =>
      (p.title || "").toLowerCase().includes(q) ||
      (p.url || "").toLowerCase().includes(q)
  );
}

/**
 * Count total projects matching a specific status (e.g. 'completed', 'processing').
 */
export function countProjectsByStatus(projects: Project[], status: string): number {
  const target = status.toLowerCase();
  return projects.filter((p) => (p.status || "").toLowerCase() === target).length;
}

/**
 * Sum total panel count across all active projects.
 */
export function calculateTotalPanels(projects: Project[]): number {
  return projects.reduce(
    (acc, p) => acc + (p.panels_count || p.imported_assets_count || 0),
    0
  );
}

/**
 * Re-calculate onboarding progress based on existing project state.
 */
export function computeOnboardingTasks(
  tasks: OnboardingTask[],
  projects: Project[],
  completedCount: number
): OnboardingTask[] {
  const hasProjects = projects.length > 0;
  const hasAnalyzedPanels = projects.some(
    (p) => (p.panels_count || p.imported_assets_count || 0) > 0
  );
  const hasCompletedVideo = completedCount > 0;

  return tasks.map((task) => {
    if (task.id === 1 && hasProjects) return { ...task, completed: true };
    if (task.id === 2 && hasAnalyzedPanels) return { ...task, completed: true };
    if (task.id === 4 && hasCompletedVideo) return { ...task, completed: true };
    return task;
  });
}

/**
 * Calculate estimated runtime in minutes based on total panel count (~4s per panel).
 */
export function calculateEstimatedRuntimeMinutes(totalPanels: number): number {
  if (totalPanels <= 0) return 1;
  return Math.max(1, Math.round((totalPanels * 4) / 60));
}

/**
 * Calculate production health percentage based on completed and total projects.
 */
export function calculateHealthPercentage(completedCount: number, totalCount: number): number {
  if (totalCount <= 0) return 100;
  return Math.min(100, Math.max(10, Math.round((completedCount / totalCount) * 100)));
}
