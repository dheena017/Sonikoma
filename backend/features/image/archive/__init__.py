"""
backend/features/image/archive/__init__.py
─────────────────────────────────────────────────────────────────────────────
Comic & Panel Archive Packaging Services:
- export_comic_archive: Packages panels into .cbz / .zip with ComicInfo.xml
- generate_comic_info_xml: ComicInfo.xml metadata schema generator
- download_and_bundle_zip: Asynchronously downloads URLs into memory zip
─────────────────────────────────────────────────────────────────────────────
"""

from .archive_exporter_service import (
    export_comic_archive,
    create_comic_archive,
    generate_comic_info_xml,
)
from .zip_downloader_service import download_and_bundle_zip

__all__ = [
    "export_comic_archive",
    "create_comic_archive",
    "generate_comic_info_xml",
    "download_and_bundle_zip",
]
