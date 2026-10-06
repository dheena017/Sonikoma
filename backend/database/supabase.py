"""
backend/database/supabase.py
─────────────────────────────────────────────────────────────────────────────
Supabase Client & Cloud Storage Integration:
- get_supabase_client: Initializes official Supabase client using env vars
- supabase: Singleton Supabase client instance (or None if unconfigured)
- upload_to_supabase_bucket: Uploads raw bytes to a Supabase bucket and returns public URL
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
from typing import Any, Optional
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("sonikoma.database.supabase")

try:
    from supabase import create_client, Client
    _HAS_SUPABASE = callable(create_client)
    HAS_SUPABASE = True
except ImportError:
    create_client = None  # type: ignore[assignment]
    Client = None  # type: ignore[assignment, misc]
    _HAS_SUPABASE = False
    HAS_SUPABASE = False


def get_supabase_client() -> Optional[Any]:
    """Retrieve or initialize the Supabase client instance."""
    if not _HAS_SUPABASE or create_client is None:
        return None

    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_KEY", "")

    if not url or not key:
        return None

    try:
        return create_client(url, key)
    except Exception as e:
        logger.warning(f"[Database] Could not create Supabase client: {e}")
        return None


supabase = get_supabase_client()


def upload_to_supabase_bucket(
    file_bytes: bytes,
    bucket_name: str,
    filename: str,
    content_type: str,
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
        client = supabase or get_supabase_client()
        if not client:
            return None

        # Upload using the bytes payload
        client.storage.from_(bucket_name).upload(
            file=file_bytes,
            path=filename,
            file_options={"content-type": content_type, "upsert": "true"},
        )

        # Retrieve and return the public URL
        public_url = client.storage.from_(bucket_name).get_public_url(filename)
        logger.info(f"Successfully uploaded {filename} to Supabase bucket '{bucket_name}': {public_url}")
        return public_url
    except Exception as e:
        logger.error(f"Failed to upload {filename} to Supabase bucket '{bucket_name}': {e}")
        return None


__all__ = [
    "supabase",
    "get_supabase_client",
    "upload_to_supabase_bucket",
    "HAS_SUPABASE",
]
