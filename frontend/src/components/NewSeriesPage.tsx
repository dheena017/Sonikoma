import React from "react";
import { ChevronLeft, Sparkles } from "lucide-react";
import UrlInputPanel from "./scraper/UrlInputPanel";

interface NewSeriesPageProps {
  appLogic: any;
  onNavigateHome: () => void;
}

const NewSeriesPage = ({ appLogic, onNavigateHome }: NewSeriesPageProps) => {
  const {
    targetUrl,
    setTargetUrl,
    selectedSource,
    setSelectedSource,
    selectedModel,
    setSelectedModel,
    isProcessing,
    isScraping,
    handleGenerateVideo,
    addNotification,
    narrationStyle,
    setNarrationStyle,
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
    resetWorkspace,
    setShowScrapeConfirmModal,
  } = appLogic;

  return (
    <div className="flex-1 flex flex-col w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-purple-400" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Start a New Series
            </h2>
          </div>
          <p className="text-sm text-neutral-400 font-mono">
            Initialize your webtoon-to-video pipeline by importing a source URL
          </p>
        </div>
        <button
          onClick={onNavigateHome}
          className="px-5 py-2.5 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-bold font-mono transition-all hover:bg-neutral-800/80 cursor-pointer flex items-center gap-2 group"
        >
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
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
        />

        <div className="bg-neutral-900/20 border border-neutral-800/50 rounded-3xl p-8 text-center max-w-2xl mx-auto">
           <p className="text-neutral-500 text-sm font-sans leading-relaxed">
             Need help? Check out our <span className="text-purple-400 cursor-pointer hover:underline">import guide</span> or
             paste a URL from supported platforms like Webtoons, MangaDex, or any direct image link.
           </p>
        </div>
      </div>
    </div>
  );
};

export default NewSeriesPage;
