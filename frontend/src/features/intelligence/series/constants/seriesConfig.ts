/**
 * Configuration and Preset Registry for AI Generated Series Studio.
 * Centralizes all formats, art styles, diffusion models, and story archetypes.
 */

export interface PresetIdea {
  title: string;
  format: "manhwa" | "comic_manga" | "anime";
  genre: string;
  style: string;
  concept: string;
  imageModel?: string;
  pacing?: string;
  dialogueDensity?: string;
}

export interface FormatStyle {
  id: string;
  name: string;
  desc: string;
  badge: string;
}

export interface FormatDefinition {
  id: "manhwa" | "comic_manga" | "anime";
  label: string;
  formatLabel: string;
  aspectTag: string;
  defaultStyle: string;
}

export const FORMAT_DEFINITIONS: FormatDefinition[] = [
  {
    id: "manhwa",
    label: "Manhwa",
    formatLabel: "Manhwa",
    aspectTag: "2:3 Webtoon Scroll",
    defaultStyle: "action_system_leveling",
  },
  {
    id: "comic_manga",
    label: "Comic",
    formatLabel: "Comic",
    aspectTag: "3:4 Inked Screentone",
    defaultStyle: "classic_shonen_action",
  },
  {
    id: "anime",
    label: "Anime",
    formatLabel: "Anime",
    aspectTag: "16:9 Cinema 24fps",
    defaultStyle: "modern_cel_shaded",
  },
];

export const FORMAT_STYLES_MAP: Record<"manhwa" | "comic_manga" | "anime", FormatStyle[]> = {
  manhwa: [
    {
      id: "action_system_leveling",
      name: "Manhwa Hunter (Action / System Leveling)",
      desc: "Solo Leveling style, sharp angular designs, digital neon magic glows, airbrushed dynamic lighting",
      badge: "High-Energy Glow • SOTA",
    },
    {
      id: "otome_isekai_rofan",
      name: "Romance Webtoon (Otome Isekai / Rofan)",
      desc: "Delicate pastel & jeweled palette, ornate lace, jewel jewelry, soft lighting, glitter/bokeh",
      badge: "Elegant & Soft",
    },
    {
      id: "painterly_webtoon",
      name: "Painterly Webtoon / Soft Render",
      desc: "Blended brushwork, atmospheric watercolor/oil blending, realistic nuanced facial shading",
      badge: "Painterly Fine Art",
    },
    {
      id: "realistic_modern_drama",
      name: "Realistic Modern Drama (Lookism / True Beauty)",
      desc: "Trendy K-fashion outfits, semi-realistic facial proportions, soft digital makeup gradients, urban streets",
      badge: "K-Fashion Drama",
    },
    {
      id: "rough_ink_murim",
      name: "Rough Ink / Murim Martial Arts",
      desc: "Traditional Korean calligraphic brushstrokes, ink splatters, fluid martial poses, high-impact blur",
      badge: "Calligraphic Murim",
    },
  ],
  comic_manga: [
    {
      id: "classic_shonen_action",
      name: "Action Shōnen (Dragon Ball, One Piece, JJK)",
      desc: "Bold dynamic G-pen line work, angular jaws, exaggerated kinetic speed lines, kuro-beta blacks",
      badge: "Black & White Ink • SOTA",
    },
    {
      id: "dark_gritty_seinen",
      name: "Dark Seinen (Berserk, Vinland Saga, Vagabond)",
      desc: "Hyper-detailed crosshatching, realistic anatomy, heavy ink washes, textured screentones, deep shadows",
      badge: "Gritty Realism",
    },
    {
      id: "shojo_josei_romance",
      name: "Shōjo & Josei Romance (Nana, Fruits Basket)",
      desc: "Soft line weights, elongated slender figures, decorative motifs, detailed expressive eyes",
      badge: "Delicate Screentone",
    },
    {
      id: "moe_chibi_slice_of_life",
      name: "Moe & Chibi / Slice-of-Life (K-On!)",
      desc: "2-3 head-to-body ratios, rounded soft silhouettes, simplified facial features, minimal shadowing",
      badge: "Soft Minimalist",
    },
    {
      id: "gekiga_retro",
      name: "Gekiga & Retro 80s/90s (Akira, Fist of North Star)",
      desc: "Hard-boiled realistic ink, mechanical details, muscular builds, heavy hatch shading",
      badge: "Hard-Boiled Ink",
    },
    {
      id: "modern_superhero",
      name: "Modern American Comic (Marvel / DC)",
      desc: "Sculpted muscular anatomy, crosshatch feathering, detailed digital multi-light rim rendering, chiaroscuro",
      badge: "Sculpted Anatomy",
    },
    {
      id: "golden_silver_classic",
      name: "Silver Age Classic (Jack Kirby)",
      desc: "Bold uniform ink lines, primary flat colors, visible vintage Ben-Day dot halftone patterns",
      badge: "Retro Ben-Day Dots",
    },
    {
      id: "noir_heavy_shadow",
      name: "Noir / Heavy Shadow (Sin City, Hellboy)",
      desc: "Extreme contrast, massive blocks of pure black silhouette, sparse stark highlight lines",
      badge: "Extreme Contrast",
    },
  ],
  anime: [
    {
      id: "modern_cel_shaded",
      name: "Modern Anime (Demon Slayer, Chainsaw Man)",
      desc: "Clean vector-like linework, 2-to-3 tone crisp cel-shading, vibrant ambient lighting, particle glows",
      badge: "Digital Full Color • SOTA",
    },
    {
      id: "kyoto_animation_soft",
      name: "Kyoto Animation / Soft Aesthetic (Violet Evergarden)",
      desc: "Soft gradients, subsurface scattering on skin, delicate hair highlights, luminous lens-flare atmosphere",
      badge: "Luminous Soft",
    },
    {
      id: "retro_90s_cel",
      name: "Retro 90s Cel Anime (Cowboy Bebop, Evangelion)",
      desc: "Film grain, chromatic aberration, hand-painted gouache backgrounds, muted vintage palette",
      badge: "Nostalgic Analog",
    },
    {
      id: "makoto_shinkai_cinematic",
      name: "Makoto Shinkai Cinematic (Your Name)",
      desc: "Photorealistic sky and environment lighting, HDR bloom, hyper-reflective water and eye reflections",
      badge: "HDR Cinematic",
    },
    {
      id: "stylized_pop_action",
      name: "Stylized Pop Action (Studio Trigger)",
      desc: "Exaggerated perspective, flat bright color blocking, thick expressive brushstrokes, dynamic sakuga",
      badge: "Hyper-Kinetic Pop",
    },
  ],
};

