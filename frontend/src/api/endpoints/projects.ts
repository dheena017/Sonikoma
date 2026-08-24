import { apiRequest } from "../client/request";
import {
  FetchClient,
  ApiResponse,
  CreateProjectPayload,
  UpdateProjectPayload,
  SaveScrapedImagesPayload,
} from "../types";

export const getProjects = async (
  fetchWithInterceptor: FetchClient
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/projects");
};

export const getProject = async (
  fetchWithInterceptor: FetchClient,
  projectId: string,
  jobId?: string | null
): Promise<ApiResponse<any>> => {
  const query = jobId ? `?job_id=${encodeURIComponent(jobId)}` : "";
  return apiRequest(fetchWithInterceptor, `/api/projects/${projectId}${query}`);
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
  panels: any[],
  jobId?: string | null
): Promise<ApiResponse<any>> => {
  const query = jobId ? `?job_id=${encodeURIComponent(jobId)}` : "";
  return apiRequest(
    fetchWithInterceptor,
    `/api/projects/${projectId}/panels${query}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ panels }),
    }
  );
};

export const saveScrapedImages = async (
  fetchWithInterceptor: FetchClient,
  data: SaveScrapedImagesPayload
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/scraper/cache/session", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};

export const updateProjectTokens = async (
  fetchWithInterceptor: FetchClient,
  projectId: string,
  tokens: number,
  jobId?: string | null
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, `/api/projects/${projectId}/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tokens, ...(jobId ? { job_id: jobId } : {}) }),
  });
};

export const getProjectSettings = async (
  fetchWithInterceptor: FetchClient,
  projectId: string
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, `/api/projects/${projectId}/settings`);
};

export const updateProjectSettings = async (
  fetchWithInterceptor: FetchClient,
  projectId: string,
  settings: {
    video_settings?: any;
    audio_settings?: any;
    autocrop_settings?: any;
  }
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, `/api/projects/${projectId}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
};

// 1. Dedicated Video Settings API
export const getVideoSettings = async (
  fetchWithInterceptor: FetchClient,
  projectId: string
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, `/api/projects/${projectId}/settings/video`);
};

export const updateVideoSettings = async (
  fetchWithInterceptor: FetchClient,
  projectId: string,
  videoSettings: any
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, `/api/projects/${projectId}/settings/video`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ video_settings: videoSettings }),
  });
};

// 2. Dedicated Audio Settings API
export const getAudioSettings = async (
  fetchWithInterceptor: FetchClient,
  projectId: string
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, `/api/projects/${projectId}/settings/audio`);
};

export const updateAudioSettings = async (
  fetchWithInterceptor: FetchClient,
  projectId: string,
  audioSettings: any
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, `/api/projects/${projectId}/settings/audio`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audio_settings: audioSettings }),
  });
};

// 3. Dedicated AutoCrop Settings API
export const getAutoCropSettings = async (
  fetchWithInterceptor: FetchClient,
  projectId: string
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, `/api/projects/${projectId}/settings/autocrop`);
};

export const updateAutoCropSettings = async (
  fetchWithInterceptor: FetchClient,
  projectId: string,
  autoCropSettings: any
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, `/api/projects/${projectId}/settings/autocrop`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ autocrop_settings: autoCropSettings }),
  });
};
