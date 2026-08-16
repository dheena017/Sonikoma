/**
 * frontend/src/utils/authFetch.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Global fetch interceptor — auto-attaches the Sonikoma JWT to every API
 * request so that raw `fetch("/api/...")` calls work without manual headers.
 *
 * This is imported once in main.tsx (before the app renders).  It wraps the
 * native window.fetch, checks whether the target URL is an internal /api
 * endpoint, and silently injects `Authorization: Bearer <token>` if:
 *   1. The URL starts with /api/ or is relative and begins with /api
 *   2. A sonikoma_token is stored in localStorage or sessionStorage
 *   3. No Authorization header is already present (won't override explicit ones)
 *
 * Public endpoints (/api/health, /api/auth/login, /api/auth/register, etc.)
 * are unaffected — the token is simply absent when the user isn't logged in,
 * so those calls go through normally.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const _originalFetch = window.fetch.bind(window);

const activeSkillAbortControllers = new Set<AbortController>();

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
  return url.includes("/api/skills/");
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

window.fetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  const token = getToken();
  const trackedAbortController = createTrackedAbortController(input, init);
  const headers = new Headers(init?.headers);

  // Only inject for /api requests and when a token exists
  if (token && isApiRequest(input)) {
    // Never override an explicit Authorization header
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const responsePromise = _originalFetch(input, {
    ...init,
    headers,
    signal: trackedAbortController?.signal ?? init?.signal,
  });

  return responsePromise.finally(() => {
    if (trackedAbortController) {
      activeSkillAbortControllers.delete(trackedAbortController);
      notifySkillRequestState();
    }
  });
};

export const fetchWithAuth = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  const token =
    localStorage.getItem("sonikoma_token") ||
    sessionStorage.getItem("sonikoma_token");
  const trackedAbortController = createTrackedAbortController(input, init);
  const headers = new Headers(init?.headers);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Automatically attach BYOK custom user keys from local storage
  const geminiKey = localStorage.getItem("user_gemini_key");
  if (geminiKey && !headers.has("X-User-Gemini-Key")) {
    headers.set("X-User-Gemini-Key", geminiKey);
  }
  const openaiKey = localStorage.getItem("user_openai_key");
  if (openaiKey && !headers.has("X-User-OpenAI-Key")) {
    headers.set("X-User-OpenAI-Key", openaiKey);
  }
  const anthropicKey = localStorage.getItem("user_anthropic_key");
  if (anthropicKey && !headers.has("X-User-Anthropic-Key")) {
    headers.set("X-User-Anthropic-Key", anthropicKey);
  }
  const hfKey = localStorage.getItem("user_huggingface_key");
  if (hfKey && !headers.has("X-User-HuggingFace-Key")) {
    headers.set("X-User-HuggingFace-Key", hfKey);
  }

  const responsePromise = fetch(input, {
    ...init,
    headers,
    signal: trackedAbortController?.signal ?? init?.signal,
  });

  return responsePromise.finally(() => {
    if (trackedAbortController) {
      activeSkillAbortControllers.delete(trackedAbortController);
      notifySkillRequestState();
    }
  });
};

declare global {
  interface Window {
    __sonikomaAbortAllSkillRequests?: () => void;
    __sonikomaActiveSkillRequestCount?: () => number;
  }
}

window.__sonikomaAbortAllSkillRequests = () => {
  activeSkillAbortControllers.forEach((controller) => controller.abort());
  activeSkillAbortControllers.clear();
  notifySkillRequestState();
};

window.__sonikomaActiveSkillRequestCount = () =>
  activeSkillAbortControllers.size;
