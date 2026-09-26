/**
 * frontend/src/shared/utils/urlValidator.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Validates comic / webtoon chapter URLs across supported platforms (Webtoons,
 * Naver, MangaDex, Tapas, Bato.to, Toomics, Asura, FlameComics, Madara, etc.)
 * to ensure full, complete viewer links and immediately reject incomplete links,
 * homepages, language roots, or series catalogs.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface UrlValidationResult {
  valid: boolean;
  error?: string;
  platform?: string;
  isWebtoons?: boolean;
}

const COMMON_LANG_CODES = new Set([
  "en", "ko", "kr", "jp", "ja", "zh", "cn", "fr", "es", "de", "id", "th", "tw", "vi"
]);

const BATO_DOMAINS = new Set([
  "bato.to", "mangatoto.com", "battwo.com", "readtoto.com",
  "batotwo.com", "batocomic.com", "batotoo.com"
]);

const SCANLATION_DOMAINS = new Set([
  "asuracomic.net", "asurascans.com", "asura.gg", "asuratoon.com", "asuracomics.com", "asura.nacm.me", "asurascans.net",
  "flamecomics.xyz", "flamecomics.me", "flamecomics.com", "flamescans.org", "flamecomics.org", "flamescans.com", "flame-comics.com",
  "void-scans.com", "voidscans.com", "luminousscans.gg", "luminousscans.com",
  "reaperscans.com", "realmscans.xyz", "cosmicscans.com", "anigliscans.com",
  "freakscans.com", "suryascans.com", "nightcomic.com", "omegascans.org", "vortexscans.org"
]);

const MADARA_DOMAINS = new Set([
  "manhuatop.org", "manhwatop.com", "manhwatop.org", "mangaclash.com",
  "manhuaus.com", "topmanhua.com", "manhuaplus.org", "manhuaplus.com",
  "1stkissmanga.io", "1stkissmanga.com", "1stkissmanga.me", "mangatx.com",
  "mangaeffect.com", "mangaonlineteam.com", "kunmanga.com", "harimanga.com",
  "zinmanga.com", "zinmanga.me", "zinmanga.net", "manhwaclan.com", "manhwaden.com", "manga68.com"
]);

const SERIES_KEYWORDS = new Set([
  "series", "manga", "manhwa", "manhua", "comic", "comics", "webtoon",
  "webtoons", "title", "titles", "comic-detail", "detail", "book", "show"
]);

export function validateChapterUrl(urlStr: string): UrlValidationResult {
  if (!urlStr || !urlStr.trim()) {
    return { valid: false, error: "Please enter a comic chapter viewer URL." };
  }

  const trimmed = urlStr.trim();
  let parsed: URL;
  try {
    const formatted =
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`;
    parsed = new URL(formatted);
  } catch {
    return { valid: false, error: "Invalid URL format. Please enter a valid HTTP/HTTPS link." };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    !hostname ||
    !hostname.includes(".") ||
    hostname.split(".").some((part) => part.length === 0) ||
    hostname.length < 4
  ) {
    return { valid: false, error: "Please enter a valid website domain name." };
  }

  const pathname = parsed.pathname.replace(/\/+$/, "");
  const segments = pathname.split("/").filter(Boolean);

  // 1. Reject bare root / homepage URLs (e.g. https://www.webtoons.com or https://asuracomic.net)
  if (segments.length === 0) {
    return {
      valid: false,
      error: `Incomplete URL for ${hostname}. Please enter a direct chapter viewer URL, not the homepage.`,
    };
  }

  // 2. Reject language-only roots (e.g. https://www.webtoons.com/en or https://mangadex.org/en)
  if (segments.length === 1 && COMMON_LANG_CODES.has(segments[0].toLowerCase())) {
    return {
      valid: false,
      error: `Incomplete URL for ${hostname}. Please enter a direct chapter viewer URL, not a language homepage.`,
    };
  }

  // 3. Platform-specific validation
  // ── A. Webtoons ──
  if (hostname.includes("webtoons.com") || hostname.includes("webtoon.com")) {
    const isViewer = segments.some((s) => s.toLowerCase() === "viewer");
    const isList = segments.some((s) => s.toLowerCase() === "list");

    if (isList) {
      return {
        valid: false,
        platform: "Webtoons",
        isWebtoons: true,
        error:
          "This is a series episode list page. Please click into a specific episode viewer URL (e.g. .../viewer?title_no=...&episode_no=...).",
      };
    }

    if (!isViewer) {
      return {
        valid: false,
        platform: "Webtoons",
        isWebtoons: true,
        error:
          "Incomplete Webtoon URL. Only full chapter viewer URLs containing '/viewer' (e.g. https://www.webtoons.com/.../viewer?title_no=958&episode_no=1270) are allowed.",
      };
    }

    const hasEpisodeParam =
      Boolean(parsed.searchParams.get("episode_no")) ||
      Boolean(parsed.searchParams.get("title_no")) ||
      segments.some((s) => /\d+/.test(s));

    if (!hasEpisodeParam) {
      return {
        valid: false,
        platform: "Webtoons",
        isWebtoons: true,
        error:
          "Incomplete Webtoon viewer link. Missing chapter/episode identification parameters.",
      };
    }

    return { valid: true, platform: "Webtoons", isWebtoons: true };
  }

  // ── B. Naver Webtoon ──
  if (hostname.includes("comic.naver.com") || hostname.includes("naver.com")) {
    const isDetail = segments.some((s) => s.toLowerCase() === "detail");
    const hasEpisode = Boolean(parsed.searchParams.get("no"));

    if (!isDetail || !hasEpisode) {
      return {
        valid: false,
        platform: "Naver Webtoon",
        error:
          "Incomplete Naver Webtoon URL. Please provide a direct chapter detail URL (e.g. https://comic.naver.com/webtoon/detail?titleId=...&no=...).",
      };
    }

    return { valid: true, platform: "Naver Webtoon" };
  }

  // ── C. MangaDex ──
  if (hostname.includes("mangadex.org")) {
    const isChapter = segments.some((s) => s.toLowerCase() === "chapter");
    if (!isChapter) {
      if (segments.some((s) => s.toLowerCase() === "title")) {
        return {
          valid: false,
          platform: "MangaDex",
          error:
            "This is a MangaDex series title page. Please click into a specific chapter reader URL (e.g. https://mangadex.org/chapter/{uuid}).",
        };
      }
      return {
        valid: false,
        platform: "MangaDex",
        error:
          "Incomplete MangaDex link. Please provide a direct chapter reader URL (e.g. https://mangadex.org/chapter/{uuid}).",
      };
    }

    return { valid: true, platform: "MangaDex" };
  }

  // ── D. Tapas ──
  if (hostname.includes("tapas.io")) {
    const isEpisode = segments.some((s) => s.toLowerCase() === "episode");
    if (!isEpisode) {
      if (segments.some((s) => s.toLowerCase() === "series")) {
        return {
          valid: false,
          platform: "Tapas",
          error:
            "This is a Tapas series overview page. Please enter a direct episode reader URL (e.g. https://tapas.io/episode/{id}).",
        };
      }
      return {
        valid: false,
        platform: "Tapas",
        error:
          "Incomplete Tapas link. Please enter a direct episode reader URL containing '/episode/'.",
      };
    }

    return { valid: true, platform: "Tapas" };
  }

  // ── E. Bato.to Network ──
  const isBato = Array.from(BATO_DOMAINS).some((d) => hostname.includes(d));
  if (isBato) {
    const isChapter = segments.some((s) => s.toLowerCase() === "chapter");
    if (!isChapter) {
      if (segments.some((s) => s.toLowerCase() === "series" || s.toLowerCase() === "title")) {
        return {
          valid: false,
          platform: "Bato.to",
          error:
            "This is a Bato.to series catalog page. Please enter a direct chapter reader URL (e.g. https://bato.to/chapter/{id}).",
        };
      }
      return {
        valid: false,
        platform: "Bato.to",
        error:
          "Incomplete Bato.to link. Please enter a direct chapter reader URL containing '/chapter/'.",
      };
    }

    return { valid: true, platform: "Bato.to" };
  }

  // ── F. Toomics ──
  if (hostname.includes("toomics.com")) {
    const isEp = segments.some((s) => s.toLowerCase() === "ep");
    if (!isEp) {
      return {
        valid: false,
        platform: "Toomics",
        error:
          "Incomplete Toomics URL. Please enter a direct episode reader URL containing '/ep/' (e.g. https://global.toomics.com/en/index/ep/...).",
      };
    }

    return { valid: true, platform: "Toomics" };
  }

  // ── G. Scanlation Platforms (Asura, Flame Comics, Reaper, Void, etc.) ──
  const isScanlation = Array.from(SCANLATION_DOMAINS).some((d) => hostname.includes(d));
  if (isScanlation) {
    const hasChapterIndicator = segments.some((s) =>
      /(chapter|ch|ep|episode)[-_]?\d+/i.test(s) || /^\d+$/.test(s)
    );
    if (!hasChapterIndicator) {
      return {
        valid: false,
        error:
          `This appears to be a series catalog page on ${hostname}. Please enter a direct chapter reader URL (e.g. ...-chapter-1).`,
      };
    }

    return { valid: true };
  }

  // ── H. Madara / WP-Manga Platforms (ManhwaTop, KunManga, etc.) ──
  const isMadara = Array.from(MADARA_DOMAINS).some((d) => hostname.includes(d));
  if (isMadara) {
    const hasChapterIndicator = segments.some((s) =>
      /(chapter|ch|ep|episode)[-_]?\d+/i.test(s) || /^\d+$/.test(s)
    );
    if (!hasChapterIndicator) {
      return {
        valid: false,
        error:
          `This is a manga series page on ${hostname}. Please enter a specific chapter reader URL (e.g. .../chapter-1/).`,
      };
    }

    return { valid: true };
  }

  // ── I. General Comic & Manga Platforms ──
  const hasChapterIndicator =
    segments.some((s) =>
      /(chapter|episode|ep|ch|viewer|reader|read|c\d+|\d+)/i.test(s)
    ) ||
    Boolean(
      parsed.searchParams.get("chapter") ||
      parsed.searchParams.get("episode") ||
      parsed.searchParams.get("ep") ||
      parsed.searchParams.get("ch") ||
      parsed.searchParams.get("page")
    );

  const lastSeg = segments[segments.length - 1]?.toLowerCase() || "";
  const penultimateSeg = segments[segments.length - 2]?.toLowerCase() || "";

  if (!hasChapterIndicator) {
    if (SERIES_KEYWORDS.has(lastSeg) || SERIES_KEYWORDS.has(penultimateSeg)) {
      return {
        valid: false,
        error:
          `This appears to be a series catalog page on ${hostname}. Please enter a direct chapter reader URL (e.g. .../chapter-1).`,
      };
    }

    if (segments.length <= 2) {
      return {
        valid: false,
        error:
          `Incomplete comic URL for ${hostname}. Please enter a direct chapter or reader page URL.`,
      };
    }
  }

  return { valid: true };
}
