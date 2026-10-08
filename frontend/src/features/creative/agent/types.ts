export type VideoFormat = "shorts" | "landscape";
export type PrivacyStatus = "unlisted" | "public" | "private";

export type AgentStage =
  | "initializing"
  | "scraping"
  | "processing_images"
  | "generating_narrative"
  | "synthesizing_audio"
  | "awaiting_review"
  | "rendering_video"
  | "publishing_youtube"
  | "completed"
  | "failed";

export interface AgentRunRequest {
  url: string;
  video_format: VideoFormat;
  language: string;
  voice: string;
  privacy_status: PrivacyStatus;
  review_mode: boolean;
  max_panels?: number;
  title_override?: string;
}

export interface AgentLogMessage {
  timestamp: number;
  stage: string;
  level: "info" | "success" | "warning" | "error";
  message: string;
}

export interface AgentPanel {
  index: number;
  image_url: string;
  speech_text: string;
  audio_url?: string;
  duration: number;
  motion_type: string;
  sfx?: string;
}

export interface AgentYouTubeMetadata {
  title: string;
  description: string;
  tags: string[];
  category_id: string;
  privacy_status: string;
  is_short: boolean;
  thumbnail_url?: string;
}

export interface AgentRunResponse {
  run_id: string;
  user_id?: string;
  status: AgentStage;
  progress: number;
  current_action: string;
  logs: AgentLogMessage[];
  scraped_title?: string;
  raw_images_count: number;
  panels: AgentPanel[];
  video_filename?: string;
  video_url?: string;
  youtube_metadata?: AgentYouTubeMetadata;
  youtube_url?: string;
  error?: string;
  created_at: number;
  updated_at: number;
}

export interface AgentApproveRequest {
  title_override?: string;
  privacy_status?: PrivacyStatus;
}
