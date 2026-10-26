export interface Project {
  job_id?: string | null;
  project_id: string;
  series_id?: string | null;
  chapter_id?: string | null;
  title: string;
  url: string;
  created_at: string;
  status: string;
  panels_count: number;
  imported_assets_count?: number;
  series_slug?: string;
  chapter_slug?: string;
  genre?: string;
  author?: string;
  cover_image?: string;
  synopsis?: string;
  episode?: string | number;
}

export type ViewMode = "grid" | "list";

export type ProjectSortOption =
  | "newest"
  | "oldest"
  | "panels"
  | "alphabetical";

export type ProjectStatusFilter = "all" | "draft" | "ready";

export interface Series {
  id: string; // The series_slug or project_id (if no series_slug)
  slug: string;
  title: string;
  cover?: string;
  chapters: Project[];
  chapterCount: number;
  latestChapter?: Project;
  latestUpdatedAt?: string;
  genre?: string;
  author?: string;
  synopsis?: string;
}

export interface ProjectsStatsData {
  totalProjects: number;
  totalPanels: number;
  completedCount: number;
  processingCount: number;
}
