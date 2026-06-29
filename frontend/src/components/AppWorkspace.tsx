import React from "react";
import { CheckCircle2 } from "lucide-react";
import UrlInputPanel from "./scraper/UrlInputPanel.js";
import LiveScraperDeck from "./scraper/LiveScraperDeck.js";
import PipelineStatusCard from "./pipeline/PipelineStatusCard.js";
import TerminalLogs from "./terminal/TerminalLogs.js";
import StoryboardTimeline from "./timeline/StoryboardTimeline.js";
import VideoMonitor from "./video/VideoMonitor.js";
import VolumeAndProgressPanel from "./video/VolumeAndProgressPanel.js";
import OutputMetadataPanel from "./OutputMetadataPanel.js";
import ProjectConfirmModal from "./scraper/ProjectConfirmModal.js";
import { LogEntry } from "../types/logs";

interface AppWorkspaceProps {
  isDashboardOnly?: boolean;
  projectId: string | null;
  panels: any[];
  setPanels: any;
  isGeneratingStoryboard?: boolean;
  handleGenerateStoryboardAI?: () => Promise<void>;
  consoleLogs: LogEntry[];
  setConsoleLogs: any;
  scrapedImages: string[];
  setScrapedImages: any;
  selectedScraped: string[];
  setSelectedScraped: any;
  activePreviewTab: "video" | "timeline";
  setActivePreviewTab: (tab: "video" | "timeline") => void;
  setEditingImageIdx: (idx: number | null) => void;
  setEditCropTop: (v: number) => void;
  setEditCropBottom: (v: number) => void;
  setEditCropLeft: (v: number) => void;
  setEditCropRight: (v: number) => void;
  setEditAutoTrim: (v: boolean) => void;
  showBubbleModal: boolean;
  setShowBubbleModal: (v: boolean) => void;
  playStoryboardAudio: (idx: number) => void;
  isCleaningBubbles: boolean;
  cleanProgress: any;
  bubbleCroppingImgUrl: string | null;
  showAutoCropModal: boolean;
  setShowAutoCropModal: (v: boolean) => void;
  isBatchCropping: boolean;
  batchProgress: any;
  croppingImgUrl: string | null;
  handleAutoCropSelected: () => void;
  handleCleanBubblesSelected: () => void;
  handleCancelBatch?: () => void;
  videoPlayerRef: React.RefObject<HTMLVideoElement | null>;
  addNotification: any;
  setErrorPopup: any;
  fetchWithInterceptor: any;
  targetUrl: string;
  setTargetUrl: (v: string) => void;
  selectedSource: string;
  setSelectedSource: (v: string) => void;
  selectedModel: string;
  setSelectedModel: (v: string) => void;
  isProcessing: boolean;
  handleGenerateVideo: () => void;
  isScraping: boolean;
  scrapeImages: (
    customUrl?: string,
    overrideProjectId?: string
  ) => Promise<void>;
  mergingIndices: number[];
  handleStitchWithNext: (idx: number) => Promise<void>;
  addPanelsToStoryboard: (
    urls: string[],
    currentScrapedList?: string[],
    shouldScroll?: boolean
  ) => void;
  progressStatus: any;
  videoUrl: string | null;
  setVideoUrl: any;
  aspectRatio: "9:16" | "16:9";
  currentPanelIndex: number;
  setCurrentPanelIndex: (idx: number) => void;
  playbackTime: number;
  setPlaybackTime: (time: number) => void;
  reprocessingPanelId: number | null;
  storyboardPlaying: boolean;
  toggleStoryboardPlayback: () => void;
  resetStoryboardPlayback: () => void;
  isMuted: boolean;
  setIsMuted: (v: boolean) => void;
  volume: number;
  setVolume: (v: number) => void;
  musicTheme: string;
  voiceActor: string;
  narrationStyle: string;
  setNarrationStyle: (v: string) => void;
  bubbleSensitivity?: number;
  bubbleDetectionStyle?: string;
  bubbleEraseMethod?: string;
  bubbleDilation?: number;
  bubbleInpaintRadius?: number;
  cropSensitivity?: number;
  cropBackgroundMode?: string;
  aspectRatioLock?: string;
  minPanelAreaPct?: number;
  overlapMergeThreshold?: number;
  useLocalCV?: boolean;
  autoSplitTallStrips?: boolean;
  cropModel?: string;
  cropMinHeightPx?: number;
  cropCannyLow?: number;
  cropCannyHigh?: number;
  cropCloseKernelSize?: number;
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
  saveProject?: (customPanels?: any[], options?: any) => Promise<boolean>;
  resetWorkspace?: () => void;
  isRendering?: boolean;
  renderProgress?: number;
  renderEtaSeconds?: number | null;
  handleRenderFinalVideo?: () => void;
}

