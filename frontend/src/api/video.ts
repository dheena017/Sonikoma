import { apiRequest } from "./request";
import { FetchClient, ApiResponse } from "./types";

export const generateVideo = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

export const renderVideo = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/video/render", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

export const getVideoStatus = async (
  fetchWithInterceptor: FetchClient,
  jobId: string,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, `/api/video/status/${jobId}`, options);
};

export const generateTts = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/audio/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};
