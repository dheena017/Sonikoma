import React, { useEffect, useState } from "react";
import {
  Sparkles,
  Plus,
  Layers,
  Tv,
  BookOpen,
  ChevronRight,
  Clock,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { aiSeriesApi, AISeriesProject } from "@/features/intelligence/series/api/aiSeries";
import { useSeriesNavigation } from "@/features/intelligence/series/hooks/useSeriesNavigation";

let cachedSeriesList: AISeriesProject[] = [];
let cachedSeriesLoaded = false;

export const DashboardAISeriesSection: React.FC = () => {
  const { navigate } = useSeriesNavigation();
  const [seriesList, setSeriesList] = useState<AISeriesProject[]>(cachedSeriesList);
  const [loading, setLoading] = useState(!cachedSeriesLoaded && cachedSeriesList.length === 0);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await aiSeriesApi.listSeries();
        if (isMounted) {
          cachedSeriesList = data || [];
          cachedSeriesLoaded = true;
          setSeriesList(cachedSeriesList);
        }
      } catch (err) {
        console.warn("No AI series found or server offline");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const getFormatBadge = (fmt: string) => {
    if (fmt === "anime") return "Anime Cinema (24fps)";
    if (fmt === "manhwa") return "Vertical Webtoon";
    return "Comic & Manga";
  };

  return (
    <div className="mb-10">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-600/10 text-violet-400 border border-violet-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">AI Generated Series</h2>
              <span className="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-[10px] font-bold uppercase tracking-wider">
                Autonomous
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Multi-session franchises with Character DNA consistency & guaranteed story closure.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/ai-series")}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-medium transition-colors"
          >
            View All ({seriesList.length}) <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => navigate("/series-generator")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs transition-all shadow-md shadow-violet-900/20"
          >
            <Plus className="w-3.5 h-3.5" /> New AI Series
          </button>
        </div>
      </div>

      {/* Content Shelf */}
      {loading ? (
        <div className="h-40 bg-[#121316] border border-slate-800 rounded-2xl flex items-center justify-center text-xs text-slate-400">
          Loading AI Series...
        </div>
      ) : seriesList.length === 0 ? (
        <div className="p-6 bg-gradient-to-r from-violet-950/20 to-[#121316] border border-violet-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-sm text-white">Create Your First AI Generated Series</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Set season scale (1–5), chapters (1–25), select publication art styles, and generate in seconds.
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate("/series-generator")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow"
          >
            <Zap className="w-3.5 h-3.5" /> Launch Creator Cockpit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {seriesList.slice(0, 3).map((series) => {
            const seriesId = series.series_id || series.id || "";
            const format = series.format_type || "manhwa";
            const studioPath =
              format === "anime"
                ? `/studio/anime/${seriesId}`
                : format === "comic_manga"
                ? `/studio/comic/${seriesId}`
                : `/studio/manhwa/${seriesId}`;

            return (
              <div
                key={seriesId}
                onClick={() => navigate(studioPath)}
                className="p-4 bg-[#121316] border border-slate-800 hover:border-violet-500/50 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 uppercase">
                      {getFormatBadge(format)}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-violet-400" />
                      {series.total_sessions}S • {series.chapters_per_session}Ch
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white line-clamp-1 group-hover:text-violet-300 transition-colors">
                    {series.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                    {series.logline || series.synopsis}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    {series.cast?.length || 2} Characters • 100% Epilogue
                  </span>
                  <span className="text-violet-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Studio <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DashboardAISeriesSection;
