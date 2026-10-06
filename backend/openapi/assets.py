"""Static asset helpers for the Sonikoma API documentation pages."""

from pathlib import Path

from openapi.config import CATEGORY_METADATA

_CURRENT_DIR = Path(__file__).resolve().parent
_STATIC_DIR = _CURRENT_DIR / "static"
_TEMPLATES_DIR = _CURRENT_DIR / "templates"


def read_asset(path: str) -> str:
    """Return the content of a file from the static assets directory."""
    asset_path = _STATIC_DIR / path
    if not asset_path.exists():
        return ""
    return asset_path.read_text(encoding="utf-8")


def read_template(path: str) -> str:
    """Return the content of a Jinja-style template file."""
    template_path = _TEMPLATES_DIR / path
    if not template_path.exists():
        return ""
    return template_path.read_text(encoding="utf-8")


def load_css(asset_name: str) -> str:
    """Wrap a stylesheet in a style tag."""
    css_content = read_asset(asset_name)
    if not css_content:
        return ""
    return f"<style>\n{css_content}\n</style>"


def load_js(asset_name: str) -> str:
    """Return JavaScript content from the static directory."""
    return read_asset(asset_name)


def build_category_pills(current_category: str = "all") -> str:
    """Render the category navigation pills used in the docs sidebar."""
    category_clean = (current_category or "all").lower()
    return "".join(
        [
            (
                f'<a href="{category["path"]}" '
                f'class="category-pill {"active" if category["id"] == category_clean else ""}">{category["label"]}</a>'
            )
            for category in CATEGORY_METADATA
        ]
    )


def get_sidebar_html(current_category: str = "all") -> str:
    """Render the custom docs sidebar and header navigation shell."""
    category_clean = (current_category or "all").lower()
    category_label = next(
        (item["label"] for item in CATEGORY_METADATA if item["id"] == category_clean),
        "All APIs",
    )

    template = read_template("sidebar.html")
    if not template:
        return "<aside class='sonikoma-sidebar'>__PILLS_PLACEHOLDER__</aside>"

    return (
        template.replace("__PILLS_PLACEHOLDER__", build_category_pills(category_clean))
        .replace("__CATEGORY_LABEL__", category_label)
    )
