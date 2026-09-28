import React, { useEffect, useState, useRef } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Maximize2,
  Minimize2,
  Grid,
  Languages,
  Play,
  Users,
  Compass,
  Clock,
  Download,
  FileText,
  Layers,
  Copy,
  Check,
  Volume2,
  Cpu,
  RefreshCw,
  Square,
  Mic,
} from "lucide-react";
import {
  aiSeriesApi,
  AISeriesProject,
  ChapterSession,
  InteractiveSpeechBubble,
} from "@/api/endpoints/aiSeries";
import { useSeriesNavigation } from "../hooks/useSeriesNavigation";

export const ComicStudioPage: React.FC = () => {
  const { navigate, seriesId } = useSeriesNavigation();
  const [project, setProject] = useState<AISeriesProject | null>(null);
  const [selectedSessionNum, setSelectedSessionNum] = useState<number>(1);
  const [selectedChapterNum, setSelectedChapterNum] = useState<number>(1);
  const [currentChapter, setCurrentChapter] = useState<ChapterSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [synthesizing, setSynthesizing] = useState(false);

  // Layout State
  const [leftOpen, setLeftOpen] = useState(true);
  const [leftTab, setLeftTab] = useState<"chapters" | "text">("chapters");
  const [copiedScript, setCopiedScript] = useState(false);
  const [rightOpen, setRightOpen] = useState(true);
  const [zenMode, setZenMode] = useState(false);
  const [screentoneFilter, setScreentoneFilter] = useState(true);
  const [bubbleMode, setBubbleMode] = useState<"ai_in_image" | "overlay">("ai_in_image");
  const [imageModel, setImageModel] = useState<string>("gemini-imagen");

  const handleCopyScript = () => {
    if (!currentChapter) return;
    let script = `# ${currentChapter.title} (Season ${selectedSessionNum}, Episode ${selectedChapterNum})\n`;
    if (currentChapter.pacing_role) {
      script += `Pacing Role: ${currentChapter.pacing_role.replace("_", " ")}\n`;
    }
    if (currentChapter.summary) {
      script += `Synopsis: ${currentChapter.summary}\n\n`;
    }
    script += `--- COMIC PANELS & DIALOGUE ---\n\n`;
    (currentChapter.panels || []).forEach((p, idx) => {
      script += `[PANEL ${p.panel_index || idx + 1}] (${p.camera_angle || "Standard Angle"})\n`;
      script += `Visual: ${p.prompt}\n`;
      if (p.speech_bubbles && p.speech_bubbles.length > 0) {
        p.speech_bubbles.forEach((b) => {
          script += `  ${b.speaker_name || "Character"} (${b.bubble_type || "speech"}): "${b.text}"\n`;
        });
      } else {
        script += `  [Silent Action]\n`;
      }
      if (p.sound_effects) script += `  SFX: ${p.sound_effects}\n`;
      script += `\n`;
    });
    navigator.clipboard.writeText(script);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

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

  // Active Bubble
  const [activeBubble, setActiveBubble] = useState<InteractiveSpeechBubble | null>(null);
  const [activePanelId, setActivePanelId] = useState<string | null>(null);

  const canvasScrollRef = React.useRef<HTMLDivElement | null>(null);

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
        console.error("Failed to load Comic project:", err);
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
        const updated = await aiSeriesApi.synthesizeChapter(seriesId, sessNum, chapNum, 6, imageModel);
        setCurrentChapter(updated);
      }
    } catch (err) {
      console.warn("Comic chapter fetch/synth error:", err);
      setCurrentChapter(null);
    } finally {
      setSynthesizing(false);
    }
  };

  const handleSynthesize = async () => {
    if (!seriesId) return;
    try {
      setSynthesizing(true);
      const updated = await aiSeriesApi.synthesizeChapter(seriesId, selectedSessionNum, selectedChapterNum, 6, imageModel);
      setCurrentChapter(updated);
    } catch (err) {
      alert("Failed to synthesize comic panels.");
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




  return (
    <div className="h-full w-full flex-1 flex flex-col bg-[#0B0C0E] text-[#E5E5E5] overflow-hidden min-h-0">
      {/* ── Main Workspace ──── */}
      <div className="flex-1 flex flex-row overflow-hidden relative min-h-0 h-full">
        {/* Left Column: Chapters */}
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
                      <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                      Chapters & Spreads
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
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
            <div className="px-3 py-1.5 bg-emerald-950/20 border-b border-[#2F2F2F] flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Director: series_arc_comic
              </span>
              <span className="text-[9px] font-mono text-neutral-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                Koma-wari Grid
              </span>
            </div>

            {/* Sidebar View Tabs */}
            <div className="p-2 border-b border-[#2F2F2F] bg-[#0E0E0E]">
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#181818] rounded-xl border border-[#262626]">
                <button
                  onClick={() => setLeftTab("chapters")}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    leftTab === "chapters"
                      ? "bg-[#252525] text-emerald-400 shadow-sm border border-emerald-500/40"
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
                      ? "bg-[#252525] text-emerald-400 shadow-sm border border-emerald-500/40"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Story Text</span>
                  {currentChapter?.panels?.length ? (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
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
                    <div className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
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
                              ? "bg-[#1E1E1E] text-white border-emerald-500/70 ring-1 ring-emerald-500/30 shadow-md"
                              : "bg-[#0E0E0E] text-neutral-400 hover:text-white hover:bg-[#161616] border-[#2F2F2F]"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] font-bold ${isSelected ? "text-emerald-400" : "text-neutral-500"}`}>
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
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                      S{selectedSessionNum} • Ep {selectedChapterNum}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {currentChapter?.pacing_role && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 font-semibold capitalize">
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
                </div>

                {/* AI Audio Dubbing & Image Rendering Action Bar */}
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#171922] to-[#12131A] border border-[#2B2F42] space-y-2">
                  <div className="text-[10px] font-mono font-bold text-emerald-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Cpu className="w-3 h-3 text-emerald-400" />
                      AI Manga Engines
                    </span>
                    <span className="text-[9px] text-neutral-400">Edge-TTS & B&W Manga</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {/* Synthesize All Audio */}
                    <button
                      onClick={handleSynthesizeChapterAudio}
                      disabled={synthesizingAudio || !currentChapter?.panels?.length}
                      className="px-2 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-200 text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-sm"
                      title="Generate Edge-TTS voice performance for all dialogue bubbles"
                    >
                      {synthesizingAudio ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                          <span>Dubbing...</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3 text-emerald-400" />
                          <span>Dub All Audio</span>
                        </>
                      )}
                    </button>

                    {/* Batch Render / Cache Images */}
                    <button
                      onClick={handleRenderChapterImages}
                      disabled={renderingImages || !currentChapter?.panels?.length}
                      className="px-2 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-purple-200 text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-sm"
                      title="Pre-render and locally cache all comic panel images"
                    >
                      {renderingImages ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin text-purple-400" />
                          <span>Caching...</span>
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
                    <span>Comic Panels & Dialogue</span>
                    <span className="text-neutral-500">{currentChapter?.panels?.length || 0} Panels</span>
                  </div>

                  {(!currentChapter?.panels || currentChapter.panels.length === 0) ? (
                    <div className="p-4 rounded-xl bg-[#141414] border border-dashed border-[#2F2F2F] text-center text-neutral-500 text-xs font-mono">
                      No generated text available yet. Click "Generate Comic Spread" below.
                    </div>
                  ) : (
                    currentChapter.panels.map((panel, idx) => {
                      const panelId = panel.panel_id || panel.id || `p_${idx}`;
                      return (
                        <div
                          key={panelId}
                          onClick={() => setActivePanelId(panelId)}
                          className="p-2.5 rounded-xl border border-[#252525] bg-[#141414] hover:border-emerald-500/50 hover:bg-[#181818] transition-all cursor-pointer space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-neutral-300 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Panel #{String(panel.panel_index || idx + 1).padStart(2, "0")}
                            </span>
                            <div className="flex items-center gap-1">
                              {panel.camera_angle && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
                                  {panel.camera_angle}
                                </span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRenderSinglePanel(panelId, panel.prompt);
                                }}
                                disabled={renderingImages}
                                className="p-0.5 px-1.5 rounded bg-[#1C1C1C] hover:bg-[#252525] text-neutral-400 hover:text-white border border-[#333] text-[9px] font-mono flex items-center gap-1 cursor-pointer transition-all"
                                title="Re-render this panel image"
                              >
                                <RefreshCw className={`w-2.5 h-2.5 ${renderingImages ? "animate-spin" : ""}`} />
                                <span>Re-render</span>
                              </button>
                            </div>
                          </div>

                          <div className="text-[11px] text-neutral-300 leading-relaxed font-sans bg-[#0B0C0E] p-2 rounded-lg border border-[#202020]">
                            <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase block mb-0.5">
                              Visual Prompt
                            </span>
                            {panel.prompt}
                          </div>

                          {panel.speech_bubbles && panel.speech_bubbles.length > 0 && (
                            <div className="space-y-1.5 pt-1 border-t border-[#222]">
                              {panel.speech_bubbles.map((b, bIdx) => (
                                <div
                                  key={b.bubble_id || b.id || bIdx}
                                  className="p-1.5 rounded-lg bg-[#18191E] border border-[#2A2B33] text-[11px] space-y-0.5"
                                >
                                  <div className="flex items-center justify-between text-[9px] font-mono">
                                    <span className="font-bold text-emerald-400">
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
                                              ? "bg-emerald-600 text-white animate-pulse"
                                              : "bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30"
                                          }`}
                                          title="Play character voice"
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
                          )}

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
              </div>
            )}
            <div className="p-3 border-t border-[#2F2F2F] bg-[#0E0E0E]">
              <button
                onClick={handleSynthesize}
                disabled={synthesizing}
                className="w-full py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer disabled:opacity-50 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                {synthesizing
                  ? `Synthesizing with ${getModelLabel(imageModel)}...`
                  : `Generate Comic Spread (${getModelLabel(imageModel)})`}
              </button>
            </div>
          </aside>
        )}

        {/* Center Canvas: Paginated Comic Spread */}
        <div className="flex-1 min-h-0 h-full relative overflow-hidden bg-[#08080A]">
          <main 
            ref={canvasScrollRef}
            tabIndex={0}
            className="absolute inset-0 overflow-y-auto overflow-x-hidden flex flex-col items-center py-6 px-4 studio-visible-scrollbar overscroll-y-contain outline-none"
          >
          {!currentChapter || currentChapter.panels.length === 0 ? (
            <div className="my-auto text-center p-8 bg-[#121212] border border-[#2F2F2F] rounded-2xl max-w-md shadow-2xl">
              <Grid className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-80" />
              <h3 className="text-base font-bold text-white mb-1 font-mono">
                Chapter S{selectedSessionNum}:C{selectedChapterNum} Not Generated
              </h3>
              <p className="text-xs text-neutral-400 mb-6 font-sans leading-relaxed">
                Click below to synthesize classic comic page layouts, screentones, and speech bubbles.
              </p>
              <button
                onClick={handleSynthesize}
                disabled={synthesizing}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-mono font-bold shadow-lg shadow-blue-500/20 cursor-pointer transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                {synthesizing
                  ? `Composing with ${getModelLabel(imageModel)}...`
                  : `Synthesize Comic Grid (${getModelLabel(imageModel)})`}
              </button>
            </div>
          ) : (
            <div className="w-full max-w-[850px] bg-[#141414] p-4 rounded-2xl shadow-2xl border border-[#2F2F2F]">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#2F2F2F] text-xs font-mono text-neutral-400">
                <span className="font-bold text-white">
                  Ep {currentChapter.chapter_number}: {currentChapter.title}
                </span>
                <span className="text-emerald-400">Paginated Spread • 2x3 Grid</span>
              </div>

              {/* Comic Page 2x3 Grid */}
              <div className="grid grid-cols-2 gap-3 bg-[#08080A] p-2 rounded-xl border border-[#2F2F2F]">
                {currentChapter.panels.map((panel, idx) => {
                  const panelId = panel.panel_id || panel.id || `p_${idx}`;
                  const isSelected = activePanelId === panelId;
                  return (
                    <div
                      key={panelId}
                      onClick={() => setActivePanelId(panelId)}
                      className={`relative aspect-[4/3] bg-zinc-950 overflow-hidden rounded-lg border-2 border-black group cursor-pointer transition-all ${
                        screentoneFilter ? "contrast-125" : ""
                      } ${isSelected ? "ring-2 ring-[#3B82F6]" : ""}`}
                    >
                      <img
                        src={panel.image_url}
                        alt={`Panel ${idx + 1}`}
                        className="w-full h-full object-cover block"
                        loading="lazy"
                      />

                      {/* Interactive Speech Bubbles (Only rendered if user switched to manual overlay editor mode) */}
                      {bubbleMode === "overlay" && panel.speech_bubbles.map((b) => (
                        <div
                          key={b.bubble_id || b.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePanelId(panelId);
                            setActiveBubble(b);
                          }}
                          style={{
                            left: `${b.pos_x}%`,
                            top: `${b.pos_y}%`,
                            width: `${b.width}%`,
                            fontFamily: "Bangers, cursive",
                          }}
                          className="absolute p-2 bg-white text-black border-2 border-black rounded-xl text-xs font-bold shadow-md cursor-pointer hover:scale-105 transition-transform"
                        >
                          {b.text}
                        </div>
                      ))}

                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[9px] font-mono font-bold text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        Panel {idx + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          </main>
        </div>

        {/* Right Inspector */}
        {!zenMode && rightOpen && (
          <aside className="w-80 border-l border-[#2F2F2F] bg-[#121212] flex flex-col shrink-0 z-20">
            <div className="p-2.5 border-b border-[#2F2F2F] flex items-center justify-between text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Grid Inspector
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setScreentoneFilter(!screentoneFilter)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all cursor-pointer ${
                    screentoneFilter
                      ? "bg-emerald-950 text-emerald-400 border-emerald-500/40"
                      : "bg-[#181818] text-neutral-400 border-[#2F2F2F] hover:text-white"
                  }`}
                  title="Toggle Halftone Screentones"
                >
                  Halftones
                </button>
                <button
                  onClick={() => navigate(`/series/${seriesId}/export`)}
                  className="px-2 py-0.5 rounded bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer shadow-sm transition-all"
                  title="Export Comic CBZ"
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
            <div className="flex-1 p-4 space-y-4 text-xs font-mono text-neutral-300 custom-purple-scrollbar overflow-y-auto">
              {activeBubble ? (
                <div className="space-y-3 bg-[#0E0E0E] p-3.5 rounded-2xl border border-[#2F2F2F]">
                  <label className="block text-[11px] font-bold text-white mb-2">Edit Bubble Text</label>
                  <textarea
                    rows={3}
                    value={activeBubble.text}
                    onChange={(e) => setActiveBubble({ ...activeBubble, text: e.target.value })}
                    className="w-full bg-[#141414] border border-[#2F2F2F] rounded-xl p-2.5 text-white font-sans focus:border-[#3B82F6] resize-none outline-none"
                  />
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#0E0E0E] border border-[#2F2F2F] text-center text-xs text-neutral-400">
                  Select any panel or speech bubble to customize text, fonts, and gutter thickness.
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default ComicStudioPage;
