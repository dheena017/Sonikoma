export type ThumbnailCount = 1 | 3 | 6;

export type ThumbnailAspectRatio = "16:9" | "9:16" | "1:1" | "4:5" | "4:3" | "21:9";

export type ThumbnailStylePreset =
  | "anime_manhwa"
  | "dark_monarch"
  | "action_glow"
  | "shonen_battle"
  | "cyber_neon"
  | "split_versus"
  | "reaction_shock"
  | "comic_collage"
  | string;

export interface ThumbnailPanelInput {
  id?: string;
  image_url: string;
  speech_text?: string;
  role?: "hero" | "villain" | "climax" | "background" | "reaction";
}

export interface ThumbnailGenerateRequest {
  prompt?: string;
  count?: ThumbnailCount | number;
  series_title?: string;
  genre?: string;
  panels?: ThumbnailPanelInput[];
  video_url?: string;
  style?: ThumbnailStylePreset;
  aspect_ratio?: ThumbnailAspectRatio | string;
}

export interface GeneratedThumbnailItem {
  id: string;
  image_url: string;
  archetype: string;
  archetype_label: string;
  hook_text: string;
  title: string;
  prompt_used: string;
  palette: string[];
  width: number;
  height: number;
  aspect_ratio?: string;
  created_at: number;
  tier_used?: string;
  model_used?: string;
  provider_used?: string;
  cascade_path?: string;
  routing_message?: string;
}

export interface ThumbnailGenerateResponse {
  success: boolean;
  count: number;
  prompt: string;
  series_title: string;
  thumbnails: GeneratedThumbnailItem[];
  execution_time_ms: number;
  aspect_ratio?: string;
  tier_used?: string;
  model_used?: string;
  provider_used?: string;
  cascade_path?: string;
  routing_message?: string;
}

