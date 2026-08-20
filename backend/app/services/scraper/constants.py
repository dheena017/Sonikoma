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

# Minimum threshold for reader candidate validation
MIN_READER_CONFIDENCE_THRESHOLD = 40.0

# Minimum image dimensions for comic panels (eliminates 100x150 thumbnail cards)
DEFAULT_MIN_IMAGE_WIDTH = 250
DEFAULT_MIN_IMAGE_HEIGHT = 250
