import { apiRequest } from "./request";
import { ApiResponse } from "./types";

export const getProjectTokenAnalytics = async (
  fetchWithInterceptor: any
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/projects/analytics/tokens");
};

export const getCreatorAnalytics = async (
  fetchWithInterceptor: any
): Promise<ApiResponse<any>> => {
  const fetcher =
    typeof fetchWithInterceptor === "function"
      ? fetchWithInterceptor
      : (fetch as any);

  return apiRequest(fetcher, "/api/auth/analytics");
};

export const getAnalytics = getCreatorAnalytics;
