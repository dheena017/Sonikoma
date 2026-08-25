import { apiRequest } from "../client/request";
import { FetchClient, ApiResponse } from "../types";

export type DetectedLayoutType =
  | "long_panels"
  | "single_panels"
  | "multi_grid_page"
  | "double_page_spread"
  | "four_koma"
  | "splash_page";

export type ReadingFlow = "top_to_bottom" | "right_to_left" | "left_to_right";

export interface DetectTypeResponse {
  success: boolean;
  crop_type: DetectedLayoutType;
  type_label: string;
  confidence: number;
  width: number;
  height: number;
  aspect_ratio: number;
  estimated_panel_count: number;
  reading_flow: ReadingFlow;
  detected_bg_color: string;
  edge_complexity: "low" | "medium" | "high";
  optimal_canny_thresholds: { low: number; high: number };
  recommended_endpoint: string;
  suggested_strategy: string;
  message?: string;
}

export interface PanelBoundingBoxInput {
  id?: string | number;
  panel_id?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  crop_top?: number;
  crop_bottom?: number;
  crop_left?: number;
  crop_right?: number;
  padding_px?: number;
}

export interface CroppedSliceItem {
  index: number;
  panel_id?: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  crop_width: number;
  crop_height: number;
  aspect_ratio: number;
  gutter_after_px: number;
  file_size_bytes: number;
}

export interface LongPanelsCropPayload {
  url: string;
  panels: PanelBoundingBoxInput[];
  bleed_guard_px?: number;
  background_mode?: string;
  output_format?: "webp" | "jpeg" | "png";
  quality?: number;
}

export interface LongPanelsCropResponse {
  success: boolean;
  crop_type: string;
  total_slices: number;
  processing_time_ms: number;
  slices: CroppedSliceItem[];
  message?: string;
}

export interface SinglePanelsCropPayload {
  url: string;
  crop_top?: number;
  crop_bottom?: number;
  crop_left?: number;
  crop_right?: number;
  unit?: "percent" | "pixels";
  aspect_ratio?: "free" | "9:16" | "16:9" | "1:1" | "4:5" | "4:3";
  auto_trim?: boolean;
  color_tolerance?: number;
  padding_px?: number;
  rotate?: number;
  flip_horizontal?: boolean;
  output_format?: "webp" | "jpeg" | "png";
  quality?: number;
}

export interface SinglePanelsCropResponse {
  success: boolean;
  crop_type: string;
  url: string;
  width: number;
  height: number;
  aspect_ratio: string;
  applied_margins: Record<string, number>;
  auto_trimmed: boolean;
  processing_time_ms: number;
  message?: string;
}

/**
 * Step 1: 5-Layer Layout Classifier
 * Evaluates image aspect ratio, background palette, and estimated panel count in <30ms.
 */
export const detectPanelCropType = async (
  fetchWithInterceptor: FetchClient,
  data: { url?: string; image_base64?: string },
  options?: RequestInit
): Promise<ApiResponse<DetectTypeResponse>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/images/crop/detect-type", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

/**
 * Step 3A: Batch-slice multiple panel bounding boxes from a tall webtoon strip.
 * Single-pass in-memory decoding with rich panel asset binding metadata (NO LOOP).
 */
export const cropLongPanels = async (
  fetchWithInterceptor: FetchClient,
  data: LongPanelsCropPayload,
  options?: RequestInit
): Promise<ApiResponse<LongPanelsCropResponse>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/images/crop/long-panels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

/**
 * Step 3B: 4-directional margin cropper for single comic pages and frames.
 * Supports Above, Bottom, Left, and Right margin trimming with aspect ratio snapping.
 */
export const cropSinglePanels = async (
  fetchWithInterceptor: FetchClient,
  data: SinglePanelsCropPayload,
  options?: RequestInit
): Promise<ApiResponse<SinglePanelsCropResponse>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/images/crop/single-panels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};
