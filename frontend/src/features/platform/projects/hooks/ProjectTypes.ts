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
