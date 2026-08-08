import React, { useState, useEffect } from "react";
import { Zap, ArrowLeft, Search } from "lucide-react";
import { EpisodeScraper } from "@/features/workspace_scraper/episode-scraper/components/EpisodeScraper";
import { NotificationType } from "@/features/app_notification";
import { resolveWorkspaceReturnPath } from "@/shared/utils/workspaceNavigation";
import { FavoritesManager } from "@/features/workspace_scraper/episode-scraper/utils/FavoritesManager";

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
  const [urlInput, setUrlInput] = useState("");
  const [scraperKey, setScraperKey] = useState(0);

  // Pre-populate URL from query params or localStorage on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const paramUrl = params.get("url");
      const storedUrl = localStorage.getItem("episode_scraper_url");
      const initial = paramUrl || storedUrl || "";
      if (initial) {
        setUrlInput(initial);
        // Ensure localStorage is set so EpisodeScraper's useEffect picks it up
        if (!localStorage.getItem("episode_scraper_url")) {
          localStorage.setItem("episode_scraper_url", initial);
        }
      }
    } catch (_) {
      // ignore
    }
  }, []);

  const handleNavigateHome = () => navigateTo("/");
  const handleReturnToScraper = () => {
    const path = resolveWorkspaceReturnPath({
      searchParams: window.location.search,
    });
    navigateTo(path);
  };

  const handleScrapeEpisodes = () => {
    const url = urlInput.trim();
    if (!url) return;
    FavoritesManager.addEnteredUrl(url);
    localStorage.setItem("episode_scraper_url", url);
    // Increment key forces EpisodeScraper to remount → re-triggers its auto-scrape useEffect
    setScraperKey((k) => k + 1);
  };

  const saveEpisodeMetadata = (episode: any) => {
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
  };

  return (
    <div className="page-transition w-full flex-1 flex flex-col px-4 sm:px-6 py-6 space-y-6">

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 mb-1.5">
            <span
              className="hover:text-purple-400 cursor-pointer transition-colors"
              onClick={handleNavigateHome}
            >
              Dashboard
            </span>
            {lastEditorPath && (
              <>
                <span>&gt;</span>
                <span
                  className="hover:text-purple-400 cursor-pointer transition-colors"
                  onClick={() => navigateTo(lastEditorPath)}
                >
                  Scraper Editor
                </span>
              </>
            )}
            <span>&gt;</span>
            <span className="text-purple-400 font-bold">Episode Scraper</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="icon-pill icon-pill--purple">
              <Zap className="h-5 w-5 text-purple-400" />
            </div>
            Manga &amp; Manhwa Episode Scraper
          </h2>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">
            Paste a series URL to browse all episodes — filter, bookmark, and batch import panels into the editor
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReturnToScraper}
            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-200 border border-neutral-800 rounded-xl text-xs font-mono transition-all cursor-pointer font-bold shadow-lg"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to Scraper
          </button>
          <button
            onClick={handleNavigateHome}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono transition-all cursor-pointer font-bold shadow-lg shadow-purple-950/30"
          >
            Dashboard
          </button>
        </div>
      </div>

      {/* ── SERIES URL INPUT TOOLBAR ── */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative group flex-grow">
            {/* Ambient glow */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 opacity-15 blur group-focus-within:opacity-40 transition-opacity duration-500 pointer-events-none" />
            <input
              id="episode_scraper_url_input"
              type="url"
              autoComplete="off"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && urlInput.trim()) handleScrapeEpisodes();
              }}
              placeholder="Paste a series URL (Webtoon, MangaDex, Tapas, Tappytoon...) to load all episodes..."
              className="relative w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-6 py-4 text-sm text-neutral-200 outline-none placeholder:text-neutral-700 focus:border-purple-500 transition-all shadow-inner"
            />
          </div>
          <button
            type="button"
            onClick={handleScrapeEpisodes}
            disabled={!urlInput.trim()}
            className="relative px-6 py-3.5 bg-purple-600 hover:bg-purple-500 border border-purple-500/50 rounded-2xl text-xs sm:text-sm font-bold text-white transition-all shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Search className="h-4 w-4" />
            Scrape All Episodes
          </button>
        </div>
        <p className="text-[10px] text-neutral-600 font-mono pl-1">
          Tip: Use the main series page URL, not a specific episode link, to browse all available episodes.
        </p>
      </div>

      {/* ── EPISODE SCRAPER (remounts on new scrape via key) ── */}
      <div className="w-full flex-1">
        <EpisodeScraper
          key={scraperKey}
          addNotification={addNotification}
          fetchWithInterceptor={fetchWithInterceptor}
          isStandalone={true}
          onEpisodeSelect={(episode) => {
            const temporaryProjectId = `temp_${Date.now()}_${Math.random()
              .toString(36)
              .substring(2, 10)}`;
            localStorage.setItem("auto_import_url", episode.url);
            saveEpisodeMetadata(episode);
            navigateTo(`/scraper/editor?id=${temporaryProjectId}`);
          }}
          onMultipleEpisodesSelect={(episodes) => {
            if (episodes.length > 0) {
              const temporaryProjectId = `temp_${Date.now()}_${Math.random()
                .toString(36)
                .substring(2, 10)}`;
              localStorage.setItem("auto_import_batch", JSON.stringify(episodes));
              localStorage.setItem("auto_import_url", episodes[0].url);
              saveEpisodeMetadata(episodes[0]);
              navigateTo(`/scraper/editor?id=${temporaryProjectId}`);
            }
          }}
        />
      </div>
    </div>
  );
};
