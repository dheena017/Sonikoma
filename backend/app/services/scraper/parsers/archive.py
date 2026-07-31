"""
backend/app/services/scraper/parsers/archive.py
"""
import os
import uuid
import shutil
import tempfile
import zipfile
import logging
from typing import List
from .utils import natural_sort_key

logger = logging.getLogger("sonikoma.services.scraper.parsers.archive")

def scrape_local_archive(path: str) -> List[str]:
    """Extracts image files from a local .zip or .cbz file and flat-stores them in temporary paths."""
    if not os.path.exists(path):
        raise FileNotFoundError(f"Local archive not found: {path}")

    temp_parent = os.path.join(tempfile.gettempdir(), "webtoon_scraped_archives")
    os.makedirs(temp_parent, exist_ok=True)
    session_id = str(uuid.uuid4())[:8]
    extract_dir = os.path.join(temp_parent, session_id)
    os.makedirs(extract_dir, exist_ok=True)

    extracted_files = []
    valid_exts = ('.png', '.jpg', '.jpeg', '.webp', '.gif')

    if zipfile.is_zipfile(path):
        with zipfile.ZipFile(path, 'r') as zf:
            for name in zf.namelist():
                if '__MACOSX' in name or name.split('/')[-1].startswith('.'):
                    continue
                if name.lower().endswith(valid_exts):
                    ext = os.path.splitext(name)[1]
                    flat_name = f"panel_{len(extracted_files):04d}{ext}"
                    target_path = os.path.join(extract_dir, flat_name)
                    with zf.open(name) as src, open(target_path, 'wb') as dst:
                        shutil.copyfileobj(src, dst)
                    extracted_files.append(target_path)
    else:
        raise ValueError("Unsupported archive format. Only ZIP and CBZ packages are supported.")

    extracted_files.sort(key=natural_sort_key)
    logger.info(f"[Scraper] Extracted {len(extracted_files)} panels from local file: {path}")

    file_urls = []
    for p in extracted_files:
        clean_p = p.replace('\\', '/')
        if not clean_p.startswith('/'):
            clean_p = '/' + clean_p
        file_urls.append(f"file://{clean_p}")
    return file_urls
