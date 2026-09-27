import React from "react";
import { Sparkles, Book, UploadCloud } from "lucide-react";
import { NotificationType } from "@/features/app_notification";
import { ScraperInputToolbar } from "./panel/ScraperInputToolbar";
import { LocalImageUploadZone } from "./panel/LocalImageUploadZone";
import type { SeparateUrlResult } from "@/api/endpoints/scraper";
import { Tooltip } from "@/shared/ui/common/TooltipPortal";

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
  onOpenChapterScraper?: (url: string) => void;
  onOpenEpisodeScraper?: (url: string) => void;
  fetchWithInterceptor?: typeof fetch;
  onUploadImages?: (files: FileList | File[]) => void;
}

const UrlInputPanel = React.memo((props: UrlInputPanelProps) => {
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
    onOpenChapterScraper,
    onOpenEpisodeScraper,
    onUploadImages,
  } = props;

  const [inputMode, setInputMode] = React.useState<"url" | "upload">("url");
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [separatedData, setSeparatedData] =
    React.useState<SeparateUrlResult | null>(null);

  return (
    <div
      id="dynamic_input_box"
      className="relative z-20 w-full min-w-0 space-y-5 overflow-visible rounded-lg border border-white/10 bg-[#151515] p-4 sm:p-6 animate-fade-in"
    >
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="mb-2 flex w-fit items-center gap-2 text-emerald-300">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span className="text-[11px] font-semibold uppercase">
              Import source
            </span>
          </div>
          <h2 className="text-xl font-semibold leading-tight text-white sm:text-2xl">
            Start a project
          </h2>
          <p className="text-sm leading-relaxed text-neutral-400">
            Paste a chapter link or upload comic pages from your device.
          </p>
        </div>
      </div>

      {/* 2. Input Mode Selector & Tab Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2F2F2F] pb-4">
          <div className="grid w-full grid-cols-2 gap-1 rounded-lg border border-white/10 bg-[#101010] p-1 sm:w-fit">
            <Tooltip
              text="Import panels via online webtoon, manga, or comic reader URL"
              placement="bottom"
            >
              <button
                type="button"
                onClick={() => setInputMode("url")}
                className={`flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-md px-3 text-xs font-medium leading-tight transition-colors cursor-pointer sm:px-4 ${
                  inputMode === "url"
                    ? "bg-white/10 text-white"
                    : "text-neutral-400 hover:bg-white/5 hover:text-white"
                }`}
                aria-label="Import from URL"
              >
                <Book
                  className={`w-4 h-4 ${
                    inputMode === "url" ? "text-emerald-300" : "text-neutral-400"
                  }`}
                />
                <span className="min-w-0">From URL</span>
              </button>
            </Tooltip>

            <Tooltip
              text="Upload raw PNG/JPG image files from your computer"
              placement="bottom"
            >
              <button
                type="button"
                onClick={() => setInputMode("upload")}
                className={`flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-md px-3 text-xs font-medium leading-tight transition-colors cursor-pointer sm:px-4 ${
                  inputMode === "upload"
                    ? "bg-white/10 text-white"
                    : "text-neutral-400 hover:bg-white/5 hover:text-white"
                }`}
                aria-label="Upload comic pages"
              >
                <UploadCloud
                  className={`w-4 h-4 ${
                    inputMode === "upload" ? "text-emerald-300" : "text-neutral-400"
                  }`}
                />
                <span className="min-w-0">Upload pages</span>
                {selectedFiles.length > 0 && (
                  <span className="px-2 py-0.5 text-[9px] font-black bg-white/20 text-white rounded-full font-mono">
                    {selectedFiles.length}
                  </span>
                )}
              </button>
            </Tooltip>
          </div>

          {/* Platform Badge Aligned in Tab Header Row */}
          {inputMode === "url" && separatedData && separatedData.success && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1E1E1E] border border-[#2F2F2F] text-xs shadow-md animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3B82F6] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3B82F6]"></span>
              </span>
              <span className="font-bold text-[#60A5FA] tracking-wider text-[11px] uppercase font-mono">
                {separatedData.platform && separatedData.platform !== "unknown"
                  ? separatedData.platform.toUpperCase()
                  : separatedData.domain}
              </span>
              <span className="text-neutral-500 font-bold">•</span>
              <span className="text-white font-medium text-[11px]">
                {separatedData.is_chapter_url
                  ? separatedData.chapter_number
                    ? `Chapter ${separatedData.chapter_number}`
                    : "Chapter Viewer"
                  : "Series Catalog"}
              </span>
            </div>
          )}
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
            onOpenChapterScraper={onOpenChapterScraper || onOpenEpisodeScraper}
            onOpenEpisodeScraper={onOpenChapterScraper || onOpenEpisodeScraper}
            actionSlot={actionSlot}
            setSeriesTitle={setSeriesTitle}
            setScrapedGenre={setScrapedGenre}
            setChapterNumber={setChapterNumber}
            setChapterTitle={setChapterTitle}
            fetchWithInterceptor={props.fetchWithInterceptor}
            onSeparatedDataChange={setSeparatedData}
          />
        )}
      </div>
    </div>
  );
});

export { UrlInputPanel as ChapterScraperPanel };
export default UrlInputPanel;
