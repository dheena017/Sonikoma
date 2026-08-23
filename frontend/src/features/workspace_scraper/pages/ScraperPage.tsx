import React, { useEffect, useState, useMemo } from "react";
import {
  History,
  Sparkles,
  Brain,
  Award,
  BookOpenCheck,
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  Plus,
  User2,
  BarChart2,
  Zap,
  RefreshCw,
  CheckCircle2,
  Loader,
  Download,
} from "lucide-react";
import UrlInputPanel from "@/features/workspace_scraper/components/UrlInputPanel";
import WorkspaceResumeCard from "@/features/workspace_scraper/components/WorkspaceResumeCard";
import WorkspaceStatsBar from "@/features/workspace_scraper/components/WorkspaceStatsBar";
import RecentProjectsSection from "@/features/workspace_scraper/components/RecentProjectsSection";
import CreatorGuideSection from "@/features/workspace_scraper/components/CreatorGuideSection";
import ProjectConfirmModal from "@/shared/ui/modal/ProjectConfirmModal";
import type { Project } from "@/features/workspace_projects/hooks/ProjectTypes";
import { useProjectStore } from "@/store/useProjectStore";

export interface ScraperPageProps {
  [key: string]: any;
  projectId: string | null;
  addNotification: any;
  targetUrl: string;
  setTargetUrl: (v: string) => void;
  selectedSource: string;
  setSelectedSource: (v: string) => void;
  selectedModel: string;
  setSelectedModel: (v: string) => void;
  isProcessing: boolean;
  isScraping: boolean;
  scrapeImages: (
    customUrl?: string,
    overrideProjectId?: string
  ) => Promise<boolean | void>;
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
  resetWorkspace?: () => void;
  narrationStyle: string;
  setNarrationStyle: (v: string) => void;
  cropSensitivity?: number;
  setCropSensitivity?: (v: number) => void;
  autoSplitTallStrips?: boolean;
  setAutoSplitTallStrips?: (v: boolean) => void;
  navigateTo?: (path: string) => void;
  panels?: any[];
  isDashboardOnly?: boolean;
  isGeneratingStoryboard?: boolean;
  handleGenerateStoryboardAI?: () => Promise<void>;
  seriesSlug?: string | null;
  chapterSlug?: string | null;
  videoUrl?: string | null;
}

interface StoredProject {
  imported_assets_count: number;
  project_id: string;
  url?: string;
  series_slug?: string | null;
  chapter_slug?: string | null;
  title?: string;
  genre?: string;
  author?: string;
  cover_image?: string;
  episode?: string;
  status?: string;
  panels_count?: number;
  created_at?: string;
  updated_at?: string;
  video_url?: string | null;
  synopsis?: string | null;
}

const STATUS_COLORS: Record<
  string,
  { dot: string; text: string; label: string }
> = {
  completed: {
    dot: "bg-emerald-500",
    text: "text-emerald-400",
    label: "Completed",
  },
  processing: {
    dot: "bg-amber-500 animate-pulse",
    text: "text-amber-400",
    label: "Processing",
  },
  pending: { dot: "bg-sky-500", text: "text-sky-400", label: "Pending" },
  failed: { dot: "bg-red-500", text: "text-red-400", label: "Failed" },
  ready: { dot: "bg-emerald-500", text: "text-emerald-400", label: "Ready" },
};

