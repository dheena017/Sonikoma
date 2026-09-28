import React, { useEffect, useState, useRef } from "react";
import {
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Maximize2,
  Minimize2,
  Volume2,
  Languages,
  Plus,
  Trash2,
  Play,
  RotateCcw,
  Save,
  Clock,
  Compass,
  Users,
  Film,
  Download,
  Check,
  Sun,
  Moon,
  Sliders,
  Cpu,
  Zap,
  RefreshCw,
  MessageSquare,
  FileText,
  Copy,
  BookOpen,
  Square,
  Mic,
  VolumeX,
} from "lucide-react";
import {
  aiSeriesApi,
  AISeriesProject,
  ChapterSession,
  AISeriesPanel,
  InteractiveSpeechBubble,
} from "@/api/endpoints/aiSeries";
import { useSeriesNavigation } from "../hooks/useSeriesNavigation";

export const ManhwaStudioPage: React.FC = () => {
  const { navigate, seriesId } = useSeriesNavigation();
  const canvasScrollRef = useRef<HTMLElement | null>(null);

  // Project & Chapter State
  const [project, setProject] = useState<AISeriesProject | null>(null);
  const [selectedSessionNum, setSelectedSessionNum] = useState<number>(1);
  const [selectedChapterNum, setSelectedChapterNum] = useState<number>(1);
  const [currentChapter, setCurrentChapter] = useState<ChapterSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [synthesizing, setSynthesizing] = useState(false);

  // Smooth Scroll Navigation Helpers
  const scrollByDelta = (delta: number) => {
    if (canvasScrollRef.current) {
      canvasScrollRef.current.scrollBy({ top: delta, behavior: "smooth" });
    }
  };



  // Keyboard navigation for vertical webtoon continuous scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }
      if (e.key === "ArrowDown") {
        scrollByDelta(250);
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        scrollByDelta(-250);
        e.preventDefault();
      } else if (e.key === "PageDown" || (e.key === " " && !e.shiftKey)) {
        scrollByDelta(650);
        e.preventDefault();
      } else if (e.key === "PageUp" || (e.key === " " && e.shiftKey)) {
        scrollByDelta(-650);
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Layout State (Moveable 3-column & Zen Mode)
  const [leftOpen, setLeftOpen] = useState(true);
  const [leftTab, setLeftTab] = useState<"chapters" | "text">("chapters");
  const [copiedScript, setCopiedScript] = useState(false);
  const [rightOpen, setRightOpen] = useState(true);
  const [zenMode, setZenMode] = useState(false);

  const handleCopyScript = () => {
    if (!currentChapter) return;
    let script = `# ${currentChapter.title} (Season ${selectedSessionNum}, Episode ${selectedChapterNum})\n`;
    if (currentChapter.pacing_role) {
      script += `Pacing Role: ${currentChapter.pacing_role.replace("_", " ")}\n`;
    }
    if (currentChapter.summary) {
      script += `Synopsis: ${currentChapter.summary}\n\n`;
    }
    script += `--- PANELS & DIALOGUE ---\n\n`;
    (currentChapter.panels || []).forEach((p, idx) => {
      script += `[PANEL ${p.panel_index || idx + 1}] (${p.camera_angle || "Standard Angle"})\n`;
      script += `Visual: ${p.prompt}\n`;
      if (p.speech_bubbles && p.speech_bubbles.length > 0) {
        p.speech_bubbles.forEach((b) => {
          script += `  ${b.speaker_name || "Character"} (${b.bubble_type || "speech"}): "${b.text}"\n`;
        });
      } else {
        script += `  [Silent / Atmospheric Scene]\n`;
      }
      if (p.sound_effects) script += `  SFX: ${p.sound_effects}\n`;
      script += `\n`;
    });
    navigator.clipboard.writeText(script);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  // Webtoon Canvas Presentation Theme (Default to Studio Dark Canvas)
  const [canvasTheme, setCanvasTheme] = useState<"paper" | "dark">(() => {
    try {
      return (localStorage.getItem("sonikoma_canvas_theme") as "paper" | "dark") || "dark";
    } catch {
      return "dark";
    }
  });

  const handleSetCanvasTheme = (theme: "paper" | "dark") => {
    setCanvasTheme(theme);
    try {
      localStorage.setItem("sonikoma_canvas_theme", theme);
    } catch {}
  };
  const [panelSpacing, setPanelSpacing] = useState<"standard" | "compact" | "flush">("standard");
  const [imageModel, setImageModel] = useState<string>("gemini-imagen");
  const [bubbleMode, setBubbleMode] = useState<"ai_in_image" | "overlay">("ai_in_image");

  const getModelLabel = (m: string) => {
    switch (m) {
      case "gemini-imagen":
        return "Gemini Imagen 3";
      case "stable-diffusion":
        return "Stable Diffusion (SDXL)";
      case "flux":
        return "Flux.1";
      case "flux-anime":
        return "Flux Anime";
      case "turbo":
        return "SDXL Turbo";
      default:
        return "Gemini Imagen 3";
    }
  };

  // Bubble Inspector State
  const [activeBubble, setActiveBubble] = useState<InteractiveSpeechBubble | null>(null);
  const [activePanelId, setActivePanelId] = useState<string | null>(null);

  // Load project
  useEffect(() => {
    if (!seriesId) return;
    const load = async () => {
      try {
        setLoading(true);
        const p = await aiSeriesApi.getSeries(seriesId);
        setProject(p);
        if (p?.image_model) setImageModel(p.image_model);
        await loadChapter(1, 1);
      } catch (err) {
        console.error("Failed to load Manhwa project:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [seriesId]);

  const loadChapter = async (sessNum: number, chapNum: number) => {
    if (!seriesId) return;
    try {
      setSelectedSessionNum(sessNum);
      setSelectedChapterNum(chapNum);
      const chap = await aiSeriesApi.getChapter(seriesId, sessNum, chapNum);
      if (chap && chap.panels && chap.panels.length > 0) {
        setCurrentChapter(chap);
      } else {
        setSynthesizing(true);
        const updated = await aiSeriesApi.synthesizeChapter(seriesId, sessNum, chapNum, 8, imageModel);
        setCurrentChapter(updated);
      }
    } catch (err) {
      console.warn("Chapter not synthesized yet or empty:", err);
      setCurrentChapter(null);
    } finally {
      setSynthesizing(false);
    }
  };

  const handleSynthesizeChapter = async (overrideModel?: string | React.MouseEvent) => {
    if (!seriesId) return;
    const modelToUse = (typeof overrideModel === "string" ? overrideModel : null) || imageModel;
    try {
      setSynthesizing(true);
      const updated = await aiSeriesApi.synthesizeChapter(
        seriesId,
        selectedSessionNum,
        selectedChapterNum,
        8,
        modelToUse
      );
      setCurrentChapter(updated);
    } catch (err) {
      alert("Failed to synthesize chapter panels.");
    } finally {
      setSynthesizing(false);
    }
  };

  // AI Audio & Image Generation State
  const [synthesizingAudio, setSynthesizingAudio] = useState(false);
  const [renderingImages, setRenderingImages] = useState(false);
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayAudio = (url?: string) => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    if (!url || playingAudioUrl === url) {
      setPlayingAudioUrl(null);
      return;
    }
    const a = new Audio(url);
    audioPlayerRef.current = a;
    setPlayingAudioUrl(url);
    a.play().catch((err) => {
      console.warn("Audio playback error:", err);
      setPlayingAudioUrl(null);
    });
    a.onended = () => setPlayingAudioUrl(null);
  };

  const handleSynthesizeChapterAudio = async () => {
    if (!seriesId) return;
    try {
      setSynthesizingAudio(true);
      const updated = await aiSeriesApi.synthesizeChapterAudio(
        seriesId,
        selectedSessionNum,
        selectedChapterNum
      );
      setCurrentChapter(updated);
    } catch (err) {
      console.error("Failed to dub chapter:", err);
      alert("Failed to dub chapter with Edge-TTS.");
    } finally {
      setSynthesizingAudio(false);
    }
  };

  const handleRenderChapterImages = async () => {
    if (!seriesId) return;
    try {
      setRenderingImages(true);
      const updated = await aiSeriesApi.renderChapterImages(
        seriesId,
        selectedSessionNum,
        selectedChapterNum,
        imageModel,
        true
      );
      setCurrentChapter(updated);
    } catch (err) {
      console.error("Failed to render chapter images:", err);
      alert("Failed to render chapter images.");
    } finally {
      setRenderingImages(false);
    }
  };

  const handleRenderSinglePanel = async (panelId: string, customPrompt?: string) => {
    if (!seriesId) return;
    try {
      setRenderingImages(true);
      const res = await aiSeriesApi.renderPanelImage(seriesId, panelId, {
        prompt: customPrompt,
        image_model: imageModel,
        session_number: selectedSessionNum,
        chapter_number: selectedChapterNum,
      });
      if (res?.image_url) {
        setCurrentChapter((prev) => {
          if (!prev) return null;
          const panels = prev.panels.map((p) => {
            if ((p.panel_id || p.id) === panelId) {
              return { ...p, image_url: res.image_url, prompt: customPrompt || p.prompt };
            }
            return p;
          });
          return { ...prev, panels };
        });
      }
    } catch (err) {
      console.error("Failed to render panel image:", err);
      alert("Failed to render panel image.");
    } finally {
      setRenderingImages(false);
    }
  };

  const handleUpdateBubbleText = async (newText: string) => {
    if (!seriesId || !currentChapter || !activePanelId || !activeBubble) return;
    const updated = { ...activeBubble, text: newText };
    setActiveBubble(updated);

    const chapId = currentChapter.chapter_id || currentChapter.id || "chap_1";
    await aiSeriesApi.updateSpeechBubble(seriesId, chapId, activePanelId, updated);

    // Update local state
    setCurrentChapter((prev) => {
      if (!prev) return null;
      const panels = prev.panels.map((p) => {
        if ((p.panel_id || p.id) === activePanelId) {
          const bubbles = p.speech_bubbles.map((b) =>
            (b.bubble_id || b.id) === (activeBubble.bubble_id || activeBubble.id) ? updated : b
          );
          return { ...p, speech_bubbles: bubbles };
        }
        return p;
      });
      return { ...prev, panels };
    });
  };

  const handleTranslateBubbles = async (targetLang: string) => {
    if (!seriesId || !currentChapter || !activePanelId) return;
    const panel = currentChapter.panels.find((p) => (p.panel_id || p.id) === activePanelId);
    if (!panel || panel.speech_bubbles.length === 0) return;

    try {
      const chapId = currentChapter.chapter_id || currentChapter.id || "chap_1";
      const res = await aiSeriesApi.translateSpeechBubbles(
        seriesId,
        chapId,
        activePanelId,
        targetLang,
        panel.speech_bubbles
      );

      // Refresh local panel
      setCurrentChapter((prev) => {
        if (!prev) return null;
        const panels = prev.panels.map((p) => {
          if ((p.panel_id || p.id) === activePanelId) {
            return { ...p, speech_bubbles: res.translated_bubbles };
          }
          return p;
        });
        return { ...prev, panels };
      });
      alert(`Speech bubbles translated to ${targetLang.toUpperCase()} on canvas!`);
    } catch (err) {
      alert("Translation failed.");
    }
  };

  return (
    <div className="h-full w-full flex-1 flex flex-col bg-[#0B0C0E] text-[#E5E5E5] overflow-hidden min-h-0">
      {/* ── Main Workspace ──── */}
      <div className="flex-1 flex flex-row overflow-hidden relative min-h-0 h-full">
        {/* Left Column: Chapters & Episodes Outliner */}
        {!zenMode && leftOpen && (
          <aside className="w-80 border-r border-[#2F2F2F] bg-[#121212] flex flex-col shrink-0 z-20">
            <div className="p-2.5 border-b border-[#2F2F2F] flex items-center justify-between text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/ai-series")}
                  className="p-1 rounded-lg bg-[#181818] hover:bg-[#202020] border border-[#2F2F2F] text-neutral-400 hover:text-white transition-all cursor-pointer"
                  title="Back to AI Series Hub"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="flex items-center gap-1.5">
                  {leftTab === "chapters" ? (
                    <>
                      <Layers className="w-3.5 h-3.5 text-[#3B82F6]" />
                      Seasons & Chapters
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5 text-[#3B82F6]" />
                      Generated Story Text
                    </>
                  )}
                </span>
              </div>
              <button
                onClick={() => setLeftOpen(false)}
                className="p-1 rounded-lg hover:bg-[#1E1E1E] text-neutral-400 hover:text-white transition-all cursor-pointer"
                title="Collapse Panel"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Active Skill Indicator */}
            <div className="px-3 py-1.5 bg-blue-950/20 border-b border-[#2F2F2F] flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-blue-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-400" />
                Director: series_arc_manhwa
              </span>
              <span className="text-[9px] font-mono text-neutral-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                Infinite Strip
              </span>
            </div>

            {/* Sidebar View Tabs */}
            <div className="p-2 border-b border-[#2F2F2F] bg-[#0E0E0E]">
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#181818] rounded-xl border border-[#262626]">
                <button
                  onClick={() => setLeftTab("chapters")}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    leftTab === "chapters"
                      ? "bg-[#252525] text-[#60A5FA] shadow-sm border border-[#3B82F6]/40"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Chapters</span>
                </button>
                <button
                  onClick={() => setLeftTab("text")}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    leftTab === "text"
                      ? "bg-[#252525] text-[#60A5FA] shadow-sm border border-[#3B82F6]/40"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Story Text</span>
                  {currentChapter?.panels?.length ? (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                      {currentChapter.panels.length}P
                    </span>
                  ) : null}
                </button>
              </div>
            </div>

            {/* Tab 1: Chapters Outliner */}
            {leftTab === "chapters" && (
              <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-purple-scrollbar">
                {project?.sessions.map((sess) => (
                  <div key={sess.session_number} className="space-y-1.5">
                    <div className="text-[11px] font-mono font-bold text-[#60A5FA] uppercase tracking-wider px-2 py-1 flex items-center justify-between">
                      <span>Season {sess.session_number}</span>
                      <span className="text-[9px] text-neutral-500">{sess.chapters.length} Eps</span>
                    </div>
                    {sess.chapters.map((chap) => {
                      const isSelected =
                        selectedSessionNum === sess.session_number &&
                        selectedChapterNum === chap.chapter_number;
                      const hasPanels = chap.panels && chap.panels.length > 0;
                      return (
                        <button
                          key={chap.chapter_number}
                          onClick={() => loadChapter(sess.session_number, chap.chapter_number)}
                          className={`w-full text-left p-2.5 rounded-xl text-xs font-mono transition-all flex items-center justify-between gap-2 cursor-pointer border ${
                            isSelected
                              ? "bg-[#1E1E1E] text-white border-[#3B82F6] ring-1 ring-[#3B82F6]/30 shadow-md"
                              : "bg-[#0E0E0E] text-neutral-400 hover:text-white hover:bg-[#161616] border-[#2F2F2F]"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] font-bold ${isSelected ? "text-[#60A5FA]" : "text-neutral-500"}`}>
                                #{String(chap.chapter_number).padStart(2, "0")}
                              </span>
                              <span className="truncate font-semibold text-neutral-200">
                                {chap.title}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {hasPanels ? (
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
                                {chap.panels.length}P
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-500/30">
                                Draft
                              </span>
                            )}
                            {chap.is_series_finale && (
                              <span className="text-[9px] bg-rose-950/40 text-rose-400 border border-rose-500/30 px-1 py-0.5 rounded font-mono font-bold">
                                End
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* Tab 2: Generated Story Text & Script */}
            {leftTab === "text" && (
              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-purple-scrollbar">
                {/* Chapter Synopsis & Metadata */}
                <div className="p-3 rounded-xl bg-[#161616] border border-[#2F2F2F] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#60A5FA] uppercase tracking-wider">
                      S{selectedSessionNum} • Ep {selectedChapterNum}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {currentChapter?.pacing_role && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-950/40 text-blue-400 border border-blue-500/30 font-semibold capitalize">
                          {currentChapter.pacing_role.replace("_", " ")}
                        </span>
                      )}
                      <button
                        onClick={handleCopyScript}
                        className="p-1 rounded bg-[#202020] hover:bg-[#282828] text-neutral-300 hover:text-white border border-[#3A3A3A] transition-all cursor-pointer"
                        title="Copy Full Chapter Script"
                      >
                        {copiedScript ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-xs font-bold text-white font-mono leading-tight">
                    {currentChapter?.title || "Untitled Chapter"}
                  </div>

                  {currentChapter?.summary && (
                    <p className="text-[11px] text-neutral-300 leading-relaxed bg-[#0E0E0E] p-2 rounded-lg border border-[#222]">
                      {currentChapter.summary}
                    </p>
                  )}

                  {currentChapter?.is_series_finale && currentChapter?.guaranteed_resolution_notes && (
                    <div className="p-2 rounded-lg bg-rose-950/20 border border-rose-500/30 text-[10px] text-rose-300 font-mono">
                      ✨ {currentChapter.guaranteed_resolution_notes}
                    </div>
                  )}
                </div>

                {/* AI Audio Dubbing & Image Rendering Action Bar */}
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#171922] to-[#12131A] border border-[#2B2F42] space-y-2">
                  <div className="text-[10px] font-mono font-bold text-[#60A5FA] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Cpu className="w-3 h-3 text-[#60A5FA]" />
                      AI Studio Engines
                    </span>
                    <span className="text-[9px] text-neutral-400">Edge-TTS & Flux</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {/* Synthesize All Audio */}
                    <button
                      onClick={handleSynthesizeChapterAudio}
                      disabled={synthesizingAudio || !currentChapter?.panels?.length}
                      className="px-2 py-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/40 text-blue-200 text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-sm"
                      title="Generate Edge-TTS voice performance for all dialogue bubbles"
                    >
                      {synthesizingAudio ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                          <span>Dubbing...</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3 text-blue-400" />
                          <span>Dub All Audio</span>
                        </>
                      )}
                    </button>

                    {/* Batch Render / Cache Images */}
                    <button
                      onClick={handleRenderChapterImages}
                      disabled={renderingImages || !currentChapter?.panels?.length}
                      className="px-2 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-purple-200 text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-sm"
                      title="Pre-render and locally cache all panel images with the chosen model"
                    >
                      {renderingImages ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin text-purple-400" />
                          <span>Cache Images</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-purple-400" />
                          <span>Cache Images</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Panel Breakdown Cards */}
                <div className="space-y-2">
                  <div className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider px-1 flex items-center justify-between">
                    <span>Generated Panels & Dialogue</span>
                    <span className="text-neutral-500">{currentChapter?.panels?.length || 0} Panels</span>
                  </div>

                  {(!currentChapter?.panels || currentChapter.panels.length === 0) ? (
                    <div className="p-4 rounded-xl bg-[#141414] border border-dashed border-[#2F2F2F] text-center text-neutral-500 text-xs font-mono">
                      No generated text available yet. Click "Synthesize Chapter" below to create panels & dialogue.
                    </div>
                  ) : (
                    currentChapter.panels.map((panel, idx) => {
                      const panelId = panel.panel_id || panel.id;
                      const isSelected = activePanelId === panelId;
                      return (
                        <div
                          key={panelId || idx}
                          onClick={() => setActivePanelId(panelId)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                            isSelected
                              ? "bg-[#1C1D22] border-[#3B82F6] ring-1 ring-[#3B82F6]/30 shadow-md"
                              : "bg-[#141414] border-[#252525] hover:border-[#383838] hover:bg-[#181818]"
                          }`}
                        >
                          {/* Panel Header */}
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-neutral-300 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                              Panel #{String(panel.panel_index || idx + 1).padStart(2, "0")}
                            </span>
                            <div className="flex items-center gap-1">
                              {panel.camera_angle && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
                                  {panel.camera_angle}
                                </span>
                              )}
                              {panel.speech_bubbles && panel.speech_bubbles.length > 0 && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-950/40 text-blue-400 border border-blue-500/20">
                                  {panel.speech_bubbles.length}💬
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Visual Scene Description */}
                          <div className="text-[11px] text-neutral-300 leading-relaxed font-sans bg-[#0B0C0E] p-2 rounded-lg border border-[#202020] space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase block">
                                Visual Prompt
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRenderSinglePanel(panelId, panel.prompt);
                                }}
                                disabled={renderingImages}
                                className="p-0.5 px-1.5 rounded bg-[#1C1C1C] hover:bg-[#252525] text-neutral-400 hover:text-white border border-[#333] text-[9px] font-mono flex items-center gap-1 cursor-pointer transition-all shrink-0"
                                title="Re-render this panel image"
                              >
                                <RefreshCw className={`w-2.5 h-2.5 ${renderingImages ? "animate-spin" : ""}`} />
                                <span>Re-render</span>
                              </button>
                            </div>
                            <div>{panel.prompt}</div>
                          </div>

                          {/* Speech Bubbles / Dialogue */}
                          {panel.speech_bubbles && panel.speech_bubbles.length > 0 ? (
                            <div className="space-y-1.5 pt-1 border-t border-[#222]">
                              <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase block">
                                Dialogue Beats
                              </span>
                              {panel.speech_bubbles.map((b, bIdx) => (
                                <div
                                  key={b.bubble_id || bIdx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActivePanelId(panelId);
                                    setActiveBubble(b);
                                  }}
                                  className="p-1.5 rounded-lg bg-[#18191E] border border-[#2A2B33] hover:border-[#3B82F6]/50 text-[11px] space-y-0.5 transition-colors cursor-pointer"
                                >
                                  <div className="flex items-center justify-between text-[9px] font-mono">
                                    <span className="font-bold text-[#60A5FA]">
                                      {b.speaker_name || "Character"}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-neutral-500 capitalize">{b.bubble_type || "speech"}</span>
                                      {b.audio_url && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handlePlayAudio(b.audio_url);
                                          }}
                                          className={`p-0.5 px-1.5 rounded flex items-center gap-1 text-[9px] font-mono font-bold transition-all cursor-pointer ${
                                            playingAudioUrl === b.audio_url
                                              ? "bg-blue-600 text-white animate-pulse"
                                              : "bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-500/30"
                                          }`}
                                          title="Play synthesized character voice"
                                        >
                                          {playingAudioUrl === b.audio_url ? (
                                            <>
                                              <Square className="w-2.5 h-2.5 fill-current" />
                                              <span>Stop</span>
                                            </>
                                          ) : (
                                            <>
                                              <Play className="w-2.5 h-2.5 fill-current" />
                                              <span>Voice</span>
                                            </>
                                          )}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-neutral-200 font-sans italic">
                                    "{b.text}"
                                  </div>
                                </div>
                              ))}
                            </div>

                          ) : (
                            <div className="text-[10px] text-neutral-500 font-mono italic px-1">
                              [Silent / Atmospheric Panel]
                            </div>
                          )}

                          {/* SFX / Sound effect if any */}
                          {panel.sound_effects && (
                            <div className="text-[9px] font-mono text-amber-400 bg-amber-950/20 px-2 py-0.5 rounded border border-amber-500/20">
                              SFX: {panel.sound_effects}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Cast DNA Reference Card */}
                {project?.cast && project.cast.length > 0 && (
                  <div className="p-3 rounded-xl bg-[#141414] border border-[#252525] space-y-2">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">
                      Active Cast DNA
                    </span>
                    <div className="space-y-1.5">
                      {project.cast.map((char) => (
                        <div key={char.character_id} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-[#0E0E0E] border border-[#202020]">
                          <span className="font-mono font-semibold text-neutral-200">{char.name}</span>
                          <span className="text-[9px] font-mono text-neutral-400 capitalize">{char.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Synthesize CTA in Sidebar */}
            <div className="p-3 border-t border-[#2F2F2F] bg-[#0E0E0E]">
              <button
                onClick={() => handleSynthesizeChapter()}
                disabled={synthesizing}
                className="w-full py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer disabled:opacity-50 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                {synthesizing
                  ? `Painting with ${getModelLabel(imageModel)}...`
                  : `Synthesize Chapter (${getModelLabel(imageModel)})`}
              </button>
            </div>
          </aside>
        )}

        {/* Floating Left Reopen Chevron */}
        {!zenMode && !leftOpen && (
          <button
            onClick={() => setLeftOpen(true)}
            className="absolute left-2 top-4 z-30 p-2 rounded-xl bg-[#121212] border border-[#2F2F2F] text-neutral-300 hover:text-white shadow-xl hover:scale-105 cursor-pointer"
            title="Expand Chapters"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Center Canvas (Vertical Scroll Webtoon) */}
        <div
          className={`flex-1 min-h-0 h-full relative overflow-hidden transition-colors duration-300 ${
            canvasTheme === "paper" ? "bg-[#E6E8EC]" : "bg-[#08080A]"
          }`}
        >
          <main
            ref={canvasScrollRef}
            tabIndex={0}
            className="absolute inset-0 h-full w-full overflow-y-auto overflow-x-hidden flex flex-col items-center py-8 px-4 studio-visible-scrollbar outline-none overscroll-y-contain"
          >
            {loading ? (
              <div className="my-auto flex flex-col items-center gap-3 text-neutral-500 text-xs font-mono">
                <Sparkles className="w-6 h-6 text-[#3B82F6] animate-pulse" />
                <span>Loading Chapter Canvas...</span>
              </div>
            ) : !currentChapter || currentChapter.panels.length === 0 ? (
              <div className="my-auto text-center p-8 bg-[#121212] border border-[#2F2F2F] rounded-2xl max-w-md shadow-2xl">
                <Layers className="w-12 h-12 text-[#3B82F6] mx-auto mb-3 opacity-80" />
                <h3 className="text-base font-bold text-white mb-1 font-mono">
                  Chapter S{selectedSessionNum}:C{selectedChapterNum} Not Generated
                </h3>
                <p className="text-xs text-neutral-400 mb-6 font-sans leading-relaxed">
                  Click below to synthesize authentic 2D Korean webtoon panels with soft cel-shading, interactive speech bubbles, and slice-of-life storytelling.
                </p>
                <button
                  onClick={() => handleSynthesizeChapter()}
                  disabled={synthesizing}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-mono font-bold shadow-lg shadow-blue-500/20 cursor-pointer transition-all"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  {synthesizing
                    ? `Painting Webtoon Strip (${getModelLabel(imageModel)})...`
                    : `Synthesize Chapter Now (${getModelLabel(imageModel)})`}
                </button>
              </div>
            ) : (
              <div
                className={`w-full max-w-[760px] flex flex-col shadow-2xl rounded-2xl transition-all ${
                  canvasTheme === "paper"
                    ? "bg-white text-neutral-900 border border-neutral-300"
                    : "bg-[#0E0E0E] text-neutral-200 border border-[#2F2F2F]"
                }`}
              >
                {/* Strip Top Info Header */}
                <div
                  className={`px-6 py-3.5 flex items-center justify-between text-xs font-mono border-b ${
                    canvasTheme === "paper"
                      ? "bg-neutral-50/90 border-neutral-200 text-neutral-600"
                      : "bg-[#121212] border-[#2F2F2F] text-neutral-400"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-600">
                      S{selectedSessionNum} • EPISODE {currentChapter.chapter_number}
                    </span>
                    <span>•</span>
                    <span className="font-semibold truncate max-w-sm">
                      {currentChapter.title}
                    </span>
                  </div>
                  <span className="font-bold text-emerald-600">
                    {currentChapter.panels.length} Continuous Panels
                  </span>
                </div>

                {/* Vertical Continuous Webtoon Panels Container */}
                <div
                  className={`flex flex-col ${
                    panelSpacing === "standard"
                      ? "space-y-12 py-10 px-8"
                      : panelSpacing === "compact"
                      ? "space-y-4 py-6 px-4"
                      : "space-y-0 p-0"
                  }`}
                >
                  {currentChapter.panels.map((panel, pIdx) => {
                    const panelId = panel.panel_id || panel.id || `panel_${pIdx}`;
                    const isSelected = activePanelId === panelId;

                    return (
                      <div
                        key={panelId}
                        onClick={() => setActivePanelId(panelId)}
                        className={`relative group cursor-pointer transition-all ${
                          panelSpacing !== "flush" ? "rounded-xl overflow-hidden shadow-md" : ""
                        } ${
                          canvasTheme === "paper"
                            ? "bg-neutral-100 border border-neutral-200/90"
                            : "bg-[#161616] border border-[#2F2F2F]"
                        } ${isSelected ? "ring-4 ring-[#3B82F6]/60" : ""}`}
                      >
                        <img
                          src={panel.image_url}
                          alt={`Panel ${panel.panel_index}`}
                          className="w-full h-auto object-cover block select-none pointer-events-none"
                          draggable={false}
                          loading="lazy"
                        />

                        {/* Comic Sound Effect Floating Badge (Overlay Mode Only) */}
                        {bubbleMode === "overlay" && panel.sound_effects && (
                          <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-lg bg-amber-300 text-amber-950 font-black italic tracking-wider text-xs border border-amber-400 shadow-lg uppercase select-none pointer-events-none transform -rotate-3">
                            {panel.sound_effects.replace(/[\[\]]/g, "")}
                          </div>
                        )}

                        {/* Interactive Floating Speech Bubbles (Overlay Mode Only) */}
                        {bubbleMode === "overlay" && panel.speech_bubbles.map((bubble) => {
                          const bubbleId = bubble.bubble_id || bubble.id || `bub_${pIdx}`;
                          const isBubbleActive =
                            activeBubble?.bubble_id === bubbleId || activeBubble?.id === bubbleId;

                          return (
                            <div
                              key={bubbleId}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActivePanelId(panelId);
                                setActiveBubble(bubble);
                              }}
                              style={{
                                left: `${bubble.pos_x}%`,
                                top: `${bubble.pos_y}%`,
                                width: `${bubble.width}%`,
                                backgroundColor: bubble.bg_color || "#FFFFFF",
                                color: bubble.text_color || "#111827",
                                borderColor: bubble.border_color || "#1F2937",
                                borderWidth: `${bubble.border_width || 2}px`,
                                fontFamily: bubble.font_family || "inherit",
                                fontSize: `${bubble.font_size || 14}px`,
                              }}
                              className={`absolute p-3 rounded-[24px] border shadow-xl transition-transform hover:scale-105 cursor-pointer leading-tight select-text text-center font-sans font-medium ${
                                isBubbleActive ? "ring-4 ring-[#3B82F6]" : ""
                              }`}
                            >
                              {bubble.text}

                              {/* Play Voice Button on Speech Bubble */}
                              {bubble.audio_url && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlayAudio(bubble.audio_url);
                                  }}
                                  className={`absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer ${
                                    playingAudioUrl === bubble.audio_url
                                      ? "bg-blue-600 text-white animate-pulse"
                                      : "bg-blue-900 text-blue-200 border border-blue-400 hover:bg-blue-800"
                                  }`}
                                  title="Play character voice line"
                                >
                                  {playingAudioUrl === bubble.audio_url ? (
                                    <Square className="w-2.5 h-2.5 fill-current" />
                                  ) : (
                                    <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                                  )}
                                </button>
                              )}

                              {/* Curved SVG Tail Pointer */}
                              <svg
                                className="absolute -bottom-3 left-8 w-5 h-4 overflow-visible pointer-events-none"
                                viewBox="0 0 20 16"
                                fill="none"
                              >
                                <path
                                  d="M0 0 C 4 8, 8 16, 20 16 C 14 10, 10 4, 10 0 Z"
                                  fill={bubble.bg_color || "#FFFFFF"}
                                  stroke={bubble.border_color || "#1F2937"}
                                  strokeWidth="2"
                                />
                              </svg>
                            </div>
                          );
                        })}

                        {/* Panel Overlay Label */}
                        <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-mono font-bold text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 flex items-center gap-1.5 z-10">
                          <span>Panel {panel.panel_index}</span>
                          <span>•</span>
                          <span className="text-[#60A5FA]">{panel.camera_angle || "Cinematic"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Chapter End Marker */}
                <div
                  className={`p-8 text-center border-t flex flex-col items-center gap-2 ${
                    canvasTheme === "paper"
                      ? "bg-neutral-50/80 border-neutral-200 text-neutral-600"
                      : "bg-[#121212] border-[#2F2F2F] text-neutral-400"
                  }`}
                >
                  <span className="font-mono text-xs font-bold tracking-widest text-blue-600 uppercase">
                    End of Episode {currentChapter.chapter_number}
                  </span>
                  <p className="text-xs font-sans">
                    {currentChapter.is_series_finale
                      ? "Series Grand Finale • Story Arc Completed"
                      : "Continue to next episode from the left sidebar"}
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Right Column: Bubble Inspector & Chapter Tools */}
        {!zenMode && rightOpen && (
          <aside className="w-80 border-l border-[#2F2F2F] bg-[#121212] flex flex-col shrink-0 z-20">
            <div className="p-2.5 border-b border-[#2F2F2F] flex items-center justify-between text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
                Inspector
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => navigate(`/series/${seriesId}/export`)}
                  className="px-2 py-0.5 rounded bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer shadow-sm transition-all"
                  title="Export Webtoon Chapter"
                >
                  <Download className="w-3 h-3" /> Export
                </button>
                <button
                  onClick={() => setRightOpen(false)}
                  className="p-1 rounded-lg hover:bg-[#1E1E1E] text-neutral-400 hover:text-white transition-all cursor-pointer"
                  title="Collapse Inspector"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-purple-scrollbar">
              {/* Speech Bubble Editor */}
              {activeBubble ? (
                <div className="space-y-4 bg-[#0E0E0E] p-3.5 rounded-2xl border border-[#2F2F2F]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
                      Edit Bubble Text
                    </span>
                    <span className="text-[10px] text-[#60A5FA] font-mono font-bold bg-[#1E1E1E] px-2 py-0.5 rounded border border-[#2F2F2F]">
                      {activeBubble.speaker_name || "Speaker"}
                    </span>
                  </div>

                  <textarea
                    rows={3}
                    value={activeBubble.text}
                    onChange={(e) => handleUpdateBubbleText(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2F2F2F] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#3B82F6] font-sans resize-none transition-colors"
                  />

                  {/* Multi-Language Live Canvas Translation */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Languages className="w-3.5 h-3.5 text-[#3B82F6]" /> On-Canvas Translation
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleTranslateBubbles("ja")}
                        className="py-1.5 px-2 bg-[#181818] hover:bg-[#202020] border border-[#2F2F2F] text-xs font-mono font-semibold rounded-xl text-neutral-200 hover:text-white transition-all cursor-pointer"
                      >
                        Japanese (日本語)
                      </button>
                      <button
                        onClick={() => handleTranslateBubbles("ko")}
                        className="py-1.5 px-2 bg-[#181818] hover:bg-[#202020] border border-[#2F2F2F] text-xs font-mono font-semibold rounded-xl text-neutral-200 hover:text-white transition-all cursor-pointer"
                      >
                        Korean (한국어)
                      </button>
                    </div>
                  </div>

                  {/* Bubble Font Size */}
                  <div>
                    <div className="flex justify-between text-xs font-mono text-neutral-400 mb-1.5">
                      <span>Font Size</span>
                      <span className="text-white font-bold">{activeBubble.font_size}px</span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={26}
                      value={activeBubble.font_size}
                      onChange={(e) => {
                        const updated = { ...activeBubble, font_size: Number(e.target.value) };
                        setActiveBubble(updated);
                        if (seriesId && currentChapter && activePanelId) {
                          const chapId = currentChapter.chapter_id || currentChapter.id || "chap_1";
                          aiSeriesApi.updateSpeechBubble(seriesId, chapId, activePanelId, updated);
                        }
                      }}
                      className="w-full accent-[#3B82F6] cursor-pointer"
                    />
                  {/* Voice Dubbing Performance */}
                  <div className="pt-2 border-t border-[#222]">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                        <Mic className="w-3.5 h-3.5 text-[#3B82F6]" /> Voice Dub Performance
                      </label>
                      {activeBubble.audio_url && (
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30">
                          {activeBubble.duration_seconds ? `${activeBubble.duration_seconds}s` : "Dubbed"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {activeBubble.audio_url ? (
                        <button
                          onClick={() => handlePlayAudio(activeBubble.audio_url)}
                          className={`flex-1 py-1.5 px-3 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            playingAudioUrl === activeBubble.audio_url
                              ? "bg-blue-600 text-white animate-pulse"
                              : "bg-blue-950/60 hover:bg-blue-900/60 text-blue-200 border border-blue-500/40"
                          }`}
                        >
                          {playingAudioUrl === activeBubble.audio_url ? (
                            <>
                              <Square className="w-3.5 h-3.5 fill-current" />
                              <span>Stop Voice</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Play Character Voice</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            if (!seriesId) return;
                            try {
                              setSynthesizingAudio(true);
                              const res = await aiSeriesApi.synthesizeVoice(seriesId, {
                                speaker_name: activeBubble.speaker_name || "Character",
                                text: activeBubble.text,
                                panel_id: activePanelId,
                              });
                              if (res?.audio_url) {
                                const updated = { ...activeBubble, audio_url: res.audio_url, duration_seconds: res.duration_seconds };
                                setActiveBubble(updated);
                                setCurrentChapter((prev) => {
                                  if (!prev) return null;
                                  const panels = prev.panels.map((p) => {
                                    if ((p.panel_id || p.id) === activePanelId) {
                                      const bubbles = p.speech_bubbles.map((b) =>
                                        (b.bubble_id || b.id) === (activeBubble.bubble_id || activeBubble.id) ? updated : b
                                      );
                                      return { ...p, speech_bubbles: bubbles };
                                    }
                                    return p;
                                  });
                                  return { ...prev, panels };
                                });
                                handlePlayAudio(res.audio_url);
                              }
                            } catch (err) {
                              alert("Failed to synthesize voice track.");
                            } finally {
                              setSynthesizingAudio(false);
                            }
                          }}
                          disabled={synthesizingAudio}
                          className="flex-1 py-1.5 px-3 rounded-xl font-mono text-xs font-bold bg-blue-950/60 hover:bg-blue-900/60 text-blue-200 border border-blue-500/40 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                          <span>{synthesizingAudio ? "Synthesizing..." : "Dub Line (Edge-TTS)"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#0E0E0E] border border-[#2F2F2F] text-center text-xs text-neutral-400 font-mono space-y-2">
                  <Sparkles className="w-6 h-6 text-[#3B82F6] mx-auto opacity-70" />
                  <div>Click any speech bubble on the canvas to edit dialogue or trigger voice dubbing.</div>
                </div>
              )}

              {/* Selected Panel Image Generator Controls */}
              {activePanelId && (
                <div className="bg-[#0E0E0E] p-3.5 rounded-2xl border border-[#2F2F2F] space-y-2.5 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-[#3B82F6]" />
                      Panel Image Engine
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {currentChapter?.panels?.find(p => (p.panel_id || p.id) === activePanelId)?.panel_index ? `Panel #${currentChapter.panels.find(p => (p.panel_id || p.id) === activePanelId)?.panel_index}` : ""}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                      AI Image Model
                    </label>
                    <select
                      value={imageModel}
                      onChange={(e) => setImageModel(e.target.value)}
                      className="w-full bg-[#161616] border border-[#2F2F2F] rounded-xl px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-[#3B82F6] cursor-pointer"
                    >
                      <option value="flux-anime">Flux-Anime (Recommended 2D)</option>
                      <option value="turbo">SDXL Turbo (High-Speed ~3s)</option>
                      <option value="flux">Flux.1 Schnell</option>
                      <option value="stable-diffusion">Stable Diffusion Standard</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      const p = currentChapter?.panels?.find(p => (p.panel_id || p.id) === activePanelId);
                      if (p) handleRenderSinglePanel(activePanelId, p.prompt);
                    }}
                    disabled={renderingImages}
                    className="w-full py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${renderingImages ? "animate-spin" : ""}`} />
                    <span>{renderingImages ? "Rendering Panel..." : "Re-render Panel Image"}</span>
                  </button>
                </div>
              )}

              {/* Active Chapter Details & Story Metadata Card */}
              {currentChapter && (
                <div className="bg-[#0E0E0E] p-4 rounded-2xl border border-[#2F2F2F] space-y-3 font-mono">
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span>Scene Director</span>
                    <span className="text-[10px] text-[#60A5FA] bg-[#1E1E1E] px-2 py-0.5 rounded border border-[#2F2F2F]">
                      {currentChapter.pacing_role || "Rising Action"}
                    </span>
                  </div>

                  <div className="text-[11px] text-neutral-300 font-sans leading-relaxed">
                    {currentChapter.summary || "Alliances are tested as clues to the central conspiracy deepen."}
                  </div>

                  <div className="pt-2 border-t border-[#2F2F2F] flex items-center justify-between text-[11px] text-neutral-400">
                    <span>Continuity DNA Lock:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Synchronized
                    </span>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Floating Right Reopen Chevron */}
        {!zenMode && !rightOpen && (
          <button
            onClick={() => setRightOpen(true)}
            className="absolute right-2 top-4 z-30 p-2 rounded-xl bg-[#121212] border border-[#2F2F2F] text-neutral-300 hover:text-white shadow-xl hover:scale-105 cursor-pointer"
            title="Expand Inspector"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ManhwaStudioPage;
