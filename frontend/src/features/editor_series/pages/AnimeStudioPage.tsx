import React, { useEffect, useState, useRef } from "react";
import {
  Tv,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Video,
  Zap,
  Wind,
  Layers,
  Users,
  Compass,
  Clock,
  Download,
  FileText,
  Copy,
  Check,
  Cpu,
  RefreshCw,
  Square,
  Mic,
} from "lucide-react";
import {
  aiSeriesApi,
  AISeriesProject,
  ChapterSession,
  AISeriesPanel,
} from "@/api/endpoints/aiSeries";
import { useSeriesNavigation } from "../hooks/useSeriesNavigation";

export const AnimeStudioPage: React.FC = () => {
  const { navigate, seriesId } = useSeriesNavigation();

  const [project, setProject] = useState<AISeriesProject | null>(null);
  const [selectedSessionNum, setSelectedSessionNum] = useState<number>(1);
  const [selectedChapterNum, setSelectedChapterNum] = useState<number>(1);
  const [currentChapter, setCurrentChapter] = useState<ChapterSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [synthesizing, setSynthesizing] = useState(false);

  // Active Cut & Playback
  const [activePanelIdx, setActivePanelIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [leftTab, setLeftTab] = useState<"cuts" | "text">("cuts");
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
    script += `--- ANIMATION CUTS & DIALOGUE ---\n\n`;
    (currentChapter.panels || []).forEach((p, idx) => {
      script += `[CUT #${p.panel_index || idx + 1}] (${p.camera_angle || "Cinematic Medium"})\n`;
      script += `Visual: ${p.prompt}\n`;
      if (p.motion_prompt) script += `Motion: ${p.motion_prompt}\n`;
      if (p.speech_bubbles && p.speech_bubbles.length > 0) {
        p.speech_bubbles.forEach((b) => {
          script += `  ${b.speaker_name || "Voice"} (${b.bubble_type || "dialogue"}): "${b.text}"\n`;
        });
      } else {
        script += `  [Non-verbal Action / Kinetic Sakuga]\n`;
      }
      if (p.sound_effects) script += `  SFX: ${p.sound_effects}\n`;
      script += `\n`;
    });
    navigator.clipboard.writeText(script);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  // Kinetic Motion Presets
  const [motionModel, setMotionModel] = useState<string>("i2v_character_anchor");
  const [motionPrompt, setMotionPrompt] = useState<string>(
    "High velocity physical leap across concrete rooftops, cape billowing violently in night wind, cinematic low angle 3D camera pan, 24fps anime sakuga"
  );
  const [cameraSweep, setCameraSweep] = useState<string>("orbital_3d");

  useEffect(() => {
    if (!seriesId) return;
    const load = async () => {
      try {
        setLoading(true);
        const p = await aiSeriesApi.getSeries(seriesId);
        setProject(p);
        await loadChapter(1, 1);
      } catch (err) {
        console.error("Failed to load Anime project:", err);
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
      setActivePanelIdx(0);
      const chap = await aiSeriesApi.getChapter(seriesId, sessNum, chapNum);
      if (chap && chap.panels && chap.panels.length > 0) {
        setCurrentChapter(chap);
      } else {
        setSynthesizing(true);
        const updated = await aiSeriesApi.synthesizeChapter(seriesId, sessNum, chapNum, 8);
        setCurrentChapter(updated);
      }
    } catch (err) {
      console.warn("Anime chapter fetch/synth error:", err);
      setCurrentChapter(null);
    } finally {
      setSynthesizing(false);
    }
  };

  const handleSynthesize = async () => {
    if (!seriesId) return;
    try {
      setSynthesizing(true);
      const updated = await aiSeriesApi.synthesizeChapter(seriesId, selectedSessionNum, selectedChapterNum, 8);
      setCurrentChapter(updated);
    } catch (err) {
      alert("Failed to synthesize anime episode cuts.");
    } finally {
      setSynthesizing(false);
    }
  };

  // AI Audio & Image Generation State
  const [imageModel, setImageModel] = useState<string>("flux-anime");
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
      console.error("Failed to dub anime episode:", err);
      alert("Failed to dub episode dialogue with Edge-TTS.");
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
      console.error("Failed to render chapter cuts:", err);
      alert("Failed to render anime cut keyframes.");
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
      console.error("Failed to render anime cut image:", err);
      alert("Failed to render anime cut.");
    } finally {
      setRenderingImages(false);
    }
  };

  const currentPanel: AISeriesPanel | undefined = currentChapter?.panels[activePanelIdx];

  const handleApplyMotionPreset = (presetText: string) => {
    setMotionPrompt(presetText);
    alert("Kinetic motion preset applied to current cut!");
  };

  return (
    <div className="h-full w-full flex-1 flex flex-col bg-[#0B0C0E] text-[#E5E5E5] overflow-hidden min-h-0">
      {/* ── Main Workspace ──── */}
      <div className="flex-1 flex flex-row overflow-hidden relative min-h-0 h-full">
        {/* Left Column: Episode Cuts */}
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
                  {leftTab === "cuts" ? (
                    <>
                      <Tv className="w-3.5 h-3.5 text-rose-400" />
                      Shot Cuts
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5 text-rose-400" />
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
            <div className="px-3 py-1.5 bg-rose-950/20 border-b border-[#2F2F2F] flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-rose-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-rose-400" />
                Director: series_arc_anime
              </span>
              <span className="text-[9px] font-mono text-neutral-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                16:9 Cinema
              </span>
            </div>

            {/* Sidebar View Tabs */}
            <div className="p-2 border-b border-[#2F2F2F] bg-[#0E0E0E]">
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#181818] rounded-xl border border-[#262626]">
                <button
                  onClick={() => setLeftTab("cuts")}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    leftTab === "cuts"
                      ? "bg-[#252525] text-rose-400 shadow-sm border border-rose-500/40"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>Shot Cuts</span>
                </button>
                <button
                  onClick={() => setLeftTab("text")}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    leftTab === "text"
                      ? "bg-[#252525] text-rose-400 shadow-sm border border-rose-500/40"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Story Text</span>
                  {currentChapter?.panels?.length ? (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 font-mono">
                      {currentChapter.panels.length}P
                    </span>
                  ) : null}
                </button>
              </div>
            </div>

            {/* Tab 1: Shot Cuts */}
            {leftTab === "cuts" && (
              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-purple-scrollbar">
                {currentChapter?.panels.map((p, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActivePanelIdx(idx)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                      activePanelIdx === idx
                        ? "bg-[#1E1E1E] border-rose-500/80 text-white shadow-md ring-1 ring-rose-500/30"
                        : "bg-[#0E0E0E] border-[#2F2F2F] text-neutral-400 hover:text-white hover:bg-[#161616]"
                    }`}
                  >
                    <img
                      src={p.image_url}
                      alt={`Cut ${idx + 1}`}
                      className="w-14 h-9 object-cover rounded-lg bg-black shrink-0 border border-[#2F2F2F]"
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0 font-mono">
                      <div className="text-xs font-bold text-white truncate">Cut #{String(idx + 1).padStart(2, "0")}</div>
                      <div className="text-[10px] text-neutral-400 truncate mt-0.5">{p.camera_angle || "Action Leap"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 2: Generated Story Text & Narrative Script */}
            {leftTab === "text" && (
              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-purple-scrollbar">
                {/* Episode Meta Card */}
                <div className="p-3 rounded-xl bg-[#161616] border border-[#2F2F2F] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider">
                      S{selectedSessionNum} • Ep {selectedChapterNum}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {currentChapter?.pacing_role && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-950/40 text-rose-400 border border-rose-500/30 font-semibold capitalize">
                          {currentChapter.pacing_role.replace("_", " ")}
                        </span>
                      )}
                      <button
                        onClick={handleCopyScript}
                        className="p-1 rounded bg-[#202020] hover:bg-[#282828] text-neutral-300 hover:text-white border border-[#3A3A3A] transition-all cursor-pointer"
                        title="Copy Full Episode Script"
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
                    {currentChapter?.title || "Untitled Episode"}
                  </div>

                  {currentChapter?.summary && (
                    <p className="text-[11px] text-neutral-300 leading-relaxed bg-[#0E0E0E] p-2 rounded-lg border border-[#222]">
                      {currentChapter.summary}
                    </p>
                  )}
                </div>

                {/* AI Audio Dubbing & Image Rendering Action Bar */}
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#171922] to-[#12131A] border border-[#2B2F42] space-y-2">
                  <div className="text-[10px] font-mono font-bold text-rose-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Cpu className="w-3 h-3 text-rose-400" />
                      AI Anime Engines
                    </span>
                    <span className="text-[9px] text-neutral-400">Edge-TTS & 16:9 Sakuga</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {/* Synthesize All Audio */}
                    <button
                      onClick={handleSynthesizeChapterAudio}
                      disabled={synthesizingAudio || !currentChapter?.panels?.length}
                      className="px-2 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 text-rose-200 text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-sm"
                      title="Generate Edge-TTS voice performance for all dialogue cues"
                    >
                      {synthesizingAudio ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin text-rose-400" />
                          <span>Dubbing...</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3 text-rose-400" />
                          <span>Dub All Audio</span>
                        </>
                      )}
                    </button>

                    {/* Batch Render / Cache Images */}
                    <button
                      onClick={handleRenderChapterImages}
                      disabled={renderingImages || !currentChapter?.panels?.length}
                      className="px-2 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-purple-200 text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-sm"
                      title="Pre-render and locally cache all 16:9 anime keyframes"
                    >
                      {renderingImages ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin text-purple-400" />
                          <span>Caching...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-purple-400" />
                          <span>Cache Shots</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Cuts Breakdown Cards */}
                <div className="space-y-2">
                  <div className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider px-1 flex items-center justify-between">
                    <span>Animation Cuts & Audio</span>
                    <span className="text-neutral-500">{currentChapter?.panels?.length || 0} Cuts</span>
                  </div>

                  {(!currentChapter?.panels || currentChapter.panels.length === 0) ? (
                    <div className="p-4 rounded-xl bg-[#141414] border border-dashed border-[#2F2F2F] text-center text-neutral-500 text-xs font-mono">
                      No cuts available yet. Click "Generate Episode Cuts" below.
                    </div>
                  ) : (
                    currentChapter.panels.map((p, idx) => {
                      const isSelected = activePanelIdx === idx;
                      const panelId = p.panel_id || p.id || `p_${idx}`;
                      return (
                        <div
                          key={p.panel_id || idx}
                          onClick={() => setActivePanelIdx(idx)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                            isSelected
                              ? "bg-[#1E1E1E] border-rose-500/80 ring-1 ring-rose-500/30 shadow-md"
                              : "bg-[#141414] border-[#252525] hover:border-rose-500/40 hover:bg-[#181818]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-neutral-300 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                              Cut #{String(p.panel_index || idx + 1).padStart(2, "0")}
                            </span>
                            <div className="flex items-center gap-1">
                              {p.camera_angle && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
                                  {p.camera_angle}
                                </span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRenderSinglePanel(panelId, p.prompt);
                                }}
                                disabled={renderingImages}
                                className="p-0.5 px-1.5 rounded bg-[#1C1C1C] hover:bg-[#252525] text-neutral-400 hover:text-white border border-[#333] text-[9px] font-mono flex items-center gap-1 cursor-pointer transition-all"
                                title="Re-render this anime cut"
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
                            {p.prompt}
                          </div>

                          {p.motion_prompt && (
                            <div className="text-[10px] text-rose-300 bg-rose-950/20 p-2 rounded-lg border border-rose-500/20 font-sans">
                              <span className="text-[9px] font-mono font-bold text-rose-400 uppercase block mb-0.5">
                                Sakuga Motion Cue
                              </span>
                              {p.motion_prompt}
                            </div>
                          )}

                          {p.speech_bubbles && p.speech_bubbles.length > 0 && (
                            <div className="space-y-1.5 pt-1 border-t border-[#222]">
                              {p.speech_bubbles.map((b, bIdx) => (
                                <div
                                  key={b.bubble_id || bIdx}
                                  className="p-1.5 rounded-lg bg-[#18191E] border border-[#2A2B33] text-[11px] space-y-0.5"
                                >
                                  <div className="flex items-center justify-between text-[9px] font-mono">
                                    <span className="font-bold text-rose-400">
                                      {b.speaker_name || "Voice"}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-neutral-500 capitalize">{b.bubble_type || "dialogue"}</span>
                                      {b.audio_url && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handlePlayAudio(b.audio_url);
                                          }}
                                          className={`p-0.5 px-1.5 rounded flex items-center gap-1 text-[9px] font-mono font-bold transition-all cursor-pointer ${
                                            playingAudioUrl === b.audio_url
                                              ? "bg-rose-600 text-white animate-pulse"
                                              : "bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30"
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
                {synthesizing ? "Synthesizing Shots..." : "Generate Episode Cuts"}
              </button>
            </div>
          </aside>
        )}

        {/* Center Canvas: High-Octane 16:9 Cinema Viewport */}
        <div className="flex-1 min-h-0 h-full relative overflow-hidden bg-[#08080A]">
          <main className="absolute inset-0 bg-[#08080A] flex flex-col items-center py-8 px-6 overflow-y-auto overflow-x-hidden studio-visible-scrollbar overscroll-y-contain outline-none">
          {!currentChapter || currentChapter.panels.length === 0 ? (
            <div className="my-auto text-center p-8 bg-[#121212] border border-[#2F2F2F] rounded-2xl max-w-md shadow-2xl">
              <Tv className="w-12 h-12 text-rose-400 mx-auto mb-3 opacity-80" />
              <h3 className="text-base font-bold text-white mb-1 font-mono">
                Episode S{selectedSessionNum}:E{selectedChapterNum} Cuts Pending
              </h3>
              <p className="text-xs text-neutral-400 mb-6 font-sans leading-relaxed">
                Synthesize 24fps physical leaps, rooftop jumps, 3D camera tracking, and vocal tracks.
              </p>
              <button
                onClick={handleSynthesize}
                disabled={synthesizing}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-mono font-bold shadow-lg shadow-blue-500/20 cursor-pointer transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                {synthesizing ? "Rendering Cuts..." : "Synthesize Episode Cuts"}
              </button>
            </div>
          ) : currentPanel ? (
            <div className="my-auto w-full max-w-4xl flex flex-col items-center">
              {/* 16:9 Viewport */}
              <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative border border-[#2F2F2F] group">
                <img
                  src={currentPanel.image_url}
                  alt={`Cut ${activePanelIdx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-700"
                />

                {/* Kinetic Motion Overlay Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2 font-mono">
                  <span className="px-3 py-1 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-xs font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    {currentPanel.motion_model || "I2V Character Anchor"}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-xs font-bold text-rose-300">
                    {currentPanel.camera_angle || "Orbital 3D Sweep"}
                  </span>
                </div>

                {/* Subtitle / Dialogue Bar */}
                {currentPanel.speech_bubbles[0] && (
                  <div className="absolute bottom-6 inset-x-8 text-center pointer-events-none">
                    <span className="px-4 py-2 rounded-xl bg-black/85 backdrop-blur-md text-sm md:text-base font-bold text-white tracking-wide border border-white/10 shadow-2xl">
                      {currentPanel.speech_bubbles[0].text}
                    </span>
                  </div>
                )}
              </div>

              {/* Media Controls Bar */}
              <div className="w-full max-w-4xl bg-[#121212] border border-[#2F2F2F] rounded-2xl p-3 mt-4 flex items-center justify-between font-mono">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-lg shadow-blue-500/20 cursor-pointer transition-all"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setActivePanelIdx((prev) => Math.max(0, prev - 1))}
                    className="p-2 rounded-xl bg-[#181818] hover:bg-[#202020] border border-[#2F2F2F] text-neutral-300 hover:text-white cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      setActivePanelIdx((prev) =>
                        Math.min((currentChapter.panels.length || 1) - 1, prev + 1)
                      )
                    }
                    className="p-2 rounded-xl bg-[#181818] hover:bg-[#202020] border border-[#2F2F2F] text-neutral-300 hover:text-white cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <span className="text-xs text-neutral-400 ml-2">
                    Cut {activePanelIdx + 1} of {currentChapter.panels.length} (4.5s)
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(`/watch/${seriesId}`)}
                    className="px-3.5 py-1.5 bg-[#181818] hover:bg-[#202020] border border-[#2F2F2F] text-xs font-bold text-neutral-200 hover:text-white rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Play className="w-3.5 h-3.5 text-rose-400" /> Watch Episode
                  </button>
                </div>
              </div>
            </div>
          ) : null}
          </main>
        </div>

        {/* Right Column: Kinetic Motion Choreographer */}
        {!zenMode && rightOpen && (
          <aside className="w-80 border-l border-[#2F2F2F] bg-[#121212] flex flex-col shrink-0 z-20">
            <div className="p-2.5 border-b border-[#2F2F2F] flex items-center justify-between text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-rose-400" />
                Kinetic Controls
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => navigate(`/series/${seriesId}/export`)}
                  className="px-2 py-0.5 rounded bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer shadow-sm transition-all"
                  title="Render Anime Episode MP4"
                >
                  <Download className="w-3 h-3" /> Render
                </button>
                <button
                  onClick={() => setRightOpen(false)}
                  className="p-1 rounded-lg hover:bg-[#1E1E1E] text-neutral-400 hover:text-white transition-all cursor-pointer"
                  title="Collapse Controls"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs font-mono text-neutral-300 custom-purple-scrollbar">
              {/* Pathway */}
              <div className="bg-[#0E0E0E] p-3.5 rounded-2xl border border-[#2F2F2F] space-y-2.5">
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Motion Engine Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMotionModel("i2v_character_anchor")}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      motionModel === "i2v_character_anchor"
                        ? "bg-[#1E1E1E] border-rose-500 text-white shadow-sm"
                        : "bg-[#141414] border-[#2F2F2F] text-neutral-400 hover:text-white"
                    }`}
                  >
                    I2V (DNA Anchor)
                  </button>
                  <button
                    onClick={() => setMotionModel("t2v_high_velocity")}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      motionModel === "t2v_high_velocity"
                        ? "bg-[#1E1E1E] border-rose-500 text-white shadow-sm"
                        : "bg-[#141414] border-[#2F2F2F] text-neutral-400 hover:text-white"
                    }`}
                  >
                    T2V (Velocity)
                  </button>
                </div>
              </div>

              {/* Motion Presets */}
              <div className="bg-[#0E0E0E] p-3.5 rounded-2xl border border-[#2F2F2F] space-y-2.5">
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-rose-400" /> Kinetic Action Presets
                </label>
                <div className="space-y-2">
                  {[
                    "High velocity physical leap across concrete rooftops, cape billowing in wind",
                    "Acrobatic martial arts spin strike with dual energy blades, orbital camera pan",
                    "Supersonic mid-air dash dodging particle beams, 24fps anime sakuga",
                    "Heavy meteor impact landing with radial shockwave and rising dust plume",
                  ].map((preset, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleApplyMotionPreset(preset)}
                      className="p-2.5 rounded-xl bg-[#141414] border border-[#2F2F2F] hover:border-rose-500/50 cursor-pointer text-neutral-300 hover:text-white leading-relaxed font-sans transition-all text-[11px]"
                    >
                      {preset}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default AnimeStudioPage;
