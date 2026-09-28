import React, { useState } from "react";
import {
  Sparkles,
  Zap,
  Tv,
  Layers,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  X,
  Flame,
  Palette,
  AlertCircle,
  Swords,
  Scroll,
  Crown,
  Cpu,
  Clock,
  Wand2,
  Check,
  MessageSquare,
  Heart,
  Dices,
  Grid,
  Users,
} from "lucide-react";
import { aiSeriesApi, CreateAISeriesPayload } from "@/api/endpoints/aiSeries";
import { useSeriesNavigation } from "../hooks/useSeriesNavigation";

interface ArtStylePreset {
  id: string;
  name: string;
  desc: string;
  badge: string;
  previewUrl: string;
}

const ART_STYLES_MAP: Record<"manhwa" | "comic_manga" | "anime", ArtStylePreset[]> = {
  manhwa: [
    {
      id: "manhwa_slice_of_life",
      name: "Naver Webtoon Slice of Life",
      desc: "Clean 2D comic drawing, bright pastel palette, warm expressive characters, authentic webtoon style.",
      badge: "Authentic Webtoon",
      previewUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1000&auto=format&fit=crop&q=80",
    },
    {
      id: "manhwa_action_hunter",
      name: "Solo Leveling Action Hunter",
      desc: "Deep obsidian palette, radiant cyan & purple aura particles, razor-sharp lineart.",
      badge: "Top Hunter",
      previewUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1000&auto=format&fit=crop&q=80",
    },
    {
      id: "manhwa_otome_isekai",
      name: "Otome Isekai Romance",
      desc: "Pastel jewel tones, sparkling floral flourishes, ornate royalty lace & filigree.",
      badge: "Royal Elegance",
      previewUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1000&auto=format&fit=crop&q=80",
    },
    {
      id: "manhwa_murim_wuxia",
      name: "Murim Wuxia Martial Arts",
      desc: "Dynamic ink-splatter brushwork, soaring mountain precipices, trailing chi strikes.",
      badge: "Classic Wuxia",
      previewUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000&auto=format&fit=crop&q=80",
    },
  ],
  comic_manga: [
    {
      id: "manga_shonen_jump",
      name: "Weekly Shonen Screentone",
      desc: "Authentic printed manga halftones, crisp dip-pen lineart, dynamic directional speedlines.",
      badge: "Authentic Manga",
      previewUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1000&auto=format&fit=crop&q=80",
    },
    {
      id: "manga_berserk_seinen",
      name: "Dark Seinen Cross-Hatch",
      desc: "Heavy ink cross-hatching, visceral armor textures, stark high-contrast chiaroscuro.",
      badge: "Dark Fantasy",
      previewUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?w=1000&auto=format&fit=crop&q=80",
    },
    {
      id: "comic_western_vintage",
      name: "Silver Age Western Comic",
      desc: "Vintage Ben-Day dots, offset CMYK color registration, bold heroic inks.",
      badge: "Classic Comic",
      previewUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1000&auto=format&fit=crop&q=80",
    },
  ],
  anime: [
    {
      id: "anime_ufotable_cinematic",
      name: "Ufotable Digital Cinema",
      desc: "24fps sakuga motion, volumetric embers, orbital 3D camera sweeps and blade trails.",
      badge: "Cinematic Sakuga",
      previewUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80",
    },
    {
      id: "anime_ghibli_watercolor",
      name: "Studio Ghibli Pastoral Cel",
      desc: "Lush hand-painted watercolor skies, nostalgic analog lighting, organic soft breezes.",
      badge: "Hand-Crafted",
      previewUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop&q=80",
    },
    {
      id: "anime_90s_retro_cel",
      name: "1990s Vintage Cel Art",
      desc: "CRT phosphor warmth, classic analog film grain, vibrant retro city-pop tones.",
      badge: "Retro Anime",
      previewUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1000&auto=format&fit=crop&q=80",
    },
  ],
};

