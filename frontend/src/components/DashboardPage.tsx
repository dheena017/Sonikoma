import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Film,
  Scissors,
  Plus,
  Video,
  Play,
  Loader2,
  ArrowRight,
  Sparkles,
  Cpu,
  Volume2,
  Sliders,
  Activity,
  ChevronRight,
  BookOpen,
  Settings,
  HelpCircle,
  FileText,
  MoreVertical,
  Trash2,
  Edit2,
  Download,
  ExternalLink,
} from "lucide-react";
import { getSourceName, getSourceIcon } from "../utils.js";
import { useThemeMode } from "../hooks/useThemeMode";

interface Project {
  project_id: string;
  title: string;
  url: string;
  created_at: string;
  status: string;
  panels_count: number;
  series_slug?: string;
  chapter_slug?: string;
  author?: string;
  cover_image?: string;
  synopsis?: string;
}

export default function DashboardPage() {
  const { themeMode } = useThemeMode();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setError(null);
        const res = await fetch("/api/projects", {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("sonikoma_token") ||
              sessionStorage.getItem("sonikoma_token") ||
              ""
            }`,
          },
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch projects (HTTP ${res.status})`);
        }
        const data = await res.json();
        if (data.projects) {
          setProjects(data.projects);
        } else {
          setProjects([]);
        }
      } catch (err: any) {
        console.error("Failed to fetch projects", err);
        setError(
          err.message || "An unexpected error occurred while loading projects."
        );
      } finally {
        setLoading(false);
      }
    };

    const testLatency = async () => {
      const start = Date.now();
      try {
        await fetch("/api/health");
        setLatency(Date.now() - start);
      } catch {
        setLatency(null);
      }
    };

    fetchProjects();
    testLatency();
  }, []);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    // Explicitly re-running the fetch logic
    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/projects", {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("sonikoma_token") ||
              sessionStorage.getItem("sonikoma_token") ||
              ""
            }`,
          },
        });
        if (!res.ok) throw new Error(`Failed to fetch (HTTP ${res.status})`);
        const data = await res.json();
        setProjects(data.projects || []);
      } catch (err: any) {
        setError(err.message || "Retry failed.");
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  };

  const handleNewSeries = () => {
    (window as any).navigateTo?.("/workspace");
  };

  const handleOpenProject = (project: Project) => {
    if (project.series_slug && project.chapter_slug) {
      (window as any).navigateTo?.(
        `/series/${project.series_slug}/chapters/${project.chapter_slug}/details`
      );
    } else {
      (window as any).navigateTo?.(`/workspace?id=${project.project_id}`);
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setOpenMenuId(null);
    if (await (window as any).confirmAsync?.("Are you sure you want to delete this project?", "Delete Project", "rose")) {
      try {
        const res = await fetch(`/api/projects/${projectId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("sonikoma_token") || ""}`,
          },
        });
        if (res.ok) {
          setProjects(projects.filter(p => p.project_id !== projectId));
        }
      } catch (err) {
        console.error("Delete failed", err);
      }
    }
  };

  const handleExport = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setOpenMenuId(null);
    (window as any).navigateTo?.(`/workspace?id=${project.project_id}&action=export`);
  };

  const handleRename = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setOpenMenuId(null);
    // Logic for rename could be a modal or direct navigation
    (window as any).navigateTo?.(`/workspace?id=${project.project_id}`);
  };

  const toggleMenu = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === projectId ? null : projectId);
  };

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const completedCount = projects.filter(
    (p) => p.status?.toLowerCase() === "completed"
  ).length;
  const processingCount = projects.filter(
    (p) => p.status?.toLowerCase() === "processing"
  ).length;
  const totalPanels = projects.reduce(
    (acc, p) => acc + (p.panels_count || 0),
    0
  );

  return (
    <div className="w-full min-h-full bg-[#070709] text-neutral-100 flex flex-col pt-10 px-6 sm:px-12 md:px-20 lg:px-32 animate-fade-in relative z-10 pb-20">
      {/* HEADER SECTION */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <img
            src={themeMode === "light" ? "/logo-light.png" : "/logo-dark.png"}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/logo.png";
            }}
            alt="Sonikoma Logo"
            className="h-16 w-16 mb-6 rounded-2xl shadow-lg shadow-purple-900/20 object-cover"
            style={{
              background: themeMode === "light" ? "#ffffff" : "#000000",
            }}
          />
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
            Welcome to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
              Dashboard
            </span>
          </h1>
          <p className="text-neutral-400 text-sm md:text-base font-mono max-w-xl">
            Your command center for converting webtoons to stunning narrated
            videos. Manage series, track AI pipeline progress, and start new
            conversions.
          </p>
        </div>

        <div className="flex shrink-0">
          <button
            onClick={handleNewSeries}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-purple-900/40 transition-all hover:-translate-y-0.5 cursor-pointer active:scale-95"
          >
            <Plus className="h-5 w-5" />
            <span>New Series</span>
          </button>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-12">
        <div className="bg-[#0b0b0e]/80 border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Film className="h-32 w-32" />
          </div>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">
            Total Series
          </p>
          <div className="text-4xl font-black text-white">
            {projects.length}
          </div>
        </div>

        <div className="bg-[#0b0b0e]/80 border border-emerald-500/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity text-emerald-500">
            <Video className="h-32 w-32" />
          </div>
          <p className="text-xs font-bold text-emerald-500/70 uppercase tracking-widest mb-1">
            Completed
          </p>
          <div className="text-4xl font-black text-white">{completedCount}</div>
        </div>

        <div className="bg-[#0b0b0e]/80 border border-amber-500/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-amber-500/30 transition-colors">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity text-amber-500">
            <Loader2 className="h-32 w-32" />
          </div>
          <p className="text-xs font-bold text-amber-500/70 uppercase tracking-widest mb-1">
            Processing
          </p>
          <div className="text-4xl font-black text-white">
            {processingCount}
          </div>
        </div>

        <div className="bg-[#0b0b0e]/80 border border-indigo-500/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity text-indigo-500">
            <Scissors className="h-32 w-32" />
          </div>
          <p className="text-xs font-bold text-indigo-500/70 uppercase tracking-widest mb-1">
            Total Panels
          </p>
          <div className="text-4xl font-black text-white">{totalPanels}</div>
        </div>
      </div>

      {/* TWO COLUMN CONTENT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Recent Series & Pipeline Capabilities */}
        <div className="lg:col-span-8 space-y-10">
          {/* RECENT SERIES */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5 text-purple-400" />
                Recent Series
              </h2>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center animate-pulse shadow-lg shadow-purple-500/20">
                  <img
                    src={
                      themeMode === "light"
                        ? "/logo-light.png"
                        : "/logo-dark.png"
                    }
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/logo.png";
                    }}
                    alt="Loading..."
                    className="w-full h-full rounded-[10px] object-cover p-[2px]"
                    style={{
                      background: themeMode === "light" ? "#ffffff" : "#000000",
                    }}
                  />
                </div>
              </div>
            ) : error ? (
              <div className="border border-red-500/20 bg-red-500/5 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-3xl bg-red-900/20 border border-red-500/20 flex items-center justify-center text-red-500 mb-4">
                  <Activity className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Failed to load projects
                </h3>
                <p className="text-sm text-neutral-400 max-w-sm mb-6 font-mono">
                  {error}
                </p>
                <button
                  onClick={handleRetry}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm transition-all cursor-pointer"
                >
                  Retry Connection
                </button>
              </div>
            ) : projects.length === 0 ? (
              <div className="border border-white/5 bg-[#0b0b0e]/50 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-500 mb-4">
                  <Film className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  No series yet
                </h3>
                <p className="text-sm text-neutral-400 max-w-sm mb-6 font-mono">
                  You haven't created any storyboard series yet. Start by
                  scraping a webtoon URL!
                </p>
                <button
                  onClick={handleNewSeries}
                  className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 font-bold text-sm transition-all cursor-pointer"
                >
                  Start New Series
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {projects.slice(0, 6).map((project) => {
                  const isProcessing = project.status?.toLowerCase() === "processing" || project.status?.toLowerCase() === "exporting";
                  const SourceIcon = getSourceIcon?.(project.url) || ExternalLink;

                  return (
                    <div
                      key={project.project_id}
                      onClick={() => handleOpenProject(project)}
                      className="bg-[#0b0b0e]/80 border border-white/5 hover:border-purple-500/30 rounded-2xl overflow-hidden cursor-pointer transition-all hover:bg-neutral-900/80 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-900/10 group flex flex-col relative min-h-[380px]"
                    >
                      {/* Context Menu Button */}
                      <div className="absolute top-3 right-3 z-20">
                        <button
                          onClick={(e) => toggleMenu(e, project.project_id)}
                          className="p-1.5 rounded-lg bg-black/40 text-neutral-400 hover:text-white hover:bg-black/60 transition-colors backdrop-blur-sm"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {openMenuId === project.project_id && (
                          <div className="absolute right-0 mt-2 w-40 bg-[#16161b] border border-white/10 rounded-xl shadow-2xl py-1.5 z-30 animate-in fade-in zoom-in duration-100">
                            <button onClick={(e) => handleRename(e, project)} className="w-full text-left px-4 py-2 text-xs text-neutral-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                              <Edit2 className="h-3.5 w-3.5" /> Rename
                            </button>
                            <button onClick={(e) => handleExport(e, project)} className="w-full text-left px-4 py-2 text-xs text-neutral-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                              <Download className="h-3.5 w-3.5" /> Export
                            </button>
                            <div className="h-px bg-white/5 my-1" />
                            <button onClick={(e) => handleDeleteProject(e, project.project_id)} className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2">
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Cover Image or Thumbnail */}
                      <div className="h-32 w-full bg-neutral-900 relative overflow-hidden shrink-0">
                        {project.cover_image ? (
                          <img
                            src={project.cover_image}
                            alt={project.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-700 bg-gradient-to-br from-neutral-900 to-neutral-800">
                            <Film className="h-10 w-10 opacity-30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0e] to-transparent opacity-60" />

                        {/* Play Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]">
                          <div className="h-12 w-12 rounded-full bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-900/40 transform scale-75 group-hover:scale-100 transition-transform">
                            <Play className="h-6 w-6 text-white fill-white ml-0.5" />
                          </div>
                        </div>

                        {/* Status Badge Overlay */}
                        <div className="absolute top-3 left-3">
                          <div
                            className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-md border backdrop-blur-md ${
                              project.status?.toLowerCase() === "completed"
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                : project.status?.toLowerCase() === "processing"
                                ? "bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse"
                                : "bg-neutral-800/40 text-neutral-300 border-white/10"
                            }`}
                          >
                            {project.status || "Draft"}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <SourceIcon className="h-3 w-3 text-neutral-500" />
                          <span className="text-[10px] text-neutral-500 font-mono tracking-wider uppercase">
                            {getSourceName(project.url)}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-white mb-1.5 line-clamp-1 group-hover:text-purple-300 transition-colors">
                          {project.title || "Untitled Series"}
                        </h3>

                        {project.synopsis && (
                          <p className="text-[11px] text-neutral-500 line-clamp-2 mb-4 leading-relaxed font-sans">
                            {project.synopsis}
                          </p>
                        )}

                        <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                          <div className="text-[10px] text-neutral-400 font-medium flex items-center gap-1.5">
                            <Scissors className="h-3 w-3 text-neutral-600" />
                            <span className="text-white font-bold">{project.panels_count || 0}</span> panels
                          </div>
                          <div className="text-[10px] text-neutral-600 font-mono">
                            {new Date(project.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Processing Progress Bar */}
                      {isProcessing && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800">
                          <div className="h-full bg-gradient-to-r from-amber-500 to-purple-500 animate-shimmer" style={{ width: '100%', backgroundSize: '200% 100%' }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI PROCESSING CAPABILITIES */}
          <div className="bg-[#0b0b0e]/50 border border-white/5 rounded-3xl p-6 md:p-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-bold text-white">
                AI Processing Pipeline
              </h3>
            </div>
            <p className="text-xs text-neutral-400 font-mono mb-6 leading-relaxed">
              Sonikoma orchestrates multiple specialized models to synthesize
              static webtoon series strips into full cinematic animated videos.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-purple-950/40 border border-purple-800/30 flex items-center justify-center shrink-0 text-purple-400">
                  <Scissors className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    1. Smart Panel Slicer
                  </h4>
                  <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                    Runs Canny Edge detection algorithms on backend workers to
                    detect gutters, isolate layout frames, and slice strips
                    cleanly.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-indigo-950/40 border border-indigo-800/30 flex items-center justify-center shrink-0 text-indigo-400">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    2. Speech Bubble OCR & Clean
                  </h4>
                  <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                    Locates text boundaries in comics, erases speech bubbles
                    using clearing methods, and OCR transcribes dialog into
                    transcription nodes.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-cyan-950/40 border border-cyan-800/30 flex items-center justify-center shrink-0 text-cyan-400">
                  <Volume2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    3. Dialog Voice Synthesis
                  </h4>
                  <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                    Streams script lines into advanced voice generation engines
                    (e.g. Bark, Coqui, ElevenLabs) to assign custom voices to
                    different characters.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-pink-950/40 border border-pink-800/30 flex items-center justify-center shrink-0 text-pink-400">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    4. FFmpeg Video Compositor
                  </h4>
                  <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                    Binds sliced visuals with generated audios, overlays ambient
                    soundscapes, and compiles MP4 render outputs using smooth
                    camera paths.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar (Status & Quick Links) */}
        <div className="lg:col-span-4 space-y-6">
          {/* SYSTEM HEALTH / METRICS */}
          <div className="bg-[#0b0b0e]/80 border border-white/5 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider font-mono flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              Engine Status
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-500">Computational Server</span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Online
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-500">API Health Latency</span>
                <span className="text-neutral-300 font-bold">
                  {latency !== null ? `${latency}ms` : "Checking..."}
                </span>
              </div>

              <hr className="border-white/5" />

              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 font-mono block">
                  Active Worker Pipelines
                </span>

                <div className="space-y-2.5 mt-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-neutral-400">Browser Scraping</span>
                    <span className="text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/30 font-bold text-[9px] uppercase">
                      Ready
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-neutral-400">Panel Segmentor</span>
                    <span className="text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/30 font-bold text-[9px] uppercase">
                      Ready
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-neutral-400">Speech OCR Models</span>
                    <span className="text-purple-400 bg-purple-950/20 px-2 py-0.5 rounded border border-purple-900/30 font-bold text-[9px] uppercase">
                      Connected
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-neutral-400">TTS Audio Engine</span>
                    <span className="text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/30 font-bold text-[9px] uppercase">
                      Ready
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* HELP & RESOURCES */}
          <div className="bg-[#0b0b0e]/80 border border-white/5 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider font-mono flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-400" />
              Guides & Reference
            </h3>

            <div className="space-y-3">
              <button
                onClick={() => (window as any).navigateTo?.("/shortcuts")}
                className="w-full text-left bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/5 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-purple-900/10 border border-purple-500/10 flex items-center justify-center text-purple-400">
                    <Sliders className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Keyboard Shortcuts
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-sans mt-0.5">
                      Quickly edit storyboards & camera sweeps
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-purple-400 transition-colors shrink-0" />
              </button>

              <button
                onClick={() => (window as any).navigateTo?.("/settings")}
                className="w-full text-left bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/5 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-indigo-900/10 border border-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Settings className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Pipeline Settings
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-sans mt-0.5">
                      Configure OCR & voice models
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-indigo-400 transition-colors shrink-0" />
              </button>

              <button
                onClick={() => (window as any).navigateTo?.("/logs")}
                className="w-full text-left bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/5 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-cyan-900/10 border border-cyan-500/10 flex items-center justify-center text-cyan-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      System Output Logs
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-sans mt-0.5">
                      Examine processing execution in real-time
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-cyan-400 transition-colors shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
