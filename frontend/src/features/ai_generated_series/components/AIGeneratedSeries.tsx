import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import {
  aiSeriesApi,
  CreateAISeriesPayload,
} from "@/api/endpoints/aiSeries";
import { NotificationType } from "@/features/app_notification";
import {
  FORMAT_DEFINITIONS,
  DEFAULT_SERIES_STATE,
  TOTAL_SESSIONS_OPTIONS,
  EPISODES_PER_SESSION_OPTIONS,
  PANELS_PER_CHAPTER_OPTIONS,
} from "../constants/seriesConfig";
import CyberSelect from "@/shared/ui/common/CyberSelect";

export interface AIGeneratedSeriesProps {
  addNotification: (message: string, type: NotificationType) => void;
  onSeriesCreated?: (project: any) => void;
}

export const AIGeneratedSeries: React.FC<AIGeneratedSeriesProps> = ({
  addNotification,
  onSeriesCreated,
}) => {
  const { navigate } = useSeriesNavigation();

  // Core Series State
  const [formatType, setFormatType] = useState<"manhwa" | "comic_manga" | "anime">(
    DEFAULT_SERIES_STATE.formatType
  );
  const [title, setTitle] = useState(DEFAULT_SERIES_STATE.title);
  const [logline, setLogline] = useState(DEFAULT_SERIES_STATE.logline);
  const [artStyle, setArtStyle] = useState(DEFAULT_SERIES_STATE.artStyle);
  const [imageModel] = useState(DEFAULT_SERIES_STATE.imageModel);

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
      <div className="p-5 rounded-2xl bg-gradient-to-b from-[#141523]/90 via-[#0F101A]/95 to-[#0A0B12] border border-white/[0.09] shadow-[0_12px_40px_rgba(0,0,0,0.65)] space-y-4 backdrop-blur-xl relative overflow-hidden">
        {/* Subtle Ambient Glow Accents */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-600/[0.05] rounded-full blur-3xl pointer-events-none" />

        {/* Row 1: Series Title */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Crown className="w-3 h-3" />
              </span>
              <span>Series Title</span>
            </label>
            <span className="text-[10px] font-mono text-neutral-400 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-md">
              {title.length}/60
            </span>
          </div>
          <input
            type="text"
            maxLength={60}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Solo Sovereign of the Void"
            className="w-full bg-[#080910]/90 border border-white/[0.09] hover:border-white/[0.18] focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-500 transition-all font-medium shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)]"
          />
        </div>

        {/* Row 2: Format, Seasons, Episodes, Panels (Balanced 4-Column Row) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Format */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
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
            <label className="text-[11px] font-mono font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
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
            <label className="text-[11px] font-mono font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
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
            <label className="text-[11px] font-mono font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
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
            <label className="text-[11px] font-mono font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Film className="w-3 h-3" />
              </span>
              <span>Story Concept &amp; Synopsis</span>
            </label>
            <span className="text-[10px] font-mono text-neutral-400 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-md">
              {logline.length} chars
            </span>
          </div>
          <textarea
            rows={2.5}
            value={logline}
            onChange={(e) => setLogline(e.target.value)}
            placeholder="Describe the protagonist's drive, world rules, supernatural system, inciting incident, and nemesis..."
            className="w-full bg-[#080910]/90 border border-white/[0.09] hover:border-white/[0.18] focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 rounded-xl p-3 text-xs text-white placeholder:text-neutral-500 focus:outline-none font-sans resize-none transition-all shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)] leading-relaxed"
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ACTION DOCK
          ───────────────────────────────────────────────────────────── */}
      <div className="pt-0.5">
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className={`w-full py-3.5 px-5 rounded-xl font-bold text-sm text-white tracking-wide shadow-[0_4px_20px_rgba(59,130,246,0.30)] hover:shadow-[0_6px_28px_rgba(59,130,246,0.50)] bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-400 border border-blue-400/40 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2.5 relative overflow-hidden group disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${
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
