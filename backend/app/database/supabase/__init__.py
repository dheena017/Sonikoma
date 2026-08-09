"""
backend/app/infrastructure/database/supabase.py
─────────────────────────────────────────────────────────────────────────────
Supabase client initialization.
─────────────────────────────────────────────────────────────────────────────
"""

import os
from typing import Any, Optional
from dotenv import load_dotenv

load_dotenv()

try:
    from supabase import create_client
    _HAS_SUPABASE = callable(create_client)
except ImportError:
    create_client = None  # type: ignore[assignment]
    _HAS_SUPABASE = False


def get_supabase_client() -> Optional[Any]:
    if not _HAS_SUPABASE or create_client is None:
        return None

    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_KEY", "")

    if not url or not key:
        return None

    try:
        return create_client(url, key)
    except TypeError:
        return None


supabase = get_supabase_client()
