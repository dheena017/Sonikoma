import React from "react";
import { ChapterScraper } from "../components/ChapterScraper";
import { NotificationType } from "@/features/platform/notifications";

interface ChapterScraperPageProps {
  addNotification: (message: string, type: NotificationType) => void;
  fetchWithInterceptor: typeof fetch;
  navigateTo: (path: string) => void;
  lastEditorPath?: string;
  scrapeImages?: (url: string, projectId: string) => Promise<boolean>;
  setSeriesTitle?: (title: string) => void;
  setChapterNumber?: (num: string) => void;
  setChapterTitle?: (title: string) => void;
  setSeriesAuthor?: (author: string) => void;
  setSeriesCoverImage?: (cover: string) => void;
}

export const ChapterScraperPage: React.FC<ChapterScraperPageProps> = ({
  addNotification,
  fetchWithInterceptor,
  navigateTo,
  scrapeImages,
  setSeriesTitle,
  setChapterNumber,
  setChapterTitle,
  setSeriesAuthor,
  setSeriesCoverImage,
}) => {
  React.useEffect(() => {
    const path = window.location.pathname;
    if (
      path.startsWith("/scraper/") &&
      !path.startsWith("/scraper/editor") &&
      !path.startsWith("/scraper/audio-settings")
    ) {
      window.history.replaceState(null, "", "/chapter-scraper");
    }
    try {
      localStorage.removeItem("chapter_scraper_url");
      localStorage.removeItem("episode_scraper_url");
    } catch {}
  }, []);

  const seriesNameParam = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const searchUrl =
      params.get("url") || params.get("target") || params.get("series");
    if (searchUrl) {
      return searchUrl;
    }
    return undefined;
  }, []);

  return (
    <div className="w-full flex-1 flex flex-col py-4 sm:py-6 max-w-7xl mx-auto text-[#E5E5E5] animate-fade-in text-left">
      {/* ── MAIN COVER WRAPPER CARD ── */}
      <div className="rounded-[28px] border border-[#181a24] bg-gradient-to-b from-[#0c0e14] via-[#090b10] to-[#07080c] p-6 sm:p-8 lg:p-9 shadow-2xl space-y-8 relative overflow-hidden text-left">
        <ChapterScraper
          addNotification={addNotification}
          fetchWithInterceptor={fetchWithInterceptor}
          isStandalone={true}
          initialSeriesName={seriesNameParam}
          scrapeImages={scrapeImages}
          onChapterSelect={async (chapter) => {
            const temporaryProjectId = `temp_${Date.now()}_${Math.random()
              .toString(36)
              .substring(2, 10)}`;

            if (chapter.rating !== undefined && chapter.rating !== null) {
              localStorage.setItem(
                "active_chapter_rating",
                String(chapter.rating)
              );
            } else {
              localStorage.removeItem("active_chapter_rating");
            }
            if (chapter.likes !== undefined && chapter.likes !== null) {
              localStorage.setItem(
                "active_chapter_likes",
                String(chapter.likes)
              );
            } else {
              localStorage.removeItem("active_chapter_likes");
            }
            if (chapter.views !== undefined && chapter.views !== null) {
              localStorage.setItem(
                "active_chapter_views",
                String(chapter.views)
              );
            } else {
              localStorage.removeItem("active_chapter_views");
            }

            if (setChapterTitle && chapter.title) {
              setChapterTitle(chapter.title);
            }
            if (setChapterNumber && chapter.number) {
              setChapterNumber(chapter.number);
            }

            const targetPath = `/scraper/editor?id=${temporaryProjectId}`;

            if (typeof scrapeImages === "function") {
              const ok = await scrapeImages(chapter.url, temporaryProjectId);
              if (ok) {
                localStorage.removeItem("auto_import_url");
                navigateTo(targetPath);
              }
            } else {
              localStorage.setItem("auto_import_url", chapter.url);
              navigateTo(targetPath);
            }
          }}
          onMultipleChaptersSelect={async (chapters) => {
            if (chapters.length > 0) {
              const temporaryProjectId = `temp_${Date.now()}_${Math.random()
                .toString(36)
                .substring(2, 10)}`;
              localStorage.setItem(
                "auto_import_batch",
                JSON.stringify(chapters)
              );

              const chapter = chapters[0];
              if (chapter.rating !== undefined && chapter.rating !== null) {
                localStorage.setItem(
                  "active_chapter_rating",
                  String(chapter.rating)
                );
              } else {
                localStorage.removeItem("active_chapter_rating");
              }
              if (chapter.likes !== undefined && chapter.likes !== null) {
                localStorage.setItem(
                  "active_chapter_likes",
                  String(chapter.likes)
                );
              } else {
                localStorage.removeItem("active_chapter_likes");
              }
              if (chapter.views !== undefined && chapter.views !== null) {
                localStorage.setItem(
                  "active_chapter_views",
                  String(chapter.views)
                );
              } else {
                localStorage.removeItem("active_chapter_views");
              }

              if (setChapterTitle && chapter.title) {
                setChapterTitle(chapter.title);
              }
              if (setChapterNumber && chapter.number) {
                setChapterNumber(chapter.number);
              }

              const targetPath = `/scraper/editor?id=${temporaryProjectId}`;

              if (typeof scrapeImages === "function") {
                const ok = await scrapeImages(chapter.url, temporaryProjectId);
                if (ok) {
                  localStorage.removeItem("auto_import_url");
                  navigateTo(targetPath);
                }
              } else {
                localStorage.setItem("auto_import_url", chapter.url);
                navigateTo(targetPath);
              }
            }
          }}
        />
      </div>
    </div>
  );
};

export const EpisodeScraperPage = ChapterScraperPage;
