import React, { useEffect, useState } from "react";
import {
  Sparkles,
  Plus,
  Tv,
  BookOpen,
  Film,
  Layers,
  Users,
  Compass,
  Clock,
  Play,
  Trash2,
  ChevronRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { aiSeriesApi, AISeriesProject } from "@/api/endpoints/aiSeries";
import { useSeriesNavigation } from "../hooks/useSeriesNavigation";

export const AISeriesPage: React.FC = () => {
  const { navigate } = useSeriesNavigation();
  const [seriesList, setSeriesList] = useState<AISeriesProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterFormat, setFilterFormat] = useState<string>("all");

  const loadSeries = async () => {
    try {
      setLoading(true);
      const data = await aiSeriesApi.listSeries(filterFormat === "all" ? undefined : filterFormat);
      setSeriesList(data);
    } catch (err) {
      console.error("Failed to load AI series:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeries();
  }, [filterFormat]);

  const handleDelete = async (e: React.MouseEvent, seriesId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this AI Generated Series?")) return;
    try {
      await aiSeriesApi.deleteSeries(seriesId);
      setSeriesList((prev) => prev.filter((s) => (s.series_id || s.id) !== seriesId));
    } catch (err) {
      alert("Failed to delete series.");
    }
  };

  const getFormatIcon = (format: string) => {
    if (format === "anime") return <Tv className="w-4 h-4 text-rose-400" />;
    if (format === "manhwa") return <Layers className="w-4 h-4 text-violet-400" />;
    return <BookOpen className="w-4 h-4 text-emerald-400" />;
  };

  const getFormatBadge = (format: string) => {
    if (format === "anime") return "Anime Cinema (24fps)";
    if (format === "manhwa") return "Vertical Webtoon";
    return "Comic & Manga Grid";
  };

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-neutral-200 p-6 md:p-8 select-none">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-[#2F2F2F]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[#60A5FA] text-xs font-mono font-bold tracking-wider mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
            AI Series Production Ecosystem
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white font-sans">
            AI Generated Series
          </h1>
          <p className="text-neutral-400 text-xs md:text-sm mt-1 max-w-xl font-sans">
            Multi-season franchise studios with guaranteed story closure, Character DNA consistency, and kinetic 24fps motion.
          </p>
        </div>

        <button
          onClick={() => navigate("/series-generator")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-mono font-extrabold uppercase tracking-wider shadow-lg shadow-black/50 border border-[#60A5FA]/30 transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create New AI Series
        </button>
      </div>

      {/* Metrics Bar */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#121212] border border-[#2F2F2F] p-4 rounded-2xl flex items-center gap-3.5 shadow-lg">
          <div className="p-2.5 bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded-xl text-[#3B82F6] shrink-0">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-white font-sans">{seriesList.length}</div>
            <div className="text-xs text-neutral-400 font-mono">Franchise Series</div>
          </div>
        </div>
        <div className="bg-[#121212] border border-[#2F2F2F] p-4 rounded-2xl flex items-center gap-3.5 shadow-lg">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-white font-sans">
              {seriesList.reduce((acc, s) => acc + (s.total_episodes || 0), 0)}
            </div>
            <div className="text-xs text-neutral-400 font-mono">Architected Chapters</div>
          </div>
        </div>
        <div className="bg-[#121212] border border-[#2F2F2F] p-4 rounded-2xl flex items-center gap-3.5 shadow-lg">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-white font-sans">
              {seriesList.reduce((acc, s) => acc + (s.cast?.length || 0), 0)}
            </div>
            <div className="text-xs text-neutral-400 font-mono">Locked Character DNA</div>
          </div>
        </div>
        <div className="bg-[#121212] border border-[#2F2F2F] p-4 rounded-2xl flex items-center gap-3.5 shadow-lg">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-white font-sans">100%</div>
            <div className="text-xs text-neutral-400 font-mono">Closure Guarantee</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="max-w-7xl mx-auto flex items-center gap-2 mb-8">
        {[
          { id: "all", label: "All Formats" },
          { id: "manhwa", label: "Manhwa Webtoon", icon: Layers },
          { id: "comic_manga", label: "Comic & Manga", icon: BookOpen },
          { id: "anime", label: "Anime Cinema", icon: Tv },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterFormat(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              filterFormat === tab.id
                ? "bg-[#1E1E1E] text-[#60A5FA] border border-[#3B82F6] shadow-sm"
                : "bg-[#121212] text-neutral-400 hover:text-white border border-[#2F2F2F]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-20 text-neutral-400 font-mono text-xs">Loading franchise series...</div>
        ) : seriesList.length === 0 ? (
          <div className="text-center py-16 bg-[#121212] border border-[#2F2F2F] rounded-2xl p-8 max-w-lg mx-auto shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center mx-auto text-[#3B82F6] mb-4">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-mono">No AI Series Created Yet</h3>
            <p className="text-neutral-400 text-xs mb-6 font-sans leading-relaxed">
              Step into the Creator Cockpit to configure seasons, chapters, Character DNA, and launch production.
            </p>
            <button
              onClick={() => navigate("/series-generator")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 cursor-pointer transition-all"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              Launch Creator Cockpit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {seriesList.map((series) => {
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
                  className="bg-[#121212] border border-[#2F2F2F] hover:border-[#3B82F6]/60 rounded-2xl overflow-hidden transition-all duration-300 shadow-xl flex flex-col group cursor-pointer"
                  onClick={() => navigate(studioPath)}
                >
                  {/* Card Header & Poster */}
                  <div className="h-44 relative bg-black overflow-hidden">
                    <img
                      src={
                        series.cover_image_url ||
                        `https://image.pollinations.ai/prompt/${encodeURIComponent(
                          series.title + " " + series.art_style + " epic cover illustration"
                        )}?width=800&height=450&model=flux&nologo=true`
                      }
                      alt={series.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/40 to-transparent" />

                    {/* Format Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-[#60A5FA]">
                      {getFormatIcon(format)}
                      <span>{getFormatBadge(format)}</span>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDelete(e, seriesId)}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/70 hover:bg-rose-600 text-neutral-400 hover:text-white transition-all cursor-pointer"
                      title="Delete Series"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="absolute bottom-3 left-4 right-4">
                      <h2 className="text-lg font-bold text-white line-clamp-1 font-sans">{series.title}</h2>
                      <p className="text-xs text-neutral-300 line-clamp-1 mt-0.5 font-sans">{series.logline || series.synopsis}</p>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-neutral-400 font-mono mb-3 pb-3 border-b border-[#2F2F2F]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#3B82F6]" />
                        <span>
                          {series.total_sessions} {series.total_sessions === 1 ? "Season" : "Seasons"} •{" "}
                          {series.chapters_per_session} Eps/Season
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{series.cast?.length || 2} Cast</span>
                      </div>
                    </div>

                    {/* Pre-production Vault Quick Links */}
                    <div className="grid grid-cols-3 gap-2 mb-4 text-xs font-mono font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/series/${seriesId}/cast`);
                        }}
                        className="py-1.5 px-2 rounded-xl bg-[#181818] hover:bg-[#202020] border border-[#2F2F2F] text-neutral-300 hover:text-white text-center flex items-center justify-center gap-1 cursor-pointer transition-all"
                      >
                        <Users className="w-3 h-3 text-[#3B82F6]" /> Cast
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/series/${seriesId}/world`);
                        }}
                        className="py-1.5 px-2 rounded-xl bg-[#181818] hover:bg-[#202020] border border-[#2F2F2F] text-neutral-300 hover:text-white text-center flex items-center justify-center gap-1 cursor-pointer transition-all"
                      >
                        <Compass className="w-3 h-3 text-emerald-400" /> World
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/series/${seriesId}/timeline`);
                        }}
                        className="py-1.5 px-2 rounded-xl bg-[#181818] hover:bg-[#202020] border border-[#2F2F2F] text-neutral-300 hover:text-white text-center flex items-center justify-center gap-1 cursor-pointer transition-all"
                      >
                        <ShieldCheck className="w-3 h-3 text-amber-400" /> Arc
                      </button>
                    </div>

                    {/* Bottom Action CTA */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/watch/${seriesId}`);
                        }}
                        className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 text-[#3B82F6]" /> Theater
                      </button>

                      <div className="flex items-center gap-1 text-xs font-mono font-bold text-[#60A5FA] group-hover:text-blue-400">
                        Enter Studio <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AISeriesPage;
