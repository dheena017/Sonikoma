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
    if (parts[0] === "studio" && parts.length >= 3) {
      return parts[2] || "";
    }
    if (parts[0] === "series" && parts.length >= 2) {
      return parts[1] || "";
    }
    if (parts.length >= 2 && (parts[0] === "watch" || parts[0] === "read")) {
      return parts[1] || "";
    }
    return "";
  };

  return {
    navigate,
    seriesId: getSeriesId(),
  };
}

export default useSeriesNavigation;
