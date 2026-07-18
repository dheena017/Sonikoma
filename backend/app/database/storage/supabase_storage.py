import logging
from typing import Optional

logger = logging.getLogger("sonikoma.database.storage.supabase_storage")

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
    """
    Uploads bytes to a Supabase Storage bucket and returns the public URL.
    Returns None if Supabase is not configured or an error occurs.
    """
    if not HAS_SUPABASE:
        logger.warning("Supabase client is not installed. Cannot upload to Supabase.")
        return None

    try:
        from database.supabase import supabase
        if not supabase:
            logger.debug(f"Supabase client not initialized, bypassing upload to {bucket_name}.")
            return None
        
        # Upload using the bytes payload
        # file_options requires a dict with content-type to set the header
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
