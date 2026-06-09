/**
 * backend/utils/urlUtils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * URL parsing helpers for Webtoon episode URLs.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Extracts the first valid URL when a pasted string contains duplicate or concatenated Webtoon links. */
export function extractWebtoonUrl(urlStr: string): string {
  if (!urlStr) return "";
  const trimmed = urlStr.trim();
  const duplicateAware = trimmed.match(
    /https?:\/\/(?:[^\s"']*?)(?=https?:\/\/|$)/i
  );
  return duplicateAware ? duplicateAware[0] : trimmed;
}

/** Strips language/region prefix (e.g. /en/, /fr/, /zh-hans/) from a Webtoon URL */
export function stripRegionFromUrl(urlStr: string): string {
  if (!urlStr) return "";
  let workingUrl = extractWebtoonUrl(urlStr);
  if (workingUrl && !/^https?:\/\//i.test(workingUrl)) {
    workingUrl = "https://" + workingUrl;
  }
  try {
    const urlObj = new URL(workingUrl);
    const parts = urlObj.pathname.split("/").filter(Boolean);
    if (parts.length > 0) {
      const rxRegion = /^[a-z]{2}(-[a-z]{2,4})?$/i;
      if (rxRegion.test(parts[0])) {
        parts.shift();
        urlObj.pathname = "/" + parts.join("/");
      }
    }
    let result = urlObj.toString();
    if (
      !urlStr.trim().startsWith("http://") &&
      !urlStr.trim().startsWith("https://")
    ) {
      result = result.replace(/^https?:\/\//i, "");
    }
    return result;
  } catch {
    return urlStr;
  }
}

export interface ParsedWebtoonUrl {
  genre: string;
  title: string;
  episode: string;
}

/** Extracts title, genre, and episode from a Webtoon URL path — no hardcoding */
export function parseWebtoonUrl(urlStr: string): ParsedWebtoonUrl {
  try {
    const cleanedUrl = stripRegionFromUrl(urlStr);
    const urlObj = new URL(
      cleanedUrl.startsWith("http") ? cleanedUrl : "https://" + cleanedUrl
    );
    const parts = urlObj.pathname.split("/").filter(Boolean);
    const host = urlObj.hostname.toLowerCase();

    let genre = "general";
    let title = "Webtoon Comic";
    let episode = "Intro Chapter";

    if (host.includes("webcomicsapp.com")) {
      genre = "WebComicsApp";
      if (parts.length >= 2 && parts[0] === "view") {
        title = parts[1]
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        episode =
          parts.length >= 3
            ? parts
                .slice(2)
                .join(" ")
                .replace(/-/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase())
            : "Chapter";
      } else if (parts.length >= 1) {
        title = parts[parts.length - 1]
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
      }
      return { genre, title, episode };
    }

    if (parts.length >= 2) {
      genre = parts[0] || "general";
      title = parts[1]
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      if (parts[2] && parts[2] !== "viewer") {
        episode = parts[2]
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
      }
    } else if (parts.length === 1) {
      title = parts[0]
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }
    return { genre, title, episode };
  } catch {
    return {
      genre: "general",
      title: "Custom Storyboard",
      episode: "Dynamic Chapter",
    };
  }
}
