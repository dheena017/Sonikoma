/**
 * frontend/src/utils/authFetch.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Global fetch interceptor:
 * 1. Auto-attaches Sonikoma JWT and BYOK keys to all /api requests.
 * 2. In-flight request coalescing (deduplication) — concurrent identical GET/query
 *    requests share a single in-flight promise and return cloned responses.
 * 3. Intelligent Page-by-Page Cache:
 *    - 30-second TTL for projects, series, analytics, and user profile data.
 *    - 60-second TTL for AI model catalogs and provider routing.
 *    - Navigating back and forth between pages serves instantly in 0ms without
 *      repetitive backend queries.
 * 4. Automatic cache invalidation on any mutation (POST, PUT, DELETE, PATCH).
 * 5. Supports manual bypass via `cache: "no-cache"` or `Cache-Control: no-cache`.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const _originalFetch = window.fetch.bind(window);

const activeSkillAbortControllers = new Set<AbortController>();

// ── In-Flight Request Deduplication & Smart Client Cache ────────────────────
interface CachedApiResponse {
  text: string;
  status: number;
  statusText: string;
  headers: [string, string][];
  timestamp: number;
}

const inFlightRequests = new Map<string, Promise<Response>>();
const recentResponses = new Map<string, CachedApiResponse>();

function getCacheTtlMs(url: string): number {
  if (
    url.includes("/api/v1/ai/models") ||
    url.includes("/api/v1/ai/routing") ||
    url.includes("/api/v1/providers") ||
    url.includes("/api/v1/export/youtube")
  ) {
    return 60_000; // 60 seconds for static AI catalog & routing
  }
  if (
    url.includes("/api/v1/projects") ||
    url.includes("/api/v1/ai-series") ||
    url.includes("/api/v1/auth/me") ||
    url.includes("/api/v1/auth/analytics") ||
    url.includes("/api/v1/profile") ||
    url.includes("/api/v1/notifications") ||
    url.includes("/api/v1/shortcuts")
  ) {
    return 30_000; // 30 seconds for page navigation data
  }
  return 15_000; // 15 seconds default for all other idempotent queries
}

function notifySkillRequestState() {
  const count = activeSkillAbortControllers.size;
  window.dispatchEvent(
    new CustomEvent("sonikoma-skill-request-count", { detail: count })
  );
}

function shouldTrackSkillRequest(input: RequestInfo | URL): boolean {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
      ? input.toString()
      : input.url;
  return url.includes("/api/v1/ai/skills/");
}

function createTrackedAbortController(
  input: RequestInfo | URL,
  init?: RequestInit
): AbortController | null {
  if (!shouldTrackSkillRequest(input) || init?.signal) {
    return null;
  }

  const controller = new AbortController();
  activeSkillAbortControllers.add(controller);
  notifySkillRequestState();
  return controller;
}

function getToken(): string | null {
  return (
    localStorage.getItem("sonikoma_token") ||
    sessionStorage.getItem("sonikoma_token")
  );
}

function isApiRequest(input: RequestInfo | URL): boolean {
  if (typeof input === "string") {
    return input.startsWith("/api") || input.includes("localhost");
  }
  if (input instanceof URL) {
    return input.pathname.startsWith("/api");
  }
  if (input instanceof Request) {
    const url = input.url;
    return url.startsWith("/api") || url.includes("localhost");
  }
  return false;
}

function getUrlString(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  if (input instanceof Request) return input.url;
  return "";
}

function getDeduplicationKey(
  input: RequestInfo | URL,
  init?: RequestInit
): string | null {
  const method = (init?.method || "GET").toUpperCase();
  const url = getUrlString(input);

  if (!url || !isApiRequest(url)) return null;

  // Do not deduplicate streaming, SSE, health, or telemetry logs
  if (
    url.includes("/system-logs") ||
    url.includes("/system/health") ||
    url.includes("/metrics") ||
    url.includes("/stream") ||
    url.includes("/events")
  ) {
    return null;
  }

  // Idempotent read operations
  if (method === "GET" || method === "HEAD") {
    return `${method}:${url}`;
  }

  // Idempotent model listing query
  if (method === "POST" && url.includes("/api/v1/ai/list-models")) {
    const bodyStr = typeof init?.body === "string" ? init.body : "";
    return `POST:${url}:${bodyStr}`;
  }

  return null;
}

export function invalidateApiCache(filter?: string) {
  if (filter) {
    for (const key of recentResponses.keys()) {
      if (key.includes(filter)) {
        recentResponses.delete(key);
      }
    }
  } else {
    recentResponses.clear();
  }
}

if (typeof window !== "undefined") {
  (window as any).invalidateApiCache = invalidateApiCache;
}

window.fetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  const token = getToken();
  const trackedAbortController = createTrackedAbortController(input, init);
  const headers = new Headers(init?.headers);

  // Only inject for /api requests and when a token exists
  if (token && isApiRequest(input)) {
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const dedupKey = getDeduplicationKey(input, init);
  const method = (init?.method || "GET").toUpperCase();
  const url = getUrlString(input);

  // Check if caller explicitly requested fresh data
  const forceFresh =
    init?.cache === "no-cache" ||
    init?.cache === "no-store" ||
    headers.get("Cache-Control") === "no-cache" ||
    headers.get("Pragma") === "no-cache";

  // Invalidate cache on any mutation (POST, PUT, DELETE, PATCH)
  if (
    method !== "GET" &&
    method !== "HEAD" &&
    !dedupKey?.startsWith("POST:/api/v1/ai/list-models")
  ) {
    invalidateApiCache();
  }

  // Check smart TTL cache for idempotent GET requests (instant 0ms response)
  if (!forceFresh && dedupKey && recentResponses.has(dedupKey)) {
    const cached = recentResponses.get(dedupKey)!;
    const ttl = getCacheTtlMs(url);
    if (Date.now() - cached.timestamp < ttl) {
      return new Response(cached.text, {
        status: cached.status,
        statusText: cached.statusText,
        headers: new Headers(cached.headers),
      });
    } else {
      recentResponses.delete(dedupKey);
    }
  }

  // Deduplicate in-flight identical requests: return clone of in-flight promise
  if (dedupKey && inFlightRequests.has(dedupKey)) {
    try {
      const existingRes = await inFlightRequests.get(dedupKey)!;
      return existingRes.clone();
    } catch {
      // If previous in-flight failed, proceed with a fresh fetch
    }
  }

  const fetchPromise = (async () => {
    const res = await _originalFetch(input, {
      ...init,
      headers,
      signal: trackedAbortController?.signal ?? init?.signal,
    });

    if (dedupKey && res.ok) {
      try {
        const cloned = res.clone();
        cloned
          .text()
          .then((text) => {
            recentResponses.set(dedupKey, {
              text,
              status: res.status,
              statusText: res.statusText,
              headers: Array.from(res.headers.entries()),
              timestamp: Date.now(),
            });
          })
          .catch(() => {});
      } catch (_) {}
    }
    return res;
  })();

  if (dedupKey) {
    inFlightRequests.set(dedupKey, fetchPromise);
  }

  try {
    const response = await fetchPromise;
    return response.clone();
  } finally {
    if (dedupKey) {
      inFlightRequests.delete(dedupKey);
    }
    if (trackedAbortController) {
      activeSkillAbortControllers.delete(trackedAbortController);
      notifySkillRequestState();
    }
  }
};

export const fetchWithAuth = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  const token =
    localStorage.getItem("sonikoma_token") ||
    sessionStorage.getItem("sonikoma_token");
  const headers = new Headers(init?.headers);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Automatically attach BYOK custom user keys from local storage
  const keys = [
    { storage: "user_gemini_key", header: "X-User-Gemini-Key" },
    { storage: "user_openai_key", header: "X-User-OpenAI-Key" },
    { storage: "user_anthropic_key", header: "X-User-Anthropic-Key" },
    { storage: "user_huggingface_key", header: "X-User-HuggingFace-Key" },
  ];
  for (const { storage, header } of keys) {
    const val = localStorage.getItem(storage);
    if (val && !headers.has(header)) {
      headers.set(header, val);
    }
  }

  return window.fetch(input, {
    ...init,
    headers,
  });
};

declare global {
  interface Window {
    __sonikomaAbortAllSkillRequests?: () => void;
    __sonikomaActiveSkillRequestCount?: () => number;
    __sonikomaInvalidateApiCache?: () => void;
  }
}

window.__sonikomaAbortAllSkillRequests = () => {
  activeSkillAbortControllers.forEach((controller) => controller.abort());
  activeSkillAbortControllers.clear();
  notifySkillRequestState();
};

window.__sonikomaActiveSkillRequestCount = () =>
  activeSkillAbortControllers.size;

window.__sonikomaInvalidateApiCache = invalidateApiCache;
