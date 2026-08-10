import React from "react";
import { Sparkles, Book, UploadCloud } from "lucide-react";
import { useAIModels } from "@/features/ai_core/hooks/useAIModels";
import { NotificationType } from "@/features/app_notification";
import { SeriesMetadataForm } from "./panel/SeriesMetadataForm";
import { BatchPresetsControls } from "./panel/BatchPresetsControls";
import { ScraperInputToolbar } from "./panel/ScraperInputToolbar";
import { LocalImageUploadZone } from "./panel/LocalImageUploadZone";
import { AdvancedPipelineConstraints } from "./panel/AdvancedPipelineConstraints";

export interface UrlInputPanelProps {
  targetUrl: string;
  setTargetUrl: (url: string) => void;
  selectedSource: string;
  setSelectedSource: (source: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  isProcessing: boolean;
  isScraping?: boolean;
  handleGenerateVideo: () => void;
  handleScrape?: () => void;
  addNotification: (message: string, type: NotificationType) => void;
  narrationStyle?: string;
  setNarrationStyle?: (style: string) => void;
  seriesTitle?: string;
  setSeriesTitle?: (title: string) => void;
  chapterNumber?: string;
  setChapterNumber?: (num: string) => void;
  chapterTitle?: string;
  setChapterTitle?: (title: string) => void;
  scrapedGenre?: string;
  setScrapedGenre?: (genre: string) => void;
  seriesAuthor?: string;
  setSeriesAuthor?: (author: string) => void;
  seriesCoverImage?: string;
  setSeriesCoverImage?: (coverImage: string) => void;
  seriesSynopsis?: string;
  setSeriesSynopsis?: (synopsis: string) => void;
  smartSlice?: boolean;
  setSmartSlice?: (v: boolean) => void;
  resetWorkspace?: () => void;
  handleSaveMeta?: () => void;
  cropSensitivity?: number;
  setCropSensitivity?: (v: number) => void;
  autoSplitTallStrips?: boolean;
  setAutoSplitTallStrips?: (v: boolean) => void;
  actionSlot?: React.ReactNode;
  onOpenEpisodeScraper?: (url: string) => void;
  fetchWithInterceptor?: typeof fetch;
  onUploadImages?: (files: FileList | File[]) => void;
}

const UrlInputPanel = React.memo((props: UrlInputPanelProps) => {
  const { models: aiModels } = useAIModels();
  const {
    targetUrl,
    setTargetUrl,
    selectedModel,
    setSelectedModel,
    isProcessing,
    isScraping = false,
    handleScrape,
    addNotification,
    narrationStyle = "long",
    setNarrationStyle,
    seriesTitle = "",
    setSeriesTitle,
    chapterNumber = "",
    setChapterNumber,
    chapterTitle = "",
    setChapterTitle,
    scrapedGenre = "",
    setScrapedGenre,
    seriesAuthor = "",
    setSeriesAuthor,
    seriesCoverImage = "",
    setSeriesCoverImage,
    seriesSynopsis = "",
    setSeriesSynopsis,
    smartSlice = true,
    setSmartSlice,
    resetWorkspace,
    cropSensitivity = 50,
    setCropSensitivity,
    autoSplitTallStrips = true,
    setAutoSplitTallStrips,
    actionSlot,
    onOpenEpisodeScraper,
    onUploadImages,
  } = props;

  const [inputMode, setInputMode] = React.useState<"url" | "upload">("url");
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);

  return (
    <div
      id="dynamic_input_box"
      className="relative z-20 bg-neutral-900/40 rounded-3xl border border-neutral-800/80 p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-8 min-w-0 w-full overflow-visible stagger-container glass-interactive animate-in fade-in zoom-in-95 duration-500"
    >
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-purple-400">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase font-mono">
              Project Constructor
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight leading-tight">
            Initialize New Video Pipeline
          </h2>
          <p className="text-xs text-neutral-400 font-medium">
            Define your project parameters and Manhwa, Manga, or Webcomic source link to begin.
          </p>
        </div>
      </div>

      {/* 2. Series Metadata & Batch Presets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/20 p-6 rounded-2xl border border-white/5">
        <SeriesMetadataForm
          seriesTitle={seriesTitle}
          setSeriesTitle={setSeriesTitle}
          chapterNumber={chapterNumber}
          setChapterNumber={setChapterNumber}
          scrapedGenre={scrapedGenre}
          setScrapedGenre={setScrapedGenre}
          setTargetUrl={setTargetUrl}
          setSeriesCoverImage={setSeriesCoverImage}
          setSeriesAuthor={setSeriesAuthor}
          setSeriesSynopsis={setSeriesSynopsis}
          setChapterTitle={setChapterTitle}
        />
        <BatchPresetsControls
          cropSensitivity={cropSensitivity}
          setCropSensitivity={setCropSensitivity}
          autoSplitTallStrips={autoSplitTallStrips}
          setAutoSplitTallStrips={setAutoSplitTallStrips}
        />
      </div>

      {/* 3. Input Mode Selector */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800/80 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInputMode("url")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                inputMode === "url"
                  ? "bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm"
                  : "bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800"
              }`}
            >
              <Book className="w-3.5 h-3.5" />
              <span>Scrape Webtoon URL</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode("upload")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                inputMode === "upload"
                  ? "bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm"
                  : "bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800"
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Local Images</span>
              {selectedFiles.length > 0 && (
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-purple-600 text-white rounded-full font-mono">
                  {selectedFiles.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {inputMode === "upload" ? (
          <LocalImageUploadZone
            selectedFiles={selectedFiles}
            setSelectedFiles={setSelectedFiles}
            onUploadImages={onUploadImages}
            addNotification={addNotification}
          />
        ) : (
          <ScraperInputToolbar
            targetUrl={targetUrl}
            setTargetUrl={setTargetUrl}
            isScraping={isScraping}
            isProcessing={isProcessing}
            handleScrape={handleScrape}
            resetWorkspace={resetWorkspace}
            onOpenEpisodeScraper={onOpenEpisodeScraper}
            actionSlot={actionSlot}
            setSeriesTitle={setSeriesTitle}
            setScrapedGenre={setScrapedGenre}
            setChapterNumber={setChapterNumber}
            setChapterTitle={setChapterTitle}
          />
        )}
      </div>

      {/* 4. Advanced Pipeline Constraints */}
      <AdvancedPipelineConstraints
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        aiModels={aiModels}
        narrationStyle={narrationStyle}
        setNarrationStyle={setNarrationStyle}
        smartSlice={smartSlice}
        setSmartSlice={setSmartSlice}
      />
    </div>
  );
});

export { UrlInputPanel as ChapterScraperPanel };
export default UrlInputPanel;
