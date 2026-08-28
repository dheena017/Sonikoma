import { apiRequest } from "../client/request";
import { FetchClient, ApiResponse } from "../types";

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
  const res = await fetch("/api/v1/system/health");
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
};

export const getBackendStatus = async (
  fetchWithInterceptor?: FetchClient
): Promise<ApiResponse<any>> => {
  if (fetchWithInterceptor) {
    return apiRequest(fetchWithInterceptor, "/api/v1/system/status");
  }
  const res = await fetch("/api/v1/system/status", { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch backend status");
  return res.json();
};

export const getSystemLogs = async (
  since?: string
): Promise<ApiResponse<any>> => {
  const url = since ? `/api/v1/system/logs?since=${since}` : "/api/v1/system/logs";
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch system logs");
  return res.json();
};

export const getSystemLogsStreamUrl = (): string => {
  return "/api/v1/system/logs/stream";
};

export const getPySystemLogsStreamUrl = (): string => {
  return "/api/v1/system/logs/stream";
};

export const getMetrics = async (
  fetchWithInterceptor?: FetchClient
): Promise<ApiResponse<any>> => {
  if (fetchWithInterceptor) {
    return apiRequest(fetchWithInterceptor, "/api/v1/system/metrics");
  }
  const res = await fetch("/api/v1/system/metrics", { headers: getAuthHeaders() });
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
