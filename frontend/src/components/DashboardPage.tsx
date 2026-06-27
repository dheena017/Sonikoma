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
} from "lucide-react";
import { getSourceName } from "../utils.js";
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
}

export default function DashboardPage() {
  const { themeMode } = useThemeMode();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
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
        const data = await res.json();
        if (data.projects) {
          setProjects(data.projects);
        }
      } catch (err) {
        console.error("Failed to fetch projects", err);
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

  const handleNewSeries = () => {
    (window as any).navigateTo?.("/workspace");
  };

  const handleOpenProject = (project: Project) => {
    if (project.series_slug && project.chapter_slug) {
      // Navigate using slug-based URL → opens the chapter details page
      (window as any).navigateTo?.(
        `/series/${project.series_slug}/chapters/${project.chapter_slug}/details`
      );
    } else {
      // Fallback: open in workspace editor by project ID
      (window as any).navigateTo?.(`/workspace?id=${project.project_id}`);
    }
  };

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
            style={{ background: themeMode === "light" ? "#ffffff" : "#000000" }}
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
                      themeMode === "light" ? "/logo-light.png" : "/logo-dark.png"
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
                {projects.slice(0, 6).map((project) => (
                  <div
                    key={project.project_id}
                    onClick={() => handleOpenProject(project)}
                    className="bg-[#0b0b0e]/80 border border-white/5 hover:border-purple-500/30 rounded-2xl p-5 cursor-pointer transition-all hover:bg-neutral-900/80 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-900/10 group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-900/20 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                        <Film className="h-6 w-6" />
                      </div>
                      <div
                        className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest rounded-lg border ${
                          project.status?.toLowerCase() === "completed"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : project.status?.toLowerCase() === "processing"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-neutral-800/50 text-neutral-400 border-white/5"
                        }`}
                      >
                        {project.status || "Draft"}
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-white mb-1 line-clamp-1 group-hover:text-purple-300 transition-colors">
                      {project.title || "Untitled Series"}
                    </h3>
                    <p className="text-[10px] text-neutral-500 font-mono mb-4 flex items-center gap-1.5">
                      <span>
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>{getSourceName(project.url)}</span>
                    </p>

                    <div className="flex items-center justify-between border-t border-white/5 pt-4">
                      <div className="text-xs text-neutral-400 font-semibold">
                        <span className="text-white font-bold">
                          {project.panels_count || 0}
                        </span>{" "}
                        panels
                      </div>
                      <div className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs font-bold">
                        <span>Open</span>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                ))}
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