export const GENRE_OPTIONS: string[] = [
  "Action Fantasy",
  "Otome Isekai / Romance",
  "Murim Wuxia Martial Arts",
  "Weekly Shonen Battle",
  "Dark Seinen / Grimdark",
  "Cyberpunk / Sci-Fi",
  "Supernatural Mystery",
  "Slice of Life / Comedy",
  "Mecha Space Opera",
  "Ghibli Fantasy",
  "Retro Supernatural Cel",
  "Psychological Thriller",
  "Cosmic Horror / Eldritch",
  "Custom...",
];

export const STORYBOARD_MODELS = [
  { id: "gemini-2.5-flash", label: "⚡ Google Gemini 2.5 Flash — Ultra-Fast Sub-Second Narrative (Recommended)", provider: "Google Gemini" },
  { id: "gemini-1.5-pro", label: "🧠 Google Gemini 1.5 Pro — 2M Context Deep Lore & Arc Architecture", provider: "Google Gemini" },
  { id: "claude-3-5-sonnet-20241022", label: "🎭 Anthropic Claude 3.5 Sonnet — Nuanced Screenwriting & Persona Voice", provider: "Anthropic" },
  { id: "gpt-4o", label: "✨ OpenAI GPT-4o — Episodic Screenplay & Cinematic Continuity", provider: "OpenAI" },
  { id: "deepseek-chat", label: "🔥 DeepSeek-V3 — High-Throughput Creative Narration", provider: "DeepSeek" },
  { id: "deepseek-reasoner", label: "💡 DeepSeek-R1 — Deep Strategic Narrative & Mystery Planning", provider: "DeepSeek" },
  { id: "llama-3.3-70b-versatile", label: "⚡ Groq Llama 3.3 70B — Real-Time Inference (~180ms)", provider: "Groq" },
];

export const DIFFUSION_MODELS = [
  { id: "flux-anime", label: "🎨 Flux Anime — Authentic 2D Cel & Webtoon Manhwa (~12s, Recommended)", speed: "medium", provider: "Pollinations" },
  { id: "flux", label: "⚡ Flux.1 Schnell — Fast & Razor Sharp 2D (~5s)", speed: "fast", provider: "Pollinations" },
  { id: "turbo", label: "⚡ SDXL Turbo — Ultra-High Speed Draft (~3s)", speed: "fast", provider: "Pollinations" },
  { id: "stable-diffusion", label: "🖼️ Stable Diffusion XL — Classic Manga Art Style (~15s)", speed: "medium", provider: "Pollinations" },
  { id: "sana", label: "🌟 Sana Pollinations — 4K Efficient Generative Core (~15s)", speed: "medium", provider: "Pollinations" },
];

