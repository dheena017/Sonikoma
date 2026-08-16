import React from "react";
import { Zap, ArrowLeft } from "lucide-react";
import { EpisodeScraper } from "@/features/workspace_scraper/episode-scraper/components/EpisodeScraper";
import { NotificationType } from "@/features/app_notification";
import { resolveWorkspaceReturnPath } from "@/shared/utils/workspaceNavigation";

interface EpisodeScraperPageProps {
  addNotification: (message: string, type: NotificationType) => void;
  fetchWithInterceptor: typeof fetch;
  navigateTo: (path: string) => void;
  lastEditorPath?: string;
}

export const EpisodeScraperPage: React.FC<EpisodeScraperPageProps> = ({
  addNotification,
  fetchWithInterceptor,
  navigateTo,
  lastEditorPath,
}) => {
  const handleNavigateHome = () => navigateTo("/");
  const handleReturnToWorkspace = () => {
    const path = resolveWorkspaceReturnPath({
      searchParams: window.location.search,
    });
    navigateTo(path);
  };

  return (
    <div className="w-full flex-1 flex flex-col py-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-white/5 pb-5">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-1.5 text-[11px] font-mono flex-wrap">
            <button
              type="button"
              onClick={handleNavigateHome}
              className="px-2.5 py-0.5 rounded-md bg-neutral-900/80 hover:bg-purple-950/40 border border-white/10 hover:border-purple-500/30 text-neutral-400 hover:text-purple-300 transition-all cursor-pointer shadow-sm"
            >
              Dashboard
            </button>
            {lastEditorPath && (
              <>
                <span className="text-neutral-600 font-bold">&rsaquo;</span>
                <button
                  type="button"
                  onClick={() => navigateTo(lastEditorPath)}
                  className="px-2.5 py-0.5 rounded-md bg-neutral-900/80 hover:bg-purple-950/40 border border-white/10 hover:border-purple-500/30 text-neutral-400 hover:text-purple-300 transition-all cursor-pointer shadow-sm"
                >
                  Workspace Editor
                </button>
              </>
            )}
            <span className="text-neutral-600 font-bold">&rsaquo;</span>
            <span className="px-2.5 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold">
              Episode Scraper
            </span>
          </div>

          <div className="flex items-center gap-3 pt-0.5">
            <div className="relative group">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-900/40 border border-purple-400/30 group-hover:scale-105 transition-transform">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="absolute -inset-0.5 rounded-2xl border border-purple-500/40 pointer-events-none animate-pulse" />
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                Manga & Webtoon Scraper
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                  Auto Engine
                </span>
              </h2>
              <p className="text-xs text-neutral-400 font-sans mt-0.5">
                Browse episodes, manage bookmarks, filter chapters, and batch import panels into your workspace.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleReturnToWorkspace}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono font-bold text-xs shadow-lg shadow-purple-900/30 transition-all cursor-pointer active:scale-95 border border-purple-400/30"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Editor</span>
          </button>
        </div>
      </div>

      <div className="w-full flex-1">
        <EpisodeScraper
          addNotification={addNotification}
          fetchWithInterceptor={fetchWithInterceptor}
          isStandalone={true}
          onEpisodeSelect={(episode) => {
            const temporaryProjectId = `temp_${Date.now()}_${Math.random()
              .toString(36)
              .substring(2, 10)}`;
            localStorage.setItem("auto_import_url", episode.url);
            
            // Save visual metadata to localStorage
            if (episode.rating !== undefined && episode.rating !== null) {
              localStorage.setItem("active_episode_rating", String(episode.rating));
            } else {
              localStorage.removeItem("active_episode_rating");
            }
            if (episode.likes !== undefined && episode.likes !== null) {
              localStorage.setItem("active_episode_likes", String(episode.likes));
            } else {
              localStorage.removeItem("active_episode_likes");
            }
            if (episode.views !== undefined && episode.views !== null) {
              localStorage.setItem("active_episode_views", String(episode.views));
            } else {
              localStorage.removeItem("active_episode_views");
            }

            navigateTo(`/scraper/editor?id=${temporaryProjectId}`);
          }}
          onMultipleEpisodesSelect={(episodes) => {
            if (episodes.length > 0) {
              const temporaryProjectId = `temp_${Date.now()}_${Math.random()
                .toString(36)
                .substring(2, 10)}`;
              localStorage.setItem("auto_import_batch", JSON.stringify(episodes));
              localStorage.setItem("auto_import_url", episodes[0].url);

              const episode = episodes[0];
              if (episode.rating !== undefined && episode.rating !== null) {
                localStorage.setItem("active_episode_rating", String(episode.rating));
              } else {
                localStorage.removeItem("active_episode_rating");
              }
              if (episode.likes !== undefined && episode.likes !== null) {
                localStorage.setItem("active_episode_likes", String(episode.likes));
              } else {
                localStorage.removeItem("active_episode_likes");
              }
              if (episode.views !== undefined && episode.views !== null) {
                localStorage.setItem("active_episode_views", String(episode.views));
              } else {
                localStorage.removeItem("active_episode_views");
              }

              navigateTo(`/scraper/editor?id=${temporaryProjectId}`);
            }
          }}
        />
      </div>
    </div>
  );
};
