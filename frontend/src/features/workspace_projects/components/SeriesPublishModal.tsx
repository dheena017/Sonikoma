import React, { useState } from "react";
import {
  X,
  Film,
  Download,
  FileText,
  Music,
  Sparkles,
  Check,
  Loader2,
  Play,
} from "lucide-react";

interface SeriesPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  seriesTitle: string;
  chapterCount: number;
  totalPanels: number;
}

export default function SeriesPublishModal({
  isOpen,
  onClose,
  seriesTitle,
  chapterCount,
  totalPanels,
}: SeriesPublishModalProps) {
  const [activeTab, setActiveTab] = useState<
    "video" | "archive" | "pdf" | "audio"
  >("video");
  const [resolution, setResolution] = useState<"1080p" | "4k">("1080p");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("9:16");
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  if (!isOpen) return null;

  const handleStartExport = () => {
    setIsExporting(true);
    setExportComplete(false);
    setTimeout(() => {
      setIsExporting(false);
      setExportComplete(true);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 bg-neutral-955/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 text-purple-300 border border-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">
                Publish & Export Hub
              </h2>
              <p className="text-xs text-neutral-400 font-mono">
                {seriesTitle} · {chapterCount} Chapters · {totalPanels} Panels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-neutral-800/60 bg-neutral-950">
          <button
            onClick={() => {
              setActiveTab("video");
              setExportComplete(false);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold font-mono transition-all border-b-2 cursor-pointer ${
              activeTab === "video"
                ? "border-purple-500 text-purple-400 bg-neutral-900"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            <Film className="w-4 h-4" /> Full Video Reel (MP4)
          </button>
          <button
            onClick={() => {
              setActiveTab("archive");
              setExportComplete(false);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold font-mono transition-all border-b-2 cursor-pointer ${
              activeTab === "archive"
                ? "border-purple-500 text-purple-400 bg-neutral-900"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            <Download className="w-4 h-4" /> Comic Archive (CBZ/ZIP)
          </button>
          <button
            onClick={() => {
              setActiveTab("pdf");
              setExportComplete(false);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold font-mono transition-all border-b-2 cursor-pointer ${
              activeTab === "pdf"
                ? "border-purple-500 text-purple-400 bg-neutral-900"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" /> PDF Storyboard
          </button>
          <button
            onClick={() => {
              setActiveTab("audio");
              setExportComplete(false);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold font-mono transition-all border-b-2 cursor-pointer ${
              activeTab === "audio"
                ? "border-purple-500 text-purple-400 bg-neutral-900"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            <Music className="w-4 h-4" /> Audio Track (MP3)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-neutral-900">
          {activeTab === "video" && (
            <div className="space-y-5">
              <div className="p-4 bg-neutral-955 rounded-2xl border border-neutral-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                  <Film className="w-4 h-4 text-purple-400" /> Video Render
                  Settings
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-neutral-400 font-mono mb-1.5 block">
                      Resolution
                    </label>
                    <div className="flex gap-2">
                      {(["1080p", "4k"] as const).map((res) => (
                        <button
                          key={res}
                          type="button"
                          onClick={() => setResolution(res)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            resolution === res
                              ? "bg-purple-600/20 border-purple-500 text-purple-300"
                              : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                          }`}
                        >
                          {res.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-neutral-400 font-mono mb-1.5 block">
                      Aspect Ratio
                    </label>
                    <div className="flex gap-2">
                      {(["9:16", "16:9"] as const).map((ratio) => (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => setAspectRatio(ratio)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            aspectRatio === ratio
                              ? "bg-purple-600/20 border-purple-500 text-purple-300"
                              : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                          }`}
                        >
                          {ratio === "9:16"
                            ? "9:16 (Shorts/TikTok)"
                            : "16:9 (YouTube)"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {exportComplete ? (
                <div className="p-5 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Full Series Video Ready!
                      </h4>
                      <p className="text-xs text-neutral-400 font-mono">
                        {seriesTitle}_Reel_{resolution}.mp4
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => alert(`Downloading ${seriesTitle}_Reel.mp4`)}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-emerald-900/40"
                  >
                    <Download className="w-4 h-4" /> Download MP4
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleStartExport}
                  disabled={isExporting}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:brightness-110 text-white font-extrabold text-xs uppercase tracking-wider shadow-xl shadow-purple-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                      Rendering Continuous Series Reel...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" /> Compile & Render
                      Series Reel
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {activeTab === "archive" && (
            <div className="p-6 bg-neutral-955 rounded-2xl border border-neutral-800 text-center space-y-4">
              <Download className="w-10 h-10 text-purple-400 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-white">
                  Export CBZ / ZIP Package
                </h3>
                <p className="text-xs text-neutral-400 font-mono max-w-md mx-auto mt-1">
                  Downloads all sliced comic panels across {chapterCount}{" "}
                  chapters in structured folders for offline reading.
                </p>
              </div>
              <button
                onClick={() =>
                  alert(`Packaging CBZ archive for ${seriesTitle}...`)
                }
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-purple-900/40 inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download CBZ Archive
              </button>
            </div>
          )}

          {activeTab === "pdf" && (
            <div className="p-6 bg-neutral-955 rounded-2xl border border-neutral-800 text-center space-y-4">
              <FileText className="w-10 h-10 text-purple-400 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-white">
                  Printable PDF Storyboard
                </h3>
                <p className="text-xs text-neutral-400 font-mono max-w-md mx-auto mt-1">
                  Generates a clean PDF document containing all storyboard
                  panels, dialogues, and timestamps.
                </p>
              </div>
              <button
                onClick={() =>
                  alert(`Generating PDF storyboard for ${seriesTitle}...`)
                }
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-purple-900/40 inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Generate PDF Sheet
              </button>
            </div>
          )}

          {activeTab === "audio" && (
            <div className="p-6 bg-neutral-955 rounded-2xl border border-neutral-800 text-center space-y-4">
              <Music className="w-10 h-10 text-purple-400 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-white">
                  Synthesized Audio Track
                </h3>
                <p className="text-xs text-neutral-400 font-mono max-w-md mx-auto mt-1">
                  Exports the complete audio track with AI voice narration,
                  sound effects (SFX), and background music (BGM).
                </p>
              </div>
              <button
                onClick={() =>
                  alert(`Exporting audio track for ${seriesTitle}...`)
                }
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-purple-900/40 inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download MP3 Track
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
