import React from "react";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ChevronRight,
  Download,
  ExternalLink,
  History,
  LayoutGrid,
  Loader2,
  Play,
  Plus,
  Scissors,
  Search,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";

interface SeriesDetailsPageProps {
  onNavigateHome: () => void;
  navigateTo: (path: string) => void;
}

export default function SeriesDetailsPage({
  onNavigateHome,
  navigateTo,
}: SeriesDetailsPageProps) {
  const [seriesSlug, setSeriesSlug] = React.useState<string | null>(null);
  const [series, setSeries] = React.useState<any | null>(null);
  const [chapters, setChapters] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handlePathChange = () => {
      const path = window.location.pathname;
      const match = path.match(/\/series\/([^\/]+)$/);
      if (match) {
        setSeriesSlug(match[1]);
      }
    };

    handlePathChange();
    window.addEventListener("popstate", handlePathChange);
    return () => window.removeEventListener("popstate", handlePathChange);
  }, []);

  React.useEffect(() => {
    if (!seriesSlug) return;

    const fetchSeriesDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const token =
          localStorage.getItem("sonikoma_token") ||
          sessionStorage.getItem("sonikoma_token");
        const headers: HeadersInit = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch(`/api/projects/series/${seriesSlug}`, {
          headers,
        });
        if (!res.ok) {
          throw new Error(`Failed to load series (HTTP ${res.status})`);
        }
        const data = await res.json();
        if (data.success) {
          setSeries(data.series);

          // Also fetch chapters for this series
          const chaptersRes = await fetch(`/api/projects`, { headers });
          const chaptersData = await chaptersRes.json();
          if (chaptersData.success) {
            const seriesChapters = chaptersData.projects.filter(
              (p: any) => p.series_id === data.series.id
            );
            setChapters(seriesChapters);
          }
        } else {
          throw new Error(data.message || "Failed to load series details");
        }
      } catch (err: any) {
        setError(err.message || "Error fetching series details.");
      } finally {
        setLoading(false);
      }
    };

    fetchSeriesDetails();
  }, [seriesSlug]);

  const totalPanels = React.useMemo(() => {
    return chapters.reduce((sum, ch) => sum + (ch.panels_count || 0), 0);
  }, [chapters]);

  const handleDeleteChapter = async (
    e: React.MouseEvent,
    projectId: string
  ) => {
    e.stopPropagation();
    if (
      !window.confirm(
        "Are you sure you want to delete this chapter? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(projectId);
    try {
      const token =
        localStorage.getItem("sonikoma_token") ||
        sessionStorage.getItem("sonikoma_token");
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setChapters((prev) => prev.filter((ch) => ch.project_id !== projectId));
      }
    } catch (err) {
      console.error("Failed to delete chapter:", err);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDownloadVideo = (
    e: React.MouseEvent,
    videoUrl: string | null
  ) => {
    e.stopPropagation();
    if (!videoUrl) return;
    const link = document.createElement("a");
    link.href = videoUrl;
    link.download = `video_${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
        <p className="text-sm font-bold text-neutral-400 font-mono">
          Retrieving series landing page...
        </p>
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center p-6 space-y-4 text-center">
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-3xl max-w-md space-y-3">
          <h2 className="text-lg font-black text-rose-400">Series Not Found</h2>
          <p className="text-xs text-neutral-400 leading-relaxed">{error}</p>
        </div>
        <button
          onClick={() => navigateTo("/profile")}
          className="px-5 py-2 bg-neutral-900 border border-white/5 text-neutral-300 hover:text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
        >
          Return to Profile
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070709] text-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex-1 w-full text-left">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo("/profile")}
              className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-white/5 hover:border-white/10 text-neutral-400 hover:text-white rounded-2xl transition-all cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-white leading-tight">
                {series.title}
              </h1>
              <p className="text-sm text-neutral-400 font-bold mt-0.5">
                by {series.author || "Unknown Author"}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigateTo("/dashboard")}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-sm font-black transition-all active:scale-95 shadow-[0_0_20px_-5px_rgba(147,51,234,0.5)] cursor-pointer group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            Create New Chapter
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Metadata */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#0c0c10]/80 border border-white/5 rounded-3xl p-6 space-y-6 shadow-xl backdrop-blur-xl">
              {series.cover_image && (
                <div className="w-full aspect-[2/3] rounded-2xl overflow-hidden border border-white/5 bg-black/40">
                  <img
                    src={series.cover_image}
                    alt={series.title}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-neutral-500 text-xs font-bold uppercase">
                    Genre
                  </span>
                  <span className="text-purple-400 text-xs font-black uppercase">
                    {series.genre}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-neutral-500 text-xs font-bold uppercase">
                    Chapters
                  </span>
                  <span className="text-white text-xs font-bold font-mono">
                    {chapters.length}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-neutral-500 text-xs font-bold uppercase">
                    Total Panels
                  </span>
                  <span className="text-white text-xs font-bold font-mono">
                    {totalPanels}
                  </span>
                </div>
              </div>
              {series.synopsis && (
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">
                    Synopsis
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {series.synopsis}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Chapter List */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-purple-400" />
              Published Chapters
            </h3>

            <div className="space-y-3">
              {chapters.length > 0 ? (
                chapters.map((chapter) => (
                  <div
                    key={chapter.project_id}
                    className="bg-[#0b0b0e]/60 border border-white/5 hover:border-purple-500/20 rounded-2xl p-4 flex items-center justify-between transition-all cursor-pointer group"
                    onClick={() =>
                      navigateTo(
                        `/series/${series.slug}/chapters/${chapter.chapter_slug}`
                      )
                    }
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center">
                        <Play className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                            {chapter.episode}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                              chapter.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : chapter.status === "processing"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-neutral-800 text-neutral-400 border border-white/5"
                            }`}
                          >
                            {chapter.status || "Draft"}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-500 font-mono">
                          {chapter.panels_count} Panels • Last edited{" "}
                          {new Date(chapter.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {chapter.video_url && (
                        <button
                          onClick={(e) =>
                            handleDownloadVideo(e, chapter.video_url)
                          }
                          className="p-2 hover:bg-neutral-800 text-neutral-400 hover:text-emerald-400 rounded-lg transition-colors"
                          title="Download Video"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) =>
                          handleDeleteChapter(e, chapter.project_id)
                        }
                        disabled={isDeleting === chapter.project_id}
                        className="p-2 hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete Chapter"
                      >
                        {isDeleting === chapter.project_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                      <div className="w-px h-4 bg-white/5 mx-1" />
                      <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-purple-400 transition-colors" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center bg-neutral-900/20 border border-white/5 rounded-3xl">
                  <p className="text-sm text-neutral-500 font-bold">
                    No chapters published yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
