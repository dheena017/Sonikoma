import type { AISeriesProject } from "@/features/intelligence/series/api/aiSeries";

export interface Project {
  project_id: string;
  job_id?: string | null;
  title: string;
  url: string;
  created_at: string;
  status: string;
  panels_count: number;
  imported_assets_count?: number;
  series_slug?: string;
  chapter_slug?: string;
  author?: string;
  cover_image?: string;
  synopsis?: string;
}

export interface OnboardingTask {
  id: number;
  text: string;
  completed: boolean;
}

export interface DashboardStatsMetrics {
  projectsCount: number;
  completedCount: number;
  totalPanels: number;
  estimatedRuntimeMinutes: number;
  healthPercentage: number;
}

export type { AISeriesProject };
