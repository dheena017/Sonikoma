import { Globe, Book, Smartphone, ExternalLink } from "lucide-react";

/**
 * Proxies external image URLs through the local backend image proxy to bypass CORS/hotlinking.
 */
export function getProxiedImageUrl(url?: string, referer?: string): string {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  if (
    url.includes("/api/proxy-image?url=data") ||
    url.includes("/api/proxy-image?url=blob")
  ) {
    try {
      const match = url.match(/url=([^&]+)/);
      if (match && match[1]) {
        const unwrap = decodeURIComponent(match[1]);
        if (unwrap.startsWith("data:") || unwrap.startsWith("blob:")) {
          return unwrap;
        }
      }
    } catch (e) {}
  }
  try {
    const decoded = decodeURIComponent(url);
    if (
      url.includes("/api/proxy-image") ||
      url.includes("/api/proxy/image") ||
      decoded.includes("/api/proxy-image") ||
      decoded.includes("/api/proxy/image")
    ) {
      if (referer && !url.includes("referer=") && !decoded.includes("referer=")) {
        const sep = url.includes("?") ? "&" : "?";
        return `${url}${sep}referer=${encodeURIComponent(referer)}`;
      }
      return url;
    }
  } catch {
    if (url.includes("/api/proxy-image") || url.includes("/api/proxy/image")) {
      if (referer && !url.includes("referer=")) {
        const sep = url.includes("?") ? "&" : "?";
        return `${url}${sep}referer=${encodeURIComponent(referer)}`;
      }
      return url;
    }
  }
  if (url.includes("/api/")) {
    return url;
  }
  if (url.startsWith("http") && !url.includes("/api/")) {
    let proxied = `/api/proxy-image?url=${encodeURIComponent(url)}`;
    if (referer) {
      proxied += `&referer=${encodeURIComponent(referer)}`;
    }
    return proxied;
  }
  return url;
}

/**
 * Extracts a human-friendly platform name from a URL hostname.
 */
export function getSourceName(urlStr: string): string {
  try {
    if (!urlStr) return "Custom Source";
    const cleaned = urlStr.trim();
    const urlObj = new URL(cleaned.startsWith("http") ? cleaned : "https://" + cleaned);
    const host = urlObj.hostname.toLowerCase();

    const parts = host
      .replace(/^www\./, "")
      .split(".")
      .filter(
        (p) =>
          ![
            "com", "net", "org", "io", "co", "kr", "app", "fan", "mobi",
            "tv", "cc", "us", "me", "xyz", "top", "site", "online", "store"
          ].includes(p)
      );

    const nameParts = parts.filter(
      (p) =>
        ![
          "m", "api", "cdn", "static", "assets", "v1", "v2", "v3",
          "en", "kr", "jp", "cn", "fr", "es", "de"
        ].includes(p)
    );
    const activeParts = nameParts.length > 0 ? nameParts : parts;

    if (activeParts.length > 0) {
      return activeParts
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ");
    }
    return "Custom Source";
  } catch {
    return "Custom Source";
  }
}

/**
 * Returns a UI icon component appropriate for the source URL.
 */
export function getSourceIcon(urlStr: string) {
  try {
    if (!urlStr) return Globe;
    const cleaned = urlStr.trim();
    const urlObj = new URL(cleaned.startsWith("http") ? cleaned : "https://" + cleaned);
    const host = urlObj.hostname.toLowerCase();

    if (host.includes("webtoons.com") || host.includes("webtoon.com")) return Book;
    if (host.includes("webcomicsapp.com")) return Smartphone;
    return ExternalLink;
  } catch {
    return Globe;
  }
}
