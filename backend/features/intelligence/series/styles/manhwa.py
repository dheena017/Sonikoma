"""Manhwa (Korean Webtoons) Art Style Definitions and Prompt Generators.

Modern manhwa is almost exclusively full-color, digital-native, and designed
with vertical-scroll framing.
"""

from typing import Dict, Any, Optional, Tuple

MANHWA_STYLES: Dict[str, Dict[str, Any]] = {
    "action_system_leveling": {
        "name": "Action / System Leveling",
        "description": "Sharp angular character designs, digital neon magic glows, airbrushed dynamic lighting, high-contrast dark backgrounds, and glowing eyes.",
        "references": ["Solo Leveling", "Omniscient Reader's Viewpoint", "The Beginning After the End", "Doom Breaker"],
        "prompt_prefix": (
            "korean webtoon style, manhwa action, sharp angular character design, digital glowing neon cyan and purple magic aura, "
            "airbrushed dynamic rim lighting, high-contrast dark dungeon background, glowing eyes, Solo Leveling REDICE Studio aesthetic, "
            "sleek 2D digital webtoon drawing, crisp digital ink linework, no 3D render, no CGI"
        ),
        "negative_prompt": (
            "monochrome, black and white, manga screentone, soft pastel wash, chibi, 3D CGI render, "
            "octane render, photorealism, blurry, muddy colors, bad anatomy"
        ),
        "visual_engine_focus": "High-energy glow",
        "key_keywords": "korean webtoon style, manhwa action, digital glowing aura, sharp dynamic lighting, solo leveling style",
    },
    "otome_isekai_rofan": {
        "name": "Otome Isekai / Romance Fantasy (Rofan)",
        "description": "Intricate 3D-rendered lace, jewelry, and palace assets; soft pastel or jeweled palettes; delicate hair strands; and glitter/bokeh lighting.",
        "references": ["The Villainess Reverses the Hourglass", "Roxana", "Who Made Me a Princess", "Death Is the Only Ending for the Villainess"],
        "prompt_prefix": (
            "otome isekai manhwa, romance fantasy rofan webtoon aesthetic, intricate ornate lace and golden embroidery, "
            "detailed faceted jewel jewelry, soft pastel and royal jeweled color palette, delicate flowing hair strands, "
            "sparkling glitter and luminous bokeh lighting, opulent European palace ballroom, expressive emotional eyes, 2D manhwa masterpiece"
        ),
        "negative_prompt": (
            "rough ink, gritty dark shadows, harsh monochrome, comic screentone, 3D model clay render, photorealism, grotesque, blurry"
        ),
        "visual_engine_focus": "Elegant & soft",
        "key_keywords": "otome isekai manhwa, delicate pastel palette, detailed jewel jewelry, soft lighting, rofan aesthetic",
    },
    "painterly_webtoon": {
        "name": "Painterly Webtoon / Soft Render",
        "description": "Blended brushwork instead of hard cel lines, atmospheric watercolor/oil blending, and realistic facial shading.",
        "references": ["Painter of the Night", "Lore Olympus", "Seasons of Blossom", "Your Throne (painterly panels)"],
        "prompt_prefix": (
            "painterly Korean webtoon style, blended soft brushwork, no harsh cel lines, atmospheric watercolor and oil blending, "
            "realistic soft facial shading, emotional nuanced expressions, rich painterly textures, delicate color harmony, "
            "poetic cinematic webtoon illustration, Clip Studio Paint painterly brush"
        ),
        "negative_prompt": (
            "hard vector lineart, flat cel shading, harsh neon glow, manga screentone, monochrome, 3D CGI, blurry, bad anatomy"
        ),
        "visual_engine_focus": "Painterly fine art render",
        "key_keywords": "painterly manhwa, blended watercolor brush, soft facial shading, emotional webtoon art, fine art digital",
    },
    "realistic_modern_drama": {
        "name": "Realistic Modern Drama",
        "description": "Realistic K-fashion outfits, semi-realistic facial proportions, soft digital makeup gradients, and detailed urban street/interior settings.",
        "references": ["Lookism", "True Beauty", "Wind Breaker", "Study Group"],
        "prompt_prefix": (
            "modern Korean drama webtoon style, realistic trendy K-fashion streetwear outfits, semi-realistic stylish facial proportions, "
            "soft digital gradient makeup and lip tint, detailed Seoul urban street and cafe interior background, "
            "crisp digital line art, clean modern Naver webtoon aesthetic, Lookism True Beauty visual style, no 3D"
        ),
        "negative_prompt": (
            "medieval fantasy, armor, magic aura, monster, crude sketch, manga screentone, monochrome, 3D render, deformed"
        ),
        "visual_engine_focus": "Contemporary K-fashion & urban drama",
        "key_keywords": "modern manhwa, k-fashion webtoon, realistic proportions, lookism style, urban drama webtoon",
    },
    "rough_ink_murim": {
        "name": "Rough Ink / Murim Martial Arts",
        "description": "Traditional Korean calligraphic brushstrokes, ink splatters, fluid martial poses, and high-impact motion blur.",
        "references": ["Legend of the Northern Blade", "Gosu", "Return of the Blossoming Blade", "Reaper of the Drifting Moon"],
        "prompt_prefix": (
            "Murim martial arts manhwa style, traditional Korean calligraphic sumi-e ink brushstrokes, dynamic black ink splatters, "
            "fluid high-impact martial arts combat pose, directional motion blur, sword Qi visual distortion, "
            "Legend of the Northern Blade aesthetic, visceral dynamic line weight, full color with dramatic ink accents, 2D webtoon art"
        ),
        "negative_prompt": (
            "cute pastel, shojo sparkles, stiff poses, western superhero, modern city, 3D CGI, plastic texture, blurry"
        ),
        "visual_engine_focus": "Dynamic calligraphic martial arts",
        "key_keywords": "murim manhwa, calligraphy ink brush, northern blade style, martial arts webtoon, sword qi",
    },
}

