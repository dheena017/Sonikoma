import { Globe, Book, Smartphone, ExternalLink } from "lucide-react";

// Extracts the first valid URL if the pasted string contains duplicate or concatenated links.
export function extractWebtoonUrl(urlStr: string): string {
  if (!urlStr) return "";
  const trimmed = urlStr.trim();
  const duplicateAware = trimmed.match(
    /https?:\/\/(?:[^\s"']*?)(?=https?:\/\/|$)/i
  );
  return duplicateAware ? duplicateAware[0] : trimmed;
}

// Removes any webtoons language/region code (like en, fr, es, th, id, zh-hans etc.) from the URL path to keep it region-free
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
        parts.shift(); // discard language/region prefix
        urlObj.pathname = "/" + parts.join("/");
      }
    }
    // Return with original prefix style if user didn't enter https yet
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

// Robust path parser for dynamic Webtoon URLs to extract Title, Genre, and Chapter details without any hardcoding
export function parseWebtoonUrl(urlStr: string) {
  try {
    const cleanedUrl = stripRegionFromUrl(urlStr);
    const urlObj = new URL(
      cleanedUrl.startsWith("http") ? cleanedUrl : "https://" + cleanedUrl
    );
    const parts = urlObj.pathname.split("/").filter(Boolean);

    // Check query params for episode/chapter indicators
    let epVal: string | null = null;
    const searchKeys = [
      "episode_no",
      "episode",
      "chapter",
      "ep",
      "no",
      "chapter_no",
    ];
    for (const key of searchKeys) {
      const val = urlObj.searchParams.get(key);
      if (val) {
        epVal = val;
        break;
      }
    }

    let genre = "general";
    let title = "Webtoon Comic";
    let chapterNumber = epVal || "1";
    let chapterTitle = "";

    const cleanTitle = (raw: string) => {
      // Check if original is UUID
      const isOriginalUuid =
        /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
          raw
        );
      if (isOriginalUuid) {
        return getSourceName(urlStr) + " Comic";
      }
      let cleaned = raw.replace(/^\d+[-_]/, "");
      const isPureNum = /^\d+$/.test(cleaned);
      if (isPureNum) {
        return getSourceName(urlStr) + " Comic";
      }
      const replaced = cleaned.replace(/-/g, " ");
      // Strip 8-character hex suffix commonly appended to Webtoon series slugs
      const doubleCleaned = replaced.replace(/\s+[a-fA-F0-9]{8}$/, "");
      return doubleCleaned.replace(/\b\w/g, (c) => c.toUpperCase());
    };

    if (parts.length >= 2) {
      genre = parts[0] || "general";

      // Check if series title and chapter number are merged in parts[1]
      const mergeMatch = parts[1].match(
        /^(.*?)[-_](?:chapter|episode|ep|ch|no)[-_]?(\d+)(?:[-_].*)?$/i
      );
      if (mergeMatch) {
        title = cleanTitle(mergeMatch[1]);
        if (!epVal) {
          chapterNumber = mergeMatch[2];
        }
      } else {
        title = cleanTitle(parts[1]);
      }

      // Look for a chapter segment in remaining path parts containing a digit
      let epPart = "";
      for (let i = 2; i < parts.length; i++) {
        if (/\d+/.test(parts[i]) && parts[i] !== "viewer") {
          epPart = parts[i];
          break;
        }
      }

      if (!epPart && parts[2] && parts[2] !== "viewer") {
        epPart = parts[2];
      }

      if (epPart) {
        // Find first number sequence as chapter number
        const numMatch = epPart.match(/(?:^|[^0-9])(\d+)(?:[^0-9]|$)/);
        let pathNum = numMatch ? numMatch[1] : "";

        if (!epVal && pathNum) {
          chapterNumber = pathNum;
        }

        // Clean name
        let rawTitle = epPart;
        if (pathNum) {
          const numIdx = epPart.indexOf(pathNum);
          const after = epPart.substring(numIdx + pathNum.length);
          rawTitle = after.replace(/[-_]+/g, " ").trim();
          if (!rawTitle) {
            const before = epPart.substring(0, numIdx);
            rawTitle = before
              .replace(/(?:chapter|episode|ep|no)/gi, "")
              .replace(/[-_]+/g, " ")
              .trim();
          }
        } else {
          rawTitle = epPart
            .replace(/(?:chapter|episode|ep|no)/gi, "")
            .replace(/[-_]+/g, " ")
            .trim();
        }
        chapterTitle = rawTitle.replace(/\b\w/g, (c) => c.toUpperCase());
      }
    } else if (parts.length === 1) {
      // Check if series title and chapter number are merged in parts[0]
      const mergeMatch = parts[0].match(
        /^(.*?)[-_](?:chapter|episode|ep|ch|no)[-_]?(\d+)(?:[-_].*)?$/i
      );
      if (mergeMatch) {
        title = cleanTitle(mergeMatch[1]);
        if (!epVal) {
          chapterNumber = mergeMatch[2];
        }
      } else {
        title = cleanTitle(parts[0]);
      }
    }

    let episode = `Chapter ${chapterNumber}`;
    if (chapterTitle) {
      episode = `Chapter ${chapterNumber} - ${chapterTitle}`;
    }

    return { genre, title, chapterNumber, chapterTitle, episode };
  } catch {
    return {
      genre: "general",
      title: "Custom Timeline",
      chapterNumber: "1",
      chapterTitle: "",
      episode: "Chapter 1",
    };
  }
}

export function getSourceName(urlStr: string): string {
  try {
    if (!urlStr) return "Custom Source";
    const cleaned = urlStr.trim();
    const urlObj = new URL(
      cleaned.startsWith("http") ? cleaned : "https://" + cleaned
    );
    const host = urlObj.hostname.toLowerCase();

    if (host.includes("asurascans.com")) return "Asura Scans";
    if (host.includes("webtoons.com") || host.includes("webtoon.com"))
      return "Webtoons";
    if (host.includes("manhuato.com")) return "ManhuaTo";
    if (host.includes("mangadex.org")) return "MangaDex";
    if (host.includes("webcomicsapp.com")) return "WebComics App";
    if (host.includes("toomics.com")) return "Toomics";

    const parts = host.replace("www.", "").split(".");
    if (parts.length > 0) {
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
    return "Custom Source";
  } catch {
    return "Custom Source";
  }
}

export function getSourceIcon(urlStr: string) {
  try {
    if (!urlStr) return Globe;
    const cleaned = urlStr.trim();
    const urlObj = new URL(
      cleaned.startsWith("http") ? cleaned : "https://" + cleaned
    );
    const host = urlObj.hostname.toLowerCase();

    if (host.includes("webtoons.com") || host.includes("webtoon.com"))
      return Book;
    if (host.includes("webcomicsapp.com")) return Smartphone;

    return ExternalLink;
  } catch {
    return Globe;
  }
}

export function getProxiedImageUrl(url?: string): string {
  if (!url) return "";
  if (url.startsWith("http") && !url.startsWith("/api/")) {
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  }
  return url;
}
