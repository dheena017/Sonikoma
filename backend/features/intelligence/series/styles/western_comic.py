"""Western Comics (American & European) Art Style Definitions and Prompt Generators.

Western comics focus heavily on anatomy, dimensional shading, and cinematic page framing.
"""

from typing import Dict, Any, Optional, Tuple

WESTERN_COMIC_STYLES: Dict[str, Dict[str, Any]] = {
    "modern_superhero": {
        "name": "Modern Superhero / DC & Marvel",
        "description": "Muscular anatomy, crosshatch feathering, detailed digital multi-light rendering, and dramatic chiaroscuro (light vs. deep shadow).",
        "references": ["Jim Lee (Batman: Hush)", "Olivier Coipel (Thor)", "David Finch", "Ivan Reis"],
        "prompt_prefix": (
            "western comic book art, detailed inking, dramatic lighting, marvel dc comic aesthetic, feathered shadows, "
            "sculpted heroic muscular anatomy, fine crosshatch line feathering, detailed digital multi-light rim rendering, "
            "dramatic chiaroscuro lighting, dynamic superhero splash page, high-end American graphic novel illustration"
        ),
        "negative_prompt": (
            "manga screentone, chibi, cute, anime cel shading, flat 2D cartoon, 3D CGI plastic render, photorealism, blurry"
        ),
        "visual_engine_focus": "Sculpted anatomy & dynamic chiaroscuro",
        "key_keywords": "western comic book art, detailed inking, dramatic lighting, marvel dc comic aesthetic, feathered shadows",
    },
    "golden_silver_classic": {
        "name": "Golden / Silver Age Classic",
        "description": "Bold uniform ink lines, primary flat colors, and visible Ben-Day dot / halftone patterns.",
        "references": ["Jack Kirby (Fantastic Four, New Gods)", "Steve Ditko", "Curt Swan", "Joe Shuster"],
        "prompt_prefix": (
            "vintage Silver Age American comic book art, Jack Kirby aesthetic, bold uniform black ink contours, "
            "vibrant primary flat CMYK colors, visible vintage Ben-Day dot halftone printing patterns, Kirby crackle cosmic dots, "
            "classic retro superhero comic book page, authentic vintage comic paper texture"
        ),
        "negative_prompt": (
            "modern digital gradients, 3D render, anime eyes, soft watercolor, photorealism, dark grunge, blurry"
        ),
        "visual_engine_focus": "Retro Silver Age pop & Ben-Day dots",
        "key_keywords": "retro comic art, ben-day dots, jack kirby style, vintage superhero, primary flat colors",
    },
    "noir_heavy_shadow": {
        "name": "Noir / Heavy Shadow",
        "description": "Extreme contrast, massive blocks of pure black silhouette (shadow spotting), and sparse highlight lines.",
        "references": ["Sin City (Frank Miller)", "Hellboy (Mike Mignola)", "Batman: Year One (David Mazzucchelli)"],
        "prompt_prefix": (
            "graphic noir comic style, extreme high contrast, massive blocks of pure pitch-black silhouette shadows, "
            "sparse stark white highlight lines, Mike Mignola Frank Miller Sin City aesthetic, dramatic hard shadows, "
            "stark chiaroscuro ink spotting, grim atmospheric crime graphic novel"
        ),
        "negative_prompt": (
            "soft shading, pastel colors, bright cheerful, colorful anime, cute, 3D CGI, blurry, gray gradients"
        ),
        "visual_engine_focus": "Extreme high-contrast shadow spotting",
        "key_keywords": "noir comic art, frank miller style, mike mignola shadows, extreme contrast ink, graphic novel noir",
    },
    "ligne_claire": {
        "name": "Ligne Claire / Franco-Belgian",
        "description": "Equal-weight clear ink lines across foreground and background, no hatching, completely flat colors, and architectural precision.",
        "references": ["Tintin (Hergé)", "Moebius (The Incal, Arzach)", "Blake and Mortimer (Edgar P. Jacobs)"],
        "prompt_prefix": (
            "Franco-Belgian bande dessinée ligne claire style, clear clean equal-weight ink lineart, "
            "zero crosshatching, completely flat gouache color fills, architectural draftsmanship precision, "
            "Hergé Tintin Moebius aesthetic, elegant European graphic album illustration, exquisite linework"
        ),
        "negative_prompt": (
            "heavy shadows, crosshatching, dark gradients, anime glow, 3D CGI, photorealism, blurry, gritty mud"
        ),
        "visual_engine_focus": "Equal-weight clear line & flat color",
        "key_keywords": "ligne claire, franco-belgian comic, moebius herge style, clean lineart, flat colors",
    },
    "dark_indie_graphic_novel": {
        "name": "Dark Indie / Graphic Novel",
        "description": "Mixed media textures (watercolor, scratchboard, gouache), atmospheric palettes, and experimental panel layouts.",
        "references": ["The Sandman (Dave McKean)", "Image Comics (Spawn, Saga)", "Vertigo Comics", "Jeff Lemire"],
        "prompt_prefix": (
            "dark indie graphic novel art, mixed media visual texture, expressive scratchboard ink and dark watercolor wash, "
            "atmospheric muted gothic palette, evocative textured lineart, Vertigo Sandman aesthetic, "
            "experimental fine art graphic novel panel, rich illustrative depth"
        ),
        "negative_prompt": (
            "glossy superhero, clean vector, saturated primary colors, cute chibi, 3D CGI, photorealism, blurry"
        ),
        "visual_engine_focus": "Mixed media & atmospheric indie",
        "key_keywords": "indie graphic novel, mixed media comic, dark atmospheric ink, dave mckean style, artistic graphic novel",
    },
}

# Aliases for backwards compatibility with existing keys
WESTERN_COMIC_ALIASES = {
    "comic_western_vintage": "golden_silver_classic",
    "comic_cyberpunk_neon": "modern_superhero",
    "modern_american_comic": "modern_superhero",
    "western_comic": "modern_superhero",
    "comic": "modern_superhero",
}


def build_western_comic_prompt(
    style_key: str,
    action: str,
    camera_angle: str = "dramatic_medium",
    character_name: str = "Protagonist",
) -> Tuple[str, str]:
    """Build positive and negative prompts tailored specifically for Western Comic / Graphic Novel art."""
    resolved_key = WESTERN_COMIC_ALIASES.get(style_key, style_key)
    cfg = WESTERN_COMIC_STYLES.get(resolved_key, WESTERN_COMIC_STYLES["modern_superhero"])

    base_prompt = (
        f"{cfg['prompt_prefix']}, {action}, {camera_angle} angle, "
        f"western graphic novel comic panel, detailed professional inking, "
        f"cinematic comic page composition, masterpiece comic illustration, no 3D render, no CGI"
    )
    negative_prompt = (
        f"{cfg['negative_prompt']}, "
        "manga screentone, anime cel shading, photorealistic, 3D render, CGI, octane render, realism, "
        "photo, text, words, letters, font, speech bubble, dialog balloon, caption box, watermark, signature, blurry, bad anatomy"
    )
    return base_prompt, negative_prompt
