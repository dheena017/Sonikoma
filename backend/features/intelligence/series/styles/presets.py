"""Recommended Style Presets and Dispatcher for Sonikoma AI Generator.

Maps UI preset names and medium keys directly to specialized visual generators
across Japanese Manga, Anime, Korean Manhwa, and Western Comics.
"""

from typing import Dict, Any, Tuple
from .manga import MANGA_STYLES, MANGA_ALIASES, build_manga_prompt
from .anime import ANIME_STYLES, ANIME_ALIASES, build_anime_prompt
from .manhwa import MANHWA_STYLES, MANHWA_ALIASES, build_manhwa_prompt
from .western_comic import WESTERN_COMIC_STYLES, WESTERN_COMIC_ALIASES, build_western_comic_prompt

RECOMMENDED_UI_PRESETS: Dict[str, Dict[str, Any]] = {
    "action_shonen": {
        "ui_name": "Action Shōnen",
        "medium": "manga",
        "target_style": "classic_shonen_action",
        "visual_engine_focus": "Black & White ink",
        "key_keywords": "manga style, monochrome, detailed ink lineart, screentone, dynamic speedlines",
        "description": "Bold dynamic line work, angular jaws, exaggerated kinetic speed lines, and high-contrast black fills.",
    },
    "dark_seinen": {
        "ui_name": "Dark Seinen",
        "medium": "manga",
        "target_style": "dark_gritty_seinen",
        "visual_engine_focus": "Gritty realism",
        "key_keywords": "seinen manga, hyper-detailed crosshatching, dark fantasy, berserk style, high contrast ink",
        "description": "Hyper-detailed crosshatching, realistic anatomy, heavy ink washes, textured screentones, and intense shadows.",
    },
    "modern_anime": {
        "ui_name": "Modern Anime",
        "medium": "anime",
        "target_style": "modern_cel_shaded",
        "visual_engine_focus": "Digital full color",
        "key_keywords": "anime visual, vibrant cel shading, 4k anime screenshot, ufotable aesthetic, clean lines",
        "description": "Clean vector-like linework, 2-to-3 tone crisp cel-shading, vibrant ambient lighting, and digital particle glows.",
    },
    "manhwa_hunter": {
        "ui_name": "Manhwa Hunter",
        "medium": "manhwa",
        "target_style": "action_system_leveling",
        "visual_engine_focus": "High-energy glow",
        "key_keywords": "korean webtoon style, manhwa action, digital glowing aura, sharp dynamic lighting, solo leveling style",
        "description": "Sharp angular character designs, digital neon magic glows, airbrushed dynamic lighting, and glowing eyes.",
    },
    "romance_webtoon": {
        "ui_name": "Romance Webtoon",
        "medium": "manhwa",
        "target_style": "otome_isekai_rofan",
        "visual_engine_focus": "Elegant & soft",
        "key_keywords": "otome isekai manhwa, delicate pastel palette, detailed jewel jewelry, soft lighting, rofan aesthetic",
        "description": "Intricate 3D-rendered lace, jewelry, and palace assets; soft pastel or jeweled palettes; glitter/bokeh lighting.",
    },
    "modern_american_comic": {
        "ui_name": "Modern American Comic",
        "medium": "western_comic",
        "target_style": "modern_superhero",
        "visual_engine_focus": "Sculpted anatomy",
        "key_keywords": "western comic book art, detailed inking, dramatic lighting, marvel dc comic aesthetic, feathered shadows",
        "description": "Muscular anatomy, crosshatch feathering, detailed digital multi-light rendering, and dramatic chiaroscuro.",
    },
    "retro_90s_anime": {
        "ui_name": "Retro 90s Anime",
        "medium": "anime",
        "target_style": "retro_90s_cel",
        "visual_engine_focus": "Nostalgic analog",
        "key_keywords": "90s anime aesthetic, hand-drawn cel look, subtle film grain, retro anime, vintage colors",
        "description": "Film grain, chromatic aberration, hand-painted gouache backgrounds, muted saturated palettes, analog ink outlines.",
    },
}

