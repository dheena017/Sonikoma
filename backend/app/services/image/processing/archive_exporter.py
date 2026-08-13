"""
backend/app/services/image/processing/archive_exporter.py
─────────────────────────────────────────────────────────────────────────────
Comic Archive Exporter (.cbz / .zip) with ComicInfo.xml and metadata.json.
─────────────────────────────────────────────────────────────────────────────
"""

import io
import json
import zipfile
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("sonikoma.services.image.processing.archive_exporter")


def generate_comic_info_xml(metadata: Dict[str, Any], page_count: int) -> str:
    """Generates standard ComicInfo.xml metadata sidecar for Tachiyomi/Mihon/Komga/CDisplayEx."""
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


def create_comic_archive(
    images_data: List[Dict[str, Any]],
    metadata: Dict[str, Any],
    archive_format: str = "cbz"
) -> bytes:
    """
    Packages image buffers into a .cbz or .zip archive file stream.
    Sequential images are named 001.png, 002.png...
    Includes ComicInfo.xml and metadata.json.
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

            content_type = item.get("content_type", "image/png").lower()
            ext = "png"
            if "jpeg" in content_type or "jpg" in content_type:
                ext = "jpg"
            elif "webp" in content_type:
                ext = "webp"
            elif "avif" in content_type:
                ext = "avif"

            filename = f"panel_{idx + 1:03d}.{ext}"
            zf.writestr(filename, img_bytes)

    buffer.seek(0)
    return buffer.getvalue()
