"""Manga (Japanese Comics) Art Style Definitions and Prompt Generators.

Manga is characterized by black-and-white ink work, screentones, crosshatching,
speed lines, varied panel structures, and dynamic G-pen line weights.
"""

from typing import Dict, Any, Optional, Tuple

MANGA_STYLES: Dict[str, Dict[str, Any]] = {
    "classic_shonen_action": {
        "name": "Classic / Shōnen Action",
        "description": "Bold dynamic line work, angular jaws, exaggerated kinetic speed lines, and high-contrast black fills.",
        "references": ["Dragon Ball", "One Piece", "Jujutsu Kaisen", "Bleach", "Naruto"],
        "prompt_prefix": (
            "classic shonen manga style, bold dynamic G-pen ink line work, angular jawline, "
            "exaggerated kinetic speed lines, high-contrast solid black fills (kuro-beta), "
            "screentone halftone dots shading, dramatic action perspective, monochrome black and white ink, "
            "no color, no 3D render, authentic Shonen Jump manga page"
        ),
        "negative_prompt": (
            "color, colorful, pastel, watercolor, chromatic, 3D render, CGI, octane render, realism, "
            "photo, realistic skin, blurry, bad anatomy, western comic colors"
        ),
        "visual_engine_focus": "Black & White ink",
        "key_keywords": "manga style, monochrome, detailed ink lineart, screentone, dynamic speedlines",
    },
    "dark_gritty_seinen": {
        "name": "Dark / Gritty Seinen",
        "description": "Hyper-detailed crosshatching, realistic anatomy, heavy ink washes, textured screentones, and intense shadows.",
        "references": ["Berserk", "Vinland Saga", "Vagabond", "Tokyo Ghoul"],
        "prompt_prefix": (
            "seinen manga style, hyper-detailed crosshatching, realistic anatomy, heavy ink washes, "
            "textured 65 LPI screentones, intense deep shadows, dark fantasy atmosphere, Kentaro Miura Berserk aesthetic, "
            "dramatic chiaroscuro lighting, visceral ink texture, monochrome black and white ink on paper, no color, no 3D"
        ),
        "negative_prompt": (
            "color, colorful, pastel, bright, cute, chibi, 3D render, CGI, photorealism, blurry, bad anatomy"
        ),
        "visual_engine_focus": "Gritty realism",
        "key_keywords": "seinen manga, hyper-detailed crosshatching, dark fantasy, berserk style, high contrast ink",
    },
    "shojo_josei_romance": {
        "name": "Shōjo & Josei Romance",
        "description": "Soft line weights, elongated slender figures, decorative motifs (flowers, sparkles), and heavily detailed expressive eyes.",
        "references": ["Nana", "Fruits Basket", "Ao Haru Ride", "Ouran High School Host Club"],
        "prompt_prefix": (
            "shojo manga style, delicate soft ink line weights, elongated slender figures, "
            "decorative floral motifs, sparkling screen screentones, heavily detailed expressive anime eyes with light reflections, "
            "tender emotional atmosphere, monochrome black ink with delicate screentone shading, no 3D, beautiful shojo comic art"
        ),
        "negative_prompt": (
            "harsh shadows, gritty, violent, gory, color, 3D render, CGI, western comic, blurry, bad anatomy"
        ),
        "visual_engine_focus": "Delicate ink & screentone",
        "key_keywords": "shojo manga, delicate lineart, decorative screentone, expressive eyes, monochrome",
    },
    "moe_chibi_slice_of_life": {
        "name": "Moe & Chibi / Slice-of-Life",
        "description": "2–3 head-to-body ratios, rounded soft silhouettes, simplified facial features, and minimal shadowing.",
        "references": ["K-On!", "Lucky Star", "Bocchi the Rock!", "Yotsuba&!"],
        "prompt_prefix": (
            "cute slice of life manga, rounded soft silhouettes, simplified facial features, "
            "chibi cute proportions, minimal clean screentone shadowing, lighthearted comedic panel, "
            "whimsical background doodles, clean ink contours, black and white manga, no 3D, no realism"
        ),
        "negative_prompt": (
            "dark, gritty, hyper-detailed muscles, realistic anatomy, heavy crosshatching, color, 3D, CGI"
        ),
        "visual_engine_focus": "Soft minimalist manga",
        "key_keywords": "chibi manga, cute lineart, slice of life comic, simplified ink, screentone",
    },
    "gekiga_retro": {
        "name": "Gekiga & Retro 80s/90s",
        "description": "Hard-boiled realistic ink, gritty mechanical details, muscular builds, and heavy hatch shading.",
        "references": ["Akira", "Fist of the North Star", "Golgo 13", "Ghost in the Shell manga"],
        "prompt_prefix": (
            "classic 80s gekiga manga style, hard-boiled realistic ink linework, gritty mechanical details, "
            "defined muscular builds, heavy parallel hatch shading, mature cinematic framing, Katsuhiro Otomo Akira aesthetic, "
            "high-density pen inking, authentic retro vintage manga page, monochrome ink on aged newsprint, no color"
        ),
        "negative_prompt": (
            "modern moe, digital gradients, colorful, pastel, 3D render, CGI, digital smoothness, blurry"
        ),
        "visual_engine_focus": "Hard-boiled vintage inking",
        "key_keywords": "gekiga manga, retro 80s ink, heavy hatching, katsushiro otomo style, monochrome",
    },
}

# Aliases for backwards compatibility with existing keys
MANGA_ALIASES = {
    "manga_shonen_jump": "classic_shonen_action",
    "manga_berserk_seinen": "dark_gritty_seinen",
    "action_shonen": "classic_shonen_action",
    "dark_seinen": "dark_gritty_seinen",
    "manga": "classic_shonen_action",
}


def build_manga_prompt(
    style_key: str,
    action: str,
    camera_angle: str = "dramatic_medium",
    character_name: str = "Protagonist",
) -> Tuple[str, str]:
    """Build positive and negative prompts tailored specifically for Japanese Manga art."""
    resolved_key = MANGA_ALIASES.get(style_key, style_key)
    cfg = MANGA_STYLES.get(resolved_key, MANGA_STYLES["classic_shonen_action"])

    base_prompt = (
        f"{cfg['prompt_prefix']}, {action}, {camera_angle} angle, "
        f"traditional Japanese manga panel, crisp black and white G-pen lineart, "
        f"dense 50 LPI screentone halftone dots, dramatic Kuro-beta blacks, "
        f"monochrome ink on white paper, masterpiece manga illustration, no color, no 3D render"
    )
    negative_prompt = (
        f"{cfg['negative_prompt']}, "
        "color, colors, colorful, pastel, watercolor, chromatic, RGB, photorealistic, 3D render, "
        "CGI, octane render, realism, photo, realistic skin, text, words, letters, font, speech bubble, "
        "dialog balloon, caption box, watermark, signature, blurry, bad anatomy, deformed limbs"
    )
    return base_prompt, negative_prompt
