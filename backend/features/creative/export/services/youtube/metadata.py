"""
backend/app/services/export/youtube/metadata.py
─────────────────────────────────────────────────────────────────────────────
Handles YouTube video metadata formatting, tag validation, and shorts logic.
─────────────────────────────────────────────────────────────────────────────
"""
from typing import Optional, List

def format_video_metadata(
    title: Optional[str] = "Untitled Video",
    description: Optional[str] = "",
    tags: Optional[List[str]] = None,
    category_id: Optional[str] = "1",
    privacy_status: Optional[str] = "unlisted",
    is_short: Optional[bool] = False
) -> dict:
    """Formats YouTube video metadata and applies Shorts tags if needed."""
    default_tags = ["sonikoma", "webtoon", "manga", "comic"]
    user_tags = tags if tags else []
    final_tags = list(set(default_tags + [t.strip() for t in user_tags if t.strip()]))

    final_title = title or "Untitled Video"
    final_description = description or ""

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


import re
import json
import logging
from app.core.config import (
    ai_initialized,
    genai_client,
    GEMINI_MODEL_PRIMARY,
    GEMINI_FALLBACK_MODELS,
    call_gemini_with_retry,
)
from ai_engine.core.hub import AIHub

logger = logging.getLogger("sonikoma.creative.export.youtube.metadata")


def _clean_json_text(text: str) -> str:
    """Robustly extracts valid JSON array or object from AI response text even with markdown or commentary."""
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        text = match.group(1).strip()

    array_match = re.search(r"(\[\s*\{[\s\S]*\}\s*\])", text)
    if array_match:
        return array_match.group(1).strip()

    obj_match = re.search(r"(\{[\s\S]*\})", text)
    if obj_match:
        return obj_match.group(1).strip()

    return text


async def generate_video_seo_metadata(
    title: str,
    genre: str = "Action/Fantasy",
    storyboard_summary: str = "",
    is_short: bool = False,
    model: Optional[str] = None,
) -> dict:
    """Generates viral YouTube SEO title, description, tags, and timestamps using Gemini / AIHub."""
    clean_title = title.strip() if title else "Webtoon Climax Recap"
    clean_genre = genre.strip() if genre else "Action Fantasy"
    summary = storyboard_summary.strip()[:600] if storyboard_summary else f"Full dramatic story recap of {clean_title}."

    prompt = f"""You are an elite YouTube CTR & SEO Strategist specializing in Manga/Webtoon recaps.
Analyze:
- Series Title: "{clean_title}"
- Genre: "{clean_genre}"
- Story Outline / Transcript:
{summary}
- Video Format: "{'Shorts (9:16 vertical)' if is_short else 'Standard (16:9 widescreen)'}"

Generate high-CTR, viral YouTube metadata:
1. "youtube_title": Catchy, curiosity-gap title (under 90 chars, all caps emphasis, include #Shorts if shorts).
2. "youtube_description": Professional description with chapter recap summary, timestamps, and viral hashtags (#webtoon #manhwa #animerecap).
3. "tags": 10-15 high-ranking YouTube search tags as a list of strings.
4. "timestamps": List of timestamps like ["00:00 - Introduction", "01:30 - The Climax Battle", "03:45 - Ending Hook"].

Return STRICT JSON:
{{
  "youtube_title": "...",
  "youtube_description": "...",
  "tags": ["webtoon recap", "manhwa recap", "anime recap"],
  "timestamps": ["00:00 - Introduction", "01:15 - Rising Tension", "02:30 - Final Climax"]
}}
"""

    system_inst = "You are an elite YouTube algorithm and CTR strategist specializing in Manga & Webtoon video compilations."

    # Default baseline
    fallback_title = f"{clean_title.upper()} - THE UNTOLD POWER! [Full Recap]"
    if is_short and "#Shorts" not in fallback_title:
        fallback_title = f"{fallback_title[:80]} #Shorts"

    result_data = {
        "youtube_title": fallback_title,
        "youtube_description": f"Full story recap of {clean_title}.\n\nTIMESTAMPS:\n00:00 - Introduction\n01:15 - Climax Awakening\n02:30 - Cliffhanger\n\n#webtoon #manhwa #animerecap",
        "tags": [clean_genre.lower(), "webtoon recap", "manhwa recap", "anime recap", "op mc"],
        "timestamps": ["00:00 - Introduction", "01:15 - Climax Awakening", "02:30 - Cliffhanger Ending"],
    }

    # 1. Try Gemini
    if ai_initialized and genai_client:
        models_to_try = [model] if model else [GEMINI_MODEL_PRIMARY] + [m for m in GEMINI_FALLBACK_MODELS if m != GEMINI_MODEL_PRIMARY]
        for m_name in models_to_try:
            if not m_name:
                continue
            async def _invoke():
                full_p = f"{system_inst}\n\n{prompt}"
                if hasattr(genai_client, "models") and hasattr(genai_client.models, "generate_content"):
                    resp = genai_client.models.generate_content(model=m_name, contents=full_p)
                    return getattr(resp, "text", str(resp))
                elif hasattr(genai_client, "GenerativeModel"):
                    mdl = genai_client.GenerativeModel(m_name)
                    resp = mdl.generate_content(full_p)
                    return getattr(resp, "text", str(resp))
                return None

            try:
                res = await call_gemini_with_retry(_invoke)
                if res and len(res.strip()) > 5:
                    parsed = json.loads(_clean_json_text(res))
                    if isinstance(parsed, dict):
                        result_data["youtube_title"] = parsed.get("youtube_title", result_data["youtube_title"])
                        result_data["youtube_description"] = parsed.get("youtube_description", result_data["youtube_description"])
                        result_data["tags"] = parsed.get("tags", result_data["tags"])
                        result_data["timestamps"] = parsed.get("timestamps", result_data["timestamps"])
                        return result_data
            except Exception as e:
                logger.debug(f"[SEO Generator] Gemini {m_name} attempt: {e}")
                continue

    # 2. Try AIHub
    try:
        hub_res = await AIHub().chat(prompt=prompt, system_instruction=system_inst)
        if hub_res and len(hub_res.strip()) > 5:
            parsed = json.loads(_clean_json_text(hub_res))
            if isinstance(parsed, dict):
                result_data["youtube_title"] = parsed.get("youtube_title", result_data["youtube_title"])
                result_data["youtube_description"] = parsed.get("youtube_description", result_data["youtube_description"])
                result_data["tags"] = parsed.get("tags", result_data["tags"])
                result_data["timestamps"] = parsed.get("timestamps", result_data["timestamps"])
                return result_data
    except Exception as hub_err:
        logger.debug(f"[SEO Generator] AIHub attempt: {hub_err}")

    return result_data
