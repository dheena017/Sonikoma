import {
  ThumbnailGenerateRequest,
  ThumbnailGenerateResponse,
} from "../types";

const BASE_URL = "/api/v1/creative/thumbnails";

export async function generateThumbnails(
  fetchWithInterceptor: any,
  request: ThumbnailGenerateRequest
): Promise<ThumbnailGenerateResponse> {
  const fetcher = fetchWithInterceptor || window.fetch.bind(window);
  const response = await fetcher(`${BASE_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to generate thumbnails.");
  }
  return response.json();
}
