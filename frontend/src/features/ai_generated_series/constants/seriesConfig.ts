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
    defaultStyle: "manhwa_action_hunter",
  },
  {
    id: "comic_manga",
    label: "Comic",
    formatLabel: "Comic",
    aspectTag: "3:4 Inked Screentone",
    defaultStyle: "manga_shonen_jump",
  },
  {
    id: "anime",
    label: "Anime",
    formatLabel: "Anime",
    aspectTag: "16:9 Cinema 24fps",
    defaultStyle: "anime_ufotable_cinematic",
  },
];

export const FORMAT_STYLES_MAP: Record<"manhwa" | "comic_manga" | "anime", FormatStyle[]> = {
  manhwa: [
    {
      id: "manhwa_action_hunter",
      name: "Solo Leveling Action Hunter",
      desc: "Obsidian tones, glowing violet mana auras, razor linework",
      badge: "Vibrant Dark",
    },
    {
      id: "manhwa_overpowered_regression",
      name: "Omniscient Regression Hunter",
      desc: "Translucent cyan system screens, neon particle blooms, modern apocalypse",
      badge: "System UI • Beast",
    },
    {
      id: "manhwa_otome_isekai",
      name: "Otome Isekai Romance",
      desc: "Pastel jewel tones, sparkling floral flourishes, royal filigree",
      badge: "Pastel Luxe",
    },
    {
      id: "manhwa_murim_wuxia",
      name: "Murim Wuxia Martial Arts",
      desc: "Dynamic ink brushwork, soaring mountain precipices, chi strikes",
      badge: "Ink Dynasty",
    },
    {
      id: "manhwa_slice_of_life",
      name: "Naver Slice of Life",
      desc: "Warm pastel palette, tender facial expressions, domestic warmth",
      badge: "Warm Cozy",
    },
  ],
  comic_manga: [
    {
      id: "manga_shonen_jump",
      name: "Weekly Shonen Screentone",
      desc: "Authentic printed halftones, crisp dip-pen inking, explosive speedlines",
      badge: "50 LPI Tone • SOTA",
    },
    {
      id: "manga_berserk_seinen",
      name: "Dark Seinen Cross-Hatch",
      desc: "Visceral armor textures, deep chiaroscuro, heavy crosshatching",
      badge: "Deep Kuro-Beta",
    },
    {
      id: "manga_junji_horror",
      name: "Gothic Psychological Horror",
      desc: "Obsessive pen hatching, surreal spiraling distortions, cosmic dread",
      badge: "Surreal Ink • Beast",
    },
    {
      id: "comic_western_vintage",
      name: "Silver Age Graphic Comic",
      desc: "Vintage Ben-Day dots, offset CMYK registration, bold inks",
      badge: "CMYK Retro",
    },
    {
      id: "comic_cyberpunk_neon",
      name: "Akira Cyberpunk Graphic",
      desc: "High-density mechanical inking, radioactive neon backlighting",
      badge: "Cyber Neo-Tokyo",
    },
  ],
  anime: [
    {
      id: "anime_ufotable_cinematic",
      name: "Ufotable Digital Cinema",
      desc: "24fps sakuga motion, raytraced embers, dynamic 3D camera sweeps",
      badge: "Raytraced Sakuga • Beast",
    },
    {
      id: "anime_mappa_dark",
      name: "MAPPA Visceral Sakuga",
      desc: "Gritty cinematic grain, motion-blurred hand combat, moody desaturation",
      badge: "Visceral Action",
    },
    {
      id: "anime_trigger_kinetic",
      name: "Trigger Hyper-Kinetic",
      desc: "Exaggerated perspective distortion, primary color bursts, neon shockwaves",
      badge: "Hyper-Kinetic • Beast",
    },
    {
      id: "anime_ghibli_watercolor",
      name: "Kyoto Hand-Painted Cel",
      desc: "Soft atmospheric watercolor skies, gentle lighting bloom",
      badge: "Hand-Painted",
    },
    {
      id: "anime_90s_retro_cel",
      name: "90s Cyberpunk Retro Cel",
      desc: "High contrast neon grain, analog CRT halos, moody shadows",
      badge: "Analog Cel",
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

export const DIFFUSION_MODELS = [
  // ── FAST (Pollinations Live, Cached in ~3-8s) ─────────────────────────────
  { id: "turbo",            label: "⚡ SDXL Turbo — Ultra Fast (~3s, Best for Preview)", speed: "fast" },
  { id: "flux",             label: "⚡ Flux.1 Schnell — Fast & Sharp (~5s, High Quality)", speed: "fast" },
  { id: "flux-anime",       label: "🎨 Flux Anime — Authentic 2D Cel & Webtoon (~15s, Recommended)", speed: "medium" },
  { id: "flux-realism",     label: "📸 Flux Realism — Photorealistic Style (~15s)", speed: "medium" },
  { id: "stable-diffusion", label: "🖼️ Stable Diffusion XL — Classic Art Style (~20s)", speed: "slow" },
  { id: "sana",             label: "🌟 Sana — Latest Pollinations Model (~20s)", speed: "slow" },
];

export const ENHANCER_ENGINES = [
  { id: "real-esrgan-anime", label: "Real-ESRGAN Anime 6B (4K Lineart & Screentone Super-Resolution • Beast)" },
  { id: "comic-text-detector", label: "ComicTextDetector + IOPaint (Clean Speech Bubble Inpainting • Beast)" },
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
  { value: "action_fast", label: "Fast Action (High velocity, explosive beats • Beast)" },
  { value: "cinematic", label: "Cinematic (Atmospheric slow-burn, emotional depth)" },
];

export const DIALOGUE_OPTIONS = [
  { value: "balanced", label: "Balanced Dialogue (Conversations & monologues)" },
  { value: "action_punchy", label: "Punchy Action (Minimalist, tactical battle lines)" },
  { value: "lore_rich", label: "Rich Lore (Deep worldbuilding, descriptive prose)" },
];

export const VOICE_DUBBING_OPTIONS = [
  { value: "gpt-sovits", label: "GPT-SoVITS (Zero-Shot Anime Character Voice Cloning • Beast)" },
  { value: "cosyvoice", label: "CosyVoice / F5-TTS (High-Fidelity Expressive Dialogue • Beast)" },
  { value: "edge-tts", label: "Edge-TTS Multi-Voice Dubbing (Included & Auto-Linked)" },
  { value: "muted", label: "Muted / Visual Art & Text Bubbles Only" },
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
  totalSessions: 1,
  chaptersPerSession: 8,
  panelsPerChapter: 8,
  pacing: "dynamic" as const,
  dialogueDensity: "balanced" as const,
  voiceDubbing: "edge-tts" as const,
};
