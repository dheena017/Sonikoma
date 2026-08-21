"""
backend/app/openapi/theme.py
─────────────────────────────────────────────────────────────────────────────
Cyberpunk Dark Neon Theme & Custom Sidebar Layout Loader for Swagger UI.
Separated into dedicated CSS, JS, and HTML template files.
─────────────────────────────────────────────────────────────────────────────
"""

from functools import lru_cache
from pathlib import Path

from app.openapi.config import CATEGORY_METADATA

_CURRENT_DIR = Path(__file__).resolve().parent
_STATIC_DIR = _CURRENT_DIR / "static"
_TEMPLATES_DIR = _CURRENT_DIR / "templates"


def get_swagger_dark_theme_css() -> str:
    """Loads and returns the custom Swagger UI stylesheet from static/swagger_theme.css."""
    css_file = _STATIC_DIR / "swagger_theme.css"
    if css_file.exists():
        css_content = css_file.read_text(encoding="utf-8")
        return f"<style>\n{css_content}\n</style>"
    return ""


def get_swagger_ui_js() -> str:
    """Loads and returns the custom Swagger UI script from static/swagger_ui.js."""
    js_file = _STATIC_DIR / "swagger_ui.js"
    if js_file.exists():
        return js_file.read_text(encoding="utf-8")
    return ""


def get_swagger_navbar_html(current_category: str = "all") -> str:
    """Generates the sidebar HTML, quick action dock, and attaches helper scripts."""
    category_clean = (current_category or "all").lower()

    pills_html = "".join([
        f'<a href="{c["path"]}" class="category-pill {"active" if c["id"] == category_clean else ""}">{c["label"]}</a>'
        for c in CATEGORY_METADATA
    ])

    category_label = next((c["label"] for c in CATEGORY_METADATA if c["id"] == category_clean), "All APIs")

    template_file = _TEMPLATES_DIR / "sidebar.html"
    if template_file.exists():
        template = template_file.read_text(encoding="utf-8")
    else:
        template = "<aside class='sonikoma-sidebar'>__PILLS_PLACEHOLDER__</aside>"

    rendered_html = template.replace("__PILLS_PLACEHOLDER__", pills_html).replace("__CATEGORY_LABEL__", category_label)
    js_content = get_swagger_ui_js()
    script_html = f"<script>\n{js_content}\n</script>" if js_content else ""

    return f"{rendered_html}\n{script_html}"


def get_redoc_dark_theme_css() -> str:
    """Loads and returns the custom ReDoc stylesheet from static/redoc_theme.css."""
    css_file = _STATIC_DIR / "redoc_theme.css"
    if css_file.exists():
        css_content = css_file.read_text(encoding="utf-8")
        return f"<style>\n{css_content}\n</style>"
    return ""


def get_schemas_explorer_html() -> str:
    """Loads and renders the interactive Schemas & Models Explorer portal."""
    template_file = _TEMPLATES_DIR / "schemas_explorer.html"
    if template_file.exists():
        template = template_file.read_text(encoding="utf-8")
        theme_css = get_swagger_dark_theme_css()
        navbar_html = get_swagger_navbar_html("schemas")
        return template.replace("__THEME_CSS_PLACEHOLDER__", theme_css).replace("__SIDEBAR_HTML_PLACEHOLDER__", navbar_html)
    return ""


def get_redoc_custom_html(category: str = "all") -> str:
    """Loads and renders the custom branded ReDoc API reference portal."""
    template_file = _TEMPLATES_DIR / "redoc.html"
    if template_file.exists():
        template = template_file.read_text(encoding="utf-8")
        theme_css = get_swagger_dark_theme_css()
        redoc_theme_css = get_redoc_dark_theme_css()
        navbar_html = get_swagger_navbar_html(category)
        openapi_url = f"/api/openapi/{category}.json" if category and category != "all" else "/api/openapi.json"
        return (
            template
            .replace("__THEME_CSS_PLACEHOLDER__", theme_css)
            .replace("__REDOC_THEME_CSS_PLACEHOLDER__", redoc_theme_css)
            .replace("__SIDEBAR_HTML_PLACEHOLDER__", navbar_html)
            .replace("__OPENAPI_URL__", openapi_url)
        )
    return ""
