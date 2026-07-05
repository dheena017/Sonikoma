import React, { useEffect, useState } from "react";
import {
  History,
  ArrowRight,
  Layout,
  Sparkles,
  Scissors,
  Brain,
  Film,
  Award,
  BookOpen,
  Music,
  Settings,
  Play,
  Loader2,
  TrendingUp,
  Terminal,
  BookOpenCheck,
} from "lucide-react";
import UrlInputPanel from "../Feature/scraper/UrlInputPanel";
import ProjectConfirmPanel from "../confirmationmodels/ProjectConfirmPanel";

interface AppWorkspaceProps {
  [key: string]: any;
  projectId: string | null;
  addNotification: any;
  targetUrl: string;
  setTargetUrl: (v: string) => void;
  selectedSource: string;
  setSelectedSource: (v: string) => void;
  selectedModel: string;
  setSelectedModel: (v: string) => void;
  isProcessing: boolean;
  isScraping: boolean;
  scrapeImages: (
    customUrl?: string,
    overrideProjectId?: string
  ) => Promise<void>;
  seriesTitle: string;
  setSeriesTitle: (v: string) => void;
  chapterNumber: string;
  setChapterNumber: (v: string) => void;
  chapterTitle: string;
  setChapterTitle: (v: string) => void;
  scrapedGenre: string;
  setScrapedGenre: (v: string) => void;
  seriesAuthor: string;
  setSeriesAuthor: (v: string) => void;
  seriesCoverImage: string;
  setSeriesCoverImage: (v: string) => void;
  seriesSynopsis: string;
  setSeriesSynopsis: (v: string) => void;
  smartSlice?: boolean;
  setSmartSlice?: (v: boolean) => void;
  showScrapeConfirmModal: boolean;
  setShowScrapeConfirmModal: (v: boolean) => void;
  resetWorkspace?: () => void;
  narrationStyle: string;
  setNarrationStyle: (v: string) => void;
  cropSensitivity?: number;
  setCropSensitivity?: (v: number) => void;
  autoSplitTallStrips?: boolean;
  setAutoSplitTallStrips?: (v: boolean) => void;
  navigateTo?: (path: string) => void;
  panels?: any[];
  isDashboardOnly?: boolean;
  isGeneratingStoryboard?: boolean;
  handleGenerateStoryboardAI?: () => Promise<void>;
}

interface StoredProject {
  project_id: string;
  url?: string;
  series_slug?: string | null;
  chapter_slug?: string | null;
  title?: string;
}