const GENRE_PRESETS = [
  {
    genre: "Slice of Life",
    icon: Heart,
    title: "Our Little Miracle",
    logline:
      "A young couple embarks on the heartwarming journey of parenthood, navigating joyful sleepless nights and tender family moments.",
    format: "manhwa" as const,
    style: "manhwa_slice_of_life",
  },
  {
    genre: "Action Fantasy",
    icon: Swords,
    title: "Chronicles of the Ash Monarch",
    logline:
      "When celestial rifts tear through modern Tokyo, a disgraced swordsman awakens an ancient sovereign bloodline to seal the cosmic gates.",
    format: "manhwa" as const,
    style: "manhwa_action_hunter",
  },
  {
    genre: "Dark Fantasy",
    icon: Flame,
    title: "Iron & Blood Eclipse",
    logline:
      "In an endless winter empire besieged by ancient leviathans, a lone cursed knight wields a soul-devouring blade to reclaim his lost kingdom.",
    format: "comic_manga" as const,
    style: "manga_berserk_seinen",
  },
  {
    genre: "Anime Sakuga",
    icon: Zap,
    title: "Neon Phantom: Protocol Zero",
    logline:
      "A rogue cybernetic acrobat and an elite operative team up across rain-slicked skyscraper spires to prevent an autonomous AI cataclysm.",
    format: "anime" as const,
    style: "anime_ufotable_cinematic",
  },
  {
    genre: "Otome Romance",
    icon: Crown,
    title: "The Alchemist Empress",
    logline:
      "Reincarnated into the villainess of a royal tragedy, a genius alchemist rewrites the empire's destiny with forbidden floral potions.",
    format: "manhwa" as const,
    style: "manhwa_otome_isekai",
  },
  {
    genre: "Murim Wuxia",
    icon: Scroll,
    title: "Nine Heavenly Dragons",
    logline:
      "Betrayed and cast into the Abyss of Swords, a crippled martial prodigy reconstructs his meridian network with ancient demonic chi.",
    format: "manhwa" as const,
    style: "manhwa_murim_wuxia",
  },
];

const GENRE_TAGS = [
  "Action Hunter",
  "Slice of Life",
  "Dark Fantasy",
  "Murim Wuxia",
  "Otome Romance",
  "Cyberpunk",
  "Supernatural Mystery",
  "Sci-Fi Mecha",
];

const FORMAT_OPTIONS = [
  {
    id: "manhwa" as const,
    title: "Manhwa Webtoon",
    subtitle: "Korean Continuous Strip",
    desc: "Infinite vertical reading, soft pastel cel-shading, vibrant character staging & aura VFX.",
    badge: "Infinite Strip",
    accent: "from-blue-600/20 to-cyan-500/10 border-blue-500/40 text-blue-400",
    glow: "shadow-blue-500/10",
    icon: Layers,
    skillId: "series_arc_manhwa",
    skillName: "Korean Webtoon Manhwa Arc Director",
    skillPromptFile: "series_arc_manhwa.md",
    skillTag: "Vertical Infinite Scroll & Gutter Cadence",
    highlights: [
      "Vertical Eye-Trace & Mobile Pacing",
      "Emotional Gutter Voids (8px - 300px)",
      "In-Artwork Speech Balloons & SFX Lettering",
      "Soft Pastel Cel-Shading",
      "Guaranteed 0-Cliffhanger Epilogue",
    ],
  },
  {
    id: "comic_manga" as const,
    title: "Comic & Manga",
    subtitle: "Paginated Grid Spreads",
    desc: "Multi-panel Japanese manga layouts, authentic screentone halftones, crisp dip-pen cross-hatching.",
    badge: "Page Spreads",
    accent: "from-emerald-600/20 to-teal-500/10 border-emerald-500/40 text-emerald-400",
    glow: "shadow-emerald-500/10",
    icon: BookOpen,
    skillId: "series_arc_comic",
    skillName: "Japanese Manga & Graphic Comic Arc Director",
    skillPromptFile: "series_arc_comic.md",
    skillTag: "Paginated Spreads & Koma-wari Grids",
    highlights: [
      "Z-Path Reading Hierarchy (R-to-L / L-to-R)",
      "Asymmetric Koma-wari Panel Grids",
      "Boundary-Breaking Action (Tachi-kiri)",
      "G-Pen Linework & Screentone Halftone Dots",
      "Guaranteed 0-Cliffhanger Epilogue",
    ],
  },
  {
    id: "anime" as const,
    title: "Anime Sakuga Cinema",
    subtitle: "24fps Cinematic Cinema",
    desc: "16:9 widescreen cinema cuts, dynamic camera tracking, particle physics & voice staging.",
    badge: "Cinema 16:9",
    accent: "from-rose-600/20 to-purple-500/10 border-rose-500/40 text-rose-400",
    glow: "shadow-rose-500/10",
    icon: Tv,
    skillId: "series_arc_anime",
    skillName: "Cinematic Sakuga Anime Arc Director",
    skillPromptFile: "series_arc_anime.md",
    skillTag: "24fps Kinetic Sakuga & 16:9 Cinema",
    highlights: [
      "Physical Martial Staging (24fps Sakuga)",
      "Orbital 3D & Low-Angle Hero Camera Sweeps",
      "Translucent Subtitle Letterbox Staging",
      "Generative Video Motion Prompts",
      "Guaranteed 0-Cliffhanger Epilogue",
    ],
  },
];

