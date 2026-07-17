"""
backend/app/services/scraper/parsers/__init__.py
"""
from .constants import USER_AGENTS, UNWANTED_PATTERNS
from .utils import decode_escaped_js_string, natural_sort_key
from .metadata import parse_episode_index, extract_metadata, parse_image_dimensions_from_bytes
from .archive import scrape_local_archive
from .html import parse_with_bs4
from .nuxt import extract_images_from_nuxt_payload

__all__ = [
    'USER_AGENTS',
    'UNWANTED_PATTERNS',
    'decode_escaped_js_string',
    'natural_sort_key',
    'parse_episode_index',
    'extract_metadata',
    'parse_image_dimensions_from_bytes',
    'scrape_local_archive',
    'parse_with_bs4',

    'extract_images_from_nuxt_payload'
]
