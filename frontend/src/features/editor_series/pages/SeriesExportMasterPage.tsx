import React, { useEffect, useState } from "react";
import {
  Download,
  ArrowLeft,
  Sparkles,
  Layers,
  BookOpen,
  Tv,
  CheckCircle2,
  FileArchive,
  Film,
  FileText,
} from "lucide-react";
import { aiSeriesApi, AISeriesProject } from "@/api/endpoints/aiSeries";
import { useSeriesNavigation } from "../hooks/useSeriesNavigation";

export const SeriesExportMasterPage: React.FC = () => {
  const { navigate, seriesId } = useSeriesNavigation();


  const [project, setProject] = useState<AISeriesProject | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>("webtoon_strip");
  const [resolution, setResolution] = useState<string>("1080p");
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!seriesId) return;
    const load = async () => {
      try {
        const p = await aiSeriesApi.getSeries(seriesId);
        setProject(p);
        if (p.format_type === "anime") setSelectedFormat("anime_mp4_master");
        else if (p.format_type === "comic_manga") setSelectedFormat("cbz_archive");
      } catch (err) {
        console.error("Failed to load project:", err);
      }
    };
    load();
  }, [seriesId]);

  const handleExport = async () => {
    if (!seriesId) return;
    try {
      setExporting(true);
      const res = await aiSeriesApi.exportChapter(seriesId, {
        session_number: 1,
        chapter_number: 1,
        export_format: selectedFormat,
        resolution,
        include_speech_bubbles: true,
        include_audio_mix: true,
      });
      setResult(res);
    } catch (err) {
      alert("Failed to compile export package.");
    } finally {
      setExporting(false);
    }
  };

  const getStudioLink = () => {
    if (!project) return `/ai-series`;
    const format = project.format_type;
    if (format === "anime") return `/studio/anime/${seriesId}`;
    if (format === "comic_manga") return `/studio/comic/${seriesId}`;
    return `/studio/manhwa/${seriesId}`;
  };

  return (
    <div className="min-h-full w-full flex-1 flex flex-col justify-center items-center bg-[#0B0C0E] text-neutral-200 p-6 md:p-8 select-none">
      <div className="max-w-2xl w-full bg-[#121212] border border-[#2F2F2F] rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#2F2F2F]">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate(getStudioLink())}
              className="p-1.5 rounded-xl bg-[#181818] hover:bg-[#202020] border border-[#2F2F2F] text-neutral-400 hover:text-white transition-all cursor-pointer shadow-sm"
              title="Back to Studio"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[10px] font-mono font-bold text-[#60A5FA] uppercase tracking-wider">
                Distribution Master
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white font-sans">Export & Deliverables</h1>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider mb-2.5">
              Deliverable Package Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: "webtoon_strip",
                  name: "Webtoon Strip (PNG)",
                  icon: Layers,
                  desc: "Continuous vertical slice for Webtoons / Tapas",
                },
                {
                  id: "cbz_archive",
                  name: "Comic Book (CBZ)",
                  icon: FileArchive,
                  desc: "Digital comic reader package with paginated spreads",
                },
                {
                  id: "anime_mp4_master",
                  name: "Anime Master (MP4)",
                  icon: Film,
                  desc: "Cinema 24fps video render with full vocal mix",
                },
              ].map((fmt) => {
                const Icon = fmt.icon;
                const isSelected = selectedFormat === fmt.id;
                return (
                  <div
                    key={fmt.id}
                    onClick={() => setSelectedFormat(fmt.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all font-mono ${
                      isSelected
                        ? "bg-[#1E1E1E] border-[#3B82F6] text-white shadow-md ring-1 ring-[#3B82F6]/30"
                        : "bg-[#0E0E0E] border-[#2F2F2F] text-neutral-400 hover:text-white hover:bg-[#161616]"
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${isSelected ? "text-[#3B82F6]" : "text-neutral-400"}`} />
                    <div className="font-bold text-xs text-white mb-1">{fmt.name}</div>
                    <div className="text-[10px] text-neutral-400 font-sans leading-tight">{fmt.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resolution */}
          <div>
            <label className="block text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider mb-2.5">
              Output Resolution
            </label>
            <div className="grid grid-cols-2 gap-3">
              {["1080p", "4k"].map((res) => (
                <button
                  key={res}
                  onClick={() => setResolution(res)}
                  className={`py-2.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                    resolution === res
                      ? "bg-[#1E1E1E] border-[#3B82F6] text-[#60A5FA]"
                      : "bg-[#0E0E0E] border-[#2F2F2F] text-neutral-400 hover:text-white"
                  }`}
                >
                  {res.toUpperCase()} Ultra Master
                </button>
              ))}
            </div>
          </div>

          {/* Export Trigger */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full py-3.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? "Packaging Deliverables..." : "Compile & Download Deliverable Package"}
          </button>

          {/* Download Ready Display */}
          {result && (
            <div className="p-4 bg-emerald-950/20 border border-emerald-500/40 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="w-4 h-4" /> Package Ready for Publication
                </div>
                <div className="text-xs text-neutral-300 mt-1 font-mono">
                  File Size: {result.file_size_mb} MB • Deliverable: {result.export_format}
                </div>
              </div>
              <a
                href={result.download_url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold shadow transition-all"
              >
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeriesExportMasterPage;
