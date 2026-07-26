export interface Project {
  project_id: string;
  title: string;
  url: string;
  created_at: string;
  status: string;
  panels_count: number;
  series_slug?: string;
  chapter_slug?: string;
  genre?: string;
  author?: string;
  cover_image?: string;
  synopsis?: string;
  episode?: string | number;
}

export type ViewMode = "grid" | "list";
