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

# Standard reader candidate selectors to inspect during DOM scanning
READER_CONTAINER_SELECTORS = [
    "#_imageList", "._img_viewer_area", ".viewer_lst", ".wt_viewer", "._imageList",
    "#readerarea", ".readerarea", "#reader-area", ".reader-area-wrap", ".reader-area",
    ".read-container", ".reader-page", ".gc-reader", "[data-gc-page]", "#reader",
    ".wp-manga-chapter-img", ".rd-page", ".page-break", ".reading-content", ".main-col",
    ".entry-content", ".reading-detail", ".chapter-content", ".episode-view", ".comic-content",
    ".panel-container", "#comic_view_area", "#comic-image", "#comic-view", ".ep-contents",
    ".chapter-img", ".page-content", ".comic-page-img", ".chapter-images", ".viewer-images",
    ".comic-pages", ".manga-reader", "#chapter-reader", "#manga-reader", ".vng-reader",
    ".reader-image-list", ".reader-content", ".reading-area", ".chapter-area",
    ".viewer-cnt", ".viewer-wrap", "#viewer-container", ".manga-image", ".read-img",
    ".chapter-img-list", ".chapter-image", ".reader-images", "#chapter-images", ".page-img",
    "#pages", "#images-container", "#pages-container", ".canvas-container", ".manga-page",
    "[data-page]", "[data-page-id]", "[class*='reader-content']", "[class*='chapter-content']",
    "[class*='reader-area']", "[class*='viewer-area']", "[class*='comic-view']",
    ".viewer", ".reader", ".webtoon-viewer", ".chapter-viewer"
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
    "membership-", "avatar", "share_btn", "icon_", "banner", "promo", "thumb"
]

# Image extensions
IMAGE_EXTENSIONS = (
    ".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".bmp", ".tiff", ".svg"
)

# Minimum threshold for reader candidate validation
MIN_READER_CONFIDENCE_THRESHOLD = 40.0

# Minimum image dimensions for validation
DEFAULT_MIN_IMAGE_WIDTH = 80
DEFAULT_MIN_IMAGE_HEIGHT = 80
