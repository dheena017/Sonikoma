"""Art Styles Package for Sonikoma AI Series Studio.

Modular style systems and kinetic motion presets for:
- 1. Manga (Japanese Comics): Shonen, Seinen, Shojo, Moe/Chibi, Gekiga
- 2. Anime (Animation Renderings): Modern Cel, KyoAni, Retro 90s, Shinkai, Trigger Pop
- 3. Manhwa (Korean Webtoons): Action Hunter, Rofan, Painterly, Drama, Murim
- 4. Western Comics (American & European): Superhero, Kirby Classic, Noir, Ligne Claire, Dark Indie
- Recommended UI Presets & Dynamic Style Dispatcher
"""

from .manga import MANGA_STYLES, MANGA_ALIASES, build_manga_prompt
from .anime import ANIME_STYLES, ANIME_ALIASES, KINETIC_MOTION_PRESETS, build_anime_prompt
from .manhwa import MANHWA_STYLES, MANHWA_ALIASES, build_manhwa_prompt
from .western_comic import WESTERN_COMIC_STYLES, WESTERN_COMIC_ALIASES, build_western_comic_prompt
from .presets import (
    RECOMMENDED_UI_PRESETS,
    PRESET_ALIASES,
    ART_STYLE_PROMPT_PREFIXES,
    resolve_style_prompt,
)

__all__ = [
    "MANGA_STYLES",
    "MANGA_ALIASES",
    "build_manga_prompt",
    "ANIME_STYLES",
    "ANIME_ALIASES",
    "KINETIC_MOTION_PRESETS",
    "build_anime_prompt",
    "MANHWA_STYLES",
    "MANHWA_ALIASES",
    "build_manhwa_prompt",
    "WESTERN_COMIC_STYLES",
    "WESTERN_COMIC_ALIASES",
    "build_western_comic_prompt",
    "RECOMMENDED_UI_PRESETS",
    "PRESET_ALIASES",
    "ART_STYLE_PROMPT_PREFIXES",
    "resolve_style_prompt",
]
