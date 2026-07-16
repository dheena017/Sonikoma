import { apiRequest } from "./request";
import {
  FetchClient,
  ApiResponse,
  CreateProjectPayload,
  UpdateProjectPayload,
  SaveScrapedImagesPayload,
} from "./types";

export const getProjects = async (
  fetchWithInterceptor: FetchClient
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/projects");
};

export const getProject = async (
  fetchWithInterceptor: FetchClient,
  projectId: string
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, `/api/projects/${projectId}`);
};

export const getPublicProject = async (
  fetchWithInterceptor: FetchClient,
  projectId: string
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, `/api/projects/public/${projectId}`);
};

export const createProject = async (
  fetchWithInterceptor: FetchClient,
  projectData: CreateProjectPayload
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(projectData),
  });
};

export const updateProject = async (
  fetchWithInterceptor: FetchClient,
  projectId: string,
  projectData: UpdateProjectPayload
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, `/api/projects/${projectId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(projectData),
  });
};

export const deleteProject = async (
  fetchWithInterceptor: FetchClient,
  projectId: string
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, `/api/projects/${projectId}`, {
    method: "DELETE",
  });
};

export const batchDeleteProjects = async (
  fetchWithInterceptor: FetchClient,
  projectIds: string[]
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/projects/batch-delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_ids: projectIds }),
  });
};

export const getSeries = async (
  fetchWithInterceptor: FetchClient,
  seriesSlug: string
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, `/api/projects/series/${seriesSlug}`);
};

export const deleteSeries = async (
  fetchWithInterceptor: FetchClient,
  seriesId: string
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, `/api/projects/series/${seriesId}`, {
    method: "DELETE",
  });
};

export const updateProjectPanels = async (
  fetchWithInterceptor: FetchClient,
  projectId: string,
  panels: any[]
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, `/api/projects/${projectId}/panels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ panels }),
  });
};

export const saveScrapedImages = async (
  fetchWithInterceptor: FetchClient,
  data: SaveScrapedImagesPayload
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/save-scraped-images", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};

export const updateProjectTokens = async (
  fetchWithInterceptor: FetchClient,
  projectId: string,
  tokens: number
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, `/api/projects/${projectId}/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tokens }),
  });
};
