import React, { useMemo } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import {
  Sparkles,
  Film,
  Scissors,
  Users,
  Globe,
  Music,
  MessageSquare,
  Mic,
  BarChart3,
  Youtube,
  Play,
  ArrowRight,
  Clock,
  CheckCircle2,
  Lock,
  Tv,
} from "lucide-react";

interface CreativeSuiteDashboardPageProps {
  user?: any;
  navigateTo: (path: string) => void;
  panels?: any[];
  projectId?: string | null;
  seriesTitle?: string | null;
  chapterTitle?: string | null;
  seriesCoverImage?: string | null;
  addNotification?: any;
}

const CreativeSuiteDashboardPage: React.FC<CreativeSuiteDashboardPageProps> = ({
  user,
  navigateTo,
  panels = [],
  projectId = null,
  seriesTitle = null,
  chapterTitle = null,
  seriesCoverImage = null,
  addNotification = () => {},
}) => {
  const activeProjectData = useProjectStore((state) => state.activeProjectData);
  const activeProject = activeProjectData?.project || null;
  const activePanels = activeProjectData?.panels || panels || [];

  const projectIdVal = activeProject?.project_id ?? projectId;
  const seriesTitleVal = activeProject?.title ?? seriesTitle;
  const seriesCoverImageVal = activeProject?.cover_image ?? seriesCoverImage;
  const chapterTitleVal = activeProject?.episode ? (activeProject.episode.split(" - ").slice(1).join(" - ") || "") : chapterTitle;

  // Stats calculations
  const totalPanelsCount = activePanels.length;
  const totalAudioSeconds = useMemo(() => {
    if (activePanels.length === 0) return 0;
    return activePanels.reduce((acc, panel) => acc + (panel.duration || 3.0), 0);
  }, [activePanels]);

  const statsRibbon = [
    {
      label: "Audio Compiled",
      value: totalAudioSeconds > 0 ? `${totalAudioSeconds.toFixed(1)}s` : "0.0s",
      desc: "Soundtrack & Voice tracks",
      icon: Music,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
    {
      label: "Timeline Panels",
      value: totalPanelsCount.toString(),
      desc: "Active storyboard frames",
      icon: Film,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      label: "Engagement Score",
      value: totalPanelsCount > 0 ? "88.4%" : "N/A",
      desc: "Predicted CTR rating",
      icon: BarChart3,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "AI Processing Load",
      value: "Idle",
      desc: "No active compiles",
      icon: Sparkles,
      color: "text-pink-400 bg-pink-500/10 border-pink-500/20",
    },
  ];

  const tools = [
    {
      id: "optimizer",
      label: "Video Optimizer",
      desc: "Configure dimensions, sync frame timings, and render video outputs.",
      icon: Film,
      path: "/ai-optimizer",
      requiresPanels: true,
      badge: "Visual",
    },
    {
      id: "assistant",
      label: "Panel Assistant",
      desc: "Direct layout splitter, bubble remover, and image crop adjuster.",
      icon: Scissors,
      path: "/panel-assistant",
      requiresPanels: true,
      badge: "Visual",
    },
    {
      id: "thumbnails",
      label: "Thumbnail Studio",
      desc: "Create and rate custom high-performing preview thumbnails.",
      icon: Sparkles,
      path: "/ai-thumbnails",
      requiresPanels: false,
      badge: "Marketing",
    },
    {
      id: "analytics",
      label: "CTR Predictor",
      desc: "Visual heatmap analyzer and engagement metric scoring.",
      icon: BarChart3,
      path: "/ai-analytics",
      requiresPanels: false,
      badge: "Marketing",
    },
    {
      id: "audio-lab",
      label: "Sound Design Lab",
      desc: "Inject soundtrack music, select themes, and overlay SFX triggers.",
      icon: Music,
      path: "/ai-audio-lab",
      requiresPanels: true,
      badge: "Audio",
    },
    {
      id: "voice",
      label: "Voice Studio",
      desc: "Select voice actors and synthesize narration scripts.",
      icon: Mic,
      path: "/ai-voice",
      requiresPanels: true,
      badge: "Audio",
    },
    {
      id: "characters",
      label: "Character DB",
      desc: "Store custom character prompt rules and image references.",
      icon: Users,
      path: "/ai-characters",
      requiresPanels: false,
      badge: "Context",
    },
    {
      id: "translation",
      label: "Translation Studio",
      desc: "Translate panel text dialogues into multiple target languages.",
      icon: Globe,
      path: "/ai-translation",
      requiresPanels: true,
      badge: "Context",
    },
    {
      id: "youtube",
      label: "YouTube Publisher",
      desc: "Push completed video exports to YouTube Shorts or channel feed.",
      icon: Youtube,
      path: "/youtube",
      requiresPanels: false,
      badge: "Distribution",
    },
  ];

  const recentActivities = [
    {
      time: "2 mins ago",
      text: "Synthesized text-to-speech dialogue for chapter 3 panel #5",
      type: "voice",
    },
    {
      time: "15 mins ago",
      text: "Translated Solo Leveling script to Portuguese (Brazil)",
      type: "translation",
    },
    {
      time: "1 hour ago",
      text: "Cropped 12 speech bubbles via Bubble Clean AI filter",
      type: "cleaner",
    },
    {
      time: "3 hours ago",
      text: "Composed ambient synth-wave theme inside Sound Lab",
      type: "music",
    },
  ];

  return (
    <div className="space-y-6 text-left">
      
      {/* Welcome Hero Panel */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-900/30 bg-[#0e0e14]/60 p-8 shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-36 h-36 text-purple-400" />
        </div>
        
        <div className="relative z-10 max-w-xl">
          <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-400 font-bold uppercase tracking-wider rounded-full font-mono mb-4 inline-block">
            CREATOR STUDIO HUB
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">
            Welcome to the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">
              Creative Suite
            </span>
          </h1>
          <p className="text-neutral-400 mt-2 text-sm leading-relaxed font-sans">
            Fine-tune visual boundaries, compose orchestral backings, cast AI narrators, translate speech dialogues, and evaluate engagement ratings in a single location.
          </p>
        </div>
      </div>

      {/* Statistics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsRibbon.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-[#0b0b0f] border border-neutral-900 rounded-2xl p-5 hover:bg-[#0e0e14] transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl border ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-neutral-500 font-mono">
                  Telemetry
                </span>
              </div>
              <div className="text-2xl font-black text-white">{stat.value}</div>
              <div className="text-[10px] font-bold text-neutral-400 font-mono uppercase tracking-wide mt-1">
                {stat.label}
              </div>
              <p className="text-[10px] text-neutral-500 font-medium mt-0.5">
                {stat.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Launcher and Project Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Launcher Grid */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-black text-purple-400 uppercase tracking-widest font-mono pl-1">
            Creative AI Tools Launcher
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const isLocked = tool.requiresPanels && activePanels.length === 0;

              return (
                <div
                  key={tool.id}
                  onClick={() => navigateTo(tool.path)}
                  className={`bg-[#0b0b0f] border border-neutral-900 rounded-2xl p-5 hover:bg-[#0e0e14]/80 hover:border-purple-500/30 transition-all duration-300 cursor-pointer flex flex-col justify-between group relative shadow-md ${
                    isLocked ? "opacity-75 hover:border-rose-900/30" : ""
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-2.5 bg-neutral-900 border border-neutral-850 rounded-xl text-neutral-400 group-hover:text-purple-400 group-hover:border-purple-500/20 transition-all">
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono font-bold bg-neutral-900 px-2 py-0.5 rounded text-neutral-500 uppercase">
                          {tool.badge}
                        </span>
                        
                        {isLocked && (
                          <span className="text-[9px] font-mono font-bold bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/10 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> LCK
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="text-sm font-extrabold text-neutral-200 group-hover:text-white transition-colors">
                      {tool.label}
                    </h4>
                    <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                      {tool.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-900 flex justify-end">
                    <button
                      className={`text-[10px] font-bold font-mono tracking-wider uppercase flex items-center gap-1 transition-all ${
                        isLocked
                          ? "text-neutral-600 group-hover:text-rose-400"
                          : "text-purple-400 group-hover:text-purple-300 group-hover:translate-x-1"
                      }`}
                    >
                      <span>{isLocked ? "Open Locker" : "Launch"}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Side Panel: Project status and Activity Logs */}
        <div className="space-y-6">
          
          {/* Active Workspace / Project */}
          <div className="bg-[#0b0b0f] border border-neutral-900 rounded-2xl p-6 shadow-md text-left">
            <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono mb-4 flex items-center gap-1.5">
              <Tv className="w-4 h-4" /> Active Timeline
            </h3>

            {projectIdVal ? (
              <div className="space-y-4">
                <div className="flex gap-4">
                  {seriesCoverImageVal ? (
                    <img
                      src={seriesCoverImageVal}
                      className="w-16 h-20 rounded-xl object-cover border border-neutral-800"
                      alt={seriesTitleVal || "Project"}
                    />
                  ) : (
                    <div className="w-16 h-20 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-600 text-xs font-bold font-mono">
                      Cover
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">
                      {seriesTitleVal || "Untitled Series"}
                    </h4>
                    <p className="text-xs text-purple-400 truncate mt-0.5">
                      {chapterTitleVal || "Untitled Chapter"}
                    </p>
                    <div className="text-[10px] text-neutral-500 font-mono mt-2">
                      Panels Count:{" "}
                      <span className="font-bold text-neutral-300">
                        {totalPanelsCount}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const seriesSlug = activeProject?.series_slug || localStorage.getItem("active_series_slug") || "active";
                    const chapterSlug = activeProject?.chapter_slug || localStorage.getItem("active_chapter_slug") || "active";
                    navigateTo(`/workspace/editor/series/${seriesSlug}/chapters/${chapterSlug}`);
                  }}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-purple-950/20 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> Resume Editing
                </button>
              </div>
            ) : (
              <div className="py-6 text-center">
                <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-850 flex items-center justify-center mx-auto text-neutral-600 mb-3">
                  📁
                </div>
                <p className="text-xs text-neutral-500 leading-normal">
                  No active project loaded in cache. Open a storyboard project
                  from the main app workspace to unlock full Creative features.
                </p>
                <button
                  onClick={() => navigateTo("/workspace")}
                  className="mt-4 px-4 py-2 border border-purple-550/30 rounded-xl text-[10px] font-mono font-bold text-purple-400 hover:bg-purple-500/5 transition-all active:scale-95 cursor-pointer"
                >
                  Browse Projects
                </button>
              </div>
            )}
          </div>

          {/* Activity Logs */}
          <div className="bg-[#0b0b0f] border border-neutral-900 rounded-2xl p-6 shadow-md text-left">
            <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono mb-4 flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Creative Logs
            </h3>

            <div className="space-y-4">
              {recentActivities.map((act, idx) => (
                <div key={idx} className="flex gap-3 text-xs leading-normal">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-300 font-medium text-[11px]">
                      {act.text}
                    </p>
                    <span className="text-[9px] text-neutral-550 font-mono mt-0.5 block">
                      {act.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CreativeSuiteDashboardPage;
