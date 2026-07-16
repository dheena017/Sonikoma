"""
backend/app/infrastructure/database/supabase.py
─────────────────────────────────────────────────────────────────────────────
Supabase client initialization.
─────────────────────────────────────────────────────────────────────────────
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

def get_supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", os.environ.get("SUPABASE_ANON_KEY", ""))
    
    if not url or not key:
        return None
        
    return create_client(url, key)

supabase = get_supabase_client()