const IMAGE_MODEL_CARDS = [
  {
    id: "gemini-imagen",
    name: "Google Gemini Imagen 3",
    tagline: "Premier Generative Quality",
    desc: "Google's flagship generative model. Superior composition, anatomical accuracy, and vibrant flat pastel rendering.",
    badge: "Recommended",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    icon: Sparkles,
  },
  {
    id: "stable-diffusion",
    name: "Stable Diffusion (SDXL)",
    tagline: "Authentic 2D Anime & Comic Lineart",
    desc: "High-contrast ink lines, classic Japanese screentones, and rich flat cel-shading with zero 3D plastic bias.",
    badge: "Authentic 2D",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    icon: Sparkles,
  },
  {
    id: "flux",
    name: "Flux.1 Cinematic",
    tagline: "Ultra-High Fidelity",
    desc: "Volumetric atmospheric lighting, intricate background architecture, and complex group compositions.",
    badge: "Atmospheric",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    icon: Cpu,
  },
  {
    id: "flux-anime",
    name: "Flux Anime Manga",
    tagline: "Specialized Manga Tuning",
    desc: "Tailored specifically for expressive Japanese manga characters, sharp hair highlights, and manga speedlines.",
    badge: "Stylized",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    icon: Tv,
  },
  {
    id: "turbo",
    name: "SDXL Turbo",
    tagline: "Rapid Sub-Second Iteration",
    desc: "Instant real-time rendering for rapid visual storyboarding and quick pilot creation.",
    badge: "Ultra-Fast",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    icon: Zap,
  },
];

const SEASONS_LIST = [
  { value: 1, label: "1 Season", badge: "Miniseries" },
  { value: 2, label: "2 Seasons", badge: "Recommended" },
  { value: 3, label: "3 Seasons", badge: "Trilogy" },
  { value: 4, label: "4 Seasons", badge: "Epic" },
  { value: 5, label: "5 Seasons", badge: "Grand Saga" },
];

const CHAPTERS_LIST = [
  { value: 1, label: "1 Ep", badge: "Pilot" },
  { value: 3, label: "3 Eps", badge: "Mini Arc" },
  { value: 5, label: "5 Eps", badge: "Standard" },
  { value: 8, label: "8 Eps", badge: "Extended" },
  { value: 10, label: "10 Eps", badge: "Full Cour" },
  { value: 12, label: "12 Eps", badge: "Sakuga Climax" },
  { value: 16, label: "16 Eps", badge: "Webtoon Run" },
  { value: 20, label: "20 Eps", badge: "Major Epic" },
];

const PANELS_PER_CHAPTER_LIST = [
  { value: 4, label: "4 Panels", badge: "Short Strip", desc: "Fast-paced punchy scenes" },
  { value: 6, label: "6 Panels", badge: "Standard", desc: "Balanced narrative & character focus" },
  { value: 8, label: "8 Panels", badge: "Recommended", desc: "Authentic Korean webtoon / manga spread" },
  { value: 10, label: "10 Panels", badge: "Extended", desc: "Rich choreography & multi-scene progression" },
  { value: 12, label: "12 Panels", badge: "Maximum Cour", desc: "Longform cinematic sequence & cliffhangers" },
  { value: 16, label: "16 Panels", badge: "Grand Chapter", desc: "Major battle climax or grand volume special" },
];

const PACING_CARDS = [
  {
    id: "fast",
    label: "High-Velocity",
    desc: "Rapid escalation, combat cliffhangers, high-speed momentum",
    icon: Zap,
  },
  {
    id: "dynamic",
    label: "Dynamic Shonen",
    desc: "Balanced training arcs, emotional stakes, climactic boss encounters",
    icon: Swords,
  },
  {
    id: "deep_lore",
    label: "Epic Slow-Burn",
    desc: "Intricate world-building, political intrigue, massive lore reveals",
    icon: Scroll,
  },
];

const DIALOGUE_CARDS = [
  {
    id: "minimal",
    label: "Visuals First",
    desc: "Sparse dialogue, pure visual sakuga & fight choreography",
    icon: Tv,
  },
  {
    id: "balanced",
    label: "Balanced Cinematic",
    desc: "Natural dialogue pacing, rich character banter & narration",
    icon: MessageSquare,
  },
  {
    id: "rich",
    label: "Lore & Monologues",
    desc: "Tactical analysis, inner monologues, deep philosophical lore",
    icon: BookOpen,
  },
];

