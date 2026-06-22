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

interface AppWorkspaceProps {
  isDashboardOnly?: boolean;
  projectId: string | null;
  panels: any[];
  setPanels: any;
  isGeneratingStoryboard?: boolean;
  handleGenerateStoryboardAI?: () => Promise<void>;
  consoleLogs: string[];
  setConsoleLogs: any;
  scrapedImages: string[];
  setScrapedImages: any;
  selectedScraped: string[];
  setSelectedScraped: any;
  activePreviewTab: "video" | "storyboard";
  setActivePreviewTab: (tab: "video" | "storyboard") => void;
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
  saveProject?: (customPanels?: any[]) => Promise<boolean>;
  resetWorkspace?: () => void;
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
}: AppWorkspaceProps) {
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
      await saveProject();
    }
  };

  const handleSaveAssets = async () => {
    if (projectId?.startsWith("temp_")) {
      addNotification("Temporary Session: Saving assets is disabled.", "warning");
      return;
    }
    const token =
      localStorage.getItem("anivox_token") ||
      sessionStorage.getItem("anivox_token");
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    try {
      const scrapeRes = await fetch("/api/save-scraped-images", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          url: targetUrl,
          images: scrapedImages,
        }),
      });
      if (scrapeRes.ok) {
        addNotification("Raw assets saved successfully!", "success");
      } else {
        throw new Error("Failed to save raw assets");
      }
    } catch (err: any) {
      addNotification(`Failed to save raw assets: ${err.message}`, "error");
    }
  };

  const handleSaveStoryboard = async () => {
    if (saveProject) {
      await saveProject(panels);
    }
  };

  const handleSaveVideo = async () => {
    if (saveProject) {
      await saveProject();
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
        className={`order-1 lg:order-1 flex flex-col gap-6 md:gap-8 ${
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
          handleScrape={() => setShowScrapeConfirmModal(true)}
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

        {/* PROJECT PRODUCTION CHECKLIST */}
        {projectId && (
          <div className="bg-neutral-900/40 rounded-3xl border border-neutral-800/80 p-6 backdrop-blur-md shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                Series Production Pipeline
              </span>
              <span className="text-[9px] text-neutral-500 font-bold font-mono">
                Pipeline Checklist
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Step 1: Create Series & Metadata */}
              <div className="flex items-start justify-between p-4 bg-neutral-950/40 border border-neutral-850 rounded-2xl gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-neutral-200">
                      Step 1: Create Series
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-medium leading-normal">
                      Initialize series entry and metadata in SQLite database.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSaveMeta}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 border border-purple-500/50 text-white text-[10px] font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
                >
                  Save Meta
                </button>
              </div>

              {/* Step 2: Live Asset Extraction */}
              <div className="flex items-start justify-between p-4 bg-neutral-950/40 border border-neutral-850 rounded-2xl gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {scrapedImages.length > 0 ? (
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                    ) : (
                      <div className="h-4.5 w-4.5 rounded-full border-2 border-neutral-700 mt-0.5" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-neutral-200">
                      Step 2: Live Asset Extraction
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-medium leading-normal">
                      Extract and download vertical comic/webtoon strip image
                      assets.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={async () => {
                      await scrapeImages(targetUrl, projectId);
                    }}
                    disabled={isScraping}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-[10px] font-bold rounded-xl transition-all border border-neutral-700/50 cursor-pointer disabled:opacity-50"
                  >
                    {isScraping ? "Scraping..." : "Scrape"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAssets}
                    disabled={scrapedImages.length === 0}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 border border-purple-500/50 text-white text-[10px] font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    Save Assets
                  </button>
                </div>
              </div>

              {/* Step 3: Storyboard & OCR Transcription */}
              <div className="flex items-start justify-between p-4 bg-neutral-950/40 border border-neutral-850 rounded-2xl gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {panels.length > 0 ? (
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                    ) : (
                      <div className="h-4.5 w-4.5 rounded-full border-2 border-neutral-700 mt-0.5" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-neutral-200">
                      Step 3: Storyboard &amp; OCR
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-medium leading-normal">
                      Slice comic strips into panels and generate scripts,
                      dialogue, &amp; camera moves.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleGenerateStoryboardAI}
                    disabled={
                      isGeneratingStoryboard || scrapedImages.length === 0
                    }
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-[10px] font-bold rounded-xl transition-all border border-neutral-700/50 cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingStoryboard ? "Generating..." : "Generate AI"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveStoryboard}
                    disabled={panels.length === 0}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 border border-purple-500/50 text-white text-[10px] font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    Save Storyboard
                  </button>
                </div>
              </div>

              {/* Step 4: Final Video Compilation */}
              <div className="flex items-start justify-between p-4 bg-neutral-950/40 border border-neutral-850 rounded-2xl gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {videoUrl ? (
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                    ) : (
                      <div className="h-4.5 w-4.5 rounded-full border-2 border-neutral-700 mt-0.5" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-neutral-200">
                      Step 4: Final Video Render
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-medium leading-normal">
                      Compile panels, synthesized voice narration, and
                      background music into MP4.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleGenerateVideo}
                    disabled={isProcessing || panels.length === 0}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-[10px] font-bold rounded-xl transition-all border border-neutral-700/50 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? "Compiling..." : "Compile Video"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveVideo}
                    disabled={!videoUrl}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 border border-purple-500/50 text-white text-[10px] font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    Save Video
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
            />
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: INTEGRATED CINEMA PLAYER */}
      {panels.length > 0 && (
        <div
          id="cinema_column"
          className="order-2 lg:order-2 lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24"
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

          {/* PLAYBACK CONTROLLER ACCESSORIES FOR STORYBOARD PREVIEW */}
          {activePreviewTab === "storyboard" && panels.length > 0 && (
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