# Legacy and medium alias registry
PRESET_ALIASES: Dict[str, Tuple[str, str]] = {
    # Recommended UI Presets
    "action_shonen": ("manga", "classic_shonen_action"),
    "dark_seinen": ("manga", "dark_gritty_seinen"),
    "modern_anime": ("anime", "modern_cel_shaded"),
    "manhwa_hunter": ("manhwa", "action_system_leveling"),
    "romance_webtoon": ("manhwa", "otome_isekai_rofan"),
    "modern_american_comic": ("western_comic", "modern_superhero"),
    "retro_90s_anime": ("anime", "retro_90s_cel"),

    # Legacy SeriesArtStyle enums
    "manhwa_action_hunter": ("manhwa", "action_system_leveling"),
    "manhwa_overpowered_regression": ("manhwa", "action_system_leveling"),
    "manhwa_otome_isekai": ("manhwa", "otome_isekai_rofan"),
    "manhwa_pastel_romance": ("manhwa", "otome_isekai_rofan"),
    "manhwa_slice_of_life": ("manhwa", "painterly_webtoon"),
    "manhwa_murim_wuxia": ("manhwa", "rough_ink_murim"),
    "manga_shonen_jump": ("manga", "classic_shonen_action"),
    "manga_berserk_seinen": ("manga", "dark_gritty_seinen"),
    "comic_western_vintage": ("western_comic", "golden_silver_classic"),
    "comic_cyberpunk_neon": ("western_comic", "modern_superhero"),
    "anime_ufotable_cinematic": ("anime", "modern_cel_shaded"),
    "anime_ghibli_watercolor": ("anime", "kyoto_animation_soft"),
    "anime_90s_retro_cel": ("anime", "retro_90s_cel"),

    # Sub-style Direct Keys
    "classic_shonen_action": ("manga", "classic_shonen_action"),
    "dark_gritty_seinen": ("manga", "dark_gritty_seinen"),
    "shojo_josei_romance": ("manga", "shojo_josei_romance"),
    "moe_chibi_slice_of_life": ("manga", "moe_chibi_slice_of_life"),
    "gekiga_retro": ("manga", "gekiga_retro"),
    "modern_cel_shaded": ("anime", "modern_cel_shaded"),
    "kyoto_animation_soft": ("anime", "kyoto_animation_soft"),
    "makoto_shinkai_cinematic": ("anime", "makoto_shinkai_cinematic"),
    "stylized_pop_action": ("anime", "stylized_pop_action"),
    "action_system_leveling": ("manhwa", "action_system_leveling"),
    "otome_isekai_rofan": ("manhwa", "otome_isekai_rofan"),
    "painterly_webtoon": ("manhwa", "painterly_webtoon"),
    "realistic_modern_drama": ("manhwa", "realistic_modern_drama"),
    "rough_ink_murim": ("manhwa", "rough_ink_murim"),
    "modern_superhero": ("western_comic", "modern_superhero"),
    "golden_silver_classic": ("western_comic", "golden_silver_classic"),
    "noir_heavy_shadow": ("western_comic", "noir_heavy_shadow"),
    "ligne_claire": ("western_comic", "ligne_claire"),
    "dark_indie_graphic_novel": ("western_comic", "dark_indie_graphic_novel"),
}

# Composite mapping of style keys to positive prompt prefixes
ART_STYLE_PROMPT_PREFIXES: Dict[str, str] = {
    **{k: v["prompt_prefix"] for k, v in MANGA_STYLES.items()},
    **{k: v["prompt_prefix"] for k, v in ANIME_STYLES.items()},
    **{k: v["prompt_prefix"] for k, v in MANHWA_STYLES.items()},
    **{k: v["prompt_prefix"] for k, v in WESTERN_COMIC_STYLES.items()},
}
for alias_k, (medium, target_k) in PRESET_ALIASES.items():
    if target_k in ART_STYLE_PROMPT_PREFIXES and alias_k not in ART_STYLE_PROMPT_PREFIXES:
        ART_STYLE_PROMPT_PREFIXES[alias_k] = ART_STYLE_PROMPT_PREFIXES[target_k]


# Data-driven medium builders and canvas dimension mappings
STYLE_BUILDERS: Dict[str, Tuple[Any, Tuple[int, int]]] = {
    "anime": (build_anime_prompt, (1024, 576)),         # 16:9 widescreen
    "manga": (build_manga_prompt, (768, 1024)),         # 3:4 Manga page
    "western_comic": (build_western_comic_prompt, (768, 1024)),  # 3:4 Comic page
    "manhwa": (build_manhwa_prompt, (768, 1152)),       # 2:3 vertical strip
}


def resolve_style_prompt(
    art_style_key: str,
    format_type_str: str,
    action: str,
    camera_angle: str = "dramatic_medium",
    character_name: str = "Protagonist",
) -> Tuple[str, str, Tuple[int, int]]:
    """Resolve prompt, negative prompt, and canvas dimensions based on style and format medium."""
    fmt = (format_type_str or "").lower()
    style_key = (art_style_key or "").lower().strip()

    # Determine medium and specific style key
    if style_key in PRESET_ALIASES:
        medium, sub_key = PRESET_ALIASES[style_key]
    elif "anime" in fmt or "sakuga" in fmt:
        medium, sub_key = "anime", ANIME_ALIASES.get(style_key, "modern_cel_shaded")
    elif "comic" in fmt and any(k in style_key for k in ["western", "superhero", "noir", "kirby", "ligne"]):
        medium, sub_key = "western_comic", WESTERN_COMIC_ALIASES.get(style_key, "modern_superhero")
    elif "comic" in fmt or "manga" in fmt:
        medium, sub_key = "manga", MANGA_ALIASES.get(style_key, "classic_shonen_action")
    else:
        medium, sub_key = "manhwa", MANHWA_ALIASES.get(style_key, "action_system_leveling")

    builder_func, dimensions = STYLE_BUILDERS.get(medium, STYLE_BUILDERS["manhwa"])
    prompt, neg = builder_func(sub_key, action, camera_angle, character_name)
    return prompt, neg, dimensions
