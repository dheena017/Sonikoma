"""
backend/app/services/scraper/evidence/sources.py
─────────────────────────────────────────────────────────────────────────────
Enumeration of all supported evidence sources for scraper provenance tracking.
─────────────────────────────────────────────────────────────────────────────
"""

from enum import Enum


class EvidenceSource(str, Enum):
    """Origin sources that can provide chapter, image, or reader evidence."""
    STATIC_HTML = "STATIC_HTML"
    DOM_READER = "DOM_READER"
    EMBEDDED_JSON = "EMBEDDED_JSON"
    EMBEDDED_STATE = "EMBEDDED_STATE"
    NEXT_DATA = "NEXT_DATA"
    NUXT_STATE = "NUXT_STATE"
    REACT_STATE = "REACT_STATE"
    REST_API = "REST_API"
    GRAPHQL = "GRAPHQL"
    XHR = "XHR"
    FETCH = "FETCH"
    NETWORK_INTERCEPTION = "NETWORK_INTERCEPTION"
    BROWSER_RENDER = "BROWSER_RENDER"
    IFRAME = "IFRAME"
    CANVAS = "CANVAS"
    BLOB = "BLOB"
    TILES = "TILES"
    LOCAL_STORAGE = "LOCAL_STORAGE"
    SESSION_STORAGE = "SESSION_STORAGE"
    LOCAL_ARCHIVE = "LOCAL_ARCHIVE"
    FALLBACK_METADATA = "FALLBACK_METADATA"
