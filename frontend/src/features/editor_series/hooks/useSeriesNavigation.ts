/**
 * Navigation and URL parameter resolution hook for AI Generated Series.
 * Integrates natively with Sonikoma's global event-driven routing without requiring react-router-dom.
 */

export function useSeriesNavigation() {
  const navigate = (path: string) => {
    if (typeof window !== "undefined") {
      if (typeof (window as any).navigateTo === "function") {
        (window as any).navigateTo(path);
      } else {
        window.history.pushState({}, "", path);
        window.dispatchEvent(new Event("popstate"));
      }
    }
  };

  const getSeriesId = (): string => {
    if (typeof window === "undefined") return "";
    const parts = window.location.pathname.split("/").filter(Boolean);
    // Patterns:
    // /studio/manhwa/:id -> parts[2]
    // /studio/comic/:id  -> parts[2]
    // /studio/anime/:id  -> parts[2]
    // /series/:id/cast   -> parts[1]
    // /watch/:id         -> parts[1]
    // /read/:id          -> parts[1]
    if (parts.length >= 3 && parts[0] === "studio") {
      return parts[2] || "";
    }
    if (parts.length >= 3 && parts[0] === "series") {
      return parts[1] || "";
    }
    if (parts.length >= 2 && (parts[0] === "watch" || parts[0] === "read" || parts[0] === "series")) {
      return parts[1] || "";
    }
    return parts[parts.length - 1] || "";
  };

  return {
    navigate,
    seriesId: getSeriesId(),
  };
}

export default useSeriesNavigation;
