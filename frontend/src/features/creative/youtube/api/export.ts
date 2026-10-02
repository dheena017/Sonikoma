import { apiRequest } from "@/shared/api/client/request";
import { FetchClient, ApiResponse } from "@/shared/api/types";

export const exportToYoutube = async (
  fetchWithInterceptor: FetchClient,
  data: any
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/export/youtube", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};
