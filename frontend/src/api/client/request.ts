import { FetchClient, ApiResponse } from "@/api/types";

/**
 * Standard generic network helper that wraps FetchClient, parses JSON, and types the response.
 * Automatically sets Content-Type: application/json when a body is present and no Content-Type is
 * explicitly provided, so FastAPI/Pydantic can parse the request body without a 422.
 */
export async function apiRequest<T = any>(
  fetchWithInterceptor: FetchClient,
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const method = (options?.method || "GET").toUpperCase();
  const hasBody = options?.body !== undefined && options.body !== null;

  // Build merged headers — inject Content-Type for JSON-body requests if not already set
  const existingHeaders = new Headers(options?.headers as HeadersInit | undefined);
  if (hasBody && ["POST", "PUT", "PATCH"].includes(method) && !existingHeaders.has("Content-Type")) {
    existingHeaders.set("Content-Type", "application/json");
  }

  const res = await fetchWithInterceptor(url, {
    ...options,
    headers: existingHeaders,
  });
  return res.json() as Promise<ApiResponse<T>>;
}
