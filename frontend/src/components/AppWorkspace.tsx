import React, { useEffect, useState } from "react";
import { History, ArrowRight, Layout, Sparkles } from "lucide-react";
import UrlInputPanel from "./scraper/UrlInputPanel.js";
import ProjectConfirmModal from "./scraper/ProjectConfirmModal.js";

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
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("autoScrape") === "true" && props.targetUrl) {
      // Remove autoScrape so it doesn't loop on refresh
      params.delete("autoScrape");
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?${params.toString()}`
      );
      props.setShowScrapeConfirmModal(true);
    }
  }, [props.targetUrl]);

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


  const handleWorkspaceImport = async () => {
    if (!targetUrl.trim()) return;

    navigateTo?.("/workspace/editor");

    const temporaryProjectId = `temp_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 10)}`;

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
      className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-20 flex flex-col gap-10 items-center justify-center min-h-[80vh]"
    >
      <div className="w-full space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">

        {/* RESUME CARD (Optimized UX with Thumbnail) */}
        {hasActiveProject && (
           <div className="group bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-[32px] p-6 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl transition-all hover:border-purple-400/50">
              <div className="flex flex-col md:flex-row items-center gap-6 w-full">
                 {/* Visual Anchor / Thumbnail */}
                 <div className="relative h-28 w-48 rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-inner shrink-0 group-hover:scale-[1.02] transition-transform duration-500">
                    {seriesCoverImage ? (
                      <img src={seriesCoverImage} className="w-full h-full object-cover" alt="Series Cover" />
                    ) : panels.length > 0 ? (
                      <img src={panels[0].image_url} className="w-full h-full object-cover" alt="Latest Panel" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-purple-600/10">
                        <History className="h-8 w-8 text-purple-500/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
                       <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[9px] font-black text-white uppercase tracking-widest font-mono">In Progress</span>
                    </div>
                 </div>

                 <div className="flex-1 text-center md:text-left space-y-2">
                    <div className="flex items-center justify-center md:justify-start gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
                        <History className="h-4 w-4 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-black text-white tracking-tight">Resume Workspace</h3>
                    </div>
                    <p className="text-xs text-purple-200/60 font-medium max-w-sm">
                      Pick up exactly where you left off with <span className="text-purple-300 font-bold">"{seriesTitle || projectId}"</span>. Your assets and timeline are ready.
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
                Launch Workspace <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
           </div>
        )}

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
                {[0,1,2].map(i => (
                  <div key={i} className="h-1.5 w-1.5 rounded-full bg-purple-500" style={{animationDelay: `${i*200}ms`}} />
                ))}
              </div>
              <p className="text-sm font-bold text-neutral-300">
                Launching Pro Editor for <span className="text-purple-400">"{seriesTitle || 'New Series'}"</span>...
              </p>
              <p className="text-xs text-neutral-500 max-w-sm">
                Mindanao's upskilling project is initializing the vision pipeline. We are currently scraping and optimizing your assets for the workspace.
              </p>
           </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
           {[
             {title: '1. Scrape', desc: 'Auto-fetch images from any link'},
             {title: '2. Edit', desc: 'Sync audio & panels in Pro Editor'},
             {title: '3. Render', desc: 'Export high-quality 4K videos'}
           ].map(step => (
             <div key={step.title} className="space-y-1">
                <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">{step.title}</p>
                <p className="text-xs text-neutral-400 font-medium">{step.desc}</p>
             </div>
           ))}
        </div>
      </div>

    </main>
  );
}

const AppWorkspace = React.memo(AppWorkspaceInner);
export default AppWorkspace;
