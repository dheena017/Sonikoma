import { apiRequest } from "./request";
import { FetchClient, ApiResponse } from "./types";

export const exportToYoutube = async (
  fetchWithInterceptor: FetchClient,
  data: any
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/export/youtube", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};
