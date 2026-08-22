"""
backend/app/services/scraper/constants.py
─────────────────────────────────────────────────────────────────────────────
Constants, versioning, selectors, and heuristic thresholds for the
Adaptive Webtoon/Chapter Scraper.
─────────────────────────────────────────────────────────────────────────────
"""

SCRAPER_VERSION = "2.0.0"

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36"
]

# Standard reader container selectors to inspect during DOM scanning (container elements only)
READER_CONTAINER_SELECTORS = [
    # Dedicated Webtoons / Naver selectors
    "#_imageList", "._img_viewer_area", ".viewer_lst", ".wt_viewer", "._imageList",
    # Dedicated Manga / Manhwa reader containers
    "#readerarea", ".readerarea", "#reader-area", ".reader-area-wrap",
    ".reading-content", ".reading-content-wrap", ".entry-content", ".entry-content_wrap",
    ".chapter-content", ".c-blog-post", ".read-container", ".reading-detail",
    ".chapter-images", ".viewer-images", ".comic-pages", ".manga-reader",
    "#chapter-reader", "#manga-reader", ".vng-reader", ".reader-image-list",
    ".reader-content", ".reading-area", ".chapter-area", ".viewer-cnt", ".viewer-wrap",
    "#viewer-container", ".chapter-img-list", ".reader-images", "#chapter-images",
    "#pages", "#images-container", "#pages-container", ".canvas-container",
    ".episode-view", ".comic-content", ".panel-container", "#comic_view_area",
    "#comic-image", "#comic-view", ".ep-contents", ".page-content",
    "[class*='reader-content']", "[class*='chapter-content']", "[class*='reader-area']",
    "[class*='viewer-area']", "[class*='comic-view']", ".webtoon-viewer", ".chapter-viewer"
]

# Leaf / item-level image selectors used for fallback discovery and common-ancestor resolution
KNOWN_MANGA_IMAGE_SELECTORS = [
    ".wp-manga-chapter-img", ".page-break img", ".rd-page img", ".chapter-img",
    ".manga-image", ".read-img", ".page-img", ".chapter-image", ".manga-page",
    "[data-page] img", "[data-page-id] img", "img.lazyload-ordered"
]

# Containers and tags that should receive negative scoring or exclusion
UNWANTED_CONTAINERS = [
    "header", "footer", "nav", "aside", ".creator_note", ".author_area",
    ".profile_area", "#cList", ".area_comment", ".rt_area", ".recommend_area",
    ".comment_area", ".viewer_lst_recommend", ".viewer_lst_author", ".author_avatar",
    ".user_avatar", ".reply_area", ".comment_list", ".sidebar", ".navigation",
    ".ad-container", ".advertisement", ".banner-container", ".banner-ads",
    ".banner", ".recommendations", ".social-share", ".related-comics",
    ".recommended-series", ".promo", ".ads", ".thumbs"
]

# Secondary keyword patterns for rejection validation
UNWANTED_PATTERNS = [
    "logo", "favicon", "sprite", "button", "badge", "advertisement", "ads/", "/ad/",
    "tracking", "pixel", "1x1", "spacer", "placeholder", "spinner", "facebook.com",
    "google-analytics", "googletagmanager", "/tr?", "doubleclick", "analytics",
    "age_all_white", "agerate", "defaultuser", "android-chrome", "apple-touch-icon",
    "membership-", "avatar", "share_btn", "icon_", "banner", "promo", "thumb",
    "read-manga-", "read-manhua-", "read-manhwa-", "-75x106", "-150x150",
    "pocketcomics", "pocket_comics", "app_icon", "app-icon", "appstore", "googleplay",
    "playstore", "download_app", "web_app", "app_banner", "site_logo", "/_nuxt/",
    "img_app_", "img_app", "app_comico", "original_image."
]

# Image extensions
IMAGE_EXTENSIONS = (
    ".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".bmp", ".tiff", ".svg"
)

# Supported image MIME types for network interception and proxy streaming
IMAGE_MIME_TYPES = {
    "image/png", "image/jpeg", "image/jpg", "image/webp",
    "image/avif", "image/gif", "image/svg+xml", "image/bmp"
}

# HTML Image Tag attributes to inspect for image URLs (ordered by priority)
IMAGE_ATTRS_TO_SCAN = [
    "src", "data-src", "data-lazy-src", "data-original", "data-cdn",
    "data-url", "srcset", "data-full-url", "data-page-url", "data-echo",
    "data-lazy", "data-srcset", "data-real-src", "data-img-src"
]

# Minimum threshold for reader candidate validation
MIN_READER_CONFIDENCE_THRESHOLD = 40.0

# Minimum image dimensions for comic panels (eliminates 100x150 thumbnail cards)
DEFAULT_MIN_IMAGE_WIDTH = 250
DEFAULT_MIN_IMAGE_HEIGHT = 250


