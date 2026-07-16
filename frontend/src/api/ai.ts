import { apiRequest } from "./request";
import { FetchClient, ApiResponse } from "./types";

export const analyzeImage = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/analyze-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

export const analyzeNarrativeSequence = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/narratives/analyze-sequence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

export const analyzeSequence = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/analyze-sequence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

export const generateSpeechText = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/generate-speech-text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

export const aiDetectPanels = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/ai-detect-panels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

export const aiSmartCrop = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/ai-smart-crop", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

export const listModels = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/list-models", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    ...options,
  });
};

export const executeSkill = async (
  fetchWithInterceptor: FetchClient,
  endpoint: string,
  payload: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    ...options,
  });
};

export const generateSequenceNarrative = async (
  fetchWithInterceptor: FetchClient,
  data: {
    panels: { id: number; visual_description: string }[];
    model?: string;
    voice?: string;
  },
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  const res = await fetchWithInterceptor("/api/generate-sequence-narrative", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.detail || `Request failed with status ${res.status}`);
  }
  return json as ApiResponse<any>;
};