const AppWorkspaceInner = (props: AppWorkspaceProps) => {
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(false);
  const [activeGuideTab, setActiveGuideTab] = useState<string>("general");

  const {
    projectId,
    addNotification,
    targetUrl,
    setTargetUrl,
    selectedSource,
    setSelectedSource,
    selectedModel,
    setSelectedModel,
    isProcessing,
    isScraping,
    scrapeImages,
    seriesTitle,
    setSeriesTitle,
    chapterNumber,
    setChapterNumber,
    chapterTitle,
    setChapterTitle,
    scrapedGenre,
    setScrapedGenre,
    seriesAuthor,
    setSeriesAuthor,
    seriesCoverImage,
    setSeriesCoverImage,
    seriesSynopsis,
    setSeriesSynopsis,
    smartSlice,
    setSmartSlice,
    showScrapeConfirmModal,
    setShowScrapeConfirmModal,
    resetWorkspace,
    narrationStyle,
    setNarrationStyle,
    cropSensitivity,
    setCropSensitivity,
    autoSplitTallStrips,
    setAutoSplitTallStrips,
    navigateTo,
    panels = [],
    isDashboardOnly = false,
  } = props;

  const samplePresets = [
    {
      id: "boundless",
      name: "Boundless Necromancer",
      style: "Action Webtoon (Tall Strip)",
      url: "https://www.webtoons.com/en/action/boundless-necromancer/viewer?title_no=5212&episode_no=1",
      chapter: "1",
      genre: "Action",
      author: "Seong-su Gwang / Ji-hye Han",
      synopsis: "A hunter climbs a mysterious tower to seek strength.",
      cropSensitivity: 45,
      autoSplit: true,
      smartSlice: true,
      narration: "long",
    },
    {
      id: "sololeveling",
      name: "Solo Leveling",
      style: "Action/Fantasy (Webtoon)",
      url: "https://www.webtoons.com/en/action/solo-leveling/episode-1/viewer?title_no=5999&episode_no=1",
      chapter: "1",
      genre: "Action/Fantasy",
      author: "Chugong",
      synopsis:
        "In a world where hunters must battle deadly monsters, Jinwoo Sung is the weakest of them all.",
      cropSensitivity: 50,
      autoSplit: true,
      smartSlice: true,
      narration: "dramatic",
    },
    {
      id: "traditional_manga",
      name: "Manga Prototype",
      style: "Page-based (B&W)",
      url: "https://example.com/manga-sample/chapter-1",
      chapter: "1",
      genre: "Shonen",
      author: "Artist Master",
      synopsis: "Classic black and white page-based layout format.",
      cropSensitivity: 60,
      autoSplit: false,
      smartSlice: false,
      narration: "brief",
    },
    {
      id: "western_grid",
      name: "Comic Grid",
      style: "Western Superhero Layout",
      url: "https://example.com/western-comic/chapter-1",
      chapter: "1",
      genre: "Superhero",
      author: "Writer & Penciler",
      synopsis: "Multi-panel grid with border borders and action shots.",
      cropSensitivity: 35,
      autoSplit: false,
      smartSlice: true,
      narration: "long",
    },
  ];

  const applyPreset = (preset: (typeof samplePresets)[0]) => {
    setTargetUrl(preset.url);
    setSeriesTitle(preset.name);
    setChapterNumber(preset.chapter);
    setChapterTitle(`Chapter ${preset.chapter}`);
    setScrapedGenre(preset.genre);
    setSeriesAuthor(preset.author);
    setSeriesCoverImage("");
    setSeriesSynopsis(preset.synopsis);
    setSmartSlice?.(preset.smartSlice);
    setCropSensitivity?.(preset.cropSensitivity);
    setAutoSplitTallStrips?.(preset.autoSplit);
    setNarrationStyle(preset.narration);

    addNotification(
      `Loaded preset configuration for "${preset.name}".`,
      "success"
    );
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("autoScrape") === "true" && targetUrl) {
      params.delete("autoScrape");
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?${params.toString()}`
      );
      setShowScrapeConfirmModal(true);
    }
  }, [targetUrl]);

  useEffect(() => {
    const fetchRecentProjects = async () => {
      try {
        setLoadingProjects(true);
        const res = await fetch("/api/projects", {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("sonikoma_token") ||
              sessionStorage.getItem("sonikoma_token") ||
              ""
            }`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.projects) {
            const sorted = [...data.projects].sort((a: any, b: any) => {
              return (
                new Date(b.created_at || 0).getTime() -
                new Date(a.created_at || 0).getTime()
              );
            });
            setRecentProjects(sorted.slice(0, 3));
          }
        }
      } catch (err) {
        console.error("Failed to fetch projects in workspace page:", err);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchRecentProjects();
  }, []);

  const handleWorkspaceImport = async () => {
    if (!targetUrl.trim()) return;

    const temporaryProjectId = `temp_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 10)}`;

    const nav = navigateTo || (window as any).navigateTo;
    const targetPath = `/workspace/editor?id=${temporaryProjectId}`;
    if (typeof nav === "function") {
      nav(targetPath);
    } else {
      window.history.pushState({}, "", targetPath);
      window.dispatchEvent(new Event("popstate"));
    }

    try {
      await scrapeImages(targetUrl, temporaryProjectId);
    } catch (err: any) {
      console.error(err);
      addNotification(
        `Failed to import images: ${err.message || "Unknown error"}`,
        "error"
      );
    }
  };

  const hasActiveProject =
    (projectId && panels.length > 0) ||
    (projectId && projectId.startsWith("proj_"));

  return (
    <main
      id="main_workspace"
      className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-16 flex flex-col gap-12 items-center justify-start min-h-[80vh]"
    >
      <div className="w-full space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* RESUME CARD (Optimized UX with Thumbnail) */}
        {hasActiveProject && (
          <div className="group bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-[32px] p-6 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl transition-all hover:border-purple-400/50">
            <div className="flex flex-col md:flex-row items-center gap-6 w-full">
              {/* Visual Anchor / Thumbnail */}
              <div className="relative h-28 w-48 rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-inner shrink-0 group-hover:scale-[1.02] transition-transform duration-500">
                {seriesCoverImage ? (
                  <img
                    src={seriesCoverImage}
                    className="w-full h-full object-cover"
                    alt="Series Cover"
                  />
                ) : panels.length > 0 ? (
                  <img
                    src={panels[0].image_url}
                    className="w-full h-full object-cover"
                    alt="Latest Panel"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-purple-600/10">
                    <History className="h-8 w-8 text-purple-500/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black text-white uppercase tracking-widest font-mono">
                    In Progress
                  </span>
                </div>
              </div>

              <div className="flex-1 text-center md:text-left space-y-2">
                <div className="flex items-center justify-center md:justify-start gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
                    <History className="h-4 w-4 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight">
                    Resume Workspace
                  </h3>
                </div>
                <p className="text-xs text-purple-200/60 font-medium max-w-sm">
                  Pick up exactly where you left off with{" "}
                  <span className="text-purple-300 font-bold">
                    "{seriesTitle || projectId}"
                  </span>
                  . Your assets and timeline are ready.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (!projectId) return;
                navigateTo?.(`/workspace?id=${projectId}`);
              }}
              className="w-full md:w-auto px-8 py-4 bg-white text-purple-950 font-black rounded-2xl text-xs uppercase tracking-[0.15em] hover:bg-purple-50 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]"
            >
              Launch Workspace{" "}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}

        {/* 1. DIRECT TOOLS LAUNCHPAD */}
        <div className="w-full space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
              <Layout className="h-4 w-4 text-purple-400" />
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">
              Direct Tools Launchpad
            </h3>
          </div>
          <p className="text-xs text-neutral-400 font-medium max-w-2xl">
            Skip URL scraping and jump directly into specific editing or
            pipeline configurations.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {/* Card 1: Video Studio */}
            <div
              onClick={() => {
                const tempId = `temp_${Date.now()}_${Math.random()
                  .toString(36)
                  .substring(2, 10)}`;
                navigateTo?.(`/workspace/editor?id=${tempId}`);
              }}
              className="group cursor-pointer bg-neutral-905/40 hover:bg-purple-955/20 border border-neutral-800 hover:border-purple-500/30 rounded-2xl p-5 backdrop-blur-md transition-all duration-300 flex flex-col justify-between gap-6 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] active:scale-[0.98]"
            >
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500/20 transition-all">
                  <Film className="h-5 w-5 text-purple-400" />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                  Video Studio
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                  Create, arrange, and edit panel-level animations, voiceovers,
                  and sound effects.
                </p>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black text-purple-400 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                Launch Studio <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Card 2: Auto-Crop Panel Editor */}
            <div
              onClick={() => navigateTo?.("/auto-crop")}
              className="group cursor-pointer bg-neutral-905/40 hover:bg-purple-955/20 border border-neutral-800 hover:border-purple-500/30 rounded-2xl p-5 backdrop-blur-md transition-all duration-300 flex flex-col justify-between gap-6 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] active:scale-[0.98]"
            >
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500/20 transition-all">
                  <Scissors className="h-5 w-5 text-purple-400" />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                  Auto-Crop
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                  Extract standalone panel panels from vertical strips and
                  page-based formats automatically.
                </p>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black text-purple-400 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                Open Cropper <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Card 3: Clean-Bubbles */}
            <div
              onClick={() => navigateTo?.("/bubble-cleaner")}
              className="group cursor-pointer bg-neutral-905/40 hover:bg-purple-955/20 border border-neutral-800 hover:border-purple-500/30 rounded-2xl p-5 backdrop-blur-md transition-all duration-300 flex flex-col justify-between gap-6 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] active:scale-[0.98]"
            >
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500/20 transition-all">
                  <Brain className="h-5 w-5 text-purple-400" />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                  Bubble Cleaner
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                  Erase speech bubbles and inpaint underlying panel artwork
                  using AI models.
                </p>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black text-purple-400 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                Open Cleaner <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Card 4: AI Models & Keys */}
            <div
              onClick={() => navigateTo?.("/ai-models")}
              className="group cursor-pointer bg-neutral-905/40 hover:bg-purple-955/20 border border-neutral-800 hover:border-purple-500/30 rounded-2xl p-5 backdrop-blur-md transition-all duration-300 flex flex-col justify-between gap-6 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] active:scale-[0.98]"
            >
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500/20 transition-all">
                  <Award className="h-5 w-5 text-purple-400" />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                  AI Models
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                  Configure model parameters, api endpoints, and keys for
                  vision, audio, and translation.
                </p>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black text-purple-400 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                Configure <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* 2. SAMPLE PRESETS SELECTOR */}
        <div className="w-full bg-[#111116]/60 border border-neutral-800/80 rounded-3xl p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />
            <h4 className="text-sm font-bold text-white tracking-tight">
              Quick Start Presets & Templates
            </h4>
          </div>
          <p className="text-xs text-neutral-400 font-medium font-sans">
            Select a pre-configured template format to instantly fill in scraper
            parameters, crop sensitivities, and auto-split configurations.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            {samplePresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className="group relative flex flex-col text-left p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/60 hover:border-purple-500/40 hover:bg-purple-955/10 cursor-pointer transition-all duration-200"
              >
                <span className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                  {preset.name}
                </span>
                <span className="text-[10px] text-neutral-500 font-medium mt-1">
                  {preset.style}
                </span>
                <span className="absolute bottom-2.5 right-3 h-4 w-4 rounded-full bg-purple-500/10 border border-purple-500/20 group-hover:bg-purple-500/20 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                  <ArrowRight className="h-2.5 w-2.5 text-purple-400" />
                </span>
              </button>
            ))}
          </div>
        </div>

        <UrlInputPanel
          targetUrl={targetUrl}
          setTargetUrl={setTargetUrl}
          selectedSource={selectedSource}
          setSelectedSource={setSelectedSource}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          isProcessing={isProcessing}
          isScraping={isScraping}
          handleGenerateVideo={() => {}}
          handleScrape={handleWorkspaceImport}
          addNotification={addNotification}
          narrationStyle={narrationStyle}
          setNarrationStyle={setNarrationStyle}
          seriesTitle={seriesTitle}
          setSeriesTitle={setSeriesTitle}
          chapterNumber={chapterNumber}
          setChapterNumber={setChapterNumber}
          chapterTitle={chapterTitle}
          setChapterTitle={setChapterTitle}
          scrapedGenre={scrapedGenre}
          setScrapedGenre={setScrapedGenre}
          seriesAuthor={seriesAuthor}
          setSeriesAuthor={setSeriesAuthor}
          seriesCoverImage={seriesCoverImage}
          setSeriesCoverImage={setSeriesCoverImage}
          seriesSynopsis={seriesSynopsis}
          setSeriesSynopsis={setSeriesSynopsis}
          smartSlice={smartSlice}
          setSmartSlice={setSmartSlice}
          resetWorkspace={resetWorkspace}
          cropSensitivity={cropSensitivity}
          setCropSensitivity={setCropSensitivity}
          autoSplitTallStrips={autoSplitTallStrips}
          setAutoSplitTallStrips={setAutoSplitTallStrips}
        />

        {/* LOADING CONTEXT BRIDGE */}
        {isScraping && (
          <div className="bg-black/40 border border-white/5 rounded-3xl p-8 backdrop-blur-md flex flex-col items-center gap-4 text-center animate-pulse">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-purple-500"
                  style={{ animationDelay: `${i * 200}ms` }}
                />
              ))}
            </div>
            <p className="text-sm font-bold text-neutral-300">
              Launching Pro Editor for{" "}
              <span className="text-purple-400">
                "{seriesTitle || "New Series"}"
              </span>
              ...
            </p>
            <p className="text-xs text-neutral-500 max-w-sm">
              Mindanao's upskilling project is initializing the vision pipeline.
              We are currently scraping and optimizing your assets for the
              workspace.
            </p>
          </div>
        )}

        {/* 3. RECENT ACTIVE PROJECTS */}
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
                <History className="h-4 w-4 text-purple-400" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                Recent Projects
              </h3>
            </div>
            <button
              onClick={() => navigateTo?.("/projects")}
              className="text-xs font-bold text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1 cursor-pointer"
            >
              View All Projects
            </button>
          </div>

          {loadingProjects ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-32 bg-neutral-900/50 border border-neutral-800 animate-pulse rounded-2xl"
                />
              ))}
            </div>
          ) : recentProjects.length === 0 ? (
            <div className="bg-neutral-900/20 border border-neutral-800/60 rounded-2xl p-6 text-center">
              <p className="text-xs font-medium text-neutral-500">
                No active projects found. Scrape a URL or open Video Studio to
                get started!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentProjects.map((project) => (
                <div
                  key={project.project_id}
                  className="group relative bg-[#111116]/60 border border-neutral-800 hover:border-purple-500/30 rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all duration-300 hover:shadow-[0_0_15px_rgba(168,85,247,0.05)]"
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    <div className="h-14 w-14 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 shrink-0 relative flex items-center justify-center">
                      {project.cover_image ? (
                        <img
                          src={project.cover_image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpenCheck className="h-5 w-5 text-neutral-700" />
                      )}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate max-w-full">
                        {project.title || "Untitled Series"}
                      </h4>
                      <p className="text-[10px] text-neutral-500 font-mono">
                        ID: {project.project_id.substring(0, 12)}...
                      </p>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[9px] font-bold text-emerald-500/80 uppercase">
                          {project.status || "Ready"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-neutral-800/60 pt-3 mt-1">
                    <span className="text-[10px] font-mono text-neutral-500">
                      {project.panels_count || 0} Panels
                    </span>
                    <button
                      onClick={() => {
                        navigateTo?.(`/workspace?id=${project.project_id}`);
                      }}
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-[10px] transition-all flex items-center gap-1 cursor-pointer"
                    >
                      Resume <Play className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. CREATOR TIPS & GUIDE */}
        <div className="w-full bg-[#0a0a0f]/50 border border-neutral-800/80 rounded-[32px] p-6 sm:p-8 backdrop-blur-md space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
              <BookOpen className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Creator Guide & Best Practices
              </h3>
              <p className="text-xs text-neutral-400 font-medium">
                Expert recommendations for extracting panel assets, syncing
                audio narration, and rendering 4K videos.
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-neutral-800">
            {[
              { id: "general", label: "General Workflow", icon: Layout },
              { id: "cropping", label: "Panel Extraction", icon: Scissors },
              { id: "audio", label: "Voice & Audio Sync", icon: Music },
              {
                id: "rendering",
                label: "HD Rendering & Output",
                icon: Settings,
              },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeGuideTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveGuideTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    isActive
                      ? "border-purple-500 text-purple-300"
                      : "border-transparent text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  <TabIcon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="min-h-[140px] flex items-center">
            {activeGuideTab === "general" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200 w-full">
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest">
                    The Three-Step Cycle
                  </h4>
                  <p className="text-xs text-neutral-300 leading-relaxed font-medium">
                    Start by scraping a webtoon episode or uploading a custom
                    panel zip file. The system processes the images, extracts
                    speech bubbles, and opens the timeline view.
                  </p>
                  <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                    Next, tweak panel animations, transitions, and audio sync
                    inside the Video Studio. Lastly, trigger the final video
                    rendering to export standard or 4K files.
                  </p>
                </div>
                <div className="bg-neutral-900/40 p-4 rounded-2xl border border-neutral-800/80 space-y-3">
                  <h5 className="text-xs font-bold text-white flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-purple-400" />{" "}
                    Pipeline Metrics
                  </h5>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                      <p className="text-[9px] font-bold text-neutral-500 uppercase">
                        Avg Scrape Time
                      </p>
                      <p className="text-base font-black text-white font-mono mt-0.5">
                        ~12s
                      </p>
                    </div>
                    <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                      <p className="text-[9px] font-bold text-neutral-500 uppercase">
                        Avg Export Quality
                      </p>
                      <p className="text-base font-black text-purple-400 font-mono mt-0.5">
                        4K UHD
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeGuideTab === "cropping" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200 w-full">
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest">
                    Extraction & Auto-Split
                  </h4>
                  <p className="text-xs text-neutral-300 leading-relaxed font-medium font-sans">
                    For vertical strip webtoons, keep{" "}
                    <span className="text-purple-300 font-bold">
                      Auto-Split Tall Strips
                    </span>{" "}
                    enabled. The system detects natural gutters and divides
                    panels automatically.
                  </p>
                  <p className="text-xs text-neutral-400 leading-relaxed font-medium font-sans">
                    Tweak{" "}
                    <span className="text-purple-300 font-bold">
                      Crop Sensitivity
                    </span>{" "}
                    if panels are cut mid-scene. Higher sensitivity works better
                    for standard grids, while lower values help with continuous
                    action panels.
                  </p>
                </div>
                <div className="space-y-2.5">
                  <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800/80 text-[11px] font-medium text-neutral-300 flex items-start gap-2.5">
                    <span className="h-5 w-5 rounded bg-purple-500/10 flex items-center justify-center font-mono text-purple-400 shrink-0">
                      1
                    </span>
                    <span>
                      Webtoons usually need sensitivity values between 40 and
                      50.
                    </span>
                  </div>
                  <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800/80 text-[11px] font-medium text-neutral-300 flex items-start gap-2.5">
                    <span className="h-5 w-5 rounded bg-purple-500/10 flex items-center justify-center font-mono text-purple-400 shrink-0">
                      2
                    </span>
                    <span>
                      Page-based traditional manga performs best at 55 to 65.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeGuideTab === "audio" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200 w-full">
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest">
                    Voice Synthesis & Narration
                  </h4>
                  <p className="text-xs text-neutral-300 leading-relaxed font-medium font-sans">
                    Configure narration style presets to fit your story's tone.{" "}
                    <span className="text-purple-300 font-bold">dramatic</span>{" "}
                    adds pauses and suspense, while{" "}
                    <span className="text-purple-300 font-bold">brief</span>{" "}
                    speed-reads summaries.
                  </p>
                  <p className="text-xs text-neutral-400 leading-relaxed font-medium font-sans">
                    You can customize voice actor files and sound effects within
                    individual panels on the storyboard workspace in the Video
                    Studio view.
                  </p>
                </div>
                <div className="space-y-2.5">
                  <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800/80 text-[11px] font-medium text-neutral-300 flex items-start gap-2.5">
                    <span className="h-5 w-5 rounded bg-purple-500/10 flex items-center justify-center font-mono text-purple-400 shrink-0">
                      1
                    </span>
                    <span>
                      Enable background music themes inside System Settings for
                      ambient audio.
                    </span>
                  </div>
                  <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800/80 text-[11px] font-medium text-neutral-300 flex items-start gap-2.5">
                    <span className="h-5 w-5 rounded bg-purple-500/10 flex items-center justify-center font-mono text-purple-400 shrink-0">
                      2
                    </span>
                    <span>
                      Use AI character profiles to ensure voice actors match
                      dialog bubble targets.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeGuideTab === "rendering" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200 w-full">
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest">
                    High Definition Output
                  </h4>
                  <p className="text-xs text-neutral-300 leading-relaxed font-medium font-sans">
                    Export settings default to vertical formats suitable for
                    Shorts, Reels, and TikTok. You can switch aspect ratios
                    under timeline options inside the main editor view.
                  </p>
                  <p className="text-xs text-neutral-400 leading-relaxed font-medium font-sans">
                    Set custom frame rates up to 60 FPS in System Settings for
                    smoother zoom and pan effects in action scenes.
                  </p>
                </div>
                <div className="bg-neutral-900/40 p-4 rounded-2xl border border-neutral-800/80 space-y-2 flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase">
                    Available Output Formats
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      "MP4 H.264",
                      "WebM",
                      "Shorts 9:16",
                      "Landscape 16:9",
                      "4K UHD",
                    ].map((fmt) => (
                      <span
                        key={fmt}
                        className="px-2 py-1 bg-neutral-950 border border-neutral-800 text-[10px] font-bold text-neutral-300 rounded-lg"
                      >
                        {fmt}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
          {[
            { title: "1. Scrape", desc: "Auto-fetch images from any link" },
            { title: "2. Edit", desc: "Sync audio & panels in Pro Editor" },
            { title: "3. Render", desc: "Export high-quality 4K videos" },
          ].map((step) => (
            <div key={step.title} className="space-y-1">
              <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">
                {step.title}
              </p>
              <p className="text-xs text-neutral-400 font-medium">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

const AppWorkspace = React.memo(AppWorkspaceInner);
export default AppWorkspace;
