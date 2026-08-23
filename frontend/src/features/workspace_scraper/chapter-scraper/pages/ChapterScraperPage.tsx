import React from "react";
import { ChapterScraper } from "../components/ChapterScraper";
import { NotificationType } from "@/features/app_notification";

interface ChapterScraperPageProps {
  addNotification: (message: string, type: NotificationType) => void;
  fetchWithInterceptor: typeof fetch;
  navigateTo: (path: string) => void;
  lastEditorPath?: string;
}

export const ChapterScraperPage: React.FC<ChapterScraperPageProps> = ({
  addNotification,
  fetchWithInterceptor,
  navigateTo,
}) => {
  const seriesNameParam = React.useMemo(() => {
    const path = window.location.pathname;
    if (path.startsWith("/scraper/")) {
      const seg = decodeURIComponent(
        path.replace(/^\/scraper\//, "").replace(/\/$/, "")
      );
      if (
        seg &&
        seg !== "editor" &&
        seg !== "audio-settings"
      ) {
        return seg;
      }
    }
    return undefined;
  }, []);

  return (
    <div className="w-full flex-1 flex flex-col py-4 max-w-7xl mx-auto">
      <ChapterScraper
        addNotification={addNotification}
        fetchWithInterceptor={fetchWithInterceptor}
        isStandalone={true}
        initialSeriesName={seriesNameParam}
        onChapterSelect={(chapter) => {
          const temporaryProjectId = `temp_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 10)}`;
          localStorage.setItem("auto_import_url", chapter.url);

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

          navigateTo(`/scraper/editor?id=${temporaryProjectId}`);
        }}
        onMultipleChaptersSelect={(chapters) => {
          if (chapters.length > 0) {
            const temporaryProjectId = `temp_${Date.now()}_${Math.random()
              .toString(36)
              .substring(2, 10)}`;
            localStorage.setItem(
              "auto_import_batch",
              JSON.stringify(chapters)
            );
            localStorage.setItem("auto_import_url", chapters[0].url);

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

            navigateTo(`/scraper/editor?id=${temporaryProjectId}`);
          }
        }}
      />
    </div>
  );
};

export const EpisodeScraperPage = ChapterScraperPage;