export const ENHANCER_ENGINES = [
  { id: "real-esrgan-anime", label: "Real-ESRGAN Anime 6B (4K Lineart & Screentone Super-Resolution)" },
  { id: "comic-text-detector", label: "ComicTextDetector + IOPaint (Clean Speech Bubble Inpainting)" },
  { id: "manga-ocr", label: "Manga-OCR (Stylized Typography & SFX Reader)" },
];

export const TOTAL_SESSIONS_OPTIONS = [
  { value: 1, label: "1 Season" },
  { value: 2, label: "2 Seasons" },
  { value: 3, label: "3 Seasons" },
  { value: 4, label: "4 Seasons" },
  { value: 5, label: "5 Seasons" },
];

export const EPISODES_PER_SESSION_OPTIONS = [
  { value: 4, label: "4 Episodes" },
  { value: 6, label: "6 Episodes" },
  { value: 8, label: "8 Episodes" },
  { value: 12, label: "12 Episodes" },
  { value: 16, label: "16 Episodes" },
  { value: 24, label: "24 Episodes" },
];

export const SEASON_ARC_OPTIONS = EPISODES_PER_SESSION_OPTIONS;

export const PANELS_PER_CHAPTER_OPTIONS = [
  { value: 4, label: "4 Panels" },
  { value: 6, label: "6 Panels" },
  { value: 8, label: "8 Panels" },
  { value: 10, label: "10 Panels" },
  { value: 12, label: "12 Panels" },
  { value: 16, label: "16 Panels" },
];

export const PACING_OPTIONS = [
  { value: "dynamic", label: "Dynamic Pacing (Balanced rising tension & climaxes)" },
  { value: "action_fast", label: "Fast Action (High velocity, explosive beats)" },
  { value: "cinematic", label: "Cinematic (Atmospheric slow-burn, emotional depth)" },
];

export const DIALOGUE_OPTIONS = [
  { value: "balanced", label: "Balanced Dialogue (Conversations & monologues)" },
  { value: "action_punchy", label: "Punchy Action (Minimalist, tactical battle lines)" },
  { value: "lore_rich", label: "Rich Lore (Deep worldbuilding, descriptive prose)" },
];

export const VOICE_DUBBING_OPTIONS = [
  { value: "edge-tts", label: "Microsoft Edge Neural TTS — 300+ Voices (Built-in Zero Barrier)" },
  { value: "gpt-sovits", label: "GPT-SoVITS — Zero-Shot Anime Character Voice Cloning" },
  { value: "cosyvoice", label: "CosyVoice / F5-TTS — High-Fidelity Expressive Dialogue" },
  { value: "elevenlabs", label: "ElevenLabs Multilingual v2 — Studio Grade Emotional Dubbing" },
  { value: "muted", label: "Muted — Visual Art & Text Bubbles Only" },
];

