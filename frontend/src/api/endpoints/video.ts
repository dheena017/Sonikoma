import { apiRequest } from "../client/request";
import { FetchClient, ApiResponse } from "../types";
import { logAudioEndpoint } from "./skills";

export const generateVideo = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/video/render", {
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
  return apiRequest(fetchWithInterceptor, "/api/v1/video/render", {
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
  return apiRequest(fetchWithInterceptor, `/api/v1/jobs/${jobId}`, options);
};

export const generateTts = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  const endpoint = "/api/v1/audio/synthesize-panel-audio";
  const startedAt = performance.now();
  try {
    const response = await apiRequest(fetchWithInterceptor, endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      ...options,
    });
    logAudioEndpoint("POST", endpoint, data, response, startedAt);
    return response;
  } catch (error) {
    logAudioEndpoint("POST", endpoint, data, undefined, startedAt, error);
    throw error;
  }
};
