import React, { useState, useMemo, useEffect } from "react";
import { useSeriesNavigation } from "../hooks/useSeriesNavigation";
import {
  Sparkles,
  BookOpen,
  Crown,
  Film,
  Loader2,
  Layers,
  Bookmark,
  LayoutGrid,
  Cpu,
  Palette,
  Mic,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  aiSeriesApi,
  CreateAISeriesPayload,
} from "@/features/intelligence/series/api/aiSeries";
import { NotificationType } from "@/features/platform/notifications";
import {
  FORMAT_DEFINITIONS,
  DEFAULT_SERIES_STATE,
  TOTAL_SESSIONS_OPTIONS,
  EPISODES_PER_SESSION_OPTIONS,
  PANELS_PER_CHAPTER_OPTIONS,
  STORYBOARD_MODELS,
  DIFFUSION_MODELS,
  VOICE_DUBBING_OPTIONS,
} from "../constants/seriesConfig";
import CyberSelect from "@/shared/ui/common/CyberSelect";
import { useAIModelStore } from "@/features/intelligence/core/hooks/useAIModelStore";

export interface AIGeneratedSeriesProps {
  addNotification: (message: string, type: NotificationType) => void;
  onSeriesCreated?: (project: any) => void;
}

export const AIGeneratedSeries: React.FC<AIGeneratedSeriesProps> = ({
  addNotification,
  onSeriesCreated,
}) => {
  const { navigate } = useSeriesNavigation();
  const { getAvailableModels, loadCatalogFromBackend } = useAIModelStore();

  useEffect(() => {
    loadCatalogFromBackend();
  }, [loadCatalogFromBackend]);

  const allAvailableModels = getAvailableModels();

  const dynamicStoryboardOptions = useMemo(() => {
    const list = allAvailableModels.filter(
      (m) =>
        (m.tags || []).includes("Text-to-Text") ||
        (m.tags || []).includes("Image-to-Text")
    );
    if (list.length > 0) {
      return list.map((m) => ({
        value: m.id,
        label: `${m.name} (${m.provider.toUpperCase()})${
          m.is_free_tier ? " [100% FREE]" : ""
        }`,
      }));
    }
    return STORYBOARD_MODELS.map((m) => ({ value: m.id, label: m.label }));
  }, [allAvailableModels]);

  const dynamicDiffusionOptions = useMemo(() => {
    const list = allAvailableModels.filter((m) =>
      (m.tags || []).includes("Text-to-Image")
    );
    if (list.length > 0) {
      return list.map((m) => ({
        value: m.id,
        label: `${m.name} (${m.provider.toUpperCase()})${
          m.is_free_tier ? " [100% FREE]" : ""
        }`,
      }));
    }
    return DIFFUSION_MODELS.map((m) => ({ value: m.id, label: m.label }));
  }, [allAvailableModels]);

  const dynamicVoiceOptions = useMemo(() => {
    const list = allAvailableModels.filter((m) =>
      (m.tags || []).includes("Text-to-Speech")
    );
    if (list.length > 0) {
      return [
        ...list.map((m) => ({
          value: m.id,
          label: `${m.name} (${m.provider.toUpperCase()})${
            m.is_free_tier ? " [100% FREE]" : ""
          }`,
        })),
        { value: "muted", label: "Muted — Visual Art & Text Bubbles Only" },
      ];
    }
    return VOICE_DUBBING_OPTIONS.map((m) => ({ value: m.value, label: m.label }));
  }, [allAvailableModels]);

  // Core Series State
  const [formatType, setFormatType] = useState<"manhwa" | "comic_manga" | "anime">(
    DEFAULT_SERIES_STATE.formatType
  );
  const [title, setTitle] = useState(DEFAULT_SERIES_STATE.title);
  const [logline, setLogline] = useState(DEFAULT_SERIES_STATE.logline);
  const [artStyle, setArtStyle] = useState(DEFAULT_SERIES_STATE.artStyle);

  // AI Core Pipeline Models State (pre-populated from user's AI Core Cascades / Routing)
  const [storyboardModel, setStoryboardModel] = useState<string>(() => {
    try {
      const stored = localStorage.getItem("sonikoma_ai_routing_custom");
      if (stored) {
        const routes = JSON.parse(stored);
        const storyRoute = routes.find((r: any) => r.task === "storyboard_narrative");
        if (storyRoute?.primary_model) return storyRoute.primary_model;
      }
    } catch {}
    return DEFAULT_SERIES_STATE.storyboardModel;
  });

  const [imageModel, setImageModel] = useState<string>(() => {
    try {
      const stored = localStorage.getItem("sonikoma_ai_routing_custom");
      if (stored) {
        const routes = JSON.parse(stored);
        const diffRoute = routes.find((r: any) => r.task === "image_diffusion");
        if (diffRoute?.primary_model) return diffRoute.primary_model;
      }
    } catch {}
    return DEFAULT_SERIES_STATE.imageModel;
  });

  const [voiceModel, setVoiceModel] = useState<string>(() => {
    try {
      const stored = localStorage.getItem("sonikoma_ai_routing_custom");
      if (stored) {
        const routes = JSON.parse(stored);
        const voiceRoute = routes.find((r: any) => r.task === "speech_synthesis");
        if (voiceRoute?.primary_model) return voiceRoute.primary_model;
      }
    } catch {}
    return DEFAULT_SERIES_STATE.voiceDubbing;
  });

  // Series Structure & Scale State
  const [totalSessions, setTotalSessions] = useState<number>(DEFAULT_SERIES_STATE.totalSessions || 1);
  const [chaptersPerSession, setChaptersPerSession] = useState<number>(DEFAULT_SERIES_STATE.chaptersPerSession);
  const [panelsPerChapter, setPanelsPerChapter] = useState<number>(DEFAULT_SERIES_STATE.panelsPerChapter);

  // Default narrative settings
  const [pacing] = useState<"action_fast" | "dynamic" | "cinematic">(
    DEFAULT_SERIES_STATE.pacing
  );
  const [dialogueDensity] = useState<"action_punchy" | "balanced" | "lore_rich">(
    DEFAULT_SERIES_STATE.dialogueDensity
  );

  // Processing state
  const [creating, setCreating] = useState(false);

  const currentFormatDef = useMemo(() => {
    return (
      FORMAT_DEFINITIONS.find((f) => f.id === formatType) || FORMAT_DEFINITIONS[0]
    );
  }, [formatType]);

  const handleFormatChange = (newFormat: "manhwa" | "comic_manga" | "anime") => {
    setFormatType(newFormat);
    const matchingDef = FORMAT_DEFINITIONS.find((f) => f.id === newFormat);
    if (matchingDef) {
      setArtStyle(matchingDef.defaultStyle);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      addNotification("Please enter a title for your AI Series.", "warning");
      return;
    }
    if (!logline.trim()) {
      addNotification("Please enter a story concept or logline.", "warning");
      return;
    }

    try {
      setCreating(true);
      const payload: CreateAISeriesPayload = {
        title: title.trim(),
        logline: logline.trim(),
        genre: currentFormatDef.formatLabel,
        format_type: formatType,
        art_style: artStyle,
        image_model: imageModel,
        storyboard_model: storyboardModel,
        voice_model: voiceModel,
        total_sessions: totalSessions,
        chapters_per_session: chaptersPerSession,
        panels_per_chapter: panelsPerChapter,
        pacing: pacing,
        dialogue_density: dialogueDensity,
        generation_priority: "turbo_first_chapter",
      };

      const project = await aiSeriesApi.createSeries(payload);
      addNotification(`AI Series "${project.title}" created with Turbo Chapter 1!`, "success");

      if (onSeriesCreated) {
        onSeriesCreated(project);
      }

      // Navigate to dedicated master AI Series Studio
      navigate(`/ai-series/${project.series_id}?format=${formatType}`);
    } catch (err: any) {
      console.error("Failed to construct AI series:", err);
      addNotification(err.message || "Failed to create AI Series.", "error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="relative space-y-4 pt-1 animate-fade-in font-sans">
      {/* ─────────────────────────────────────────────────────────────
          CORE SERIES SPECIFICATIONS
          ───────────────────────────────────────────────────────────── */}
      <div className="p-5 sm:p-6 rounded-[24px] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] border border-[#2F2F2F] shadow-2xl space-y-4 relative overflow-visible z-20">
        {/* Subtle Ambient Glow Accent (matching Sonikoma website design) */}
        <div className="absolute inset-0 overflow-hidden rounded-[24px] pointer-events-none">
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-neutral-700/50 to-transparent" />
        </div>

        {/* Row 1: Series Title */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono font-bold text-[#E5E5E5] uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-[#252525] border border-[#2F2F2F] flex items-center justify-center text-[#3B82F6] shrink-0">
                <Crown className="w-3 h-3" />
              </span>
              <span>Series Title</span>
            </label>
            <span className="text-[10px] font-mono text-[#9CA3AF] bg-[#222222] border border-[#2F2F2F] px-2 py-0.5 rounded-md">
              {title.length}/60
            </span>
          </div>
          <input
            type="text"
            maxLength={60}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Solo Sovereign of the Void"
            className="w-full bg-[#161616] border border-[#2F2F2F] hover:border-neutral-600 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#E5E5E5] placeholder:text-[#6B7280] transition-all font-medium shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)]"
          />
        </div>

        {/* Row 2: Format, Seasons, Episodes, Panels (Balanced 4-Column Row) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Format */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-bold text-[#E5E5E5] uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-[#252525] border border-[#2F2F2F] flex items-center justify-center text-[#3B82F6] shrink-0">
                <BookOpen className="w-3 h-3" />
              </span>
              <span>Format</span>
            </label>
            <CyberSelect
              value={formatType}
              onChange={(val) => handleFormatChange(val as any)}
              options={FORMAT_DEFINITIONS.map((f) => ({ value: f.id, label: f.label }))}
              variant="blue"
            />
          </div>

          {/* Seasons */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-bold text-[#E5E5E5] uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-[#252525] border border-[#2F2F2F] flex items-center justify-center text-[#3B82F6] shrink-0">
                <Layers className="w-3 h-3" />
              </span>
              <span>Seasons</span>
            </label>
            <CyberSelect
              value={String(totalSessions)}
              onChange={(val) => setTotalSessions(Number(val))}
              options={TOTAL_SESSIONS_OPTIONS.map((opt) => ({
                value: String(opt.value),
                label: opt.label,
              }))}
              variant="blue"
            />
          </div>

          {/* Episodes */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-bold text-[#E5E5E5] uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-[#252525] border border-[#2F2F2F] flex items-center justify-center text-[#3B82F6] shrink-0">
                <Bookmark className="w-3 h-3" />
              </span>
              <span>Episodes</span>
            </label>
            <CyberSelect
              value={String(chaptersPerSession)}
              onChange={(val) => setChaptersPerSession(Number(val))}
              options={EPISODES_PER_SESSION_OPTIONS.map((opt) => ({
                value: String(opt.value),
                label: opt.label,
              }))}
              variant="blue"
            />
          </div>

          {/* Panels */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-bold text-[#E5E5E5] uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-[#252525] border border-[#2F2F2F] flex items-center justify-center text-[#3B82F6] shrink-0">
                <LayoutGrid className="w-3 h-3" />
              </span>
              <span>Panels</span>
            </label>
            <CyberSelect
              value={String(panelsPerChapter)}
              onChange={(val) => setPanelsPerChapter(Number(val))}
              options={PANELS_PER_CHAPTER_OPTIONS.map((opt) => ({
                value: String(opt.value),
                label: opt.label,
              }))}
              variant="blue"
            />
          </div>
        </div>

        {/* Row 3: Story Concept & Logline Textarea */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono font-bold text-[#E5E5E5] uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-[#252525] border border-[#2F2F2F] flex items-center justify-center text-[#3B82F6] shrink-0">
                <Film className="w-3 h-3" />
              </span>
              <span>Story Concept &amp; Synopsis</span>
            </label>
            <span className="text-[10px] font-mono text-[#9CA3AF] bg-[#222222] border border-[#2F2F2F] px-2 py-0.5 rounded-md">
              {logline.length} chars
            </span>
          </div>
          <textarea
            rows={2.5}
            value={logline}
            onChange={(e) => setLogline(e.target.value)}
            placeholder="Describe the protagonist's drive, world rules, supernatural system, inciting incident, and nemesis..."
            className="w-full bg-[#161616] border border-[#2F2F2F] hover:border-neutral-600 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30 rounded-xl p-3 text-xs text-[#E5E5E5] placeholder:text-[#6B7280] focus:outline-none font-sans resize-none transition-all shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)] leading-relaxed"
          />
        </div>

        {/* ── AI Core Model Routing & Pipelines Section ── */}
        <div className="pt-3 border-t border-[#2F2F2F] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-[#252525] border border-[#2F2F2F] flex items-center justify-center text-[#3B82F6] shrink-0">
                <Cpu className="w-3 h-3" />
              </span>
              <span className="text-[11px] font-mono font-bold text-[#E5E5E5] uppercase tracking-wider">
                AI Engine Routing &amp; Selected Pipelines
              </span>
            </div>
            <a
              href="/ai-core/models"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-mono text-[#3B82F6] hover:text-[#60A5FA] flex items-center gap-1 transition-colors"
            >
              <span>AI Core Cascades</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Storyboard & Script Narration */}
            <div className="p-3 rounded-xl bg-[#161616] border border-[#2F2F2F] hover:border-neutral-600 transition-all space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#E5E5E5] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                  Script Narration
                </span>
                <span className="text-[9px] font-mono text-[#9CA3AF] bg-[#222222] border border-[#2F2F2F] px-1.5 py-0.5 rounded">
                  Tier 1 Primary
                </span>
              </div>
              <CyberSelect
                value={storyboardModel}
                onChange={setStoryboardModel}
                options={dynamicStoryboardOptions}
                variant="blue"
              />
            </div>

            {/* 2. Visual Art Diffusion Engine */}
            <div className="p-3 rounded-xl bg-[#161616] border border-[#2F2F2F] hover:border-neutral-600 transition-all space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#E5E5E5] uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-3 h-3 text-[#A855F7]" />
                  Visual Diffusion
                </span>
                <span className="text-[9px] font-mono text-[#9CA3AF] bg-[#222222] border border-[#2F2F2F] px-1.5 py-0.5 rounded">
                  2D Art
                </span>
              </div>
              <CyberSelect
                value={imageModel}
                onChange={setImageModel}
                options={dynamicDiffusionOptions}
                variant="purple"
              />
            </div>

            {/* 3. Character Vocal Dubbing Engine */}
            <div className="p-3 rounded-xl bg-[#161616] border border-[#2F2F2F] hover:border-neutral-600 transition-all space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#E5E5E5] uppercase tracking-wider flex items-center gap-1.5">
                  <Mic className="w-3 h-3 text-[#10B981]" />
                  Voice Dubbing
                </span>
                <span className="text-[9px] font-mono text-[#9CA3AF] bg-[#222222] border border-[#2F2F2F] px-1.5 py-0.5 rounded">
                  Neural TTS
                </span>
              </div>
              <CyberSelect
                value={voiceModel}
                onChange={setVoiceModel}
                options={dynamicVoiceOptions}
                variant="emerald"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ACTION DOCK
          ───────────────────────────────────────────────────────────── */}
      <div className="pt-0.5 relative z-10">
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className={`w-full py-3.5 px-5 rounded-xl font-bold text-sm text-white uppercase tracking-wider shadow-lg bg-[#3B82F6] hover:bg-[#2563EB] border border-[#3B82F6]/40 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2.5 relative overflow-hidden group disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${
            creating ? "cursor-wait" : ""
          }`}
          aria-label="Generate Series & Launch Studio"
        >
          {/* Subtle light sweep animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />

          {creating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              <span>Synthesizing Chapter 1…</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-white group-hover:rotate-12 transition-transform duration-300" />
              <span>Generate {currentFormatDef.formatLabel} &amp; Launch Studio</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AIGeneratedSeries;
