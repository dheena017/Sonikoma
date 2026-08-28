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
  const [separatedData, setSeparatedData] = React.useState<SeparateUrlResult | null>(null);

  return (
    <div
      id="dynamic_input_box"
      className="relative z-20 rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-6 sm:p-8 shadow-2xl space-y-8 min-w-0 w-full overflow-visible animate-fade-in"
    >
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#3B82F6]">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase font-mono">
              Project Constructor
            </span>
          </div>
          <h2 className="text-2xl font-bold text-[#E5E5E5] tracking-tight leading-tight">
            Initialize New Video Pipeline
          </h2>
          <p className="text-xs text-[#9CA3AF] font-medium">
            Define your project parameters and Manhwa, Manga, or Webcomic source
            link to begin.
          </p>
        </div>
      </div>

      {/* 2. Input Mode Selector & Tab Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2F2F2F] pb-3">
          <div className="flex items-center gap-2">
            <Tooltip text="Import panels via online webtoon, manga, or comic reader URL" placement="top">
              <button
                type="button"
                onClick={() => setInputMode("url")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  inputMode === "url"
                    ? "bg-[#3B82F6] text-white border border-[#60A5FA]/40 shadow-sm"
                    : "bg-[#1E1E1E] text-[#9CA3AF] hover:text-white hover:bg-[#262626] border border-[#2F2F2F]"
                }`}
                aria-label="Scrape Comic / Manhwa URL"
              >
                <Book className="w-3.5 h-3.5" />
                <span>Scrape Comic / Manhwa URL</span>
              </button>
            </Tooltip>

            <Tooltip text="Upload raw PNG/JPG image files from your computer" placement="top">
              <button
                type="button"
                onClick={() => setInputMode("upload")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  inputMode === "upload"
                    ? "bg-[#3B82F6] text-white border border-[#60A5FA]/40 shadow-sm"
                    : "bg-[#1E1E1E] text-[#9CA3AF] hover:text-white hover:bg-[#262626] border border-[#2F2F2F]"
                }`}
                aria-label="Upload Local Images"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload Local Images</span>
                {selectedFiles.length > 0 && (
                  <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-[#3B82F6] text-white rounded-full font-mono">
                    {selectedFiles.length}
                  </span>
                )}
              </button>
            </Tooltip>
          </div>

          {/* Option B: Platform Badge Aligned in Tab Header Row */}
          {inputMode === "url" && separatedData && separatedData.success && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#121212] border border-[#2F2F2F] text-xs shadow-md animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3B82F6] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3B82F6]"></span>
              </span>
              <span className="font-bold text-[#3B82F6] tracking-wider text-[11px] uppercase font-mono">
                {separatedData.platform && separatedData.platform !== "unknown"
                  ? separatedData.platform.toUpperCase()
                  : separatedData.domain}
              </span>
              <span className="text-[#6B7280] font-bold">•</span>
              <span className="text-[#E5E5E5] font-medium text-[11px]">
                {separatedData.is_chapter_url
                  ? (separatedData.chapter_number ? `Chapter ${separatedData.chapter_number}` : "Chapter Viewer")
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
