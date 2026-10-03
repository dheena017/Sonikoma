import type { Project, OnboardingTask } from "../hooks/useDashboardPage";

/** Retrieve auth token from local or session storage */
export function getStoredAuthToken(): string {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("sonikoma_token") ||
    sessionStorage.getItem("sonikoma_token") ||
    ""
  );
}

/** Construct standard Authorization headers if token exists */
export function getAuthHeaders(): Record<string, string> {
  const token = getStoredAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Navigate using app navigation if available or fallback to browser history */
export function navigateToDashboardPath(target: string): void {
  if (typeof window === "undefined") return;
  const nav = (window as any).navigateTo;
  if (typeof nav === "function") {
    nav(target);
  } else {
    window.history.pushState({}, "", target);
    window.dispatchEvent(new Event("popstate"));
  }
}

/** Format target URL for opening project in the canvas editor */
export function buildProjectEditorUrl(project: Project): string {
  const jobId = project.job_id;
  return project.series_slug && project.chapter_slug
    ? `/scraper/editor/series/${project.series_slug}/chapters/${
        project.chapter_slug
      }?project_id=${encodeURIComponent(project.project_id)}${
        jobId ? `&job_id=${encodeURIComponent(jobId)}` : ""
      }`
    : `/scraper/editor?project_id=${encodeURIComponent(
        project.project_id
      )}${jobId ? `&job_id=${encodeURIComponent(jobId)}` : ""}`;
}

/** Helper to extract scraped panel images from fetched project payload */
export function extractProjectScrapedImages(data: any): string[] {
  const loadedSettings = data?.project?.audio_settings || {};
  const savedScrapedImages =
    Array.isArray(data?.scraped_images) && data.scraped_images.length > 0
      ? data.scraped_images
      : loadedSettings.scraped_images;
  return Array.isArray(savedScrapedImages) && savedScrapedImages.length > 0
    ? savedScrapedImages
    : (data?.panels || []).map((p: any) => p.image_url).filter(Boolean);
}

/** Filter projects by search query across title and url */
export function filterProjectsByQuery(
  projects: Project[],
  query: string
): Project[] {
  const q = (query || "").trim().toLowerCase();
  if (!q) return projects;
  return projects.filter(
    (p) =>
      (p.title || "").toLowerCase().includes(q) ||
      (p.url || "").toLowerCase().includes(q)
  );
}

/** Count projects with a given status */
export function countProjectsByStatus(
  projects: Project[],
  status: string
): number {
  const s = status.toLowerCase();
  return projects.filter((p) => p.status?.toLowerCase() === s).length;
}

/** Calculate total panel/asset count across projects */
export function calculateTotalPanels(projects: Project[]): number {
  return projects.reduce(
    (acc, p) => acc + (p.panels_count || p.imported_assets_count || 0),
    0
  );
}

/** Update onboarding progress based on user project state */
export function computeOnboardingTasks(
  tasks: OnboardingTask[],
  projects: Project[],
  completedCount: number
): OnboardingTask[] {
  let updated = tasks;
  if (projects.length > 0) {
    updated = updated.map((t) => (t.id === 1 ? { ...t, completed: true } : t));
  }
  const hasAnalyzed = projects.some(
    (p) => (p.panels_count || p.imported_assets_count || 0) > 0
  );
  if (hasAnalyzed) {
    updated = updated.map((t) => (t.id === 2 ? { ...t, completed: true } : t));
  }
  if (completedCount > 0) {
    updated = updated.map((t) => (t.id === 4 ? { ...t, completed: true } : t));
  }
  return updated;
}