export function AppWorkspace({
  isDashboardOnly = true,
  projectId,
  panels,
  setPanels,
  consoleLogs,
  setConsoleLogs,
  scrapedImages,
  setScrapedImages,
  selectedScraped,
  setSelectedScraped,
  activePreviewTab,
  setActivePreviewTab,
  setEditingImageIdx,
  setEditCropTop,
  setEditCropBottom,
  setEditCropLeft,
  setEditCropRight,
  setEditAutoTrim,
  showBubbleModal,
  setShowBubbleModal,
  playStoryboardAudio,
  isCleaningBubbles,
  cleanProgress,
  bubbleCroppingImgUrl,
  showAutoCropModal,
  setShowAutoCropModal,
  isBatchCropping,
  batchProgress,
  croppingImgUrl,
  handleAutoCropSelected,
  handleCleanBubblesSelected,
  handleCancelBatch,
  videoPlayerRef,
  addNotification,
  setErrorPopup,
  fetchWithInterceptor,
  targetUrl,
  setTargetUrl,
  selectedSource,
  setSelectedSource,
  selectedModel,
  setSelectedModel,
  isProcessing,
  handleGenerateVideo,
  isScraping,
  scrapeImages,
  mergingIndices,
  handleStitchWithNext,
  addPanelsToStoryboard,
  progressStatus,
  videoUrl,
  setVideoUrl,
  aspectRatio,
  currentPanelIndex,
  setCurrentPanelIndex,
  playbackTime,
  setPlaybackTime,
  reprocessingPanelId,
  storyboardPlaying,
  toggleStoryboardPlayback,
  resetStoryboardPlayback,
  isMuted,
  setIsMuted,
  volume,
  setVolume,
  musicTheme,
  voiceActor,
  narrationStyle,
  setNarrationStyle,
  bubbleSensitivity,
  bubbleDetectionStyle,
  bubbleEraseMethod,
  bubbleDilation,
  bubbleInpaintRadius,
  cropSensitivity,
  cropBackgroundMode,
  aspectRatioLock,
  minPanelAreaPct,
  overlapMergeThreshold,
  useLocalCV,
  autoSplitTallStrips,
  cropModel,
  cropMinHeightPx,
  cropCannyLow,
  cropCannyHigh,
  cropCloseKernelSize,
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
  saveProject,
  isGeneratingStoryboard = false,
  handleGenerateStoryboardAI,
  resetWorkspace,
  isRendering = false,
  renderProgress = 0,
  renderEtaSeconds = null,
  handleRenderFinalVideo,
}: AppWorkspaceProps) {
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("autoScrape") === "true" && targetUrl) {
      // Remove autoScrape so it doesn't loop on refresh
      params.delete("autoScrape");
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?${params.toString()}`
      );

      const token =
        localStorage.getItem("sonikoma_token") ||
        sessionStorage.getItem("sonikoma_token");

      if (!token) {
        const usedFree = localStorage.getItem("sonikoma_free_scrape_used");
        if (usedFree === "true") {
          addNotification(
            "You've used your free try. Please sign in to import more links!",
            "warning"
          );
          if (typeof (window as any).navigateTo === "function") {
            (window as any).navigateTo("/login");
          } else {
            window.history.pushState({}, "", "/login");
            window.dispatchEvent(new Event("popstate"));
          }
          return;
        } else {
          localStorage.setItem("sonikoma_free_scrape_used", "true");
        }
      }
      setShowScrapeConfirmModal(true);
    }
  }, [targetUrl]);

  const handleConfirmProjectAndScrape = async (
    details: {
      seriesTitle: string;
      chapterNumber: string;
      chapterTitle: string;
      scrapedGenre: string;
      seriesAuthor: string;
      seriesCoverImage: string;
      seriesSynopsis: string;
    },
    isTemporary?: boolean
  ) => {
    setShowScrapeConfirmModal(false);

    // Update parent states
    setSeriesTitle(details.seriesTitle);
    setChapterNumber(details.chapterNumber);
    setChapterTitle(details.chapterTitle);
    setScrapedGenre(details.scrapedGenre);
    setSeriesAuthor(details.seriesAuthor);
    setSeriesCoverImage(details.seriesCoverImage);
    setSeriesSynopsis(details.seriesSynopsis);

    // Generate project_id
    const generatedProjectId =
      (isTemporary ? "temp_" : "proj_") +
      Date.now() +
      "_" +
      Math.random().toString(36).substring(2, 10);

    try {
      const formattedEpisode = (() => {
        const num = details.chapterNumber.trim();
        const name = details.chapterTitle.trim();
        if (num && name) return `Chapter ${num} - ${name}`;
        if (num) return `Chapter ${num}`;
        if (name) return name;
        return "";
      })();

      const logMsg = isTemporary
        ? "Initializing temporary preview session (no data will be saved)..."
        : `Initializing workspace for "${details.seriesTitle}"...`;
      addNotification(logMsg, "info");

      if (!isTemporary) {
        // Clear query parameters when moving into a managed project
        window.history.pushState(null, "", "/workspace");
      }

      // Start the actual scrape
      await scrapeImages(targetUrl, generatedProjectId);
    } catch (err: any) {
      console.error(err);
      addNotification(
        `Failed to create project: ${err.message || "Unknown error"}`,
        "error"
      );
    }
  };

  const handleSaveMeta = async () => {
    if (saveProject) {
      await saveProject(undefined, {
        savingMessage: "Saving metadata...",
        successMessage: "Metadata saved successfully!",
        errorMessage: "Failed to save metadata.",
      });
    }
  };

  const handleSaveAssets = async () => {
    if (projectId?.startsWith("temp_")) {
      addNotification(
        "Temporary Session: Saving images is disabled.",
        "warning"
      );
      return;
    }
    const token =
      localStorage.getItem("sonikoma_token") ||
      sessionStorage.getItem("sonikoma_token");
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    try {
      addNotification("Saving images...", "info");
      const scrapeRes = await fetch("/api/save-scraped-images", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          url: targetUrl,
          images: scrapedImages,
        }),
      });
      if (scrapeRes.ok) {
        addNotification("Images saved successfully!", "success");
      } else {
        throw new Error("Failed to save images");
      }
    } catch (err: any) {
      addNotification(`Failed to save images: ${err.message}`, "error");
    }
  };

  const handleSaveStoryboard = async () => {
    if (saveProject) {
      await saveProject(panels, {
        savingMessage: "Saving timeline...",
        successMessage: "Timeline saved successfully!",
        errorMessage: "Failed to save timeline.",
      });
    }
  };

  const handleSaveVideo = async () => {
    if (saveProject) {
      await saveProject(undefined, {
        savingMessage: "Saving video...",
        successMessage: "Video saved successfully!",
        errorMessage: "Failed to save video.",
      });
    }
  };

  return (
    <main
      id="main_workspace"
      className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 lg:gap-10 items-start"
    >
      {/* LEFT COLUMN: SOURCE INTEGRATION */}
      <div
        id="controls_column"
        className={`order-1 lg:order-1 flex flex-col gap-6 md:gap-8 min-w-0 ${
          panels.length > 0 ? "lg:col-span-7" : "lg:col-span-12"
        }`}
      >
        {/* CONVERSION INPUT CARD */}
        <UrlInputPanel
          targetUrl={targetUrl}
          setTargetUrl={setTargetUrl}
          selectedSource={selectedSource}
          setSelectedSource={setSelectedSource}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          isProcessing={isProcessing}
          isScraping={isScraping}
          handleGenerateVideo={handleGenerateVideo}
          handleScrape={() => {
            const token =
              localStorage.getItem("sonikoma_token") ||
              sessionStorage.getItem("sonikoma_token");
            if (!token) {
              const usedFree = localStorage.getItem(
                "sonikoma_free_scrape_used"
              );
              if (usedFree === "true") {
                addNotification(
                  "You've used your free try. Please sign in to import more links!",
                  "warning"
                );
                if (typeof (window as any).navigateTo === "function") {
                  (window as any).navigateTo("/login");
                } else {
                  window.history.pushState({}, "", "/login");
                  window.dispatchEvent(new Event("popstate"));
                }
                return;
              } else {
                localStorage.setItem("sonikoma_free_scrape_used", "true");
              }
            }
            setShowScrapeConfirmModal(true);
          }}
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
          handleSaveMeta={handleSaveMeta}
        />

        {/* SEPARATED IMAGE STRIPS GALLERY */}
        <LiveScraperDeck
          isDashboardOnly={isDashboardOnly}
          scrapedImages={scrapedImages}
          isScraping={isScraping}
          selectedScraped={selectedScraped}
          setSelectedScraped={setSelectedScraped}
          setScrapedImages={setScrapedImages}
          mergingIndices={mergingIndices}
          setConsoleLogs={setConsoleLogs}
          panels={panels}
          setPanels={setPanels}
          currentPanelIndex={currentPanelIndex}
          handleMergeWithNext={handleStitchWithNext}
          setEditingImageIdx={setEditingImageIdx}
          openEditingImageIdx={setEditingImageIdx}
          setEditCropTop={setEditCropTop}
          setEditCropBottom={setEditCropBottom}
          setEditCropLeft={setEditCropLeft}
          setEditCropRight={setEditCropRight}
          setEditAutoTrim={setEditAutoTrim}
          addNotification={addNotification}
          fetchWithInterceptor={fetchWithInterceptor}
          setErrorPopup={setErrorPopup}
          showBubbleModal={showBubbleModal}
          setShowBubbleModal={setShowBubbleModal}
          isCleaningBubbles={isCleaningBubbles}
          cleanProgress={cleanProgress}
          bubbleCroppingImgUrl={bubbleCroppingImgUrl}
          showAutoCropModal={showAutoCropModal}
          setShowAutoCropModal={setShowAutoCropModal}
          isBatchCropping={isBatchCropping}
          batchProgress={batchProgress}
          croppingImgUrl={croppingImgUrl}
          handleAutoCropSelected={handleAutoCropSelected}
          handleCleanBubblesSelected={handleCleanBubblesSelected}
          handleCancelBatch={handleCancelBatch}
          addPanelsToStoryboard={addPanelsToStoryboard}
          seriesTitle={seriesTitle}
          chapterNumber={chapterNumber}
          chapterTitle={chapterTitle}
          targetUrl={targetUrl}
          selectedSource={selectedSource}
          handleSaveAssets={handleSaveAssets}
        />

        {/* ACTIVE QUEUE / LIVE PIPELINE PROGRESS */}
        {isProcessing && <PipelineStatusCard progressStatus={progressStatus} />}

        {/* REAL-TIME LOG MONITOR — Always visible */}
        <TerminalLogs
          consoleLogs={consoleLogs}
          setConsoleLogs={setConsoleLogs}
        />

        {/* DYNAMIC STORYBOARD TIMELINE DECK (hidden when empty to save vertical space on mobile) */}
        {panels.length > 0 && (
          <div id="storyboard_timeline_section">
            <StoryboardTimeline
              panels={panels}
              setPanels={setPanels}
              currentPanelIndex={currentPanelIndex}
              setCurrentPanelIndex={setCurrentPanelIndex}
              activePreviewTab={activePreviewTab}
              setActivePreviewTab={setActivePreviewTab}
              setPlaybackTime={setPlaybackTime}
              hasScrapedImages={scrapedImages.length > 0}
              setVideoUrl={setVideoUrl}
              addNotification={addNotification}
              targetUrl={targetUrl}
              fetchWithInterceptor={fetchWithInterceptor}
              selectedModel={selectedModel}
              setConsoleLogs={setConsoleLogs}
              voiceActor={voiceActor}
              musicTheme={musicTheme}
              narrationStyle={narrationStyle}
              playStoryboardAudio={playStoryboardAudio}
              bubbleSensitivity={bubbleSensitivity}
              bubbleDetectionStyle={bubbleDetectionStyle}
              bubbleEraseMethod={bubbleEraseMethod}
              bubbleDilation={bubbleDilation}
              bubbleInpaintRadius={bubbleInpaintRadius}
              cropSensitivity={cropSensitivity}
              cropBackgroundMode={cropBackgroundMode}
              aspectRatioLock={aspectRatioLock}
              minPanelAreaPct={minPanelAreaPct}
              overlapMergeThreshold={overlapMergeThreshold}
              useLocalCV={useLocalCV}
              saveProject={saveProject}
              cropModel={cropModel}
              cropMinHeightPx={cropMinHeightPx}
              cropCannyLow={cropCannyLow}
              cropCannyHigh={cropCannyHigh}
              cropCloseKernelSize={cropCloseKernelSize}
              autoSplitTallStrips={autoSplitTallStrips}
              handleSaveStoryboard={handleSaveStoryboard}
              handleCancelBatch={handleCancelBatch}
            />
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: INTEGRATED CINEMA PLAYER */}
      {panels.length > 0 && (
        <div
          id="cinema_column"
          className="order-2 lg:order-2 lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24 min-w-0"
        >
          <VideoMonitor
            activePreviewTab={activePreviewTab}
            setActivePreviewTab={setActivePreviewTab}
            videoUrl={videoUrl}
            panels={panels}
            aspectRatio={aspectRatio}
            videoPlayerRef={videoPlayerRef}
            currentPanelIndex={currentPanelIndex}
            playbackTime={playbackTime}
            reprocessingPanelId={reprocessingPanelId}
          />

          {/* PLAYBACK CONTROLLER ACCESSORIES FOR TIMELINE PREVIEW */}
          {activePreviewTab === "timeline" && panels.length > 0 && (
            <VolumeAndProgressPanel
              panels={panels}
              setPanels={setPanels}
              currentPanelIndex={currentPanelIndex}
              playbackTime={playbackTime}
              storyboardPlaying={storyboardPlaying}
              toggleStoryboardPlayback={toggleStoryboardPlayback}
              resetStoryboardPlayback={resetStoryboardPlayback}
              isMuted={isMuted}
              setIsMuted={setIsMuted}
              volume={volume}
              setVolume={setVolume}
              addNotification={addNotification}
            />
          )}

          {/* RENDER FINAL VIDEO BUTTON */}
          <div className="bg-[#111115] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden">
            {isRendering && (
              <div
                className="absolute left-0 top-0 bottom-0 bg-purple-600/20 transition-all duration-300"
                style={{ width: `${renderProgress}%` }}
              />
            )}
            <button
              onClick={handleRenderFinalVideo}
              disabled={isRendering}
              className={`relative z-10 w-full py-4 rounded-xl font-bold text-lg tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 ${
                isRendering
                  ? "bg-purple-900/50 text-purple-200 cursor-not-allowed border border-purple-500/30"
                  : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-white/10 hover:shadow-[0_0_20px_rgba(124,58,237,0.3)]"
              }`}
            >
              {isRendering ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Rendering {Math.round(renderProgress)}%
                  {renderEtaSeconds !== null && renderEtaSeconds > 0 && (
                    <span className="text-xs opacity-75 font-normal ml-1">
                      (~{Math.floor(renderEtaSeconds / 60)}:
                      {(renderEtaSeconds % 60).toString().padStart(2, "0")})
                    </span>
                  )}
                  ...
                </>
              ) : (
                <>🎬 Render Final Video</>
              )}
            </button>
          </div>

          {/* AI Model Capabilities panel intentionally removed */}

          {/* METADATA RENDER MATRIX */}
          <OutputMetadataPanel
            videoUrl={videoUrl}
            musicTheme={musicTheme}
            voiceActor={voiceActor}
            handleSaveVideo={handleSaveVideo}
          />
        </div>
      )}
      <ProjectConfirmModal
        isOpen={showScrapeConfirmModal}
        onClose={() => setShowScrapeConfirmModal(false)}
        onConfirm={handleConfirmProjectAndScrape}
        initialDetails={{
          seriesTitle,
          chapterNumber,
          chapterTitle,
          scrapedGenre,
          seriesAuthor,
          seriesCoverImage,
          seriesSynopsis,
        }}
      />
    </main>
  );
}