function getStatusInfo(status?: string) {
  const key = (status || "ready").toLowerCase();
  return STATUS_COLORS[key] || STATUS_COLORS["ready"];
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

const GENRE_COLORS: Record<string, string> = {
  action: "bg-red-500/15 text-red-400 border-red-500/20",
  fantasy: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  romance: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  horror: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  comedy: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  drama: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  shonen: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  superhero: "bg-amber-500/15 text-amber-400 border-amber-500/20",
};

function getGenreStyle(genre?: string): string {
  const key = (genre || "").toLowerCase().split("/")[0];
  return (
    GENRE_COLORS[key] ||
    "bg-neutral-800/60 text-neutral-400 border-neutral-700/40"
  );
}

export type AppWorkspaceProps = ScraperPageProps;

const ScraperPageInner = (props: ScraperPageProps) => {
  const [recentProjects, setRecentProjects] = useState<StoredProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(
    null
  );
  const [activeGuideTab, setActiveGuideTab] = useState<string>("general");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAll, setShowAll] = useState<boolean>(false);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);
  const [stats, setStats] = useState<{
    totalProjects: number;
    totalPanels: number;
    completedProjects: number;
  }>({
    totalProjects: 0,
    totalPanels: 0,
    completedProjects: 0,
  });

  const handleOpenProject = (project: Project) => {
    const targetPath = `/scraper?id=${project.project_id}`;
    if (props.navigateTo) {
      props.navigateTo(targetPath);
    } else {
      const nav = (window as any).navigateTo;
      if (typeof nav === "function") {
        nav(targetPath);
      } else {
        window.history.pushState({}, "", targetPath);
        window.dispatchEvent(new Event("popstate"));
      }
    }
  };

  const handleRenameProject = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setRenamingProjectId(project.project_id);
    setOpenMenuId(null);
  };

  const handleSaveRename = async (projectId: string, newName: string) => {
    if (!newName.trim()) {
      setRenamingProjectId(null);
      return;
    }
    try {
      const token =
        localStorage.getItem("sonikoma_token") ||
        sessionStorage.getItem("sonikoma_token") ||
        "";
      await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newName }),
      });
    } catch (err) {
      console.error("Failed to rename project:", err);
    }
    setRecentProjects((prev) =>
      prev.map((p) =>
        p.project_id === projectId ? { ...p, title: newName } : p
      )
    );
    setRenamingProjectId(null);
    props.addNotification?.(`Renamed project to "${newName}"`, "success");
  };

  const handleDeleteProject = async (
    e: React.MouseEvent,
    projectId: string
  ) => {
    e.stopPropagation();
    setOpenMenuId(null);
    if (!window.confirm("Are you sure you want to delete this project?"))
      return;
    try {
      const token =
        localStorage.getItem("sonikoma_token") ||
        sessionStorage.getItem("sonikoma_token") ||
        "";
      await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
    setRecentProjects((prev) => prev.filter((p) => p.project_id !== projectId));
    props.addNotification?.("Project deleted successfully.", "info");
  };

  const handleExportProject = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setOpenMenuId(null);
    if (props.navigateTo) {
      props.navigateTo(`/scraper?id=${project.project_id}&export=true`);
    }
  };

  const handleCopyLink = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setOpenMenuId(null);
    const link = `${window.location.origin}/scraper?id=${project.project_id}`;
    navigator.clipboard.writeText(link);
    props.addNotification?.("Project link copied to clipboard!", "success");
  };

  const handleToggleMenu = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setOpenMenuId((current) => (current === projectId ? null : projectId));
  };

  const {
    projectId,
    addNotification,
    targetUrl,
    setTargetUrl,
    selectedSource,
    setSelectedSource,
    selectedModel,
    setSelectedModel,
    isProcessing,
    isScraping,
    scrapeImages,
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
    resetWorkspace,
    narrationStyle,
    setNarrationStyle,
    cropSensitivity,
    setCropSensitivity,
    autoSplitTallStrips,
    setAutoSplitTallStrips,
    navigateTo,
    panels = [],
    isDashboardOnly = false,
    seriesSlug,
    chapterSlug,
    videoUrl,
  } = props;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("autoScrape") === "true" && targetUrl) {
      params.delete("autoScrape");
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?${params.toString()}`
      );
      setShowScrapeConfirmModal(true);
    }
  }, [targetUrl]);

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      setStatsLoading(true);
      const res = await fetch("/api/projects", {
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("sonikoma_token") ||
            sessionStorage.getItem("sonikoma_token") ||
            ""
          }`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.projects) {
          const sorted = [...data.projects].sort(
            (a: any, b: any) =>
              new Date(b.created_at || 0).getTime() -
              new Date(a.created_at || 0).getTime()
          );
          setRecentProjects(sorted);
          const totalPanels = sorted.reduce(
            (acc: number, p: any) =>
              acc + (p.panels_count || p.imported_assets_count || 0),
            0
          );
          const completed = sorted.filter(
            (p: any) => (p.status || "").toLowerCase() === "completed"
          ).length;
          setStats({
            totalProjects: sorted.length,
            totalPanels,
            completedProjects: completed,
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch projects in workspace page:", err);
    } finally {
      setLoadingProjects(false);
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return recentProjects;
    const q = searchQuery.toLowerCase();
    return recentProjects.filter(
      (p) =>
        (p.title || "").toLowerCase().includes(q) ||
        (p.genre || "").toLowerCase().includes(q) ||
        (p.author || "").toLowerCase().includes(q) ||
        (p.episode || "").toLowerCase().includes(q)
    );
  }, [recentProjects, searchQuery]);

  const displayedProjects = useMemo(
    () => (showAll ? filteredProjects : filteredProjects.slice(0, 6)),
    [filteredProjects, showAll]
  );

  const isValidUrl = (urlStr: string): boolean => {
    if (!urlStr || !urlStr.trim()) return false;
    try {
      const formatted =
        urlStr.trim().startsWith("http://") || urlStr.trim().startsWith("https://")
          ? urlStr.trim()
          : `https://${urlStr.trim()}`;
      const parsed = new URL(formatted);
      return Boolean(
        parsed.hostname &&
          parsed.hostname.includes(".") &&
          parsed.hostname.split(".").every((part) => part.length > 0) &&
          parsed.hostname.length >= 4
      );
    } catch {
      return false;
    }
  };

  const handleWorkspaceImport = async () => {
    const trimmed = targetUrl.trim();
    if (!trimmed) return;

    if (!isValidUrl(trimmed)) {
      if (addNotification) {
        addNotification(
          "Please enter a valid comic URL (e.g. https://domain.com/chapter-1)",
          "warning"
        );
      }
      return;
    }

    const temporaryProjectId = `temp_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 10)}`;

    if (typeof scrapeImages === "function") {
      const ok = await scrapeImages(trimmed, temporaryProjectId);
      if (ok) {
        localStorage.removeItem("auto_import_url");
        const nav = navigateTo || (window as any).navigateTo;
        const targetPath = `/scraper/editor?id=${temporaryProjectId}`;
        if (typeof nav === "function") {
          nav(targetPath);
        } else {
          window.history.pushState({}, "", targetPath);
          window.dispatchEvent(new Event("popstate"));
        }
      }
    } else {
      localStorage.setItem("auto_import_url", trimmed);
      const nav = navigateTo || (window as any).navigateTo;
      const targetPath = `/scraper/editor?id=${temporaryProjectId}`;
      if (typeof nav === "function") {
        nav(targetPath);
      } else {
        window.history.pushState({}, "", targetPath);
        window.dispatchEvent(new Event("popstate"));
      }
    }
  };

  const handleEpisodeSelect = async (episode: any) => {
    if (!episode.url) return;

    setTargetUrl(episode.url);
    const numMatch = episode.number.match(/\d+/);
    const num = numMatch ? numMatch[0] : episode.number;
    setChapterNumber(num || "");
    setChapterTitle(episode.title || "");

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

    const temporaryProjectId = `temp_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 10)}`;

    if (typeof scrapeImages === "function") {
      const ok = await scrapeImages(episode.url, temporaryProjectId);
      if (ok) {
        localStorage.removeItem("auto_import_url");
        const nav = navigateTo || (window as any).navigateTo;
        const targetPath = `/scraper/editor?id=${temporaryProjectId}`;
        if (typeof nav === "function") {
          nav(targetPath);
        } else {
          window.history.pushState({}, "", targetPath);
          window.dispatchEvent(new Event("popstate"));
        }
      }
    } else {
      localStorage.setItem("auto_import_url", episode.url);
      const nav = navigateTo || (window as any).navigateTo;
      const targetPath = `/scraper/editor?id=${temporaryProjectId}`;
      if (typeof nav === "function") {
        nav(targetPath);
      } else {
        window.history.pushState({}, "", targetPath);
        window.dispatchEvent(new Event("popstate"));
      }
    }
  };

  const normalizeUrl = (u: string) => {
    let s = u.trim().toLowerCase();
    if (s.startsWith("http://")) {
      s = s.substring(7);
    } else if (s.startsWith("https://")) {
      s = s.substring(8);
    }
    if (s.startsWith("www.")) {
      s = s.substring(4);
    }
    if (s.endsWith("/")) {
      s = s.slice(0, -1);
    }
    return s;
  };

  const matchingProject = useMemo<StoredProject | null>(() => {
    if (!targetUrl || !targetUrl.trim()) return null;
    const targetUrlNormalized = normalizeUrl(targetUrl);
    return (
      recentProjects.find(
        (p) => p.url && normalizeUrl(p.url) === targetUrlNormalized
      ) || null
    );
  }, [recentProjects, targetUrl]);

  const handleUploadLocalImages = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );
    if (fileArray.length === 0) {
      addNotification(
        "Please select valid image files (PNG, JPG, WEBP, GIF, SVG).",
        "error"
      );
      return;
    }

    const readFileAsDataUrl = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    const imageUrls = await Promise.all(
      fileArray.map((file) => readFileAsDataUrl(file))
    );

    const currentStore = useProjectStore.getState();
    const existingProjectData = currentStore.activeProjectData as {
      project?: {
        project_id: string;
        title: string;
        url: string;
        created_at?: string;
      };
      panels?: any[];
      scrapedImages?: string[];
    } | null;

    const pid =
      existingProjectData?.project?.project_id || `proj_upload_${Date.now()}`;
    const fallbackProject = {
      project_id: pid,
      title: seriesTitle.trim() || "Custom Image Project",
      url: "local_upload",
      created_at: new Date().toISOString(),
    };

    const existingScraped = existingProjectData?.scrapedImages || [];
    const updatedScraped = [...existingScraped, ...imageUrls];

    currentStore.setActiveProject({
      project: existingProjectData?.project ?? fallbackProject,
      panels: existingProjectData?.panels || [],
      scrapedImages: updatedScraped,
    });

    addNotification(
      `Successfully imported ${fileArray.length} image(s) to Imported Assets!`,
      "success"
    );

    const nav = navigateTo || (window as any).navigateTo;
    const targetPath = `/scraper/editor?id=${pid}`;
    if (typeof nav === "function") {
      nav(targetPath);
    } else {
      window.history.pushState({}, "", targetPath);
      window.dispatchEvent(new Event("popstate"));
    }
  };

  return (
    <main
      id="main_workspace"
      className="flex-1 w-full max-w-7xl mx-auto py-6 flex flex-col gap-10 items-center justify-start"
    >
      <div className="w-full space-y-12 stagger-container animate-in fade-in slide-in-from-bottom-8 duration-700">
        {matchingProject && (
          <WorkspaceResumeCard
            matchingProject={matchingProject as any}
            navigateTo={navigateTo}
            addNotification={addNotification}
            getGenreStyle={getGenreStyle}
          />
        )}

        {/* ── STATS BAR ── */}
        <WorkspaceStatsBar
          statsLoading={statsLoading}
          stats={stats}
          projectId={projectId}
        />

        <div className="relative z-50">
          <UrlInputPanel
            targetUrl={targetUrl}
            setTargetUrl={setTargetUrl}
            selectedSource={selectedSource}
            setSelectedSource={setSelectedSource}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            isProcessing={isProcessing}
            isScraping={isScraping}
            handleGenerateVideo={() => {}}
            handleScrape={handleWorkspaceImport}
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
            cropSensitivity={cropSensitivity}
            setCropSensitivity={setCropSensitivity}
            autoSplitTallStrips={autoSplitTallStrips}
            setAutoSplitTallStrips={setAutoSplitTallStrips}
            onUploadImages={handleUploadLocalImages}
            fetchWithInterceptor={props.fetchWithInterceptor}
            onOpenChapterScraper={(url) => {
              const nav = navigateTo || (window as any).navigateTo;
              const targetPath = `/scraper/chapters?url=${encodeURIComponent(
                url
              )}`;
              if (typeof nav === "function") {
                nav(targetPath);
              } else {
                window.history.pushState({}, "", targetPath);
                window.dispatchEvent(new Event("popstate"));
              }
            }}
            onOpenEpisodeScraper={(url) => {
              const nav = navigateTo || (window as any).navigateTo;
              const targetPath = `/scraper/chapters?url=${encodeURIComponent(
                url
              )}`;
              if (typeof nav === "function") {
                nav(targetPath);
              } else {
                window.history.pushState({}, "", targetPath);
                window.dispatchEvent(new Event("popstate"));
              }
            }}
          />
        </div>

        {/* ── RECENT PROJECTS ── */}
        <RecentProjectsSection
          recentProjects={recentProjects}
          loadingProjects={loadingProjects}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showAll={showAll}
          setShowAll={setShowAll}
          filteredProjects={filteredProjects}
          displayedProjects={displayedProjects}
          fetchProjects={fetchProjects}
          navigateTo={navigateTo}
          handleOpenProject={handleOpenProject}
          handleRenameProject={handleRenameProject}
          handleDeleteProject={handleDeleteProject}
          handleExportProject={handleExportProject}
          handleCopyLink={handleCopyLink}
          openMenuId={openMenuId}
          handleToggleMenu={handleToggleMenu}
          renamingProjectId={renamingProjectId}
          onSaveRename={handleSaveRename}
        />

        {/* 4. CREATOR TIPS & GUIDE */}
        <CreatorGuideSection
          activeGuideTab={activeGuideTab}
          setActiveGuideTab={setActiveGuideTab}
        />
      </div>
    </main>
  );
};

const ScraperPage = React.memo(ScraperPageInner);
export const WorkspaceScraperPage = ScraperPage;
export const AppWorkspace = ScraperPage;
export { ScraperPage };
export default ScraperPage;
