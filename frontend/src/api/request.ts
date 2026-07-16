import { FetchClient, ApiResponse } from "./types";

/**
 * Standard generic network helper that wraps FetchClient, parses JSON, and types the response.
 */
export async function apiRequest<T = any>(
  fetchWithInterceptor: FetchClient,
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetchWithInterceptor(url, options);
  return res.json() as Promise<ApiResponse<T>>;
}