# ─────────────────────────────────────────────────────────────────────────────
# Centralized Supported Platforms & Domains Directory
# ─────────────────────────────────────────────────────────────────────────────
SUPPORTED_PLATFORMS = {
    "mangadex": {
        "name": "MangaDex",
        "description": "High-Speed Direct REST API v5 with lossless @Home CDN",
        "domains": ["mangadex.org", "mangadex.cc"],
        "badge": "Official API",
        "speed": "Fastest (~100ms)"
    },
    "webtoons": {
        "name": "Line Webtoons / Naver",
        "description": "Multi-page vertical scroll webtoon crawler with HD cover art",
        "domains": ["webtoons.com", "comic.naver.com"],
        "badge": "Dedicated Adapter",
        "speed": "Fast (~300ms)"
    },
    "bato": {
        "name": "Bato.to & Mirrors",
        "description": "JavaScript state decryptor for Bato, MangaToto, BatTwo, ReadToto",
        "domains": ["bato.to", "mangatoto.com", "battwo.com", "readtoto.com", "batotwo.com"],
        "badge": "Dedicated Adapter",
        "speed": "Fast (~400ms)"
    },
    "madara": {
        "name": "WordPress Madara CMS",
        "description": "Direct AJAX chapter crawler powering 100+ scanlation websites",
        "domains": [
            "mangatx.com", "manhuaplus.com", "reaperscans.com", "manhwaclan.com",
            "manga68.com", "manhuaus.com", "toonily.com", "mangakakalot.com"
        ],
        "badge": "CMS Family",
        "speed": "Fast (~300ms)"
    },
    "mangastream": {
        "name": "MangaStream / ThemeSphere",
        "description": "Scanlation reader themes (FlameComics, VoidScans, LuminousScans)",
        "domains": ["flamecomics.xyz", "flamecomics.me", "void-scans.com", "luminousscans.gg"],
        "badge": "CMS Family",
        "speed": "Fast (~350ms)"
    },
    "inkr": {
        "name": "INKR Comics",
        "description": "GraphQL manifest parser for INKR comics platform",
        "domains": ["inkr.com"],
        "badge": "Dedicated Adapter",
        "speed": "Fast (~200ms)"
    },
    "webcomics": {
        "name": "WebComics App",
        "description": "WebComics reader API integration",
        "domains": ["webcomicsapp.com"],
        "badge": "Dedicated Adapter",
        "speed": "Fast (~250ms)"
    },
    "generic": {
        "name": "Universal Adaptive Engine",
        "description": "Autonomous dynamic extraction for 100% of all other websites on the internet",
        "domains": ["*"],
        "badge": "Universal Fallback",
        "speed": "Adaptive (~200ms - 1.2s)"
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# Default Excluded & Blocked Ad/Tracker Domains
# ─────────────────────────────────────────────────────────────────────────────
DEFAULT_BLOCKED_DOMAINS = [
    "doubleclick.net", "google-analytics.com", "googletagmanager.com",
    "facebook.com", "adservice.google.com", "pagead2.googlesyndication.com",
    "adtrue.com", "exoclick.com", "popads.net", "propellerads.com",
    "trafficjunky.com", "outbrain.com", "taboola.com", "mgid.com"
]

# ─────────────────────────────────────────────────────────────────────────────
# User-Friendly Frontend Status & Error Messages
# ─────────────────────────────────────────────────────────────────────────────
SCRAPER_MESSAGES = {
    "STARTING": "Connecting to source URL...",
    "DETECTED_PLATFORM": "Detected platform: {platform_name} ({badge})",
    "FETCHING_HTTP": "Downloading page content via high-speed HTTP...",
    "ESCALATING_BROWSER": "Cloudflare / dynamic SPA detected. Launching browser worker with auto-scroll...",
    "EXTRACTING_IMAGES": "Searching page for comic panels and high-resolution images...",
    "VALIDATING_ORDER": "Filtering out advertisements and sorting panels into reading order...",
    "COMPLETE_SUCCESS": "Successfully extracted {total_images} panels in {duration}s!",
    "RAW_SUCCESS": "Extracted all {total_images} raw image assets from the page.",
    
    # Error Messages
    "ERROR_INVALID_URL": "Please enter a valid comic URL starting with http:// or https://",
    "ERROR_BLOCKED_DOMAIN": "This domain ({domain}) is currently in the blocked exclusion list.",
    "ERROR_NO_IMAGES_FOUND": "No comic panels could be found on this page. Try using the Raw All-Images extractor.",
    "ERROR_FETCH_TIMEOUT": "The website took too long to respond. Please check your internet or try again.",
    "ERROR_ACCESS_DENIED": "The target website has strictly blocked access (403 Forbidden). Retrying with browser worker..."
}

