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

  // Only inject for /api requests and when a token exists
  if (token && isApiRequest(input)) {
    const headers = new Headers(init?.headers);

    // Never override an explicit Authorization header
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return _originalFetch(input, { ...init, headers });
  }

  return _originalFetch(input, init);
};
