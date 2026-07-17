"""
backend/app/services/scraper/parsers/constants.py
"""

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPad; CPU OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
]

# URL substrings that indicate a non-panel image (icons, logos, ads, ui elements, etc.)
# Used by scraper.py to filter out irrelevant images from scraped pages.
UNWANTED_PATTERNS = [
    "logo",
    "icon",
    "banner",
    "avatar",
    "thumbnail",
    "cover",
    "thumb",
    "favicon",
    "sprite",
    "button",
    "badge",
    "advertisement",
    "ads/",
    "/ad/",
    "tracking",
    "pixel",
    "1x1",
    "spacer",
    "placeholder",
    "loading",
    "spinner",
    "background",
]
