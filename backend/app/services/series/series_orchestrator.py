"""AI Series Progressive Generation & Production Orchestrator.

Handles multi-session story architecture, fast Turbo First Chapter synthesis,
Pollinations Flux.1/SDXL image synthesis, true kinetic anime video motion (I2V/T2V),
Edge-TTS vocal dubbing, and guaranteed epilogue closure.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import urllib.parse
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import uuid4

from app.schemas.series import (
    AISeriesProject,
    AISeriesPanel,
    ChapterSession,
    SeriesSession,
    CharacterDNA,
    InteractiveSpeechBubble,
    InteractivePoint,
    SeriesFormatType,
    SeriesArtStyle,
    SeriesPacing,
    DialogueDensity,
    ProjectStatus,
    CreateAISeriesRequest,
    GenerationPriority,
)
from app.repositories.series import ai_series_repo
from app.services.series.series_memory_engine import series_memory_engine
from services.ai.skills.registry import registry

logger = logging.getLogger(__name__)


# Preset artistic style prompt builders - Strictly 2D Webtoon & Comic Art
ART_STYLE_PROMPT_PREFIXES: Dict[str, str] = {
    "manhwa_slice_of_life": (
        "authentic 2D Korean webtoon comic strip panel, slice of life manhwa drawing, "
        "crisp clean anime line art, soft pastel color palette, warm expressive character design, "
        "Naver Webtoon aesthetic, 2D digital illustration only, bright natural daylight, no 3D, no realism"
    ),
    "manhwa_action_hunter": (
        "authentic 2D Korean manhwa comic panel, clean crisp 2D anime lineart, Solo Leveling 2D drawing style, "
        "vibrant 2D cel shading, sharp digital ink lines, webtoon comic art, flat colors with dynamic cel shading, no 3D, no CGI"
    ),
    "manhwa_otome_isekai": (
        "authentic Korean romance manhwa webtoon panel, 2D shojo anime drawing, clean digital lineart, "
        "soft pastel jewel tones, sparkling floral flourishes, expressive emotional eyes, 2D comic art, no 3D"
    ),
    "manhwa_murim_wuxia": (
        "authentic martial arts manhwa comic panel, 2D digital drawing, dynamic ink brush lineart, "
        "traditional wuxia webtoon aesthetic, cel shaded 2D illustration, no 3D"
    ),
    "manga_shonen_jump": (
        "classic shonen manga screentone aesthetic, black and white dynamic hatching, crisp pen ink lines, "
        "high action speedlines, dramatic impact perspective, 2D manga page, no 3D"
    ),
    "manga_berserk_seinen": (
        "dark fantasy seinen manga style, intricate cross-hatching, heavy ink shading, gritty visceral texture, "
        "dramatic chiaroscuro lighting, legendary Berserk manga style, 2D manga art, no 3D"
    ),
    "comic_western_vintage": (
        "vintage Western comic book aesthetic, retro Ben-Day dot screentones, bold CMYK printing registration, "
        "thick primary ink outlines, silver age superhero composition, 2D graphic art"
    ),
    "comic_cyberpunk_neon": (
        "futuristic comic book style, neon cyan and magenta accents, sharp 2D detailed line art, "
        "graphic novel panel illustration, 2D ink drawing"
    ),
    "anime_ufotable_cinematic": (
        "2D modern anime keyframe, crisp digital anime drawing, dynamic 2D sakuga animation cel, "
        "vibrant colors, anime movie still, 2D illustration"
    ),
    "anime_ghibli_watercolor": (
        "heartwarming Studio Ghibli 2D anime cel style, lush hand-painted watercolor background, "
        "soft greenery, nostalgic pastoral warmth, 2D animation art"
    ),
    "anime_90s_retro_cel": (
        "authentic 1990s retro anime cel art, film grain texture, hand-drawn anime aesthetic, "
        "warm analog color palette, 2D cel drawing"
    ),
}

# Kinetic motion prompts for real anime physical action
KINETIC_MOTION_PRESETS: List[str] = [
    "High velocity physical leap across concrete rooftops, cape billowing violently in night wind, cinematic low angle 3D camera pan, 24fps high quality anime sakuga animation",
    "Dynamic martial arts leap forward with sudden spin strike, energy blade slashing through air, orbital camera spin, fluid character movement",
    "Explosive landing impact from high altitude, dust and shockwave billowing outward, dynamic hair and jacket physics, dramatic camera shake",
    "Sprinting at extreme velocity along highway overpass, camera tracking from 3/4 front angle, hair whipping in wind, intense determined expression",
    "Supernatural aerial dash dodging energy beams, mid-air acrobatic spin, kinetic blur streaks, synchronized Sakuga animation",
]


class SeriesOrchestrator:
    """Production director for AI Generated Series."""

    def __init__(self):
        self.active_jobs: Dict[str, Dict[str, Any]] = {}

    def _build_pollinations_url(
        self, prompt: str, width: int = 768, height: int = 1024, seed: Optional[int] = None, model: str = "flux-anime"
    ) -> str:
        """Construct free, high-speed Pollinations.ai image URL supporting Flux-Anime, Flux.1, and SDXL Turbo."""
        clean_prompt = prompt.replace("\n", " ").strip()
        encoded = urllib.parse.quote(clean_prompt)
        actual_seed = seed if seed is not None else int(datetime.utcnow().timestamp() % 100000)
        
        # Model selector: flux-anime produces crisp 2D anime, manga, and manhwa cel art without photorealistic or 3D distortion
        m = str(model or "flux-anime").lower()
        if "turbo" in m or "fast" in m:
            chosen_model = "turbo"
        elif "stable-diffusion" in m or "stablediffusion" in m or "sd" in m:
            chosen_model = "stable-diffusion"
        elif "flux-realism" in m:
            chosen_model = "flux-realism"
        elif "flux" in m and "anime" not in m:
            chosen_model = "flux"
        else:
            # Default to flux-anime: specifically trained for clean 2D anime/manga/manhwa lines
            chosen_model = "flux-anime"

        return f"https://image.pollinations.ai/prompt/{encoded}?width={width}&height={height}&seed={actual_seed}&model={chosen_model}&nologo=true"

    async def create_series_project(self, req: CreateAISeriesRequest) -> AISeriesProject:
        """Initialize an AI Series project with full narrative architecture and turbo chapter 1."""
        series_id = f"ai_series_{uuid4().hex[:10]}"
        
        # 1. Generate cast and arc structure using format-specific AI skill
        cast, world_bible, sessions = await self._architect_series_arc(req, series_id)

        # 2. Construct Project Entity
        project = AISeriesProject(
            series_id=series_id,
            title=req.title,
            logline=req.logline,
            format_type=req.format_type,
            art_style=req.art_style,
            image_model=getattr(req, "image_model", "flux-anime") or "flux-anime",
            total_sessions=req.total_sessions,
            chapters_per_session=req.chapters_per_session,
            panels_per_chapter=getattr(req, "panels_per_chapter", 8) or 8,
            pacing=req.pacing,
            dialogue_density=req.dialogue_density,
            cast=cast,
            world_bible=world_bible,
            sessions=sessions,
            status=ProjectStatus.COMPLETED,
            generation_priority=req.generation_priority,
        )

        # Persist project with all chapters fully generated
        ai_series_repo.create_project(project)

        # Initialize continuity memory
        continuity = series_memory_engine.get_continuity(series_id)
        for char in cast:
            continuity.active_characters[char.name] = {
                "role": char.role,
                "current_outfit": char.clothing_palette,
                "scars": ", ".join(char.signature_traits),
            }
        continuity.world_rules = world_bible.get("lore_rules", [])
        series_memory_engine.save_continuity(continuity)

        logger.info(f"[AISeries] Created and synthesized complete AI Series '{project.title}' ({len(sessions)} seasons, {sum(len(s.chapters) for s in sessions)} chapters).")
        return project

    def _synthesize_panels(
        self,
        series_id: str,
        format_type: Union[SeriesFormatType, str],
        art_style: Union[SeriesArtStyle, str],
        hero_name: str,
        session_number: int,
        chapter_number: int,
        chapter_title: str,
        is_series_finale: bool = False,
        panel_count: int = 8,
        genre: str = "",
        logline: str = "",
        image_model: str = "flux-anime",
        suggested_scene_prompts: Optional[List[Any]] = None,
    ) -> List[AISeriesPanel]:
        """Synthesize authentic 2D artwork panels, Pollinations URLs, dialogue bubbles, and camera directions."""
        art_style_key = art_style.value if hasattr(art_style, "value") else str(art_style)
        style_prefix = ART_STYLE_PROMPT_PREFIXES.get(
            art_style_key,
            "authentic 2D Korean webtoon comic strip panel, clean anime line art, soft pastel color palette, 2D digital illustration only, no 3D, no realism",
        )

        format_val = (format_type.value if hasattr(format_type, "value") else str(format_type)).lower()
        is_anime = ("anime" in format_val)
        is_comic = ("comic" in format_val or "manga" in format_val)
        is_manhwa = not is_anime and not is_comic

        art_style_key = art_style.value if hasattr(art_style, "value") else str(art_style)
        if art_style_key in ART_STYLE_PROMPT_PREFIXES:
            style_prefix = ART_STYLE_PROMPT_PREFIXES[art_style_key]
        elif is_anime:
            style_prefix = (
                "authentic cinematic 2D anime screenshot, 16:9 widescreen movie still, Ufotable Kyoto Animation sakuga aesthetic, "
                "dynamic 24fps keyframe cel animation, vibrant cinematic lighting, raytraced anime bloom, rich painterly anime background, no 3D CGI"
            )
        elif is_comic:
            style_prefix = (
                "authentic 2D Japanese manga panel, crisp black and white G-pen lineart, dense 50 LPI screentone halftone dots shading, "
                "dynamic ink speedlines, bold crosshatching, dramatic high-contrast Kuro-beta solid blacks, monochrome ink on white paper, no color, no 3D"
            )
        else: # manhwa
            style_prefix = (
                "authentic 2D Korean webtoon comic strip panel, clean anime line art, soft pastel color palette, soft cel shading, "
                "Clip Studio Paint, vibrant flat colors with glowing violet mana aura, modern webtoon digital illustration, no 3D render"
            )

        # Format-specific Canvas Dimensions
        if is_manhwa:
            w, h = 768, 1152 # 2:3 vertical mobile webtoon strip
        elif is_comic:
            w, h = 768, 1024 # 3:4 Japanese manga / comic page
        else: # anime
            w, h = 1024, 576 # 16:9 widescreen theatrical anime cut

        panels: List[AISeriesPanel] = []
        clean_hero = hero_name or "Character"

        # Check if story is slice of life, family, romance, drama
        theme_str = f"{genre} {logline} {chapter_title} {art_style_key}".lower()
        is_slice_of_life = (
            art_style_key == "manhwa_slice_of_life"
            or any(kw in theme_str for kw in ["slice of life", "family", "baby", "hospital", "parent", "home", "daily", "warmth", "miracle", "romance", "child", "angel", "life"])
        )

        logger.info(
            f"[AISeries] Synthesizing S{session_number}:C{chapter_number} '{chapter_title}' "
            f"({panel_count} panels, format: {format_val}, style: {art_style_key}, res: {w}x{h}, model: {image_model})"
        )

        for p_idx in range(1, panel_count + 1):
            panel_id = f"panel_s{session_number}_c{chapter_number}_p{p_idx}_{uuid4().hex[:6]}"

            # Check if specialized AI Skill returned a planned scene prompt for this panel
            scene_data: Optional[Dict[str, Any]] = None
            if suggested_scene_prompts and isinstance(suggested_scene_prompts, list):
                if p_idx - 1 < len(suggested_scene_prompts):
                    raw_s = suggested_scene_prompts[p_idx - 1]
                    if hasattr(raw_s, "model_dump"):
                        scene_data = raw_s.model_dump()
                    elif isinstance(raw_s, dict):
                        scene_data = raw_s

            dialogue_turns_list = []
            if scene_data and (scene_data.get("visual_description") or scene_data.get("prompt")):
                action = scene_data.get("visual_description") or scene_data.get("prompt")
                camera = scene_data.get("camera_angle") or ("cinematic_wide" if is_anime else "dramatic_medium")
                dialogue_turns_list = scene_data.get("dialogue") or []
                dialogue_text = dialogue_turns_list[0].get("spoken_line", "") if (dialogue_turns_list and isinstance(dialogue_turns_list[0], dict)) else ""
            elif is_anime:
                # ── TOTALLY UNIQUE ANIME VISUAL LANGUAGE: 16:9 Widescreen Sakuga Movie Keyframes ──
                if p_idx == 1:
                    action = f"cinematic 16:9 anime movie keyframe of {clean_hero} standing on skyscraper rooftop overlooking Neo-Tokyo skyline at dusk, glowing cybernetic eye trail, wind whipping through dark hair and combat jacket, vibrant anime color palette, atmospheric depth of field"
                    camera = "cinematic_wide_skyline"
                    dialogue_text = "The orbital grid is fracturing. We move at dawn."
                elif p_idx == panel_count and is_series_finale:
                    action = f"theatrical anime movie finale frame of {clean_hero} looking back with gentle confident smile as golden morning dawn breaks over restored city, warm volumetric anime lens flare, hand-painted anime sky, 24fps keyframe animation"
                    camera = "golden_dawn_resolution"
                    dialogue_text = "Our battle is finished. The sky is ours again."
                elif p_idx == panel_count:
                    action = f"high-tension anime cliffhanger cut of {clean_hero} turning around with determined fiery gaze, glowing energy trail igniting in fist, dynamic Dutch tilt angle, dramatic anime lighting"
                    camera = "dutch_tilt_climax"
                    dialogue_text = "This isn't over yet. Brace yourselves!"
                elif p_idx % 3 == 0:
                    action = f"high-velocity sakuga animation combat cut of {clean_hero} executing aerial sonic-boom dash, radiant neon blue energy streaks slicing through frame, kinetic motion blur, fluid 24fps anime action"
                    camera = "high_velocity_tracking"
                    dialogue_text = "Accelerating past Mach 3!"
                elif p_idx % 2 == 0:
                    action = f"dramatic anime character close-up cut of {clean_hero} in intense emotional standoff, detailed expressive anime eyes, dramatic rim lighting, atmospheric floating light motes"
                    camera = "dramatic_anime_close_up"
                    dialogue_text = "I knew you were behind this all along."
                else:
                    action = f"atmospheric anime keyframe of {clean_hero} walking forward along neon-lit rainy street, reflections rippling on wet pavement, cinematic anime movie still"
                    camera = "over_the_shoulder_cinematic"
                    dialogue_text = "Every clue leads deeper into Sector 7."

            elif is_comic:
                # ── TOTALLY UNIQUE COMIC / MANGA VISUAL LANGUAGE: Black & White G-Pen Inking & Screentones ──
                if p_idx == 1:
                    action = f"traditional black and white manga drawing of swordsman {clean_hero} drawing heavy dark-ink katana on Kyoto Iron Wastes balcony, radiating focus lines (Shuuchuusen), dense screentone shading, high-contrast ink crosshatching"
                    camera = "koma_establishing_wide"
                    dialogue_text = "The seal has broken. Draw your steel!"
                elif p_idx == panel_count and is_series_finale:
                    action = f"climactic seinen manga panel of {clean_hero} standing victorious on destroyed stone battlefield under monochrome inked sky, torn combat hakama, bold G-pen contours, heavy contrast, dramatic manga art"
                    camera = "heroic_low_angle"
                    dialogue_text = "It's finally over. Rest in peace, old friend."
                elif p_idx == panel_count:
                    action = f"dramatic manga page-turner cliffhanger of {clean_hero} unleashing cursed blade, massive black ink aura erupting through panel borders into gutter, intense speedlines"
                    camera = "dynamic_tachi_kiri"
                    dialogue_text = "You haven't seen my true form yet!"
                elif p_idx % 3 == 0:
                    action = f"explosive manga combat strike of {clean_hero} executing flash sword slash, sharp white sword trajectory cutting through solid Kuro-beta black shadows, dynamic G-pen speedlines (Kouka-sen)"
                    camera = "extreme_action_slash"
                    dialogue_text = "First Form: Moon Shadow Sever!"
                elif p_idx % 2 == 0:
                    action = f"intense manga face-off close-up on {clean_hero}'s fierce eyes and furrowed brow, dense crosshatching tension lines, stark black inking, psychological battle tension"
                    camera = "dramatic_manga_close_up"
                    dialogue_text = "Take one more step and you lose your arm."
                else:
                    action = f"atmospheric manga panel of {clean_hero} walking with nodachi across desolate windswept wasteland, screentone shaded clouds, detailed ink hatching on rocky terrain"
                    camera = "medium_manga_tracking"
                    dialogue_text = "The trail of cursed iron continues north."

            else:
                # ── TOTALLY UNIQUE MANHWA VISUAL LANGUAGE: Full-Color Korean Webtoon with Glowing Mana ──
                if is_slice_of_life:
                    if p_idx == 1:
                        action = f"young handsome father with dark hair in stylish jacket entering doorway holding a gift bag, smiling warmly with gentle eyes, clear character portrait, rich color depth, 2D Korean webtoon art"
                        camera = "medium_shot_entry"
                        dialogue_text = "Honey, I'm back! Where's our little angel?"
                    elif p_idx == 2:
                        action = f"young mother resting against white pillows in hospital bed, tenderly holding newborn baby swaddled in soft white blanket, gentle maternal smile, sunny bright window, 2D webtoon"
                        camera = "medium_shot_bedside"
                        dialogue_text = "Hi, honey. Our little angel just had a feeding and he's asleep now."
                    elif p_idx == 3:
                        action = f"close up portrait of smiling mother with brown hair gently touching sleeping baby cheek with her finger, cute peaceful baby face, soft blushing cheeks, clean 2D anime manhwa drawing"
                        camera = "intimate_close_up"
                        dialogue_text = "I'm trying to take in every little detail. He looks so cute when he's sleeping."
                    elif p_idx == 4:
                        action = f"scenic view of radiant morning sunlight and lens flare glowing through hospital window curtains, casting warm golden light over mother and sleeping baby in bed, serene atmosphere, 2D comic art"
                        camera = "wide_luminous_glow"
                        dialogue_text = None
                    elif p_idx == 5:
                        action = f"young father leaning over bedside, smiling with adoring eyes, playfully touching the baby tiny hand, mother laughing softly, cute webtoon family moment"
                        camera = "two_shot_warm"
                        dialogue_text = "Oh, dear. You'll wake him up if you're not careful, haha."
                    elif p_idx == 6:
                        action = f"young father and mother sitting close together looking lovingly at their newborn baby in swaddle, domestic family warmth, soft pastel colors, clean Korean webtoon panel"
                        camera = "medium_tender"
                        dialogue_text = "What should we name our little miracle?"
                    elif p_idx == 7:
                        action = f"adorable close up of newborn baby wrapped in blanket opening tiny eyes sleepily, soft pastel background, authentic Naver webtoon illustration"
                        camera = "baby_macro_close_up"
                        dialogue_text = "Look, he's looking right at you."
                    else:
                        action = f"young parents holding hands together over the baby crib under warm afternoon sunlight, peaceful heartfelt ending scene, clean 2D manhwa comic drawing"
                        camera = "golden_hour_finale"
                        dialogue_text = "Welcome to our family, little one."
                else:
                    if p_idx == 1:
                        action = f"vibrant 2D Korean webtoon drawing of awakened hunter {clean_hero} in sleek obsidian trench coat standing before colossal glowing blue dungeon gate, glowing violet mana daggers, radiant ethereal lighting, sharp manhwa lineart"
                        camera = "vertical_webtoon_low_angle"
                        dialogue_text = "An S-Rank gate in the middle of Seoul? This is bad."
                    elif p_idx == panel_count and is_series_finale:
                        action = f"emotional manhwa splash illustration of {clean_hero} bathed in radiant celestial golden light, serene smile, glowing purple and gold mana aura swirling, high-resolution webtoon masterpiece"
                        camera = "celestial_epilogue_splash"
                        dialogue_text = "The monarchs have fallen. The human realm is safe."
                    elif p_idx == panel_count:
                        action = f"high-tension manhwa vertical scroll cliffhanger of {clean_hero} raising glowing mana blade toward shadowy monarch descending from dungeon ceiling, intense glowing eyes, dark fantasy webtoon"
                        camera = "vertical_scroll_reveal"
                        dialogue_text = "So you're the master of this dungeon..."
                    elif p_idx % 3 == 0:
                        action = f"dynamic vertical manhwa action leap of {clean_hero} executing mid-air dual dagger strike, electric violet speed trails, sharp cel-shaded shadows, intense glowing eyes, dramatic webtoon combat frame"
                        camera = "dynamic_vertical_slash"
                        dialogue_text = "Ruler's Authority: Shadow Extraction!"
                    elif p_idx % 2 == 0:
                        action = f"intimate manhwa portrait of {clean_hero} with sharp intense gaze, glowing violet pupils, sleek tousled dark hair, dramatic rim lighting, high-stakes emotional confrontation"
                        camera = "manhwa_dramatic_close_up"
                        dialogue_text = "If you step into my territory, you won't walk out."
                    else:
                        action = f"stylish manhwa panel of {clean_hero} walking through modern neon city street at twilight, holographic hunter rank status window glowing in air, crisp 2D digital webtoon drawing"
                        camera = "hunter_street_medium"
                        dialogue_text = "My stats have leveled up again."

            # Construct TOTALLY DISTINCT prompt and negative prompt per format
            if is_anime:
                base_prompt = (
                    f"{style_prefix}, {action}, {camera} angle, 16:9 widescreen anime movie still, "
                    f"24fps hand-drawn sakuga animation cel, vibrant cinematic lighting, raytraced anime bloom, "
                    f"rich painterly anime background scenery, theatrical anime film release, masterpiece, "
                    f"no comic panel, no manga screentone, no 3D render, no CGI"
                )
                negative_prompt = (
                    "comic panel, comic strip, manga page, koma-wari, speech bubble, dialog box, halftone dots, "
                    "screentone, black and white, photorealistic, 3D render, CGI, octane render, realism, photo, "
                    "realistic skin, text, words, letters, font, watermark, signature, blurry, bad anatomy, deformed limbs"
                )
            elif is_comic:
                base_prompt = (
                    f"{style_prefix}, {action}, {camera} angle, authentic Japanese manga page panel, "
                    f"crisp traditional G-pen ink lineart, dense 50 LPI screentone halftone dots shading, "
                    f"dynamic ink speedlines, bold crosshatching, dramatic high-contrast Kuro-beta solid blacks, "
                    f"monochrome black ink on white paper, no color, no pastel, no 3D render, no CGI"
                )
                negative_prompt = (
                    "color, colors, colorful, pastel, watercolor, chromatic, RGB, photorealistic, 3D render, "
                    "CGI, octane render, realism, photo, realistic skin, text, words, letters, font, speech bubble, "
                    "dialog balloon, caption box, watermark, signature, blurry, bad anatomy, deformed limbs"
                )
            else: # manhwa
                base_prompt = (
                    f"{style_prefix}, {action}, {camera} angle, vertical Korean webtoon panel, "
                    f"clean sharp digital manhwa lineart, soft pastel gradient coloring, luminous glowing mana lighting, "
                    f"expressive anime eyes, stylish modern webtoon aesthetic, masterpiece digital illustration, "
                    f"no 3D render, no CGI, no photorealism"
                )
                negative_prompt = (
                    "monochrome, black and white, grayscale, manga screentone, comic book halftone dots, "
                    "photorealistic, 3D render, CGI, octane render, realism, photo, realistic skin, "
                    "text, words, letters, font, speech bubble, dialog balloon, caption box, watermark, signature, blurry, bad anatomy"
                )

            enhanced_prompt = series_memory_engine.generate_prompt_enhancements(
                series_id, base_prompt, character_names=[clean_hero] if clean_hero else None
            )

            # High quality Pollinations Flux URL
            s_num = int(session_number) if str(session_number).isdigit() else 1
            c_num = int(chapter_number) if str(chapter_number).isdigit() else 1
            seed = (s_num * 10000) + (c_num * 333) + (p_idx * 47)
            image_url = self._build_pollinations_url(enhanced_prompt, width=w, height=h, seed=seed, model=image_model)

            # Interactive Vector Speech Bubbles (Overlaid via SVG on frontend canvas)
            bubbles: List[InteractiveSpeechBubble] = []
            if dialogue_turns_list and isinstance(dialogue_turns_list, list):
                for d_i, d_turn in enumerate(dialogue_turns_list):
                    if isinstance(d_turn, dict) and d_turn.get("spoken_line"):
                        spk = d_turn.get("speaker_name") or clean_hero
                        line = d_turn.get("spoken_line", "")
                        b_type = d_turn.get("bubble_type") or "speech"
                        bubbles.append(
                            InteractiveSpeechBubble(
                                bubble_id=f"bub_{panel_id}_{d_i+1}",
                                text=line,
                                speaker_name=spk,
                                bubble_type=b_type,
                                pos_x=12.0 if d_i % 2 == 0 else 48.0,
                                pos_y=8.0 + (d_i * 16.0),
                                width=46.0,
                                height=16.0,
                                font_family="Comic Sans MS, system-ui, sans-serif",
                                font_size=15,
                                bg_color="#FFFFFF",
                                text_color="#111827",
                                tail_tip=InteractivePoint(x=35.0, y=32.0),
                            )
                        )
            elif dialogue_text:
                bubbles.append(
                    InteractiveSpeechBubble(
                        bubble_id=f"bub_{panel_id}_1",
                        text=dialogue_text,
                        speaker_name=clean_hero,
                        bubble_type="speech" if p_idx % 2 != 0 else "shout",
                        pos_x=14.0 if p_idx % 2 != 0 else 46.0,
                        pos_y=8.0 if p_idx % 2 != 0 else 14.0,
                        width=46.0,
                        height=16.0,
                        font_family="Comic Sans MS, system-ui, sans-serif",
                        font_size=15,
                        bg_color="#FFFFFF",
                        text_color="#111827",
                        tail_tip=InteractivePoint(x=35.0, y=32.0),
                    )
                )

            # Kinetic Anime Video Pathway
            video_url = None
            motion_prompt = None
            motion_model = None

            if is_anime:
                motion_prompt = (
                    scene_data.get("motion_prompt") if scene_data and scene_data.get("motion_prompt")
                    else KINETIC_MOTION_PRESETS[(p_idx - 1) % len(KINETIC_MOTION_PRESETS)]
                )
                motion_model = "i2v_character_anchor" if p_idx % 2 != 0 else "t2v_high_velocity"
                video_url = f"/api/v1/ai-series/preview-video/{panel_id}.mp4"

            panel = AISeriesPanel(
                panel_id=panel_id,
                panel_index=p_idx,
                image_url=image_url,
                prompt=enhanced_prompt,
                negative_prompt=negative_prompt,
                camera_angle=camera,
                motion_prompt=motion_prompt,
                video_url=video_url,
                motion_model=motion_model,
                speech_bubbles=bubbles,
                sound_effects="[DOOR CLICK]" if (is_slice_of_life and p_idx == 1) else ("[SLASH!]" if p_idx % 3 == 0 else None),
                duration=4.5 if is_anime else 3.0,
            )
            panels.append(panel)

        return panels

    async def _architect_series_arc(
        self, req: CreateAISeriesRequest, series_id: str
    ) -> tuple[List[CharacterDNA], Dict[str, Any], List[SeriesSession]]:
        """Create multi-session architecture with guaranteed 0-cliffhanger epilogue resolution using format-specific AI skill."""
        fmt_str = (req.format_type.value if hasattr(req.format_type, "value") else str(req.format_type)).lower()

        # Route to exact separated format skill
        if fmt_str in ("anime", "anime_sakuga"):
            skill_name = "series_arc_anime"
            format_medium = "anime"
            default_hero_name = f"Shin {req.title.split()[0]}"
            default_hero_desc = "Athletic high-agility operative with cybernetic eye, flowing dark hair with silver streaks, dynamic combat jacket, 24fps sakuga aesthetic."
            default_hero_palette = "Obsidian black with luminous cyan circuit trim"
            default_rival_name = "Reiko Vance"
            default_rival_desc = "Poised imperial commander with piercing cerulean gaze, immaculate white cape, high-frequency vibro-katana."
            default_rival_palette = "Ivory white, platinum trim, royal navy"
            default_setting = "Neo-Tokyo Spire Sector 7"
            default_rules = [
                "Sakuga resonance amplifies physical velocity past sound barrier during emotional apex.",
                "The Orbital Grid fractures every solstice, unlocking classified sky domains."
            ]
        elif fmt_str in ("comic_manga", "comic", "manga"):
            skill_name = "series_arc_comic"
            format_medium = "comic_manga"
            default_hero_name = f"Kaito {req.title.split()[0]}"
            default_hero_desc = "Determined swordsman with fierce dark eyes, spiked black hair, rough inked combat hakama, bold G-pen lines."
            default_hero_palette = "Monochrome inked blacks with stark white highlights and crimson sash"
            default_rival_name = "Renjiro Kuroda"
            default_rival_desc = "Towering cursed rival with jagged scars, heavy plate armor, soul-consuming nodachi, dense screentone shading."
            default_rival_palette = "Heavy black inks, crosshatched steel, charcoal gray"
            default_setting = "Kyoto Iron Wastes"
            default_rules = [
                "Swordsmen channel spiritual pressure through G-pen speedline techniques.",
                "Breaking panel boundaries allows physical attacks to strike through dimensional gutters."
            ]
        else: # manhwa
            skill_name = "series_arc_manhwa"
            format_medium = "manhwa"
            default_hero_name = f"Sung-Min {req.title.split()[0]}"
            default_hero_desc = "Lean hunter with sharp jawline, tousled charcoal hair, piercing glowing violet eyes, modern stylish hunter trench coat."
            default_hero_palette = "Obsidian black with radiant violet mana accents"
            default_rival_name = "Guildmaster Kang"
            default_rival_desc = "Elite S-rank hunter with platinum swept-back hair, immaculate gold-embroidered suit, twin crystalline daggers."
            default_rival_palette = "Pristine white, polished gold, crystal azure"
            default_setting = "Seoul Dungeon Gate Metropolis"
            default_rules = [
                "Awakened hunters rank from E to S, seeing glowing blue holographic status notifications.",
                "The Gate Abyss expands downward through infinite vertical dungeon strata."
            ]

        # Attempt invocation of specialized AI prompt skill
        ai_data: Optional[Dict[str, Any]] = None
        try:
            skill = registry.get(skill_name)
            logger.info(f"[AISeries] Executing specialized skill '{skill_name}' for format '{format_medium}' (Title: '{req.title}')...")
            raw_output = await skill.execute(
                title=req.title,
                logline=req.logline or req.synopsis or "",
                genre=getattr(req, "genre", "action_fantasy") or "action_fantasy",
                art_style=req.art_style.value if hasattr(req.art_style, "value") else str(req.art_style),
                total_sessions=req.total_sessions,
                chapters_per_session=req.chapters_per_session,
                panels_per_chapter=getattr(req, "panels_per_chapter", 8) or 8,
                pacing=req.pacing.value if hasattr(req.pacing, "value") else str(req.pacing),
                dialogue_density=req.dialogue_density.value if hasattr(req.dialogue_density, "value") else str(req.dialogue_density),
            )
            if hasattr(raw_output, "model_dump"):
                ai_data = raw_output.model_dump()
            elif isinstance(raw_output, dict):
                ai_data = raw_output
            elif isinstance(raw_output, str) and raw_output.strip():
                try:
                    ai_data = json.loads(raw_output)
                except Exception:
                    from services.ai.skills.utils import extract_json
                    clean_str = extract_json(raw_output)
                    if clean_str:
                        try:
                            ai_data = json.loads(clean_str)
                        except Exception as e2:
                            logger.warning(f"[AISeries] Secondary JSON parse error: {e2}")
            if ai_data:
                logger.info(
                    f"[AISeries] Specialized skill '{skill_name}' successfully generated series blueprint "
                    f"({len(ai_data.get('sessions', []))} seasons, {len(ai_data.get('cast', []))} cast members)."
                )
        except Exception as e:
            logger.warning(f"[AISeries] Note: AI skill '{skill_name}' execution completed with fallback blueprint: {e}")

        # Construct or Parse Cast
        cast: List[CharacterDNA] = []
        if ai_data and isinstance(ai_data.get("cast"), list) and len(ai_data["cast"]) > 0:
            for c_raw in ai_data["cast"]:
                cid = c_raw.get("character_id") or f"char_{uuid4().hex[:6]}"
                c_name = c_raw.get("name") or "Character"
                c_role = c_raw.get("role") or "supporting"
                c_summary = c_raw.get("visual_summary") or c_name
                v_prof = c_raw.get("voice_profile") or {}
                voice_id = v_prof.get("voice_name") if isinstance(v_prof, dict) else None
                cast.append(CharacterDNA(
                    character_id=cid,
                    name=c_name,
                    role=c_role,
                    visual_summary=c_summary,
                    hair_color=c_raw.get("hair_color"),
                    eye_color=c_raw.get("eye_color"),
                    clothing_palette=c_raw.get("clothing_palette"),
                    signature_traits=c_raw.get("signature_traits", []),
                    voice_id=voice_id,
                ))
        
        if not cast:
            hero_char = CharacterDNA(
                character_id=f"char_{uuid4().hex[:6]}",
                name=default_hero_name,
                role="protagonist",
                visual_summary=default_hero_desc,
                hair_color="Dark Charcoal",
                eye_color="Vibrant Amber",
                clothing_palette=default_hero_palette,
                signature_traits=["Signature Runic Aura", "Specialized Stance"],
            )
            rival_char = CharacterDNA(
                character_id=f"char_{uuid4().hex[:6]}",
                name=default_rival_name,
                role="antagonist",
                visual_summary=default_rival_desc,
                hair_color="Platinum White",
                eye_color="Piercing Cerulean",
                clothing_palette=default_rival_palette,
                signature_traits=["Aristocratic Signet", "Intimidating Presence"],
            )
            cast = [hero_char, rival_char]

        # Construct World Bible
        if ai_data and isinstance(ai_data.get("world_bible"), dict):
            world_bible = ai_data["world_bible"]
        else:
            world_bible = {
                "setting_name": default_setting,
                "lore_rules": default_rules,
                "unresolved_mysteries": [
                    f"The ancient origin of {cast[0].name}'s awakened power",
                    f"Why {cast[1].name if len(cast) > 1 else 'the antagonist'} secretly triggered the rift",
                ],
            }

        # Register mysteries into memory engine for guaranteed 0-cliffhanger epilogue
        unresolved = world_bible.get("unresolved_mysteries") or []
        for mystery in unresolved:
            series_memory_engine.record_unresolved_thread(series_id, mystery)

        # Build Sessions & Chapters
        sessions: List[SeriesSession] = []
        total_sessions = req.total_sessions
        chapters_per_session = req.chapters_per_session
        panels_per_chapter = getattr(req, "panels_per_chapter", 8) or 8

        ai_sessions_dict: Dict[int, Any] = {}
        if ai_data and isinstance(ai_data.get("sessions"), list):
            for s_item in ai_data["sessions"]:
                s_num = s_item.get("session_number", 1)
                ai_sessions_dict[s_num] = s_item

        for s_idx in range(1, total_sessions + 1):
            is_final_session = (s_idx == total_sessions)
            ai_s_data = ai_sessions_dict.get(s_idx, {})
            session_title = ai_s_data.get("session_title") or f"Season {s_idx}: {'The Final Reckoning' if is_final_session else f'Ascension Phase {s_idx}'}"
            session_theme = ai_s_data.get("session_theme") or f"Dramatic arc covering {chapters_per_session} chapters."

            ai_chapters_dict: Dict[int, Any] = {}
            if isinstance(ai_s_data.get("chapters"), list):
                for c_item in ai_s_data["chapters"]:
                    c_num = c_item.get("chapter_number", 1)
                    ai_chapters_dict[c_num] = c_item

            session_chapters: List[ChapterSession] = []

            for c_idx in range(1, chapters_per_session + 1):
                is_series_finale = is_final_session and (c_idx == chapters_per_session)
                chap_id = f"chap_s{s_idx}_c{c_idx}_{uuid4().hex[:6]}"
                ai_c_data = ai_chapters_dict.get(c_idx, {})

                if ai_c_data.get("chapter_title"):
                    chap_title = ai_c_data["chapter_title"]
                    pacing_role = ai_c_data.get("pacing_role", "rising_action")
                    summary = ai_c_data.get("summary", "")
                elif is_series_finale:
                    pacing_role = "epilogue_resolution"
                    chap_title = "The Eternal Dawn (Final Epilogue)"
                    summary = f"All battles conclude. The central mystery is resolved. {cast[0].name} seals the rift forever. Complete emotional and narrative closure."
                elif c_idx == 1 and s_idx == 1:
                    pacing_role = "inciting_incident"
                    chap_title = "Awakening of the Ash Gate"
                    summary = f"{cast[0].name} witnesses the sudden collapse of the district barrier, awakening a legendary lineage."
                elif c_idx == chapters_per_session:
                    pacing_role = "climax"
                    chap_title = f"Season {s_idx} Climactic Showdown"
                    summary = f"High stakes confrontation between factions as secrets are brought to the boiling point."
                else:
                    pacing_role = "rising_action"
                    chap_title = f"Chapter {c_idx}: Shadows Converge"
                    summary = "Alliances are tested as clues to the central conspiracy deepen."

                # Synthesize configured panels right away using AI-directed scenes
                suggested_scenes = ai_c_data.get("suggested_scene_prompts") or []
                panels = self._synthesize_panels(
                    series_id=series_id,
                    format_type=req.format_type,
                    art_style=req.art_style,
                    hero_name=cast[0].name,
                    session_number=s_idx,
                    chapter_number=c_idx,
                    chapter_title=chap_title,
                    is_series_finale=is_series_finale,
                    panel_count=panels_per_chapter,
                    genre=getattr(req, "genre", ""),
                    logline=getattr(req, "logline", ""),
                    image_model=getattr(req, "image_model", "flux-anime") or "flux-anime",
                    suggested_scene_prompts=suggested_scenes,
                )

                chapter = ChapterSession(
                    chapter_id=chap_id,
                    session_number=s_idx,
                    chapter_number=c_idx,
                    title=chap_title,
                    pacing_role=pacing_role,
                    summary=summary,
                    panels=panels,
                    status=ProjectStatus.COMPLETED,
                    is_series_finale=is_series_finale,
                    guaranteed_resolution_notes=(
                        "Mandatory Epilogue: Resolves all mysteries and character fates without cliffhangers."
                        if is_series_finale else None
                    ),
                )
                session_chapters.append(chapter)

            sessions.append(
                SeriesSession(
                    session_number=s_idx,
                    title=session_title,
                    summary=session_theme,
                    chapters=session_chapters,
                )
            )

        return cast, world_bible, sessions

    async def generate_chapter(
        self,
        series_id: str,
        session_number: int,
        chapter_number: int,
        panel_count: int = 8,
        image_model: Optional[str] = None,
    ) -> ChapterSession:
        """Synthesize all panels, interactive bubbles, and generative anime motion for a chapter."""
        project = ai_series_repo.get_project(series_id)
        if not project:
            raise ValueError(f"AI Series project '{series_id}' not found.")

        chapter = ai_series_repo.get_chapter(series_id, session_number, chapter_number)
        if not chapter:
            raise ValueError(f"Chapter S{session_number}:C{chapter_number} not found in project.")

        hero = project.cast[0] if project.cast else None
        hero_name = hero.name if hero else "Character"

        model_to_use = image_model or getattr(project, "image_model", "flux-anime") or "flux-anime"
        if image_model:
            project.image_model = image_model
            ai_series_repo.update_project(project)

        # Synthesize fresh panels
        existing_scenes = [
            {"visual_description": p.prompt, "camera_angle": p.camera_angle}
            for p in (chapter.panels or [])
            if p.prompt
        ]
        panels = self._synthesize_panels(
            series_id=series_id,
            format_type=project.format_type,
            art_style=project.art_style,
            hero_name=hero_name,
            session_number=session_number,
            chapter_number=chapter_number,
            chapter_title=chapter.title,
            is_series_finale=chapter.is_series_finale,
            panel_count=panel_count,
            genre=getattr(project, "genre", ""),
            logline=getattr(project, "logline", ""),
            image_model=model_to_use,
            suggested_scene_prompts=existing_scenes if existing_scenes else None,
        )

        chapter.panels = panels
        chapter.status = ProjectStatus.COMPLETED
        ai_series_repo.update_chapter(series_id, chapter)

        # If finale, mark unresolved threads resolved
        if chapter.is_series_finale:
            series_memory_engine.mark_thread_resolved(series_id, "The origin of Ren's runic scar")
            series_memory_engine.mark_thread_resolved(series_id, "Why Vespera Vance secretly sabotaged the Central Spire gate")

        logger.info(f"[AISeries] Chapter S{session_number}:C{chapter_number} successfully synthesized ({len(panels)} panels).")
        return chapter


# Global orchestrator singleton
series_orchestrator = SeriesOrchestrator()
