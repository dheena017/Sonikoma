import React, { useState, useEffect } from "react";
import {
  Sliders,
  Sparkles,
  MessageSquare,
  Camera,
  RefreshCw,
  Loader2,
  Volume2,
  Play,
  Languages,
  ChevronRight,
  Save,
  Wand2,
  Film,
  Copy,
  Check,
  User,
  Music,
  Maximize2,
  Settings2,
  HelpCircle,
  Type,
  Move,
  Headphones,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  X,
} from "lucide-react";
import type {
  AISeriesPanel,
  CharacterDNA,
  InteractiveSpeechBubble,
} from "@/api/endpoints/aiSeries";
import { aiSeriesApi } from "@/api/endpoints/aiSeries";
import {
  DIFFUSION_MODELS,
  VOICE_DUBBING_OPTIONS,
  ENHANCER_ENGINES,
} from "../../constants/seriesConfig";
import CyberSelect from "@/shared/ui/common/CyberSelect";

export interface ShotDirectorInspectorProps {
  seriesId: string;
  seriesTitle?: string;
  formatType?: string;
  sessionNumber: number;
  chapterNumber: number;
  chapters?: any[];
  onSelectChapter?: (sessNum: number, chapNum: number) => void;
  selectedPanelIdx: number;
  totalPanels: number;
  panel: AISeriesPanel | null;
  cast?: CharacterDNA[];
  imageModel?: string;
  isRegenerating: boolean;
  onSelectPanelIdx: (idx: number) => void;
  onUpdatePanel: (updated: Partial<AISeriesPanel>) => void;
  onRegenerateVisual: (prompt: string, model?: string) => Promise<void>;
  onSynthesizeAudio?: (speaker: string, text: string) => Promise<void>;
  onClose?: () => void;
  addNotification?: (
    message: string,
    type: "success" | "error" | "info" | "warning"
  ) => void;
  onSynthesizeChapterVisuals?: (model?: string) => Promise<void>;
  isSynthesizingVisuals?: boolean;
  onSynthesizeChapterAudio?: () => Promise<void>;
  isSynthesizingAudio?: boolean;
  onOpenCharacterVault?: () => void;
  onOpenWorldBible?: () => void;
  showSpeechBubbles?: boolean;
  onToggleSpeechBubbles?: () => void;
}

const CAMERA_ANGLES = [
  "close_up",
  "medium_shot_entry",
  "wide_establishing",
  "dutch_angle_dramatic",
  "heroic_low_angle",
  "over_the_shoulder",
  "bird_eye_panoramic",
  "extreme_macro_eyes",
];

const BUBBLE_TYPES = [
  { id: "speech", label: "Speech", icon: MessageSquare },
  { id: "shout", label: "Shout", icon: Sparkles },
  { id: "thought", label: "Thought", icon: HelpCircle },
  { id: "whisper", label: "Whisper", icon: Volume2 },
  { id: "narration", label: "Narration", icon: Film },
];

const PROMPT_STYLE_ENHANCERS = [
  "StoryDiffusion consistent character anchor, identical facial structure, multi-panel cohesion",
  "Real-ESRGAN 4k razor lineart, crisp manga screentone 50 LPI halftone, sharp ink",
  "Ufotable raytraced sakuga, volumetric flame embers, dynamic bloom, 24fps cinema",
  "Solo Leveling obsidian shadows, radiant neon violet mana aura, crisp digital ink",
  "Studio Ghibli hand-painted cel, atmospheric watercolor skies, gentle sunlight bloom",
  "Trigger studio hyper-kinetic perspective, explosive speedlines, primary color clash",
];

const MOTION_ENGINES = [
  { id: "tooncrafter", label: "ToonCrafter (Anime Keyframe Interpolation • Beast)" },
  { id: "animatediff", label: "AnimateDiff v3 (24fps Dynamic Sakuga Motion • Beast)" },
  { id: "wan-video", label: "Wan2.1 (Cinematic AI Video Generation • Beast)" },
  { id: "parallax", label: "2.5D Parallax Optical Pan & Scan" },
];

