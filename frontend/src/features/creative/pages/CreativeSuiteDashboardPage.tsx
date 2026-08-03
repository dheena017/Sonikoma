import React, { useMemo, useCallback } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { Sparkles, Film, Scissors, Users, Globe, Music, Mic, BarChart3, Youtube, Settings } from "lucide-react";
import CreativeSuiteDashboardStats from "@/features/creative/components/CreativeSuiteDashboardStats";
import CreativeSuiteDashboardTools from "@/features/creative/components/CreativeSuiteDashboardTools";
import CreativeSuiteDashboardActiveProject from "@/features/creative/components/CreativeSuiteDashboardActiveProject";
import CreativeSuiteDashboardActivityLog from "@/features/creative/components/CreativeSuiteDashboardActivityLog";

interface CreativeSuiteDashboardPageProps {
  user?: any;
  navigateTo: (path: string) => void;
  panels?: any[];
  setPanels?: (panels: any[]) => void;
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
  setPanels,
  projectId = null,
  seriesTitle = null,
  chapterTitle = null,
  seriesCoverImage = null,
  addNotification = () => {},
}) => {
  const activeProjectData = useProjectStore((state) => state.activeProjectData);
  const clearActiveProject = useProjectStore((state) => state.clearActiveProject);
  const activeProject = activeProjectData?.project || null;
  const activePanels = activeProjectData?.panels || panels || [];

  const exitActiveProject = useCallback(() => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        "Exit the active project? This will clear the current Creative Suite session and return you to Projects."
      );
      if (!confirmed) {
        return;
      }
    }

    clearActiveProject();
    if (typeof window !== "undefined") {
      localStorage.removeItem("active_project_id");
      localStorage.removeItem("active_series_slug");
      localStorage.removeItem("active_chapter_slug");
    }

    if (typeof setPanels === "function") {
      setPanels([]);
    }

    addNotification?.("Exited the active project.", "success");
    navigateTo("/projects");
  }, [addNotification, clearActiveProject, navigateTo, setPanels]);

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
      label: "Translation Studio",
      desc: "Multi-language dialogue and narrative translator per panel frame.",
      icon: Globe,
      path: "/panel-assistant",
      requiresPanels: true,
      badge: "Visual",
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
    <div className="flex-1 w-full space-y-6 animate-fade-in rounded-[24px] border border-[#1f1b2e] bg-[#09080e] p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.45)] text-left">
      
      {/* Welcome Hero Panel */}
      <div className="relative overflow-hidden rounded-2xl border border-[#231d38] bg-[#0d0b17] p-7 shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-36 h-36 text-purple-400" />
        </div>
        
        <div className="relative z-10 max-w-xl">
          <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-300 font-bold uppercase tracking-wider rounded-full font-mono mb-3 inline-block">
            CREATOR STUDIO HUB
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
            Welcome to the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">
              Creative Suite
            </span>
          </h1>
          <p className="text-neutral-400 mt-2 text-xs leading-relaxed font-mono">
            Fine-tune visual boundaries, compose orchestral backings, cast AI narrators, translate speech dialogues, and evaluate engagement ratings in a single location.
          </p>
        </div>
      </div>

      {/* Statistics Ribbon */}
      <CreativeSuiteDashboardStats stats={statsRibbon} />

      {/* Main Grid: Launcher and Project Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono pl-1">
            Creative AI Tools Launcher
          </h3>
          <CreativeSuiteDashboardTools
            tools={tools}
            activePanelsCount={activePanels.length}
            navigateTo={navigateTo}
          />
        </div>

        <div className="space-y-6">
          <CreativeSuiteDashboardActiveProject
            activeProject={activeProject}
            activePanelsCount={activePanels.length}
            exitActiveProject={exitActiveProject}
            navigateTo={navigateTo}
          />
          <CreativeSuiteDashboardActivityLog activities={recentActivities} />
        </div>
      </div>
    </div>
  );
};

export default CreativeSuiteDashboardPage;