export const PRESET_IDEAS: PresetIdea[] = [
  // --- MANHWA PRESETS ---
  {
    title: "The Solo Monarch",
    format: "manhwa",
    genre: "Action Fantasy",
    style: "manhwa_action_hunter",
    concept:
      "In a Seoul plagued by abyssal dungeon gates, an unranked scavenger awakens an immutable necromancy system, commanding fallen monster legions from the shadows.",
    imageModel: "flux-anime",
    pacing: "dynamic",
    dialogueDensity: "balanced",
  },
  {
    title: "Empress of the Silver Spire",
    format: "manhwa",
    genre: "Otome Isekai / Romance",
    style: "manhwa_otome_isekai",
    concept:
      "Betrayed by the imperial court on her wedding eve, a poisoner grand duchess regresses ten years into the past with her memory intact to seize the throne.",
    imageModel: "flux-anime",
    pacing: "dynamic",
    dialogueDensity: "lore_rich",
  },
  {
    title: "Demon Blade Reborn",
    format: "manhwa",
    genre: "Murim Wuxia Martial Arts",
    style: "manhwa_murim_wuxia",
    concept:
      "Slain by his envious sect elders atop Mount Hua, the Heavenly Demon reincarnates as the sickly third son of a bankrupt merchant clan.",
    imageModel: "flux",
    pacing: "action_fast",
    dialogueDensity: "action_punchy",
  },
  {
    title: "Coffee, Rain & Convenience Store",
    format: "manhwa",
    genre: "Slice of Life / Comedy",
    style: "manhwa_slice_of_life",
    concept:
      "A quiet midnight clerk discovers his regular customer—a mysterious trenchcoat-wearing woman—is actually the city's highest-ranking vigilante taking her coffee break.",
    imageModel: "flux-anime",
    pacing: "dynamic",
    dialogueDensity: "balanced",
  },

  // --- MANGA PRESETS ---
  {
    title: "Overdrive Striker",
    format: "comic_manga",
    genre: "Weekly Shonen Battle",
    style: "manga_shonen_jump",
    concept:
      "In an underground cyber-futsal league where players use banned pneumatic cleats, an orphan prodigy aims for the Grand World Championship.",
    imageModel: "flux-anime",
    pacing: "action_fast",
    dialogueDensity: "action_punchy",
  },
  {
    title: "Obsidian Berserker",
    format: "comic_manga",
    genre: "Dark Seinen / Grimdark",
    style: "manga_berserk_seinen",
    concept:
      "Bound to a cursed colossal slab of iron that consumes the user's lifespan, a scarred wandering mercenary hunts the demon lords who sacrificed his mercenary band.",
    imageModel: "flux",
    pacing: "dynamic",
    dialogueDensity: "balanced",
  },
  {
    title: "Neon Knight Vigilante",
    format: "comic_manga",
    genre: "Silver Age Graphic Comic",
    style: "comic_western_vintage",
    concept:
      "A rogue detective in 1970s New York City investigates radioactive mob bosses with an experimental magnetic gauntlet and relentless grit.",
    imageModel: "stable-diffusion",
    pacing: "action_fast",
    dialogueDensity: "action_punchy",
  },

  // --- ANIME PRESETS ---
  {
    title: "Cyberpunk Ronin 2099",
    format: "anime",
    genre: "Cyberpunk / Sci-Fi",
    style: "anime_ufotable_cinematic",
    concept:
      "When the stratosphere energy grid shatters over Neo-Tokyo, a high-velocity courier with a cybernetic eye races against corporate hit-squads across neon rooftops.",
    imageModel: "flux-anime",
    pacing: "action_fast",
    dialogueDensity: "action_punchy",
  },
  {
    title: "Spirited Valley of Starlight",
    format: "anime",
    genre: "Ghibli Fantasy",
    style: "anime_ghibli_watercolor",
    concept:
      "A clockwork apprentice stumbles upon a forgotten sanctuary where celestial spirits seek refuge from the industrial steam engines of the Northern Empire.",
    imageModel: "flux-anime",
    pacing: "cinematic",
    dialogueDensity: "lore_rich",
  },
  {
    title: "Valkyrie Mech Protocol",
    format: "anime",
    genre: "Mecha Space Opera",
    style: "anime_ufotable_cinematic",
    concept:
      "Deep in Jupiter's radiation storm, the pilot of a forbidden sentient biomechanical frame defends humanity's last terraforming ark from an alien hive armada.",
    imageModel: "flux",
    pacing: "dynamic",
    dialogueDensity: "balanced",
  },
  {
    title: "Retro 90s: Ghost Frequency",
    format: "anime",
    genre: "Retro Supernatural Cel",
    style: "anime_90s_retro_cel",
    concept:
      "A late-night pirate radio host in 1995 Shinjuku intercepts spectral distress frequencies from an alternate timeline where the millennium bug caused global collapse.",
    imageModel: "turbo",
    pacing: "dynamic",
    dialogueDensity: "lore_rich",
  },

  // --- BEAST SOTA ARCHETYPES ---
  {
    title: "Omniscient Apocalypse Hunter",
    format: "manhwa",
    genre: "Action Fantasy",
    style: "manhwa_overpowered_regression",
    concept:
      "Armed with the only completed survival guide to the end of the world, a reawakened hunter binds celestial constellations and fractures abyssal dimensional rifts.",
    imageModel: "story-diffusion",
    pacing: "action_fast",
    dialogueDensity: "action_punchy",
  },
  {
    title: "Spiral of the Eldritch King",
    format: "comic_manga",
    genre: "Cosmic Horror / Eldritch",
    style: "manga_junji_horror",
    concept:
      "In a remote coastal prefecture where the tide turns to black mercury, an archivist uncovers an cursed illustrated grimoire that redraws reality as it is read.",
    imageModel: "animagine-xl",
    pacing: "dynamic",
    dialogueDensity: "lore_rich",
  },
  {
    title: "Sakuga Zero: Chrono Blade",
    format: "anime",
    genre: "Action Fantasy",
    style: "anime_ufotable_cinematic",
    concept:
      "Mastering the forbidden technique that slices through milliseconds of time, a blind swordmaster executes impossible sakuga sword dances to sever the god of entropy.",
    imageModel: "wan-video",
    pacing: "action_fast",
    dialogueDensity: "action_punchy",
  },
];

export const DEFAULT_SERIES_STATE = {
  formatType: "manhwa" as const,
  title: "",
  genre: "Action Fantasy",
  logline: "",
  artStyle: "manhwa_action_hunter",
  imageModel: "flux-anime",
  storyboardModel: "gemini-2.5-flash",
  voiceDubbing: "edge-tts" as const,
  totalSessions: 1,
  chaptersPerSession: 8,
  panelsPerChapter: 8,
  pacing: "dynamic" as const,
  dialogueDensity: "balanced" as const,
};
