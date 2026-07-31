"""
backend/app/services/export/youtube/metadata.py
─────────────────────────────────────────────────────────────────────────────
Handles YouTube video metadata formatting, tag validation, and shorts logic.
─────────────────────────────────────────────────────────────────────────────
"""
from typing import Optional, List

def format_video_metadata(
    title: str,
    description: str,
    tags: Optional[List[str]] = None,
    category_id: Optional[str] = "1",
    privacy_status: Optional[str] = "unlisted",
    is_short: Optional[bool] = False
) -> dict:
    """Formats YouTube video metadata and applies Shorts tags if needed."""
    default_tags = ["sonikoma", "webtoon", "manga", "comic"]
    user_tags = tags if tags else []
    final_tags = list(set(default_tags + [t.strip() for t in user_tags if t.strip()]))

    final_title = title
    final_description = description

    if is_short:
        if "#Shorts" not in final_title and "#shorts" not in final_title:
            if len(final_title) + 8 > 100:
                final_title = final_title[:90].strip() + " #Shorts"
            else:
                final_title = final_title + " #Shorts"
        if "#Shorts" not in final_description and "#shorts" not in final_description:
            final_description = final_description + "\n\n#Shorts #webtoon #video"

    request_body = {
        "snippet": {
            "categoryId": category_id or "1",
            "title": final_title,
            "description": final_description,
            "tags": final_tags,
        },
        "status": {"privacyStatus": privacy_status or "unlisted"},
    }
    
    return request_body
