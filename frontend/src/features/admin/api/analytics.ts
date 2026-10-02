import { apiRequest } from "@/shared/api/client/request";
import { ApiResponse } from "@/shared/api/types";

export const getProjectTokenAnalytics = async (
  fetchWithInterceptor: any
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/projects/analytics/tokens");
};

export const getCreatorAnalytics = async (
  fetchWithInterceptor: any
): Promise<ApiResponse<any>> => {
  const fetcher =
    typeof fetchWithInterceptor === "function"
      ? fetchWithInterceptor
      : (fetch as any);

  return apiRequest(fetcher, "/api/v1/auth/analytics");
};

export const getAnalytics = getCreatorAnalytics;