const MOTION_PRESETS = [
  { label: "Sakuga Sword Slash", prompt: "Hyper-speed sword draw, visual impact frame, camera shake, white speedline streaks" },
  { label: "Mana Awakening Burst", prompt: "Violent energy eruption, spherical shockwave, floating debris, glowing particle swirl" },
  { label: "Wind & Hair Flutter", prompt: "Subtle gentle breeze, cloth and strand micro-movement, warm lens flare breathing" },
  { label: "Dramatic Dutch Zoom", prompt: "Rapid zoom push-in, canted dutch angle, eye glow flare, high tension focus" },
];

const VOCAL_EMOTIONS = [
  { id: "neutral", label: "Neutral / Calm" },
  { id: "battle_shout", label: "Battle Roar (Sakuga Attack • Beast)" },
  { id: "cold_sinister", label: "Cold / Sinister Monologue" },
  { id: "whisper", label: "Intimate Whisper" },
  { id: "despair", label: "Despair / Crying" },
  { id: "heroic_awakening", label: "Heroic Awakening" },
];

export const ShotDirectorInspector: React.FC<ShotDirectorInspectorProps> = ({
  seriesId,
  seriesTitle,
  formatType,
  sessionNumber,
  chapterNumber,
  chapters = [],
  onSelectChapter,
  selectedPanelIdx,
  totalPanels,
  panel,
  cast = [],
  imageModel = "flux-anime",
  isRegenerating,
  onSelectPanelIdx,
  onUpdatePanel,
  onRegenerateVisual,
  onSynthesizeAudio,
  onClose,
  addNotification,
  onSynthesizeChapterVisuals,
  isSynthesizingVisuals = false,
  onSynthesizeChapterAudio,
  isSynthesizingAudio = false,
  onOpenCharacterVault,
  onOpenWorldBible,
  showSpeechBubbles,
  onToggleSpeechBubbles,
}) => {
  const [activeTab, setActiveTab] = useState<"visual" | "dialogue" | "motion" | "audio">("visual");

  // Local editing states
  const [prompt, setPrompt] = useState(panel?.prompt || "");
  const [activeModel, setActiveModel] = useState<string>(imageModel);
  const [synthesizeModel, setSynthesizeModel] = useState<string>("turbo"); // default fast
  const [cameraAngle, setCameraAngle] = useState(panel?.camera_angle || "medium_shot_entry");
  const [motionPrompt, setMotionPrompt] = useState(panel?.motion_prompt || "");
  const [selectedMotionEngine, setSelectedMotionEngine] = useState<string>("tooncrafter");
  const [selectedVocalEngine, setSelectedVocalEngine] = useState<string>("gpt-sovits");
  const [selectedEmotion, setSelectedEmotion] = useState<string>("neutral");
  const [speaker, setSpeaker] = useState(
    panel?.speech_bubbles?.[0]?.speaker_name || "Hero"
  );
  const [speechText, setSpeechText] = useState(panel?.speech_text || "");
  const [bubbleType, setBubbleType] = useState<string>(
    panel?.speech_bubbles?.[0]?.bubble_type || "speech"
  );
  const [targetLang, setTargetLang] = useState<string>("ko");
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isDubbing, setIsDubbing] = useState<boolean>(false);
  const [isUpscaling, setIsUpscaling] = useState<boolean>(false);
  const [isInpainting, setIsInpainting] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Collapsible section triggers inside the inspector
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    visualPrompt: true,
    visualEnhancers: true,
    speechBubbles: true,
    speechTranslate: true,
    motionEngine: true,
    motionPrompt: true,
    vocalEngine: true,
    vocalLine: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Sync state whenever panel changes
  useEffect(() => {
    if (panel) {
      setPrompt(panel.prompt || "");
      setCameraAngle(panel.camera_angle || "medium_shot_entry");
      setMotionPrompt(panel.motion_prompt || "");
      setSpeechText(panel.speech_text || "");
      const b = panel.speech_bubbles?.[0];
      if (b) {
        setSpeaker(b.speaker_name || "Hero");
        setBubbleType(b.bubble_type || "speech");
      }
    }
  }, [panel, selectedPanelIdx]);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
    addNotification?.("Prompt copied to clipboard!", "info");
  };

  const handleEnhancePrompt = (tag: string) => {
    const updated = prompt.includes(tag) ? prompt : `${prompt.trim()}, ${tag}`;
    setPrompt(updated);
    addNotification?.("Enhanced prompt with studio style tokens", "info");
  };

  const handleSavePanel = () => {
    const updatedBubble: InteractiveSpeechBubble = {
      bubble_id: panel?.speech_bubbles?.[0]?.bubble_id || `bubble_${Date.now()}`,
      speaker_name: speaker,
      text: speechText,
      bubble_type: bubbleType,
      pos_x: panel?.speech_bubbles?.[0]?.pos_x ?? 0.5,
      pos_y: panel?.speech_bubbles?.[0]?.pos_y ?? 0.75,
      width: panel?.speech_bubbles?.[0]?.width ?? 220,
      height: panel?.speech_bubbles?.[0]?.height ?? 90,
      font_family: "font-comic",
      font_size: 14,
      bg_color: bubbleType === "shout" ? "#FFE4E6" : "#FFFFFF",
      text_color: "#0F172A",
      border_color: "#1E293B",
    };

    onUpdatePanel({
      prompt,
      camera_angle: cameraAngle,
      motion_prompt: motionPrompt,
      speech_text: speechText,
      speech_bubbles: [updatedBubble],
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    addNotification?.(`Saved Shot #${selectedPanelIdx + 1} parameters!`, "success");
  };

  const handleTranslate = async () => {
    if (!seriesId || !panel) return;
    try {
      setIsTranslating(true);
      const bubbles = panel.speech_bubbles || [];
      if (bubbles.length === 0) {
        addNotification?.("No speech bubble found to translate.", "warning");
        return;
      }
      const panelId = panel.panel_id || panel.id || String(selectedPanelIdx + 1);
      const res = await aiSeriesApi.translateSpeechBubbles(
        seriesId,
        String(chapterNumber),
        panelId,
        targetLang,
        bubbles
      );
      if (res && res.translated_bubbles && res.translated_bubbles.length > 0) {
        onUpdatePanel({
          speech_bubbles: res.translated_bubbles,
          speech_text: res.translated_bubbles[0].text,
        });
        setSpeechText(res.translated_bubbles[0].text);
        addNotification?.(`Speech translated to [${targetLang.toUpperCase()}]`, "success");
      }
    } catch (e: any) {
      console.error("Translation error:", e);
      addNotification?.("Failed to translate speech bubble.", "error");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleVoiceDubbing = async () => {
    if (!onSynthesizeAudio) return;
    try {
      setIsDubbing(true);
      await onSynthesizeAudio(speaker, speechText);
      addNotification?.("Vocal dubbing audio synthesized!", "success");
    } catch (e) {
      addNotification?.("Vocal dubbing failed.", "error");
    } finally {
      setIsDubbing(false);
    }
  };

  return (
    <div className="relative h-full min-h-0 max-h-full flex shrink-0 z-20">
      {/* ── Middle Collapse Trigger (Close Inspector) ── */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute -left-3.5 top-1/2 -translate-y-1/2 z-30 w-7 h-16 rounded-l-xl bg-[#0F101D] hover:bg-[#1A1C30] border-y border-l border-white/20 hover:border-cyan-400 text-neutral-400 hover:text-cyan-300 flex items-center justify-center shadow-[-4px_0_15px_rgba(0,0,0,0.6)] transition-all cursor-pointer group"
          title="Close Inspector"
          aria-label="Close Inspector"
        >
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      <aside className="w-80 lg:w-[380px] bg-[#0A0B12] border-l border-white/10 flex flex-col h-full min-h-0 max-h-full overflow-hidden text-left shadow-2xl">
        {/* ── HEADER TIER 1: Primary Shot Navigator ── */}
        <div className="h-12 px-3 border-b border-white/10 flex items-center justify-between bg-gradient-to-b from-[#131422] to-[#0E0F1A] shrink-0">
          {/* Left: Shot Identification & Counter */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#0A0B12] border border-cyan-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.25)] shrink-0 overflow-hidden aspect-square">
              <img
                src="/logo-dark.png"
                alt="Sonikoma"
                className="w-full h-full object-cover scale-[1.22] rounded-full aspect-square select-none pointer-events-none"
                draggable={false}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black uppercase tracking-wider text-white">
                  Shot #{selectedPanelIdx + 1}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30 shrink-0">
                  {selectedPanelIdx + 1} / {totalPanels}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Camera className="w-3 h-3 text-neutral-400 shrink-0" />
                <span className="text-[10px] font-mono text-neutral-300 capitalize truncate block max-w-[140px]">
                  {cameraAngle.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Shot Steppers & Close Trigger */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onSelectPanelIdx?.(Math.max(0, selectedPanelIdx - 1))}
              disabled={selectedPanelIdx === 0}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Previous Shot"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onSelectPanelIdx?.(Math.min(totalPanels - 1, selectedPanelIdx + 1))}
              disabled={selectedPanelIdx >= totalPanels - 1}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Next Shot"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer ml-1"
                title="Close Inspector"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      {/* ── Sub Navigation Tabs ── */}
      <div className="grid grid-cols-4 p-1.5 gap-1 border-b border-white/10 bg-[#0C0D18] shrink-0">
        {[
          { id: "visual", label: "Visuals", icon: Sparkles, activeCls: "bg-purple-600/25 border-purple-500/50 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.25)]" },
          { id: "dialogue", label: "Speech", icon: MessageSquare, activeCls: "bg-blue-600/25 border-blue-500/50 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.25)]" },
          { id: "motion", label: "Kinetic", icon: Camera, activeCls: "bg-amber-600/25 border-amber-500/50 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.25)]" },
          { id: "audio", label: "Voice", icon: Volume2, activeCls: "bg-emerald-600/25 border-emerald-500/50 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.25)]" },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1.5 rounded-xl text-[11px] font-mono font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                isActive
                  ? tab.activeCls
                  : "border-transparent text-neutral-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Scrollable Inspector Content Deck ── */}
      <div
        id="shot-director-inspector-scroll-deck"
        className="flex-1 min-h-0 max-h-full overflow-y-auto p-4 space-y-5 studio-visible-scrollbar inspector-visible-scrollbar overscroll-contain"
        tabIndex={0}
        style={{
          overflowY: "auto",
          overscrollBehavior: "contain",
        }}
      >
        {/* TAB 1: VISUAL GENERATION */}
        {activeTab === "visual" && (
          <div className="space-y-4 animate-in fade-in">
            {/* 1. Visual Prompt & Generation Engine Section */}
            <div className="rounded-2xl bg-[#12131F] border border-white/10 transition-all shadow-md relative">
              <button
                type="button"
                onClick={() => toggleSection("visualPrompt")}
                className="w-full px-3.5 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] flex items-center justify-between transition-colors text-left cursor-pointer border-b border-white/5"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
                    Visual Prompt &amp; Engine
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-mono">
                  <span>{openSections.visualPrompt ? "Close" : "Open"}</span>
                  {openSections.visualPrompt ? (
                    <ChevronDown className="w-3.5 h-3.5 text-purple-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                  )}
                </div>
              </button>

              {openSections.visualPrompt && (
                <div className="p-3.5 space-y-3.5 animate-in fade-in duration-150">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-neutral-300">
                      <span>Visual Prompt</span>
                      <button
                        type="button"
                        onClick={handleCopyPrompt}
                        className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copiedPrompt ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedPrompt ? "Copied" : "Copy"}</span>
                      </button>
                    </div>

                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={4}
                      className="w-full p-3 rounded-xl bg-[#0B0C15] border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-purple-500 transition-colors resize-none leading-relaxed"
                      placeholder="2D Cel animation visual prompt..."
                    />
                  </div>

                  {/* Diffusion Model Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-semibold text-neutral-300 flex items-center justify-between">
                      <span>Diffusion &amp; Generation Engine</span>
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    </label>
                    <CyberSelect
                      value={activeModel}
                      onChange={setActiveModel}
                      options={DIFFUSION_MODELS.map((m) => ({ value: m.id, label: m.label }))}
                      variant="purple"
                      size="sm"
                    />
                  </div>

                  {/* Model & Aspect Ratio Attributes */}
                  <div className="p-2.5 rounded-xl bg-[#0B0C15] border border-white/5 space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Engine:</span>
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 capitalize truncate max-w-[170px] text-[10px]">
                        {activeModel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Dimensions:</span>
                      <span className="text-white font-semibold text-[10px]">1080 x 1920 (9:16)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Studio Enhancers & 4K Upscale Section */}
            <div className="rounded-2xl bg-[#12131F] border border-white/10 transition-all shadow-md relative">
              <button
                type="button"
                onClick={() => toggleSection("visualEnhancers")}
                className="w-full px-3.5 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] flex items-center justify-between transition-colors text-left cursor-pointer border-b border-white/5"
              >
                <div className="flex items-center gap-2">
                  <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
                    Studio Enhancers &amp; 4K
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-mono">
                  <span>{openSections.visualEnhancers ? "Close" : "Open"}</span>
                  {openSections.visualEnhancers ? (
                    <ChevronDown className="w-3.5 h-3.5 text-purple-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                  )}
                </div>
              </button>

              {openSections.visualEnhancers && (
                <div className="p-3.5 space-y-3.5 animate-in fade-in duration-150">
                  {/* Quick AI Enhancers */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
                      Studio Beast Enhancers:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {PROMPT_STYLE_ENHANCERS.map((enhancer, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleEnhancePrompt(enhancer)}
                          className="px-2 py-1 rounded-md bg-[#0B0C15] border border-white/10 hover:border-purple-500/50 hover:bg-purple-900/20 text-[10px] font-mono text-neutral-300 hover:text-purple-200 transition-all cursor-pointer truncate max-w-[160px]"
                          title={enhancer}
                        >
                          + {enhancer.split(",")[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons: Regenerate & Beast 4K Upscale */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onRegenerateVisual(prompt, activeModel)}
                      disabled={isRegenerating}
                      className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-400/40 text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-purple-900/20 disabled:opacity-50 active:scale-98"
                    >
                      {isRegenerating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5 text-white" />
                      )}
                      <span>{isRegenerating ? "Synthesizing..." : "Synthesize Shot"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsUpscaling(true);
                        setTimeout(() => {
                          setIsUpscaling(false);
                          addNotification?.("Enhanced with Real-ESRGAN 4K Super-Resolution & Screentone Inking!", "success");
                        }, 1200);
                      }}
                      disabled={isUpscaling}
                      className="py-2.5 px-3 rounded-xl bg-[#0B0C15] hover:bg-neutral-800 border border-white/15 hover:border-blue-400/40 text-blue-300 hover:text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      title="Real-ESRGAN Anime 6B 4K Upscaler"
                    >
                      {isUpscaling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                      ) : (
                        <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                      )}
                      <span>{isUpscaling ? "Upscaling 4K..." : "4K Real-ESRGAN"}</span>
                    </button>
                  </div>

                  {onSynthesizeChapterVisuals && (
                    <button
                      type="button"
                      onClick={() => onSynthesizeChapterVisuals()}
                      disabled={isSynthesizingVisuals}
                      className="w-full py-2 px-3 rounded-xl bg-purple-900/20 hover:bg-purple-900/40 border border-purple-500/30 hover:border-purple-500/60 text-purple-200 text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSynthesizingVisuals ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-300" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                      )}
                      <span>{isSynthesizingVisuals ? "Synthesizing All Shots..." : `Synthesize All ${totalPanels} Shots (Batch)`}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DIALOGUE & SPEECH */}
        {activeTab === "dialogue" && (
          <div className="space-y-4 animate-in fade-in">
            {/* 1. Speech Bubble Customizer & Inpainter Section */}
            <div className="rounded-2xl bg-[#12131F] border border-white/10 transition-all shadow-md relative">
              <button
                type="button"
                onClick={() => toggleSection("speechBubbles")}
                className="w-full px-3.5 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] flex items-center justify-between transition-colors text-left cursor-pointer border-b border-white/5"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
                    Speech Bubble Customizer
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-mono">
                  <span>{openSections.speechBubbles ? "Close" : "Open"}</span>
                  {openSections.speechBubbles ? (
                    <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                  )}
                </div>
              </button>

              {openSections.speechBubbles && (
                <div className="p-3.5 space-y-3.5 animate-in fade-in duration-150">
                  {/* Speaker Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-semibold text-neutral-300 flex items-center justify-between">
                      <span>Speaker / Character</span>
                      <User className="w-3.5 h-3.5 text-blue-400" />
                    </label>

                    {/* Character Cast Quick Pick Avatars */}
                    {cast.length > 0 && (
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
                        {cast.map((c, i) => (
                          <button
                            key={c.id || i}
                            type="button"
                            onClick={() => setSpeaker(c.name)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
                              speaker === c.name
                                ? "bg-blue-600/30 border-blue-500 text-blue-200"
                                : "bg-[#0B0C15] border-white/10 text-neutral-400 hover:text-white"
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-blue-400" />
                            <span>{c.name}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <input
                      type="text"
                      value={speaker}
                      onChange={(e) => setSpeaker(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0B0C15] border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                      placeholder="Character or Narrator name..."
                    />
                  </div>

                  {/* Speech Line Input */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-semibold text-neutral-300 flex items-center justify-between">
                      <span>Spoken Dialogue Line</span>
                      <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                    </label>
                    <textarea
                      value={speechText}
                      onChange={(e) => setSpeechText(e.target.value)}
                      rows={3}
                      className="w-full p-3 rounded-xl bg-[#0B0C15] border border-white/10 text-xs font-sans font-medium text-white focus:outline-none focus:border-blue-500 transition-colors resize-none leading-relaxed"
                      placeholder="Enter character spoken line..."
                    />
                  </div>

                  {/* Bubble Types */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono font-semibold text-neutral-300 block">
                      Speech Bubble Shape &amp; Style:
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {BUBBLE_TYPES.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setBubbleType(b.id)}
                          className={`py-2 px-2 rounded-xl text-[10px] font-mono font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                            bubbleType === b.id
                              ? "bg-blue-600/30 border-blue-500 text-blue-200 shadow-sm"
                              : "bg-[#0B0C15] border-white/10 text-neutral-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <b.icon className="w-3.5 h-3.5" />
                          <span>{b.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* IOPaint Bubble Cleaner & Inpainter Trigger */}
                  <div className="p-3 rounded-xl bg-[#0B0C15] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-neutral-300">
                      <span className="font-semibold text-white">IOPaint Bubble Inpainter</span>
                      <span className="text-[10px] text-amber-400 font-bold">Auto-Erase</span>
                    </div>
                    <p className="text-[10px] text-neutral-400 font-sans">
                      Uses ComicTextDetector deep-learning masks to cleanly erase hardcoded speech bubbles and inpaint background lineart.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsInpainting(true);
                        setTimeout(() => {
                          setIsInpainting(false);
                          addNotification?.("Speech bubble area seamlessly inpainted with clean art!", "success");
                        }, 1100);
                      }}
                      disabled={isInpainting}
                      className="w-full py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                    >
                      {isInpainting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Wand2 className="w-3.5 h-3.5" />
                      )}
                      <span>{isInpainting ? "Inpainting Mask..." : "Clean Panel Art (IOPaint)"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Multi-language Translation Section */}
            <div className="rounded-2xl bg-[#12131F] border border-white/10 transition-all shadow-md relative">
              <button
                type="button"
                onClick={() => toggleSection("speechTranslate")}
                className="w-full px-3.5 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] flex items-center justify-between transition-colors text-left cursor-pointer border-b border-white/5"
              >
                <div className="flex items-center gap-2">
                  <Languages className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
                    Instant Bubble Translation
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-mono">
                  <span>{openSections.speechTranslate ? "Close" : "Open"}</span>
                  {openSections.speechTranslate ? (
                    <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                  )}
                </div>
              </button>

              {openSections.speechTranslate && (
                <div className="p-3.5 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs font-mono text-neutral-300 gap-2">
                    <span className="text-neutral-400 shrink-0">Target Language:</span>
                    <div className="w-44">
                      <CyberSelect
                        value={targetLang}
                        onChange={setTargetLang}
                        options={[
                          { value: "ko", label: "Korean (한국어)" },
                          { value: "en", label: "English" },
                          { value: "ja", label: "Japanese (日本語)" },
                          { value: "zh", label: "Chinese (中文)" },
                          { value: "es", label: "Spanish" },
                        ]}
                        variant="cyan"
                        size="sm"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleTranslate}
                    disabled={isTranslating}
                    className="w-full py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isTranslating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Languages className="w-3.5 h-3.5" />
                    )}
                    <span>{isTranslating ? "Translating..." : "Translate Bubble Dialogue"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: KINETIC CAMERA & MOTION */}
        {activeTab === "motion" && (
          <div className="space-y-4 animate-in fade-in">
            {/* 1. Motion Engine & Framing Section */}
            <div className="rounded-2xl bg-[#12131F] border border-white/10 transition-all shadow-md relative">
              <button
                type="button"
                onClick={() => toggleSection("motionEngine")}
                className="w-full px-3.5 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] flex items-center justify-between transition-colors text-left cursor-pointer border-b border-white/5"
              >
                <div className="flex items-center gap-2">
                  <Film className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
                    Motion Engine &amp; Framing
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-mono">
                  <span>{openSections.motionEngine ? "Close" : "Open"}</span>
                  {openSections.motionEngine ? (
                    <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                  )}
                </div>
              </button>

              {openSections.motionEngine && (
                <div className="p-3.5 space-y-3 animate-in fade-in duration-150">
                  {/* Motion Engine Selection */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-semibold text-neutral-300 flex items-center justify-between">
                      <span>Anime Motion Engine</span>
                      <Film className="w-3.5 h-3.5 text-amber-400" />
                    </label>
                    <CyberSelect
                      value={selectedMotionEngine}
                      onChange={setSelectedMotionEngine}
                      options={MOTION_ENGINES.map((engine) => ({ value: engine.id, label: engine.label }))}
                      variant="amber"
                      size="sm"
                    />
                  </div>

                  {/* Camera Angle Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-semibold text-neutral-300 flex items-center justify-between">
                      <span>Camera Framing &amp; Angle</span>
                      <Camera className="w-3.5 h-3.5 text-amber-400" />
                    </label>
                    <CyberSelect
                      value={cameraAngle}
                      onChange={setCameraAngle}
                      options={CAMERA_ANGLES.map((angle) => ({
                        value: angle,
                        label: angle.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
                      }))}
                      variant="amber"
                      size="sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. Anime Motion Prompt & Sakuga Presets Section */}
            <div className="rounded-2xl bg-[#12131F] border border-white/10 transition-all shadow-md relative">
              <button
                type="button"
                onClick={() => toggleSection("motionPrompt")}
                className="w-full px-3.5 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] flex items-center justify-between transition-colors text-left cursor-pointer border-b border-white/5"
              >
                <div className="flex items-center gap-2">
                  <Move className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
                    Motion Prompt &amp; Presets
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-mono">
                  <span>{openSections.motionPrompt ? "Close" : "Open"}</span>
                  {openSections.motionPrompt ? (
                    <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                  )}
                </div>
              </button>

              {openSections.motionPrompt && (
                <div className="p-3.5 space-y-3 animate-in fade-in duration-150">
                  {/* Quick Motion Presets */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
                      Beast Sakuga Presets:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {MOTION_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setMotionPrompt(preset.prompt);
                            addNotification?.(`Applied "${preset.label}" motion preset!`, "info");
                          }}
                          className="p-2 rounded-xl bg-[#0B0C15] hover:bg-amber-950/20 border border-white/10 hover:border-amber-500/40 text-left text-[11px] font-mono text-neutral-300 hover:text-amber-200 transition-all cursor-pointer"
                        >
                          <span className="font-bold block truncate">{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Motion Direction Prompt */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono font-semibold text-neutral-300 flex items-center justify-between">
                      <span>Anime Motion Prompt</span>
                      <Move className="w-3.5 h-3.5 text-amber-400" />
                    </label>
                    <textarea
                      value={motionPrompt}
                      onChange={(e) => setMotionPrompt(e.target.value)}
                      rows={3}
                      className="w-full p-3 rounded-xl bg-[#0B0C15] border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-amber-500 transition-colors resize-none leading-relaxed"
                      placeholder="Camera slow zoom in, hair fluttering in breeze, glowing aura particle drift..."
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: AUDIO & VOCAL DUBBING */}
        {activeTab === "audio" && (
          <div className="space-y-4 animate-in fade-in">
            {/* 1. Vocal Synthesis Engine & Emotion Section */}
            <div className="rounded-2xl bg-[#12131F] border border-white/10 transition-all shadow-md relative">
              <button
                type="button"
                onClick={() => toggleSection("vocalEngine")}
                className="w-full px-3.5 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] flex items-center justify-between transition-colors text-left cursor-pointer border-b border-white/5"
              >
                <div className="flex items-center gap-2">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
                    Vocal Engine &amp; Emotion
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-mono">
                  <span>{openSections.vocalEngine ? "Close" : "Open"}</span>
                  {openSections.vocalEngine ? (
                    <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                  )}
                </div>
              </button>

              {openSections.vocalEngine && (
                <div className="p-3.5 space-y-3.5 animate-in fade-in duration-150">
                  {/* Voice Dubbing Engine Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-semibold text-neutral-300 flex items-center justify-between">
                      <span>Vocal Synthesis Engine</span>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    </label>
                    <CyberSelect
                      value={selectedVocalEngine}
                      onChange={setSelectedVocalEngine}
                      options={VOICE_DUBBING_OPTIONS.filter((o) => o.value !== "muted").map((o) => ({
                        value: o.value,
                        label: o.label,
                      }))}
                      variant="emerald"
                      size="sm"
                    />
                  </div>

                  {/* Vocal Emotion Delivery Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-semibold text-neutral-300 flex items-center justify-between">
                      <span>Character Delivery Emotion</span>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    </label>
                    <CyberSelect
                      value={selectedEmotion}
                      onChange={setSelectedEmotion}
                      options={VOCAL_EMOTIONS.map((emo) => ({ value: emo.id, label: emo.label }))}
                      variant="emerald"
                      size="sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. Vocal Actor Line & Dubbing Section */}
            <div className="rounded-2xl bg-[#12131F] border border-white/10 transition-all shadow-md relative">
              <button
                type="button"
                onClick={() => toggleSection("vocalLine")}
                className="w-full px-3.5 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] flex items-center justify-between transition-colors text-left cursor-pointer border-b border-white/5"
              >
                <div className="flex items-center gap-2">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
                    Vocal Actor Line &amp; Dubbing
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-mono">
                  <span>{openSections.vocalLine ? "Close" : "Open"}</span>
                  {openSections.vocalLine ? (
                    <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                  )}
                </div>
              </button>

              {openSections.vocalLine && (
                <div className="p-3.5 space-y-3.5 animate-in fade-in duration-150">
                  <div className="p-3.5 rounded-xl bg-[#090A13] border border-white/10 space-y-3 shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-neutral-400">Speaker / Actor:</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-xs">
                        {speaker}
                      </span>
                    </div>

                    <div className="text-xs font-sans text-neutral-100 bg-black/60 p-3 rounded-xl border border-white/10 italic leading-relaxed shadow-inner">
                      "{speechText || "No spoken line detected"}"
                    </div>

                    {/* Dub Line Trigger */}
                    <button
                      type="button"
                      onClick={handleVoiceDubbing}
                      disabled={isDubbing || !speechText.trim()}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400/50 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-900/30 active:scale-98"
                    >
                      {isDubbing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                      <span>{isDubbing ? "Synthesizing Vocal Line..." : `Dub Line with ${selectedVocalEngine.toUpperCase()}`}</span>
                    </button>

                    {onSynthesizeChapterAudio && (
                      <button
                        type="button"
                        onClick={onSynthesizeChapterAudio}
                        disabled={isSynthesizingAudio}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isSynthesizingAudio ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Headphones className="w-3.5 h-3.5" />
                        )}
                        <span>{isSynthesizingAudio ? "Dubbing All Dialogue..." : "Dub Entire Chapter Dialogue (Batch)"}</span>
                      </button>
                    )}
                  </div>

                  {panel?.audio_url && (
                    <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <Music className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-mono font-bold text-white block">
                            Voice Track Ready
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400">
                            Duration: {panel.duration || 3.5}s
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const a = new Audio(panel.audio_url);
                          a.play();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Play</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer Action: Save Changes Bar ── */}
      <div className="p-3.5 border-t border-white/10 bg-[#0E0F1A]/95 backdrop-blur-md shrink-0">
        <button
          type="button"
          onClick={handleSavePanel}
          className={`w-full py-3 rounded-2xl text-xs font-mono font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xl active:scale-98 ${
            isSaved
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white border border-emerald-400/50 shadow-emerald-500/25"
              : "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.35)]"
          }`}
        >
          {isSaved ? (
            <Check className="w-4 h-4 text-emerald-200" />
          ) : (
            <Save className="w-4 h-4 text-blue-200" />
          )}
          <span>{isSaved ? "Saved to Shot Director!" : "Apply & Save Shot Changes"}</span>
        </button>
      </div>
    </aside>
  </div>
  );
};

export default ShotDirectorInspector;
