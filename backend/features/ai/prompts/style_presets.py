"""
Style presets for AI comic generation.

Stores ready-to-use style tokens, keywords, and parameters for anime,
manhwa, dark manga, and western superhero comics.
"""

from typing import Dict, Any

STYLE_PRESETS: Dict[str, Dict[str, Any]] = {
    "manhwa": {
        "name": "Manhwa Webtoon",
        "medium": "webtoon",
        "keywords": "korean webtoon style, manhwa action, digital glowing aura, sharp dynamic lighting, solo leveling style, vibrant colors",
        "negative_keywords": "blurry, low quality, photorealistic, 3d render, western cartoon",
        "lighting": "sharp digital neon glow with high contrast shadows",
        "camera": "dramatic dynamic vertical angle, wide shot",
        "aspect_ratio": "9:16",
    },
    "anime": {
        "name": "Modern Anime",
        "medium": "anime",
        "keywords": "anime visual, vibrant cel shading, 4k anime screenshot, ufotable aesthetic, clean lines, beautiful atmosphere",
        "negative_keywords": "western cartoon, sketch, noisy, distorted face, bad anatomy",
        "lighting": "cinematic backlighting with glowing dust particles",
        "camera": "rule-of-thirds cinematic close-up",
        "aspect_ratio": "16:9",
    },
    "dark_manga": {
        "name": "Dark Manga / Seinen",
        "medium": "manga",
        "keywords": "seinen manga, monochrome, detailed ink lineart, screentone, hyper-detailed crosshatching, dark fantasy, berserk style",
        "negative_keywords": "color, cartoon, blurry, soft lines, flat",
        "lighting": "high contrast chiaroscuro, heavy black shadows",
        "camera": "gritty low-angle framing with speedlines",
        "aspect_ratio": "3:4",
    },
    "shonen_manga": {
        "name": "Action Shonen Manga",
        "medium": "manga",
        "keywords": "manga style, monochrome, bold dynamic ink lineart, kinetic speedlines, high-contrast screentones, action shonen",
        "negative_keywords": "color, realistic photo, blurry, bad hands",
        "lighting": "bright dynamic highlights, kinetic motion blur",
        "camera": "dramatic foreshortening perspective",
        "aspect_ratio": "3:4",
    },
    "western_comic": {
        "name": "Modern Western Comic",
        "medium": "western",
        "keywords": "western comic book art, detailed inking, dramatic lighting, marvel dc comic aesthetic, feathered shadows, muscular anatomy",
        "negative_keywords": "anime, manga, chibi, blurry, unfinished",
        "lighting": "rim lighting with rich saturation and colored shadows",
        "camera": "heroic three-quarter dynamic action pose",
        "aspect_ratio": "2:3",
    },
    "romance_webtoon": {
        "name": "Romance Webtoon / Rofan",
        "medium": "webtoon",
        "keywords": "otome isekai manhwa, delicate pastel palette, detailed jewel jewelry, soft romantic lighting, rofan aesthetic, glitter sparkle bokeh",
        "negative_keywords": "dark, gritty, monochrome, ugly, masculine",
        "lighting": "soft ethereal bloom and golden hour sunshine",
        "camera": "intimate portrait close-up with flower petals",
        "aspect_ratio": "9:16",
    },
}

_ALIAS_MAP: Dict[str, str] = {
    "action_shonen": "shonen_manga",
    "dark_seinen": "dark_manga",
    "modern_anime": "anime",
    "manhwa_hunter": "manhwa",
    "manga": "shonen_manga",
    "comic": "western_comic",
    "romance": "romance_webtoon",
}


def _resolve_style_key(style_name: str) -> str:
    cleaned = (style_name or "").strip().lower().replace("-", "_").replace(" ", "_")
    if cleaned in STYLE_PRESETS:
        return cleaned
    if cleaned in _ALIAS_MAP:
        return _ALIAS_MAP[cleaned]
    for key in STYLE_PRESETS:
        if key in cleaned or cleaned in key:
            return key
    return "manhwa"


def get_art_style(style_name: str) -> Dict[str, Any]:
    """Returns art style keywords, color rules, and camera settings for the chosen style."""
    key = _resolve_style_key(style_name)
    preset = STYLE_PRESETS.get(key, STYLE_PRESETS["manhwa"])
    return {
        "style_key": key,
        "name": preset["name"],
        "medium": preset["medium"],
        "keywords": preset["keywords"],
        "negative_keywords": preset["negative_keywords"],
        "lighting": preset["lighting"],
        "camera": preset["camera"],
        "aspect_ratio": preset["aspect_ratio"],
    }


__all__ = ["get_art_style", "STYLE_PRESETS"]
