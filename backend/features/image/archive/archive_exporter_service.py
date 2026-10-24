"""
backend/features/image/archive/archive_exporter_service.py
─────────────────────────────────────────────────────────────────────────────
Comic Archive Exporter Service (.cbz / .zip):
- Generates industry-standard ComicInfo.xml metadata sidecar for readers
  (Tachiyomi, Mihon, Komga, Kavita, CDisplayEx)
- Packages image buffers sequentially as panel_001.png, panel_002.png...
- Embeds machine-readable metadata.json alongside ComicInfo.xml
─────────────────────────────────────────────────────────────────────────────
"""

import io
import json
import zipfile
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("sonikoma.features.image.archive.archive_exporter")


# ─────────────────────────────────────────────────────────────────────────────
# 1. Internal Helpers (Top)
# ─────────────────────────────────────────────────────────────────────────────

def generate_comic_info_xml(metadata: Dict[str, Any], page_count: int) -> str:
    """Generates standard ComicInfo.xml metadata sidecar."""
    title = metadata.get("title", "Webtoon Comic")
    author = metadata.get("author", "Unknown Author")
    genre = metadata.get("genre", "General")
    synopsis = metadata.get("synopsis") or metadata.get("description", "")
    episode = metadata.get("episode", "Chapter 1")

    xml_content = f"""<?xml version="1.0" encoding="utf-8"?>
<ComicInfo xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Title>{title}</Title>
  <Series>{title}</Series>
  <Number>{episode}</Number>
  <Summary>{synopsis}</Summary>
  <Writer>{author}</Writer>
  <Genre>{genre}</Genre>
  <PageCount>{page_count}</PageCount>
  <LanguageISO>en</LanguageISO>
</ComicInfo>"""
    return xml_content.strip()


def _resolve_extension(content_type: str) -> str:
    """Resolves standard file extension from content-type header."""
    ct = content_type.lower()
    if "jpeg" in ct or "jpg" in ct:
        return "jpg"
    elif "webp" in ct:
        return "webp"
    elif "avif" in ct:
        return "avif"
    return "png"


# ─────────────────────────────────────────────────────────────────────────────
# 2. Canonical Public API Function (Bottom)
# ─────────────────────────────────────────────────────────────────────────────

def export_comic_archive(
    images_data: List[Dict[str, Any]],
    metadata: Dict[str, Any],
    archive_format: str = "cbz"
) -> bytes:
    """
    Packages a collection of image buffers into a .cbz or .zip comic archive stream.

    Args:
        images_data: List of dicts with keys 'data' (bytes) and optional 'content_type'.
        metadata: Comic metadata dictionary (title, author, synopsis, etc.).
        archive_format: Target format ('cbz' or 'zip').

    Returns:
        Raw zip/cbz archive bytes.
    """
    buffer = io.BytesIO()

    with zipfile.ZipFile(buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        comic_xml = generate_comic_info_xml(metadata, len(images_data))
        zf.writestr("ComicInfo.xml", comic_xml)

        meta_json = json.dumps(metadata, indent=2)
        zf.writestr("metadata.json", meta_json)

        for idx, item in enumerate(images_data):
            img_bytes = item.get("data")
            if not img_bytes:
                continue

            content_type = item.get("content_type", "image/png")
            ext = _resolve_extension(content_type)
            filename = f"panel_{idx + 1:03d}.{ext}"
            zf.writestr(filename, img_bytes)

    buffer.seek(0)
    return buffer.getvalue()


# Alias for backward compatibility
create_comic_archive = export_comic_archive

__all__ = [
    "export_comic_archive",
    "create_comic_archive",
    "generate_comic_info_xml",
]