export const AISeriesGeneratorPage: React.FC = () => {
  const { navigate } = useSeriesNavigation();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("Chronicles of the Ash Monarch");
  const [logline, setLogline] = useState(
    "When celestial rifts tear through modern Tokyo, a disgraced swordsman awakens an ancient sovereign bloodline to seal the cosmic gates."
  );
  const [genre, setGenre] = useState("Action Fantasy");
  const [formatType, setFormatType] = useState<"manhwa" | "comic_manga" | "anime">("manhwa");
  const [artStyle, setArtStyle] = useState("manhwa_action_hunter");
  const [imageModel, setImageModel] = useState("gemini-imagen");
  const [totalSessions, setTotalSessions] = useState<number>(2);
  const [chaptersPerSession, setChaptersPerSession] = useState<number>(5);
  const [panelsPerChapter, setPanelsPerChapter] = useState<number>(8);
  const [pacing, setPacing] = useState("dynamic");
  const [dialogueDensity, setDialogueDensity] = useState("balanced");
  const [turboMode, setTurboMode] = useState(true);

  const totalEpisodes = totalSessions * chaptersPerSession;
  const estimatedPanels = totalEpisodes * panelsPerChapter;

  const handleFormatChange = (newFormat: "manhwa" | "comic_manga" | "anime") => {
    setFormatType(newFormat);
    const availableStyles = ART_STYLES_MAP[newFormat];
    setArtStyle(availableStyles[0].id);
  };

  const applyGenrePreset = (preset: (typeof GENRE_PRESETS)[0]) => {
    setTitle(preset.title);
    setLogline(preset.logline);
    setGenre(preset.genre);
    setFormatType(preset.format);
    setArtStyle(preset.style);
    setErrorMessage(null);
  };

  const rollRandomPreset = () => {
    const remaining = GENRE_PRESETS.filter((p) => p.title !== title);
    const chosen = remaining[Math.floor(Math.random() * remaining.length)] || GENRE_PRESETS[0];
    applyGenrePreset(chosen);
  };

  // Dedicated AI Skill Inspection State
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectData, setInspectData] = useState<any>(null);
  const [showInspectModal, setShowInspectModal] = useState(false);

  const handleInspectSkill = async () => {
    try {
      setInspectLoading(true);
      setShowInspectModal(true);
      setInspectData(null);
      const res = await aiSeriesApi.directSeriesArc({
        title: title.trim() || "Chronicles of the Ash Monarch",
        logline: logline.trim() || "A legendary epic.",
        genre,
        format_type: formatType,
        art_style: artStyle,
        total_sessions: totalSessions,
        chapters_per_session: chaptersPerSession,
        panels_per_chapter: panelsPerChapter,
        pacing,
        dialogue_density: dialogueDensity,
      });
      setInspectData(res?.result || res);
    } catch (err: any) {
      console.error("Failed to run format skill preview:", err);
      setInspectData({ error: err.message || "Failed to execute AI Skill" });
    } finally {
      setInspectLoading(false);
    }
  };

  const handleLaunch = async () => {
    if (!title.trim()) {
      setErrorMessage("Please enter a title for your AI Generated Series.");
      return;
    }
    if (!logline.trim()) {
      setErrorMessage("Please enter a story concept or logline.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);

      const payload: CreateAISeriesPayload = {
        title: title.trim(),
        logline: logline.trim(),
        synopsis: logline.trim(),
        genre,
        format_type: formatType,
        art_style: artStyle,
        image_model: imageModel,
        total_sessions: totalSessions,
        chapters_per_session: chaptersPerSession,
        panels_per_chapter: panelsPerChapter,
        pacing,
        dialogue_density: dialogueDensity,
        generation_priority: turboMode ? "turbo_first_chapter" : "background_full_series",
      };

      const project = await aiSeriesApi.createSeries(payload);
      const seriesId = project.series_id || project.id;

      if (formatType === "anime") {
        navigate(`/studio/anime/${seriesId}`);
      } else if (formatType === "comic_manga") {
        navigate(`/studio/comic/${seriesId}`);
      } else {
        navigate(`/studio/manhwa/${seriesId}`);
      }
    } catch (err: any) {
      console.error("Error creating AI Series:", err);
      setErrorMessage(err.message || "Failed to create AI Generated Series. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const currentStyles = ART_STYLES_MAP[formatType] || ART_STYLES_MAP.manhwa;
  const currentFormatMeta = FORMAT_OPTIONS.find((f) => f.id === formatType)!;

  return (
    <div className="flex-1 w-full min-h-0 h-full overflow-y-auto overflow-x-hidden bg-[#07080B] text-neutral-100 studio-visible-scrollbar">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute top-0 left-1/4 w-[600px] h-[350px] bg-blue-600/15 blur-[120px] rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[300px] bg-purple-600/15 blur-[140px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* ── Top Hero Navigation & Banner ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[11px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                Sonikoma Franchise Architect
              </span>
              <span className="text-[10px] font-mono text-neutral-500">v4.0 Ultra</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white font-mono">
              Initialize New AI Series
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl font-sans leading-relaxed">
              Synthesize full multi-chapter episodic storylines, character continuity DNA, and high-fidelity artwork across Korean Webtoons, Manga, and Sakuga Anime.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
            <button
              type="button"
              onClick={rollRandomPreset}
              className="px-3.5 py-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/60 hover:border-neutral-500 text-neutral-300 hover:text-white text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              title="Roll a random story concept"
            >
              <Dices className="w-4 h-4 text-amber-400" />
              <span>Surprise Me</span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/ai-series")}
              className="px-3.5 py-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/60 hover:text-white text-neutral-400 text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <X className="w-4 h-4" />
              <span>Studio Hub</span>
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-3 shadow-xl animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <div className="flex-1 font-medium">{errorMessage}</div>
            <button
              onClick={() => setErrorMessage(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-red-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Main Two-Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Generator Form (8 Cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* ── Step 1: Publication Medium ── */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center text-[10px]">
                    1
                  </span>
                  Choose Publication Medium
                </label>
                <span className="text-[11px] font-mono text-neutral-500">
                  Target Canvas & Reader Mode
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {FORMAT_OPTIONS.map((f) => {
                  const Icon = f.icon;
                  const isSelected = formatType === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleFormatChange(f.id)}
                      className={`relative text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group ${
                        isSelected
                          ? `bg-gradient-to-br ${f.accent} ring-2 ring-blue-500 shadow-xl ${f.glow}`
                          : "bg-[#111216] border-white/10 hover:border-white/20 hover:bg-[#16171C]"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div
                            className={`p-2 rounded-xl ${
                              isSelected ? "bg-black/40 text-white" : "bg-neutral-800 text-neutral-400 group-hover:text-white"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="text-sm font-bold text-white font-mono flex items-center gap-2">
                            <span>{f.title}</span>
                          </div>
                          <div className="text-[10px] font-mono font-semibold text-neutral-400 mt-0.5">
                            {f.subtitle}
                          </div>
                        </div>

                        <p className="text-[11px] text-neutral-300 font-sans leading-relaxed line-clamp-2">
                          {f.desc}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono">
                        <span className="text-neutral-400">Canvas:</span>
                        <span className="font-bold text-white">{f.badge}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Format-Specific AI Arc Director Skill Indicator */}
              {(() => {
                const activeFormat = FORMAT_OPTIONS.find((f) => f.id === formatType) || FORMAT_OPTIONS[0];
                return (
                  <div className="p-4 rounded-2xl bg-[#0D0E12] border border-blue-500/30 shadow-lg relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                          <Sparkles className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                              Active AI Director Skill:
                            </span>
                            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              {activeFormat.skillId}
                            </span>
                          </div>
                          <div className="text-xs text-neutral-300 font-sans mt-0.5">
                            {activeFormat.skillName} • Protocol: <code className="text-amber-400 text-[11px] font-mono">{activeFormat.skillPromptFile}</code>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleInspectSkill}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer self-stretch sm:self-auto justify-center"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        Inspect Skill Output
                      </button>
                    </div>

                    <div className="pt-3 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-mono uppercase text-neutral-400 mr-1">Architecture Rules:</span>
                      {activeFormat.highlights.map((h, i) => (
                        <span key={i} className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-neutral-900 border border-white/10 text-neutral-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </section>

            {/* ── Step 2: Story Concept & Blueprint ── */}
            <section className="space-y-4 p-5 sm:p-6 rounded-2xl bg-[#111216] border border-white/10 shadow-xl">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center text-[10px]">
                    2
                  </span>
                  Story Identity & Premise
                </label>
                <span className="text-[11px] font-mono text-neutral-500">
                  Episodic World Core
                </span>
              </div>

              {/* Quick Inspiration Chips */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Curated Concept Presets:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {GENRE_PRESETS.map((p) => {
                    const isSelected = title === p.title;
                    return (
                      <button
                        key={p.genre}
                        type="button"
                        onClick={() => applyGenrePreset(p)}
                        className={`px-3 py-1 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20"
                            : "bg-[#18191E] border-white/10 text-neutral-400 hover:text-white hover:border-white/20"
                        }`}
                      >
                        {p.genre}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title & Genre in grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
                    Series Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Chronicles of the Ash Monarch"
                    className="w-full bg-[#18191E] border border-white/10 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 font-mono font-bold outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
                    Primary Genre
                  </label>
                  <input
                    type="text"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder="e.g. Action Fantasy"
                    className="w-full bg-[#18191E] border border-white/10 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 font-mono outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Genre Quick Tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-mono text-neutral-500 uppercase mr-1">Tags:</span>
                {GENRE_TAGS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setGenre(t)}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                      genre === t
                        ? "bg-blue-950/80 text-blue-300 border-blue-500/50"
                        : "bg-[#16171C] text-neutral-400 border-white/5 hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Premise / Logline */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
                    Story Premise & Inciting Incident
                  </label>
                  <span className="text-[10px] font-mono text-neutral-500">
                    {logline.length} / 500 chars
                  </span>
                </div>
                <textarea
                  value={logline}
                  onChange={(e) => setLogline(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Describe the central conflict, protagonist's core goal, the unique supernatural power or stakes..."
                  className="w-full bg-[#18191E] border border-white/10 focus:border-blue-500 rounded-xl p-3 text-xs text-neutral-200 placeholder-neutral-500 font-sans resize-none leading-relaxed outline-none transition-colors"
                />
              </div>
            </section>

            {/* ── Step 3: Visual Art Style Gallery ── */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center text-[10px]">
                    3
                  </span>
                  Visual Art Style Preset
                </label>
                <span className="text-[11px] font-mono text-neutral-500">
                  {currentFormatMeta.title} Style Models
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {currentStyles.map((s) => {
                  const isSelected = artStyle === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setArtStyle(s.id)}
                      className={`relative rounded-2xl border overflow-hidden cursor-pointer transition-all duration-200 group flex flex-col justify-between ${
                        isSelected
                          ? "border-blue-500 ring-2 ring-blue-500/50 shadow-xl bg-[#14151B]"
                          : "border-white/10 bg-[#111216] hover:border-white/20 hover:bg-[#16171C]"
                      }`}
                    >
                      {/* Image Preview Banner */}
                      <div className="relative h-28 w-full overflow-hidden bg-black">
                        <img
                          src={s.previewUrl}
                          alt={s.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#111216] via-[#111216]/40 to-transparent" />
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[9px] font-mono font-bold text-white border border-white/10">
                          {s.badge}
                        </span>
                        {isSelected && (
                          <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>

                      <div className="p-3.5 space-y-1.5">
                        <div className="text-xs font-bold text-white font-mono truncate">
                          {s.name}
                        </div>
                        <p className="text-[11px] text-neutral-400 font-sans line-clamp-2 leading-relaxed">
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── Step 4: AI Diffusion Image Engine ── */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center text-[10px]">
                    4
                  </span>
                  Diffusion AI Image Engine
                </label>
                <span className="text-[11px] font-mono text-neutral-500">
                  Generation Backbone
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {IMAGE_MODEL_CARDS.map((m) => {
                  const Icon = m.icon;
                  const isSelected = imageModel === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setImageModel(m.id)}
                      className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-gradient-to-br from-blue-950/40 to-neutral-900 border-blue-500 ring-2 ring-blue-500/40 shadow-xl"
                          : "bg-[#111216] border-white/10 hover:border-white/20 hover:bg-[#16171C]"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-mono">
                            <div
                              className={`p-1.5 rounded-lg ${
                                isSelected ? "bg-blue-600 text-white" : "bg-neutral-800 text-neutral-400"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-white">{m.name}</span>
                          </div>

                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${m.badgeColor}`}>
                            {m.badge}
                          </span>
                        </div>

                        <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">
                          {m.desc}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono">
                        <span className="text-neutral-500 font-semibold">{m.tagline}</span>
                        {isSelected ? (
                          <span className="text-blue-400 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" /> Active
                          </span>
                        ) : (
                          <span className="text-neutral-500">Select</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── Step 5: Franchise Volume & Narrative Scope ── */}
            <section className="space-y-5 p-5 sm:p-6 rounded-2xl bg-[#111216] border border-white/10 shadow-xl">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center text-[10px]">
                    5
                  </span>
                  Franchise Architecture & Narrative Scope
                </label>
                <span className="text-[11px] font-mono text-neutral-500">
                  Episodic Distribution
                </span>
              </div>

              {/* Seasons Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-400 font-semibold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    Franchise Seasons:
                  </span>
                  <span className="font-bold text-white">{totalSessions} Seasons</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {SEASONS_LIST.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setTotalSessions(s.value)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-mono ${
                        totalSessions === s.value
                          ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20 font-bold"
                          : "bg-[#18191E] border-white/10 text-neutral-400 hover:text-white hover:border-white/20"
                      }`}
                    >
                      <div className="text-xs font-bold">{s.label}</div>
                      <div className="text-[9px] opacity-80 mt-0.5">{s.badge}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chapters per Season */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-400 font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    Episodes / Chapters per Season:
                  </span>
                  <span className="font-bold text-white">{chaptersPerSession} Episodes / Season</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CHAPTERS_LIST.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setChaptersPerSession(c.value)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-mono ${
                        chaptersPerSession === c.value
                          ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20 font-bold"
                          : "bg-[#18191E] border-white/10 text-neutral-400 hover:text-white hover:border-white/20"
                      }`}
                    >
                      <div className="text-xs font-bold">{c.label}</div>
                      <div className="text-[9px] opacity-80 mt-0.5">{c.badge}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Panels per Episode / Chapter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-400 font-semibold flex items-center gap-1.5">
                    <Grid className="w-3.5 h-3.5 text-emerald-400" />
                    Panels / Cuts per Episode:
                  </span>
                  <span className="font-bold text-emerald-400">{panelsPerChapter} Panels / Episode</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {PANELS_PER_CHAPTER_LIST.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPanelsPerChapter(p.value)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-mono ${
                        panelsPerChapter === p.value
                          ? "bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/20 font-bold"
                          : "bg-[#18191E] border-white/10 text-neutral-400 hover:text-white hover:border-white/20"
                      }`}
                    >
                      <div className="text-xs font-bold">{p.label}</div>
                      <div className="text-[9px] opacity-80 mt-0.5">{p.badge}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Narrative Pacing & Dialogue Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Pacing */}
                <div className="space-y-2">
                  <label className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Story Pacing
                  </label>
                  <div className="space-y-1.5">
                    {PACING_CARDS.map((p) => {
                      const Icon = p.icon;
                      const isSelected = pacing === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPacing(p.id)}
                          className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                            isSelected
                              ? "bg-blue-950/60 border-blue-500 text-white"
                              : "bg-[#18191E] border-white/10 text-neutral-400 hover:text-white"
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-amber-400" : "text-neutral-500"}`} />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold font-mono">{p.label}</div>
                            <div className="text-[10px] text-neutral-400 truncate">{p.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dialogue Density */}
                <div className="space-y-2">
                  <label className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                    Dialogue Density
                  </label>
                  <div className="space-y-1.5">
                    {DIALOGUE_CARDS.map((d) => {
                      const Icon = d.icon;
                      const isSelected = dialogueDensity === d.id;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setDialogueDensity(d.id)}
                          className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                            isSelected
                              ? "bg-blue-950/60 border-blue-500 text-white"
                              : "bg-[#18191E] border-white/10 text-neutral-400 hover:text-white"
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-blue-400" : "text-neutral-500"}`} />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold font-mono">{d.label}</div>
                            <div className="text-[10px] text-neutral-400 truncate">{d.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Live Production Blueprint & Launch HUD (4 Cols) */}
          <div className="lg:col-span-4 lg:sticky lg:top-8 space-y-5">
            {/* Live Production Card */}
            <div className="rounded-3xl bg-gradient-to-b from-[#14161E] to-[#0D0E13] border border-white/15 p-6 shadow-2xl space-y-6 relative overflow-hidden">
              {/* Corner accent glow */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/20 blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-mono font-bold tracking-wider text-white uppercase">
                    Production Manifest
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 font-bold">
                  Ready to Build
                </span>
              </div>

              {/* Title & Medium Summary */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                  Series Codex
                </span>
                <div className="text-base font-black text-white font-mono truncate">
                  {title || "Untitled AI Series"}
                </div>
                <div className="flex items-center gap-2 pt-1 font-mono text-[11px]">
                  <span className="px-2 py-0.5 rounded-md bg-blue-600/30 text-blue-300 border border-blue-500/30 font-bold">
                    {currentFormatMeta.title}
                  </span>
                  <span className="text-neutral-500">•</span>
                  <span className="text-neutral-400">{genre}</span>
                </div>
              </div>

              {/* Numerical Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5 text-center">
                  <div className="text-[9px] text-neutral-500 uppercase">Episodes</div>
                  <div className="text-lg font-black text-white">
                    {totalEpisodes} <span className="text-[10px] font-normal text-neutral-400">Eps</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5 text-center">
                  <div className="text-[9px] text-neutral-500 uppercase">Per Episode</div>
                  <div className="text-lg font-black text-blue-400">
                    {panelsPerChapter} <span className="text-[10px] font-normal text-neutral-400">P</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5 text-center">
                  <div className="text-[9px] text-neutral-500 uppercase">Total Panels</div>
                  <div className="text-lg font-black text-emerald-400">
                    ~{estimatedPanels} <span className="text-[10px] font-normal text-neutral-400">P</span>
                  </div>
                </div>
              </div>

              {/* Technical Specifications Checklist */}
              <div className="space-y-2.5 pt-2 border-t border-white/10 text-xs font-mono">
                <div className="flex items-center justify-between text-neutral-300">
                  <span className="text-neutral-500 flex items-center gap-1.5">
                    <Grid className="w-3.5 h-3.5 text-emerald-400" /> Panels per Ep:
                  </span>
                  <span className="font-bold text-emerald-400">
                    {panelsPerChapter} Panels
                  </span>
                </div>

                <div className="flex items-center justify-between text-neutral-300">
                  <span className="text-neutral-500 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-blue-400" /> Art Preset:
                  </span>
                  <span className="font-bold text-white truncate max-w-[150px]">
                    {currentStyles.find((s) => s.id === artStyle)?.name || artStyle}
                  </span>
                </div>

                <div className="flex items-center justify-between text-neutral-300">
                  <span className="text-neutral-500 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-emerald-400" /> Diffusion Engine:
                  </span>
                  <span className="font-bold text-emerald-300 truncate max-w-[150px]">
                    {IMAGE_MODEL_CARDS.find((m) => m.id === imageModel)?.name || imageModel}
                  </span>
                </div>

                <div className="flex items-center justify-between text-neutral-300">
                  <span className="text-neutral-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Character DNA Lock:
                  </span>
                  <span className="font-bold text-blue-400">Active (Locked)</span>
                </div>

                <div className="flex items-center justify-between text-neutral-300">
                  <span className="text-neutral-500 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Pacing Architecture:
                  </span>
                  <span className="font-bold text-amber-300 capitalize">{pacing}</span>
                </div>
              </div>

              {/* Turbo Chapter 1 First Toggle */}
              <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-white/10 flex items-center justify-between font-mono">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <div className="text-xs">
                    <div className="font-bold text-white">Turbo Chapter 1</div>
                    <div className="text-[10px] text-neutral-400">Synthesize immediately on create</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={turboMode}
                  onChange={(e) => setTurboMode(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-black border-white/20 cursor-pointer focus:ring-blue-500"
                />
              </div>

              {/* Primary Launch CTA */}
              <button
                type="button"
                onClick={handleLaunch}
                disabled={submitting}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-mono font-black text-sm shadow-xl shadow-blue-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Architecting Franchise...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Launch AI Franchise Production</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center text-[10px] font-mono text-neutral-500">
                Automatic redirection to the active {currentFormatMeta.title} studio canvas.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── AI Arc Director Skill Output Inspection Modal ── */}
      {showInspectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-4xl max-h-[85vh] bg-[#111216] border border-blue-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-950/40 to-neutral-900/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                    AI Arc Director Live Blueprint: <span className="text-blue-400">{currentFormatMeta.title}</span>
                  </h3>
                  <p className="text-xs text-neutral-400 font-mono">
                    Skill: <code className="text-amber-400">{currentFormatMeta.id === "anime" ? "series_arc_anime" : currentFormatMeta.id === "comic_manga" ? "series_arc_comic" : "series_arc_manhwa"}</code> • Protocol: <code className="text-neutral-300">{currentFormatMeta.id === "anime" ? "series_arc_anime.md" : currentFormatMeta.id === "comic_manga" ? "series_arc_comic.md" : "series_arc_manhwa.md"}</code>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowInspectModal(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 studio-visible-scrollbar">
              {inspectLoading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                  <div className="text-sm font-mono text-neutral-300">
                    Executing {currentFormatMeta.title} Arc Director Skill...
                  </div>
                  <div className="text-xs text-neutral-500 font-mono">
                    Synthesizing Cast DNA, Lore Rules, and Multi-Session Pacing Blueprint
                  </div>
                </div>
              ) : inspectData?.error ? (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
                  {inspectData.error}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Cast DNA Section */}
                  {inspectData?.cast && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Cast Character DNA ({inspectData.cast.length} characters)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {inspectData.cast.map((c: any, idx: number) => (
                          <div key={idx} className="p-4 rounded-xl bg-neutral-900 border border-white/10 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-white font-mono">{c.name}</span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 uppercase">
                                {c.role}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-300">{c.visual_summary}</p>
                            {c.clothing_palette && (
                              <div className="text-[10px] font-mono text-neutral-400">
                                <span className="text-neutral-500">Palette:</span> {c.clothing_palette}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* World Bible */}
                  {inspectData?.world_bible && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" /> World Lore & Unresolved Mysteries
                      </h4>
                      <div className="p-4 rounded-xl bg-neutral-900 border border-white/10 space-y-3">
                        <div className="text-xs font-bold text-white">
                          Setting: <span className="text-neutral-300">{inspectData.world_bible.setting_name}</span>
                        </div>
                        {inspectData.world_bible.lore_rules && (
                          <div className="space-y-1">
                            <div className="text-[10px] font-mono uppercase text-neutral-400">World Rules:</div>
                            {inspectData.world_bible.lore_rules.map((r: string, idx: number) => (
                              <div key={idx} className="text-xs text-neutral-300 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                {r}
                              </div>
                            ))}
                          </div>
                        )}
                        {inspectData.world_bible.unresolved_mysteries && (
                          <div className="space-y-1 pt-2 border-t border-white/10">
                            <div className="text-[10px] font-mono uppercase text-amber-400">
                              Zero-Cliffhanger Target Mysteries:
                            </div>
                            {inspectData.world_bible.unresolved_mysteries.map((m: string, idx: number) => (
                              <div key={idx} className="text-xs text-neutral-300 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                {m}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Raw Schema Preview */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">
                      Raw Skill Output JSON
                    </h4>
                    <pre className="p-4 rounded-xl bg-black/60 border border-white/10 text-[11px] font-mono text-neutral-300 overflow-x-auto max-h-60">
                      {JSON.stringify(inspectData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 flex items-center justify-between bg-neutral-900/80">
              <span className="text-xs font-mono text-neutral-400">
                Ready to architect full series with this AI Skill.
              </span>
              <button
                type="button"
                onClick={() => setShowInspectModal(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold transition-all cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISeriesGeneratorPage;
