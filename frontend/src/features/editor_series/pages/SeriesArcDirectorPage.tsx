import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Play,
  TrendingUp,
  Tv,
  BookOpen,
} from "lucide-react";
import { aiSeriesApi, AISeriesProject } from "@/api/endpoints/aiSeries";
import { useSeriesNavigation } from "../hooks/useSeriesNavigation";

export const SeriesArcDirectorPage: React.FC = () => {
  const { navigate, seriesId } = useSeriesNavigation();
  const [project, setProject] = useState<AISeriesProject | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!seriesId) return;
    const load = async () => {
      try {
        setLoading(true);
        const p = await aiSeriesApi.getSeries(seriesId);
        setProject(p);
        const tl = await aiSeriesApi.getTimeline(seriesId);
        setTimeline(tl.timeline || []);
        const aud = await aiSeriesApi.getEpilogueAudit(seriesId);
        setAudit(aud);
      } catch (err) {
        console.error("Failed to load timeline:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [seriesId]);

  const getStudioLink = () => {
    if (!project) return `/ai-series`;
    const format = project.format_type;
    if (format === "anime") return `/studio/anime/${seriesId}`;
    if (format === "comic_manga") return `/studio/comic/${seriesId}`;
    return `/studio/manhwa/${seriesId}`;
  };

  const getPacingBadge = (role: string) => {
    switch (role) {
      case "epilogue_resolution":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "climax":
        return "bg-rose-500/20 text-rose-300 border-rose-500/30";
      case "inciting_incident":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      default:
        return "bg-violet-500/20 text-violet-300 border-violet-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-slate-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(getStudioLink())}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5" /> Series Arc Director & Pacing Timeline
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">
                Multi-Session Story Roadmap
              </h1>
            </div>
          </div>

          <button
            onClick={() => navigate(getStudioLink())}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm transition-all shadow-md"
          >
            Enter Studio
          </button>
        </div>

        {loading ? (
          <div className="text-center py-24 text-slate-400">Loading Story Timeline...</div>
        ) : (
          <div className="space-y-8">
            {/* Format-Specific AI Arc Director Skill Banner */}
            {(() => {
              const fmt = (project?.format_type || "manhwa").toLowerCase();
              const isAnime = fmt.includes("anime");
              const isComic = fmt.includes("comic") || fmt.includes("manga");
              const skillName = isAnime
                ? "series_arc_anime"
                : isComic
                ? "series_arc_comic"
                : "series_arc_manhwa";
              const skillLabel = isAnime
                ? "Cinematic Sakuga Anime Arc Director"
                : isComic
                ? "Japanese Manga & Graphic Comic Arc Director"
                : "Korean Webtoon Manhwa Arc Director";
              const protocolFile = isAnime
                ? "series_arc_anime.md"
                : isComic
                ? "series_arc_comic.md"
                : "series_arc_manhwa.md";
              const Icon = isAnime ? Tv : isComic ? BookOpen : Layers;
              const accentColor = isAnime
                ? "from-rose-950/30 border-rose-500/40 text-rose-400"
                : isComic
                ? "from-emerald-950/30 border-emerald-500/40 text-emerald-400"
                : "from-blue-950/30 border-blue-500/40 text-blue-400";
              const tagColor = isAnime
                ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                : isComic
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : "bg-blue-500/20 text-blue-300 border-blue-500/30";

              return (
                <div className={`bg-gradient-to-r ${accentColor} via-[#121316] to-[#121316] border rounded-2xl p-6 shadow-xl`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-neutral-900/90 text-white rounded-xl border border-white/10">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-white font-mono">
                            {skillLabel}
                          </h2>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold uppercase border ${tagColor}`}>
                            {skillName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 font-sans">
                          Active Arc Protocol: <code className="text-amber-400 font-mono">{protocolFile}</code> • Target Medium: <span className="font-bold text-slate-200 capitalize">{project?.format_type}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-mono">Architecture Mode</div>
                      <div className="text-sm font-bold text-white font-mono">
                        {isAnime ? "24fps Sakuga & 16:9 Cuts" : isComic ? "Koma-wari Spreads & Halftones" : "Vertical Infinite Scroll Cadence"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Epilogue Closure Audit Card */}
            <div className="bg-gradient-to-r from-emerald-950/30 via-[#121316] to-[#121316] border border-emerald-500/40 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      Guaranteed Story Closure Protocol
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold uppercase">
                        Active
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      The AI Arc Director actively prevents cliffhangers in the series finale, tying all character fates and lore mysteries.
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-emerald-400">
                    {audit?.closure_rate_percent ?? 100}%
                  </div>
                  <div className="text-xs text-slate-400 font-medium">Narrative Resolution Index</div>
                </div>
              </div>

              {audit && audit.unresolved_threads?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-800/80">
                  <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Threads Scheduled for Epilogue Closure:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {audit.unresolved_threads.map((thread: string, idx: number) => (
                      <div
                        key={idx}
                        className="text-xs bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg text-slate-300 flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {thread}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sessions & Chapters Roadmap */}
            <div className="space-y-6">
              {timeline.map((session) => (
                <div
                  key={session.session_number}
                  className="bg-[#121316] border border-slate-800/80 rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/60">
                    <div>
                      <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                        Season {session.session_number}
                      </span>
                      <h3 className="text-xl font-bold text-white">{session.title}</h3>
                    </div>
                    <span className="text-xs text-slate-400">
                      {session.chapters.length} Chapters / Episodes
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {session.chapters.map((chap: any) => (
                      <div
                        key={chap.chapter_number}
                        onClick={() => navigate(getStudioLink())}
                        className={`p-4 rounded-xl border cursor-pointer transition-all hover:border-violet-500/50 ${
                          chap.is_series_finale
                            ? "bg-emerald-950/10 border-emerald-500/30"
                            : "bg-[#18191E] border-slate-800/80"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm text-white">
                            Chapter {chap.chapter_number}: {chap.title}
                          </span>
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getPacingBadge(
                              chap.pacing_role
                            )}`}
                          >
                            {chap.pacing_role.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{chap.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeriesArcDirectorPage;
