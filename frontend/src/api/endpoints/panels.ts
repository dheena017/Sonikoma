/**
 * frontend/src/api/endpoints/panels.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Panel Detection API client methods:
 * - detectSmallPanels: Tight frame snapping & speech bubble binding (Small Images)
 * - detectLongPanels: Continuous webtoon strip gutter slicing (Tall Strips)
 * - detectWithOpenCV: Standalone OpenCV geometric analysis
 * - detectWithYOLO: Standalone YOLOv8m-seg bubble & character segmentation
 * - detectWithAI: Standalone AI Vision OCR & reading flow
 * - detectPanelsBatch: Parallel multi-image detection
 * - detectPanelsUpload: Multipart file upload detector
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { apiRequest } from "../client/request";
import { FetchClient, ApiResponse } from "../types";

export interface SpeechBubbleMetadata {
  bubble_id: string;
  parent_panel_id?: string;
  label: string;
  category: string;
  sub_type?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  polygon?: number[][];
  dialogue_text?: string;
  confidence: number;
  reading_order: number;
  is_bound: boolean;
}

export interface PanelBox {
  id?: string;
  index?: number;
  x: number;
  y: number;
  w?: number;
  h?: number;
  width?: number;
  height?: number;
  confidence?: number;
  label?: string;
  category?: string;
  type?: string;
  sub_type?: string;
  has_bound_bubbles?: boolean;
  speech_bubbles_count?: number;
  speech_bubbles?: SpeechBubbleMetadata[];
}

export interface DetectSmallPanelsPayload {
  url?: string;
  image_base64?: string;
  aspect_ratio?: string;
  auto_trim?: boolean;
  snap_to_frame?: boolean;
  merge_speech_bubbles?: boolean;
  filter_gutter_sfx?: boolean;
  bleed_padding_px?: number;
}

export interface DetectSmallPanelsResponse {
  success: boolean;
  crop_type: string;
  image_width: number;
  image_height: number;
  panel?: PanelBox;
  panels: PanelBox[];
  speech_bubbles: SpeechBubbleMetadata[];
  total_speech_bubbles_count: number;
  bound_speech_bubbles_count: number;
  margins: {
    crop_top?: number;
    crop_bottom?: number;
    crop_left?: number;
    crop_right?: number;
    unit?: string;
  };
  message?: string;
}

export interface DetectLongPanelsPayload {
  url?: string;
  image_base64?: string;
  sensitivity?: number;
  background_mode?: string;
  min_panel_height?: number;
  overlap_merge_threshold?: number;
  auto_split?: boolean;
  bleed_padding_px?: number;
}

export interface DetectLongPanelsResponse {
  success: boolean;
  crop_type: string;
  total_panels: number;
  total_speech_bubbles_count: number;
  image_width: number;
  image_height: number;
  reading_flow: string;
  panels: PanelBox[];
  gutter_count?: number;
  message?: string;
}

/**
 * Detect tight frame and bind dialogue bubbles on a small comic image / single frame.
 */
export const detectSmallPanels = async (
  fetchWithInterceptor: FetchClient,
  data: DetectSmallPanelsPayload,
  options?: RequestInit
): Promise<ApiResponse<DetectSmallPanelsResponse>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/panels/detect/small-panels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

/**
 * Detect stacked panels and gutter seams on a tall webtoon strip.
 */
export const detectLongPanels = async (
  fetchWithInterceptor: FetchClient,
  data: DetectLongPanelsPayload,
  options?: RequestInit
): Promise<ApiResponse<DetectLongPanelsResponse>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/panels/detect/long-panels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

/**
 * Direct OpenCV geometric contour & gutter detector.
 */
export const detectWithOpenCV = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/panels/detect/opencv", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

/**
 * Direct YOLOv8m-seg speech bubble & character detector.
 */
export const detectWithYOLO = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/panels/detect/yolo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

/**
 * Direct AI Vision OCR & reading flow detector.
 */
export const detectWithAI = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/panels/detect/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

/**
 * Batch multi-image panel detector.
 */
export const detectPanelsBatch = async (
  fetchWithInterceptor: FetchClient,
  data: { urls: string[]; [key: string]: any },
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/panels/detect/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

/**
 * In-memory multipart file upload detector.
 */
export const detectPanelsUpload = async (
  fetchWithInterceptor: FetchClient,
  formData: FormData,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/panels/detect/upload", {
    method: "POST",
    body: formData,
    ...options,
  });
};

/**
 * Generic single URL panel detector.
 */
export const detectPanelsByUrl = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/panels/detect/url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};
