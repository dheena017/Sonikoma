"""Anime (Animation Renderings) Art Style Definitions and Prompt Generators.

Unlike manga, anime styles are full-color, lighting-driven, and designed
with animation production aesthetics in mind.
"""

from typing import Dict, Any, List, Optional, Tuple

# Kinetic motion prompts for real anime physical action
KINETIC_MOTION_PRESETS: List[str] = [
    "High velocity physical leap across concrete rooftops, cape billowing violently in night wind, cinematic low angle 3D camera pan, 24fps high quality anime sakuga animation",
    "Dynamic martial arts leap forward with sudden spin strike, energy blade slashing through air, orbital camera spin, fluid character movement",
    "Explosive landing impact from high altitude, dust and shockwave billowing outward, dynamic hair and jacket physics, dramatic camera shake",
    "Sprinting at extreme velocity along highway overpass, camera tracking from 3/4 front angle, hair whipping in wind, intense determined expression",
    "Supernatural aerial dash dodging energy beams, mid-air acrobatic spin, kinetic blur streaks, synchronized Sakuga animation",
]

ANIME_STYLES: Dict[str, Dict[str, Any]] = {
    "modern_cel_shaded": {
        "name": "Modern Cel-Shaded Digital",
        "description": "Clean vector-like linework, 2-to-3 tone crisp cel-shading, vibrant ambient lighting, and digital post-processing particle glows.",
        "references": ["Demon Slayer (Ufotable)", "Chainsaw Man (MAPPA)", "Jujutsu Kaisen Season 2"],
        "prompt_prefix": (
            "modern digital anime visual, clean vector-like crisp linework, vibrant 2-to-3 tone crisp cel-shading, "
            "vibrant dynamic ambient lighting, digital post-processing particle glows, Ufotable MAPPA aesthetic, "
            "4k anime screenshot, high-budget theatrical sakuga animation cut, no 3D CGI"
        ),
        "negative_prompt": (
            "comic panel, comic strip, manga screentone, monochrome, black and white, 3D CGI render, "
            "octane render, photorealism, blurry, muddy colors, bad anatomy"
        ),
        "visual_engine_focus": "Digital full color",
        "key_keywords": "anime visual, vibrant cel shading, 4k anime screenshot, ufotable aesthetic, clean lines",
    },
    "kyoto_animation_soft": {
        "name": "Kyoto Animation / Soft Aesthetic",
        "description": "Soft gradients, subsurface scattering on skin, delicate hair highlights, and luminous lens-flare atmospheres.",
        "references": ["Violet Evergarden", "Frieren: Beyond Journey's End", "Sound! Euphonium", "Hyouka"],
        "prompt_prefix": (
            "Kyoto Animation aesthetic, soft luminous gradients, subtle subsurface scattering on skin, "
            "delicate individual hair strand highlights, luminous lens-flare atmospheres, tender emotional acting, "
            "breathtaking watercolor-tinted background, warm natural sunlight filtering through dust motes, theatrical anime masterpiece"
        ),
        "negative_prompt": (
            "harsh shadows, saturated neon clash, crude lines, manga screentone, black and white, 3D render, CGI, realism"
        ),
        "visual_engine_focus": "Luminous soft rendering",
        "key_keywords": "kyoani aesthetic, soft gradients, delicate hair highlights, luminous lighting, anime screenshot",
    },
    "retro_90s_cel": {
        "name": "Retro 90s Cel Anime",
        "description": "Film grain, chromatic aberration, hand-painted gouache backgrounds, muted saturated palettes, and analog ink outlines.",
        "references": ["Cowboy Bebop", "Sailor Moon", "Neon Genesis Evangelion", "Yu Yu Hakusho"],
        "prompt_prefix": (
            "authentic 1990s retro anime cel art, analog 35mm film grain, subtle chromatic aberration, "
            "hand-painted gouache background scenery, muted saturated vintage color palette, analog acetate cel ink outlines, "
            "classic Sunrise Gainax 90s anime aesthetic, nostalgic VHS warmth"
        ),
        "negative_prompt": (
            "modern digital gradients, flat vector look, 3D render, CGI, overly sharp digital contrast, black and white manga"
        ),
        "visual_engine_focus": "Nostalgic analog",
        "key_keywords": "90s anime aesthetic, hand-drawn cel look, subtle film grain, retro anime, vintage colors",
    },
    "makoto_shinkai_cinematic": {
        "name": "Makoto Shinkai Cinematic",
        "description": "Photorealistic sky and environment lighting, high-dynamic-range (HDR) bloom, hyper-reflective water and eye surfaces.",
        "references": ["Your Name", "Weathering With You", "Suzume", "Garden of Words"],
        "prompt_prefix": (
            "Makoto Shinkai cinematic anime style, photorealistic cumulus clouds and twilight sky lighting, "
            "high-dynamic-range HDR bloom, hyper-reflective water puddles and expressive eye reflections, "
            "intricate city atmosphere, radiant golden hour lighting, CoMix Wave Films visual masterpiece"
        ),
        "negative_prompt": (
            "flat colors, dull sky, manga screentone, monochrome, low detail, crude lines, 3D CGI, blurry"
        ),
        "visual_engine_focus": "HDR cinematic atmosphere",
        "key_keywords": "shinkai cinematic anime, hdr sky lighting, reflective water, golden hour anime, masterpiece still",
    },
    "stylized_pop_action": {
        "name": "Stylized / Pop Action",
        "description": "Exaggerated perspective, flat bright color blocking, thick expressive brushstrokes, and distorted anatomy during movement.",
        "references": ["Studio Trigger", "Kill la Kill", "Tengen Toppa Gurren Lagann", "Promare"],
        "prompt_prefix": (
            "Studio Trigger stylized pop action anime, extreme wide-angle distorted perspective, "
            "flat neon and primary color blocking, thick expressive brushstrokes, dynamic kinetic energy streaks, "
            "dramatic angular poses, high-energy sakuga keyframe animation, graphic pop aesthetic"
        ),
        "negative_prompt": (
            "dull muted colors, soft pastel blur, realistic anatomy, slow pacing, monochrome, 3D render"
        ),
        "visual_engine_focus": "Hyper-kinetic graphic anime",
        "key_keywords": "studio trigger style, pop action anime, exaggerated perspective, dynamic sakuga, bold colors",
    },
}

