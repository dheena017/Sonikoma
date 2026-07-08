import React from "react";
import { Zap, ArrowLeft } from "lucide-react";
import { EpisodeScraper } from "./EpisodeScraper";
import { NotificationType } from "@/components/notification/NotificationStack";
import { resolveWorkspaceReturnPath } from "../../../utils/workspaceNavigation";

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
    <div className="page-transition w-full flex-1 flex flex-col max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 mb-1.5">
            <span
              className="hover:text-purple-400 cursor-pointer"
              onClick={handleNavigateHome}
            >
              Dashboard
            </span>
            {lastEditorPath && (
              <>
                <span>&gt;</span>
                <span
                  className="hover:text-purple-400 cursor-pointer"
                  onClick={() => navigateTo(lastEditorPath)}
                >
                  Workspace Editor
                </span>
              </>
            )}
            <span>&gt;</span>
            <span className="text-purple-400 font-bold">WEBTOON Scraper</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="icon-pill icon-pill--purple">
              <Zap className="h-5 w-5 text-purple-400" />
            </div>
            WEBTOON Episode Scraper
          </h2>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">
            Browse episodes, manage bookmarks, filter by likes/rating/date, and batch import panels
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReturnToWorkspace}
            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-200 border border-neutral-800 rounded-xl text-xs font-mono transition-all cursor-pointer font-bold shadow-lg"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to Workspace
          </button>
          <button
            onClick={handleNavigateHome}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono transition-all cursor-pointer font-bold shadow-lg shadow-purple-950/30"
          >
            Dashboard
          </button>
        </div>
      </div>

      <div className="bg-neutral-900/20 border border-neutral-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-md">
        <EpisodeScraper
          addNotification={addNotification}
          fetchWithInterceptor={fetchWithInterceptor}
          isStandalone={true}
          onEpisodeSelect={(episode) => {
            const temporaryProjectId = `temp_${Date.now()}_${Math.random()
              .toString(36)
              .substring(2, 10)}`;
            localStorage.setItem("auto_import_url", episode.url);
            navigateTo(`/workspace/editor?id=${temporaryProjectId}`);
          }}
          onMultipleEpisodesSelect={(episodes) => {
            if (episodes.length > 0) {
              const temporaryProjectId = `temp_${Date.now()}_${Math.random()
                .toString(36)
                .substring(2, 10)}`;
              localStorage.setItem("auto_import_url", episodes[0].url);
              navigateTo(`/workspace/editor?id=${temporaryProjectId}`);
            }
          }}
        />
      </div>
    </div>
  );
};
