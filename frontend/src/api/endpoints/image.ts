import { apiRequest } from "../client/request";
import { FetchClient, ApiResponse } from "../types";

export const submitImageEdits = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/images/edit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

export const editImage = submitImageEdits;
export * from "./crop";

export const removeSpeechBubblesBatch = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(
    fetchWithInterceptor,
    "/api/v1/images/remove-speech-bubbles-batch",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      ...options,
    }
  );
};

export const mergeImages = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/images/merge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

export const removeSpeechBubbles = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/images/remove-speech-bubbles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

export const splitImage = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/images/split", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

export const transformImage = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/images/transform", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

export const processLayers = async (
  fetchWithInterceptor: FetchClient,
  panelId: string | number,
  data: { url: string },
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(
    fetchWithInterceptor,
    `/api/v1/images/process-layers/${panelId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      ...options,
    }
  );
};

export const downloadZip = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/images/download-zip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

export const undoImageEdit = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/images/undo-edit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

export const undoCrop = undoImageEdit;

export const getProxyImageUrl = (url: string): string => {
  if (!url) return "";
  if (isProxyUrl(url) || isApiUrl(url)) {
    return url;
  }
  return `/api/v1/proxy/image?url=${encodeURIComponent(url)}`;
};

export const isProxyUrl = (url: string): boolean => {
  return !!(url && typeof url === "string" && url.includes("/api/v1/proxy/image"));
};

export const isApiUrl = (url: string): boolean => {
  return !!(url && typeof url === "string" && url.includes("/api/"));
};

export const saveTrainingData = async (
  fetchWithInterceptor: FetchClient,
  originalPanel: Blob,
  correctedTextMask: Blob,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  const formData = new FormData();
  formData.append("original_panel", originalPanel, "original_panel.png");
  formData.append(
    "corrected_text_mask",
    correctedTextMask,
    "corrected_text_mask.png"
  );

  return apiRequest(fetchWithInterceptor, "/api/v1/images/save-training-data", {
    method: "POST",
    body: formData,
    ...options,
  });
};

export const getTrainingDataCount = async (
  fetchWithInterceptor: FetchClient,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/images/training-data-count", {
    method: "GET",
    ...options,
  });
};

/**
 * Calls the /debug-yolo endpoint and returns a blob URL for the annotated PNG.
 * The caller is responsible for calling URL.revokeObjectURL() when done.
 */
export const debugYolo = async (
  fetchWithInterceptor: FetchClient,
  imageUrl: string,
  conf: number = 0.25
): Promise<string> => {
  const params = new URLSearchParams({ url: imageUrl, conf: String(conf) });
  const res = await fetchWithInterceptor(`/api/v1/images/debug-yolo?${params}`, {
    method: "GET",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? "Debug YOLO request failed");
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

export const startYoloTraining = async (
  fetchWithInterceptor: FetchClient,
  epochs: number = 20,
  batchSize: number = 4,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  const res = await fetchWithInterceptor(
    `/api/v1/images/start-training?epochs=${epochs}&batch_size=${batchSize}`,
    {
      method: "POST",
      ...options,
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? "Failed to start YOLO training");
  }
  return res.json();
};

export const getYoloTrainingStatus = async (
  fetchWithInterceptor: FetchClient,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  const res = await fetchWithInterceptor("/api/v1/images/training-status", {
    method: "GET",
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? "Failed to fetch training status");
  }
  return res.json();
};

export const getYoloTrainingDataList = async (
  fetchWithInterceptor: FetchClient,
  options?: RequestInit
): Promise<
  Array<{ pair_id: string; original_url: string; mask_url: string }>
> => {
  const res = await fetchWithInterceptor("/api/v1/images/training-data-list", {
    method: "GET",
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? "Failed to fetch training data list");
  }
  return res.json();
};

export const deleteYoloTrainingDataPair = async (
  fetchWithInterceptor: FetchClient,
  pairId: string,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  const res = await fetchWithInterceptor(
    `/api/v1/images/training-data-pair/${pairId}`,
    {
      method: "DELETE",
      ...options,
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? "Failed to delete training pair");
  }
  return res.json();
};

export const fetchBlob = async (url: string): Promise<Blob> => {
  const res = await fetch(url);
  return res.blob();
};
