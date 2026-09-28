import React, { useEffect, useState } from "react";
import {
  Play,
  Pause,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Tv,
  Layers,
  BookOpen,
  Volume2,
  VolumeX,
} from "lucide-react";
import { aiSeriesApi, AISeriesProject, ChapterSession } from "@/api/endpoints/aiSeries";
import { useSeriesNavigation } from "../hooks/useSeriesNavigation";

export const SeriesReaderTheaterPage: React.FC = () => {
  const { navigate, seriesId } = useSeriesNavigation();


  const [project, setProject] = useState<AISeriesProject | null>(null);
  const [selectedSessionNum, setSelectedSessionNum] = useState<number>(1);
  const [selectedChapterNum, setSelectedChapterNum] = useState<number>(1);
  const [currentChapter, setCurrentChapter] = useState<ChapterSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Video / Theater State
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentCutIdx, setCurrentCutIdx] = useState(0);
  const [showBubbleOverlays, setShowBubbleOverlays] = useState(false);

  useEffect(() => {
    if (!seriesId) return;
    const load = async () => {
      try {
        setLoading(true);
        const p = await aiSeriesApi.getSeries(seriesId);
        setProject(p);
        const chap = await aiSeriesApi.getChapter(seriesId, 1, 1);
        setCurrentChapter(chap);
      } catch (err) {
        console.error("Failed to load theater content:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [seriesId]);

  const loadChapter = async (sessNum: number, chapNum: number) => {
    if (!seriesId) return;
    try {
      const chap = await aiSeriesApi.getChapter(seriesId, sessNum, chapNum);
      setCurrentChapter(chap);
      setSelectedSessionNum(sessNum);
      setSelectedChapterNum(chapNum);
      setCurrentCutIdx(0);
    } catch (err) {
      console.warn("Chapter unavailable.");
    }
  };

  const isAnime = project?.format_type === "anime";
  const isComic = project?.format_type === "comic_manga";

  return (
    <div className="h-full w-full flex-1 flex flex-col bg-[#0B0C0E] text-[#E5E5E5] overflow-hidden min-h-0 select-none">
      {/* Main Presentation Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden min-h-0 h-full">
        {/* Floating Top Floating Action Pill for Episode Navigation & Back */}
        <div className="absolute top-4 left-4 z-40 flex items-center gap-2 bg-[#121212]/90 backdrop-blur-md border border-[#2F2F2F] p-1.5 px-3 rounded-2xl shadow-xl text-xs font-mono">
          <button
            onClick={() => navigate(`/ai-series`)}
            className="p-1 rounded-lg bg-[#181818] hover:bg-[#222] text-neutral-400 hover:text-white transition-all cursor-pointer"
            title="Back to AI Series Hub"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-white font-bold max-w-[160px] truncate">{project?.title || "Theater"}</span>
          <span className="text-[#60A5FA] text-[11px]">• Ep {selectedChapterNum}</span>
          <div className="flex items-center gap-1 ml-2 border-l border-[#2F2F2F] pl-2">
            <button
              onClick={() => loadChapter(selectedSessionNum, Math.max(1, selectedChapterNum - 1))}
              disabled={selectedChapterNum <= 1}
              className="p-1 rounded hover:bg-[#202020] text-neutral-400 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Previous Episode"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => loadChapter(selectedSessionNum, selectedChapterNum + 1)}
              className="p-1 rounded hover:bg-[#202020] text-neutral-400 hover:text-white cursor-pointer"
              title="Next Episode"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {!isAnime && (
            <div className="flex items-center gap-1 border-l border-[#2F2F2F] pl-2">
              <button
                onClick={() => setShowBubbleOverlays(!showBubbleOverlays)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                  showBubbleOverlays
                    ? "bg-[#3B82F6] text-white"
                    : "bg-[#1A1A1A] text-neutral-400 hover:text-white"
                }`}
                title="Toggle HTML speech bubble overlays on top of the image"
              >
                {showBubbleOverlays ? "Overlays: On" : "In-Image Bubbles"}
              </button>
            </div>
          )}
        </div>
        {loading ? (
          <div className="m-auto text-slate-400 text-sm">Buffering Theater Media...</div>
        ) : isAnime ? (
          /* Anime Cinema Player */
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#050608]">
            {currentChapter?.panels[currentCutIdx] ? (
              <div className="w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative border border-white/10 flex items-center justify-center">
                <img
                  src={currentChapter.panels[currentCutIdx].image_url}
                  alt="Anime Scene"
                  className="w-full h-full object-cover"
                />

                {/* Subtitle Dialogue */}
                {currentChapter.panels[currentCutIdx].speech_bubbles[0] && (
                  <div className="absolute bottom-8 inset-x-12 text-center pointer-events-none">
                    <span className="px-5 py-2 rounded-xl bg-black/80 backdrop-blur-md text-base md:text-lg font-bold text-white tracking-wide border border-white/20 shadow-2xl">
                      {currentChapter.panels[currentCutIdx].speech_bubbles[0].text}
                    </span>
                  </div>
                )}

                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex flex-col justify-between p-6">
                  <div className="flex justify-between items-center text-xs font-bold text-white">
                    <span className="px-3 py-1 rounded bg-black/60 border border-white/20">
                      24 FPS Sakuga Anime
                    </span>
                    <button onClick={() => setMuted(!muted)} className="p-2 rounded bg-black/60">
                      {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-6">
                    <button
                      onClick={() => setCurrentCutIdx((prev) => Math.max(0, prev - 1))}
                      className="p-3 rounded-full bg-white/20 hover:bg-white/40 text-white"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-xl scale-110"
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </button>
                    <button
                      onClick={() =>
                        setCurrentCutIdx((prev) =>
                          Math.min((currentChapter?.panels.length || 1) - 1, prev + 1)
                        )
                      }
                      className="p-3 rounded-full bg-white/20 hover:bg-white/40 text-white"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="text-right text-xs font-mono text-slate-300">
                    Cut {currentCutIdx + 1} / {currentChapter.panels.length}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-400">No media synthesized for this episode yet.</div>
            )}
          </div>
        ) : (
          /* Webtoon Continuous Vertical Scroll or Comic Spread */
          <div className="flex-1 min-h-0 h-full overflow-y-auto overflow-x-hidden flex flex-col items-center py-6 px-4 bg-[#08080A] studio-visible-scrollbar overscroll-contain">
            <div className="w-full max-w-[750px] shadow-2xl rounded overflow-hidden">
              {currentChapter?.panels.map((panel, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={panel.image_url}
                    alt={`Panel ${idx + 1}`}
                    className="w-full h-auto block object-cover"
                  />
                  {showBubbleOverlays && panel.speech_bubbles.map((b, bIdx) => (
                    <div
                      key={bIdx}
                      style={{
                        left: `${b.pos_x}%`,
                        top: `${b.pos_y}%`,
                        width: `${b.width}%`,
                        fontFamily: b.font_family,
                        fontSize: `${b.font_size}px`,
                      }}
                      className="absolute p-3 bg-white text-black rounded-2xl border-2 border-black font-bold shadow-lg"
                    >
                      {b.text}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeriesReaderTheaterPage;
