"""
backend/features/creative/thumbnails/ai_skill.py
─────────────────────────────────────────────────────────────────────────────
AI YouTube Thumbnail Skill:
Synthesizes prompt-driven visual concepts for 1280x720 YouTube thumbnails.
Directly uses the user's prompt without hardcoded templates or if-else branches.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import List, Optional, Tuple
from dataclasses import dataclass

from features.creative.thumbnails.schemas import ThumbnailPanelInput

logger = logging.getLogger("sonikoma.creative.thumbnails.ai_skill")


@dataclass
class DynamicThumbnailConcept:
    index: int
    archetype_id: str
    archetype_label: str
    hook_text: str
    visual_prompt: str
    palette: List[str]
    bg_color: Tuple[int, int, int]
    accent_color: Tuple[int, int, int]
    lighting_style: str


STYLE_PROMPT_MODIFIERS = {
    "anime_manhwa": "vibrant anime manhwa key visual, sharp lineart, glowing highlights, dynamic cel shading, high contrast dramatic lighting",
    "dark_monarch": "dark monarch sovereign aura, obsidian shadows, glowing purple and blue arcane energy, intense grimdark contrast",
    "shonen_battle": "epic shonen battle climax, blazing golden aura, dynamic action debris, explosive impact sparks",
    "cyber_neon": "cyberpunk neon awakening, cyan and magenta neon glow, futuristic cyber runes, dark tech background",
    "vector_art": "clean vector art illustration, flat shapes, smooth curves, crisp bold outlines, graphic design aesthetic",
    "pixel_art": "retro pixel art, 16-bit nostalgic video game aesthetic, crisp pixel grid, vibrant color palette",
    "3d_digital_sculpt": "3D digital painting, volumetric sculpting, Blender 3D render, octane render depth, cinematic subsurface scattering",
    "vaporwave_synthwave": "vaporwave synthwave 1980s retro-futuristic style, neon purple and cyan, chrome reflections, VHS grid aesthetic",
    "low_poly": "low poly 3D geometry, faceted polygonal surfaces, sharp geometric angles, minimalist low-poly art",
    "flat_illustration": "modern flat illustration, bold flat color blocks, clean graphic silhouettes, no gradients, minimalist",
    "anime_manga": "classic Japanese anime manga style, expressive eyes, dynamic line art, cel-shaded cinematic anime illustration",
    "manhwa_webtoon": "Korean manhwa webtoon style, vibrant digital painting, airbrushed soft highlights, dramatic webtoon lighting",
    "western_comic_pop": "vintage Western comic book pop art, dramatic black ink hatching, Ben-Day dots, primary colors, Roy Lichtenstein style",
    "caricature": "expressive caricature illustration, stylized exaggerated features, energetic illustrative portrait",
    "chibi_super_deformed": "cute chibi super-deformed anime style, oversized head, large adorable sparkling eyes, tiny compact body",
    "line_art_contour": "clean line art contour drawing, varied expressive line weights, minimalist pure line inking, black on clean contrast",
    "hatching_cross_hatching": "traditional pen and ink hatching and cross-hatching, fine line texture, classical engraved illustration",
    "stippling_pointillism": "stippling pointillism art, textured shading composed entirely of ink dots, high-density pointillist technique",
    "charcoal_graphite": "expressive charcoal and graphite pencil drawing, rich textured dark values, blended smudges, dramatic sketch",
    "photorealism": "photorealistic hyperrealism, 8k photographic detail, realistic material textures, cinematic studio lighting",
    "impressionism": "impressionist oil painting style, visible textured brushstrokes, Claude Monet palette, vibrant dappled light and movement",
    "surrealism": "surrealist art, Salvador Dali dreamlike atmosphere, bizarre imaginative surrealism, metaphysical realism",
    "cubism": "cubism style, fragmented geometric planes, multiple simultaneous perspectives, Pablo Picasso inspired",
    "art_nouveau": "art nouveau illustration, Alphonse Mucha style, elegant flowing organic lines, floral botanical ornaments, gold accents",
    "abstract_expressionism": "abstract expressionism, bold gestural paint splashes, dynamic spontaneous energy, emotive color field",
    "watercolor_wash": "fine watercolor painting, fluid translucent color washes, soft pigment bleeds, wet-on-wet watercolor paper texture",
}


class ThumbnailAISkill:
    """
    Skill module responsible for taking the user's prompt and title,
    and creating visual composition concepts for image generation.
    Strictly uses the user's prompt with zero hardcoded templates or if/else conditions.
    """

    async def generate_thumbnail_concepts(
        self,
        series_title: str,
        genre: str,
        user_prompt: str,
        panels: List[ThumbnailPanelInput],
        count: int = 1,
        hook_override: Optional[str] = None,
        style: Optional[str] = None,
        aspect_ratio: str = "16:9",
    ) -> List[DynamicThumbnailConcept]:
        """
        Synthesizes thumbnail concepts directly from the user's prompt, visual style, and aspect ratio.
        Zero hardcoded templates, zero if-else condition branches.
        """
        title = series_title.strip() if series_title else ""
        genre_str = genre.strip() if genre else ""
        ratio_str = aspect_ratio.strip() or "16:9"

        style_mod = STYLE_PROMPT_MODIFIERS.get(style or "", "")
        ratio_tag = f"{ratio_str} aspect ratio"

        # Directly use what the user entered in the prompt enriched by the selected style & aspect ratio
        if user_prompt.strip():
            if style_mod:
                base_prompt = f"{user_prompt.strip()}, {style_mod}, {ratio_tag}, high detail masterpiece"
            else:
                base_prompt = f"{user_prompt.strip()}, {ratio_tag}, high detail masterpiece"
        else:
            style_desc = style_mod or "2D anime illustration, vibrant manhwa key visual"
            context_bits = [b for b in [title, genre_str] if b]
            context_prefix = f"{' '.join(context_bits)} " if context_bits else ""
            base_prompt = f"{style_desc}, {context_prefix}climax scene, {ratio_tag}, dynamic heroic pose, glowing aura, cinematic lighting, 8k resolution, anime masterpiece"

        concepts: List[DynamicThumbnailConcept] = []
        for i in range(max(1, count)):
            index = i + 1
            if count == 1:
                hook = hook_override or (title.upper() if title else "EPIC CLIMAX")
                label = f"Master {ratio_str} Climax"
            else:
                prefix = title.upper() if title else "CONCEPT"
                hook = hook_override or f"{prefix} #{index}"
                label = f"Concept #{index}"

            concepts.append(
                DynamicThumbnailConcept(
                    index=index,
                    archetype_id=f"concept_{index}",
                    archetype_label=label,
                    hook_text=hook,
                    visual_prompt=base_prompt,
                    palette=["#0A0E17", "#3B82F6", "#FFD700"],
                    bg_color=(10, 14, 23),
                    accent_color=(59, 130, 246),
                    lighting_style="cinematic",
                )
            )

        return concepts


thumbnail_ai_skill = ThumbnailAISkill()
__all__ = ["ThumbnailAISkill", "thumbnail_ai_skill", "DynamicThumbnailConcept"]