# Aliases for backwards compatibility with existing keys
MANHWA_ALIASES = {
    "manhwa_action_hunter": "action_system_leveling",
    "manhwa_overpowered_regression": "action_system_leveling",
    "manhwa_otome_isekai": "otome_isekai_rofan",
    "manhwa_pastel_romance": "otome_isekai_rofan",
    "manhwa_slice_of_life": "painterly_webtoon",
    "manhwa_murim_wuxia": "rough_ink_murim",
    "manhwa_hunter": "action_system_leveling",
    "romance_webtoon": "otome_isekai_rofan",
    "manhwa": "action_system_leveling",
}


def build_manhwa_prompt(
    style_key: str,
    action: str,
    camera_angle: str = "vertical_webtoon_establishing",
    character_name: str = "Protagonist",
) -> Tuple[str, str]:
    """Build positive and negative prompts tailored specifically for Korean Manhwa Webtoon art."""
    resolved_key = MANHWA_ALIASES.get(style_key, style_key)
    cfg = MANHWA_STYLES.get(resolved_key, MANHWA_STYLES["action_system_leveling"])

    base_prompt = (
        f"{cfg['prompt_prefix']}, {action}, {camera_angle} angle, "
        f"vertical Korean webtoon strip panel, clean digital manhwa lineart, "
        f"expressive anime eyes, stylish modern Naver webtoon aesthetic, masterpiece 2D digital illustration, "
        f"no 3D render, no CGI, no photorealism"
    )
    negative_prompt = (
        f"{cfg['negative_prompt']}, "
        "monochrome, black and white, grayscale, manga screentone, comic book halftone dots, "
        "photorealistic, 3D render, CGI, octane render, realism, photo, realistic skin, "
        "text, words, letters, font, speech bubble, dialog balloon, caption box, watermark, signature, blurry, bad anatomy, "
        "harsh 3D CGI, western comic style, deformed faces, ugly eyes"
    )
    return base_prompt, negative_prompt
