"""Compatibility facade for the Sonikoma API documentation theme layer.

The implementation is split across dedicated asset and renderer modules so the
Swagger UI, ReDoc, and schema explorer concerns stay easier to maintain.
"""

from openapi.renderers import (
    get_redoc_custom_html,
    get_redoc_dark_theme_css,
    get_schemas_explorer_html,
    get_swagger_dark_theme_css,
    get_swagger_navbar_html,
    get_swagger_ui_js,
    get_test_portal_html,
)

__all__ = [
    "get_swagger_dark_theme_css",
    "get_swagger_ui_js",
    "get_swagger_navbar_html",
    "get_redoc_dark_theme_css",
    "get_schemas_explorer_html",
    "get_redoc_custom_html",
    "get_test_portal_html",
]

