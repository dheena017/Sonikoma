import { apiRequest } from "./request";
import { FetchClient, ApiResponse } from "./types";

export const adminGetUsers = async (
  fetchWithInterceptor: FetchClient
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/auth/admin/users");
};

export const adminUpdateUser = async (
  fetchWithInterceptor: FetchClient,
  userId: string,
  data: any
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, `/api/auth/admin/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};

export const adminDeleteUser = async (
  fetchWithInterceptor: FetchClient,
  userId: string
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, `/api/auth/admin/users/${userId}`, {
    method: "DELETE",
  });
};

export const adminGetSettings = async (
  fetchWithInterceptor: FetchClient
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/auth/admin/settings");
};

export const adminUpdateSettings = async (
  fetchWithInterceptor: FetchClient,
  settings: any
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/auth/admin/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ settings }),
  });
};

export const adminGetAuditLogs = async (
  fetchWithInterceptor: FetchClient
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/auth/admin/audit-logs");
};

export const adminGetAnalytics = async (
  fetchWithInterceptor: FetchClient
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/auth/admin/analytics");
};

export const adminGetProjects = async (
  fetchWithInterceptor: FetchClient
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/auth/admin/projects");
};

export const adminDeleteProject = async (
  fetchWithInterceptor: FetchClient,
  projectId: string
): Promise<ApiResponse<any>> => {
  return apiRequest(
    fetchWithInterceptor,
    `/api/auth/admin/projects/${projectId}`,
    {
      method: "DELETE",
    }
  );
};

export const adminGetUserLogs = async (
  fetchWithInterceptor: FetchClient,
  userId: string,
  limit: number = 20
): Promise<ApiResponse<any>> => {
  return apiRequest(
    fetchWithInterceptor,
    `/api/auth/admin/users/${userId}/logs?limit=${limit}`
  );
};

export const adminBulkAction = async (
  fetchWithInterceptor: FetchClient,
  data: any
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/auth/admin/users/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};

export const adminImpersonateUser = async (
  fetchWithInterceptor: FetchClient,
  userId: string
): Promise<ApiResponse<any>> => {
  return apiRequest(
    fetchWithInterceptor,
    `/api/auth/admin/impersonate/${userId}`,
    {
      method: "POST",
    }
  );
};

export const adminGetAnnouncements = async (
  fetchWithInterceptor: FetchClient
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/auth/admin/announcements");
};

export const adminCreateAnnouncement = async (
  fetchWithInterceptor: FetchClient,
  data: any
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/auth/admin/announcements", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};

export const adminDeleteAnnouncement = async (
  fetchWithInterceptor: FetchClient,
  id: number
): Promise<ApiResponse<any>> => {
  return apiRequest(
    fetchWithInterceptor,
    `/api/auth/admin/announcements/${id}`,
    {
      method: "DELETE",
    }
  );
};
