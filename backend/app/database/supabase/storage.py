"""
backend/app/database/supabase/storage.py
─────────────────────────────────────────────────────────────────────────────
Supabase Storage bucket upload and URL retrieval helpers.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
from typing import Optional

logger = logging.getLogger("sonikoma.utils.supabase_storage")

try:
    from supabase import Client  # noqa: F401
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False


def upload_to_supabase_bucket(
    file_bytes: bytes, 
    bucket_name: str, 
    filename: str, 
    content_type: str
) -> Optional[str]:
    """Uploads bytes to a Supabase Storage bucket and returns the public URL.
    
    Supabase uploads are enabled only in production mode (NODE_ENV=production).
    In development mode, returns None so local/memory caching handles storage.
    """
    node_env = os.getenv("NODE_ENV", "development").lower()
    if node_env != "production":
        return None

    if not HAS_SUPABASE:
        logger.warning("Supabase client is not installed. Cannot upload to Supabase.")
        return None

    try:
        try:
            from . import supabase
        except ImportError:
            from database.supabase import supabase

        if not supabase:
            return None
        
        # Upload using the bytes payload
        res = supabase.storage.from_(bucket_name).upload(
            file=file_bytes, 
            path=filename, 
            file_options={"content-type": content_type, "upsert": "true"}
        )
        
        # Retrieve and return the public URL
        public_url = supabase.storage.from_(bucket_name).get_public_url(filename)
        logger.info(f"Successfully uploaded {filename} to Supabase bucket '{bucket_name}': {public_url}")
        return public_url
    except Exception as e:
        logger.error(f"Failed to upload {filename} to Supabase bucket '{bucket_name}': {e}")
        return None
