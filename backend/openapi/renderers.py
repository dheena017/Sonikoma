"""HTML renderers for the Sonikoma API documentation portals."""

from openapi.assets import get_sidebar_html, load_css, load_js, read_template


def get_swagger_dark_theme_css() -> str:
    """Load the custom Swagger UI stylesheet."""
    return load_css("swagger_theme.css")


def get_swagger_ui_js() -> str:
    """Load the custom Swagger UI script."""
    return load_js("swagger_ui.js")


def get_swagger_navbar_html(current_category: str = "all") -> str:
    """Generate the sidebar HTML and attach the custom Swagger UI helpers."""
    rendered_sidebar = get_sidebar_html(current_category)
    js_content = get_swagger_ui_js()
    script_html = f"<script>\n{js_content}\n</script>" if js_content else ""
    return f"{rendered_sidebar}\n{script_html}"


def get_redoc_dark_theme_css() -> str:
    """Load the custom ReDoc stylesheet."""
    return load_css("redoc_theme.css")


def get_schemas_explorer_html() -> str:
    """Render the schema explorer portal with theme and sidebar markup."""
    template = read_template("schemas_explorer.html")
    if not template:
        return ""

    return (
        template.replace("__THEME_CSS_PLACEHOLDER__", get_swagger_dark_theme_css())
        .replace("__SIDEBAR_HTML_PLACEHOLDER__", get_swagger_navbar_html("schemas"))
    )


def get_redoc_custom_html(category: str = "all") -> str:
    """Render the branded ReDoc documentation page."""
    template = read_template("redoc.html")
    if not template:
        return ""

    openapi_url = (
        f"/api/v1/openapi/{category}.json"
        if category and category != "all"
        else "/api/v1/openapi.json"
    )

    return (
        template.replace("__THEME_CSS_PLACEHOLDER__", get_swagger_dark_theme_css())
        .replace("__REDOC_THEME_CSS_PLACEHOLDER__", get_redoc_dark_theme_css())
        .replace("__SIDEBAR_HTML_PLACEHOLDER__", get_swagger_navbar_html(category))
        .replace("__OPENAPI_URL__", openapi_url)
    )


def get_test_portal_html() -> str:
    """Render the interactive studio test portal, falling back to report files when available."""
    from pathlib import Path

    project_root = Path(__file__).resolve().parent.parent.parent
    report_file = project_root / "e2e" / "playwright-report" / "index.html"
    if report_file.exists():
        return report_file.read_text(encoding="utf-8")

    fallback_report = project_root / "playwright-report" / "index.html"
    if fallback_report.exists():
        return fallback_report.read_text(encoding="utf-8")

    template = read_template("test_portal.html")
    if template:
        return template
    return ""
