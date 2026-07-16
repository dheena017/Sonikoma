import { apiRequest } from "./request";
import { FetchClient, ApiResponse } from "./types";

// Helper: read the stored JWT from local/session storage and return auth headers
const getAuthHeaders = (): Record<string, string> => {
  const token =
    localStorage.getItem("sonikoma_token") ||
    sessionStorage.getItem("sonikoma_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const startBackend = async (): Promise<ApiResponse<any>> => {
  const res = await fetch("/start-backend", { method: "POST" });
  if (!res.ok) throw new Error("Failed to start backend");
  return res.json();
};

export const checkHealth = async (): Promise<ApiResponse<any>> => {
  const res = await fetch("/api/health");
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
};

export const getSystemLogs = async (since?: string): Promise<ApiResponse<any>> => {
  const url = since ? `/api/system-logs?since=${since}` : "/api/system-logs";
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch system logs");
  return res.json();
};

export const getSystemLogsStreamUrl = (): string => {
  return "/api/system-logs/stream";
};

export const getPySystemLogsStreamUrl = (): string => {
  return "/api/py/health/system-logs/stream";
};

export const getMetrics = async (
  fetchWithInterceptor?: FetchClient
): Promise<ApiResponse<any>> => {
  if (fetchWithInterceptor) {
    return apiRequest(fetchWithInterceptor, "/api/metrics");
  }
  const res = await fetch("/api/metrics", { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch metrics");
  return res.json();
};

export const testModelLatency = async (
  fetchWithInterceptor: FetchClient,
  data: any
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/test-model-latency", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};

export const enhancePrompt = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/enhance-prompt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    ...options,
  });
};

export const purgeCache = async (
  fetchWithInterceptor: FetchClient
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/metrics/purge-cache", {
    method: "POST",
  });
};

export const emergencyStop = async (
  fetchWithInterceptor: FetchClient
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/metrics/emergency-stop", {
    method: "POST",
  });
};

export const checkFfmpeg = async (): Promise<ApiResponse<any>> => {
  const res = await fetch("/api/health/ffmpeg");
  if (!res.ok) throw new Error("FFmpeg health check failed");
  return res.json();
};
