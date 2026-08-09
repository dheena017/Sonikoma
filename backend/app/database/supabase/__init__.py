"""
backend/app/infrastructure/database/supabase.py
─────────────────────────────────────────────────────────────────────────────
Supabase client initialization.
─────────────────────────────────────────────────────────────────────────────
"""

import os
from typing import Any, Optional
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

def get_supabase_client() -> Optional[Any]:
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_KEY", "")

    if not url or not key:
        return None

    return create_client(url, key)

supabase = get_supabase_client()