# Aliases for backwards compatibility with existing keys
ANIME_ALIASES = {
    "anime_ufotable_cinematic": "modern_cel_shaded",
    "anime_ghibli_watercolor": "kyoto_animation_soft",
    "anime_90s_retro_cel": "retro_90s_cel",
    "modern_anime": "modern_cel_shaded",
    "retro_90s_anime": "retro_90s_cel",
    "anime": "modern_cel_shaded",
}


def build_anime_prompt(
    style_key: str,
    action: str,
    camera_angle: str = "cinematic_wide",
    character_name: str = "Protagonist",
) -> Tuple[str, str]:
    """Build positive and negative prompts tailored specifically for Anime keyframe art."""
    resolved_key = ANIME_ALIASES.get(style_key, style_key)
    cfg = ANIME_STYLES.get(resolved_key, ANIME_STYLES["modern_cel_shaded"])

    base_prompt = (
        f"{cfg['prompt_prefix']}, {action}, {camera_angle} angle, "
        f"16:9 widescreen anime movie still, 24fps hand-drawn sakuga animation cel, "
        f"vibrant cinematic lighting, rich painterly anime background scenery, theatrical release masterpiece, "
        f"no comic panel, no manga screentone, no 3D render, no CGI"
    )
    negative_prompt = (
        f"{cfg['negative_prompt']}, "
        "comic panel, comic strip, manga page, koma-wari, speech bubble, dialog box, halftone dots, "
        "screentone, black and white, photorealistic, 3D render, CGI, octane render, realism, photo, "
        "realistic skin, text, words, letters, font, watermark, signature, blurry, bad anatomy, deformed limbs"
    )
    return base_prompt, negative_prompt
