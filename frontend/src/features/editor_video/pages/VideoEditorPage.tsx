import React, { useState } from "react";
// ── Subsystem imports (new architecture) ─────────────────────────────────────
import VideoEditorHeader from "@/features/editor_video/shell/VideoEditorHeader";
import VideoEditorSidebar from "@/features/editor_video/shell/VideoEditorSidebar";
import { WorkspacePanel } from "@/features/editor_video/shell/WorkspacePanel";
import { EditorViewport } from "@/features/editor_video/viewport/EditorViewport";
import { Timeline } from "@/features/editor_video/timeline/Timeline";
import { InspectorPanel } from "@/features/editor_video/inspector/InspectorPanel";
import { useProjectStore } from "@/shared/hooks/useProjectStore";

interface VideoEditorPageProps {
  appLogic?: any;
  navigateTo?: (path: string) => void;
  onBackToApp?: () => void;
  projectTitle?: string;
  user?: any;
}

const DEFAULT_LEFT_WIDTH = 380;
const DEFAULT_RIGHT_WIDTH = 260;
const DEFAULT_TIMELINE_HEIGHT = 280;

const VideoEditorPage: React.FC<VideoEditorPageProps> = ({
  appLogic,
  navigateTo,
  onBackToApp,
  projectTitle,
  user,
}) => {
  const [activeNav, setActiveNav] = useState("project");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [layoutConfig, setLayoutConfig] = useState({
    mediaBin: true,
    rightInspector: true,
    timeline: true,
  });
  const [viewportZoom, setViewportZoom] = useState(100);

  // ── Panel Resizing Dimensions & Persistence ──────────────────────────────
  const [leftWidth, setLeftWidth] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sonikoma_left_panel_w");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 260 && parsed <= 650) return parsed;
      }
    }
    return DEFAULT_LEFT_WIDTH;
  });

  const [rightWidth, setRightWidth] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sonikoma_right_panel_w");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 180 && parsed <= 500) return parsed;
      }
    }
    return DEFAULT_RIGHT_WIDTH;
  });

  const [timelineHeight, setTimelineHeight] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sonikoma_timeline_h");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 160 && parsed <= 650) return parsed;
      }
    }
    return DEFAULT_TIMELINE_HEIGHT;
  });

  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);

  // ── Mouse Drag Handlers for Smooth Studio-Grade Resizing ─────────────────
  const handleLeftResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingLeft(true);
    const startX = e.clientX;
    const startW = leftWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const nextW = Math.min(650, Math.max(260, startW + delta));
      setLeftWidth(nextW);
      localStorage.setItem("sonikoma_left_panel_w", String(nextW));
    };

    const onMouseUp = () => {
      setIsDraggingLeft(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleRightResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingRight(true);
    const startX = e.clientX;
    const startW = rightWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX;
      const nextW = Math.min(500, Math.max(180, startW + delta));
      setRightWidth(nextW);
      localStorage.setItem("sonikoma_right_panel_w", String(nextW));
    };

    const onMouseUp = () => {
      setIsDraggingRight(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleTimelineResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingTimeline(true);
    const startY = e.clientY;
    const startH = timelineHeight;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = startY - moveEvent.clientY;
      const nextH = Math.min(650, Math.max(160, startH + delta));
      setTimelineHeight(nextH);
      localStorage.setItem("sonikoma_timeline_h", String(nextH));
    };

    const onMouseUp = () => {
      setIsDraggingTimeline(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleZoomLevelChange = (nextZoom: number) => {
    setViewportZoom(Math.min(300, Math.max(20, nextZoom)));
  };

  const handleZoomIn = () =>
    setViewportZoom((prev) => Math.min(300, prev + 10));
  const handleZoomOut = () =>
    setViewportZoom((prev) => Math.max(20, prev - 10));
  const handleZoomReset = () => setViewportZoom(100);

  const handleTogglePanel = (
    panel: "mediaBin" | "rightInspector" | "timeline"
  ) => {
    setLayoutConfig((prev) => ({ ...prev, [panel]: !prev[panel] }));
  };

  // ─── Destructure all live state from appLogic with store fallback ──────────────
  const storeActiveProjectData = useProjectStore((s) => s.activeProjectData);
  const panels =
    appLogic?.panels && appLogic.panels.length > 0
      ? appLogic.panels
      : storeActiveProjectData?.panels ?? [];
  const scrapedImages =
    appLogic?.scrapedImages && appLogic.scrapedImages.length > 0
      ? appLogic.scrapedImages
      : storeActiveProjectData?.scrapedImages ?? [];
  const videoUrl = appLogic?.videoUrl ?? null;
  const setVideoUrl = appLogic?.setVideoUrl ?? (() => {});
  const seriesTitle =
    appLogic?.seriesTitle ||
    storeActiveProjectData?.project?.title ||
    "";
  const chapterTitle =
    appLogic?.chapterTitle ||
    storeActiveProjectData?.project?.chapter_title ||
    "";
  const chapterNumber =
    appLogic?.chapterNumber ||
    storeActiveProjectData?.project?.chapter_number ||
    "";
  const targetUrl = appLogic?.targetUrl ?? "";
  const isDirty = appLogic?.isDirty ?? false;
  const isSaving = appLogic?.isSaving ?? false;
  const isRendering = appLogic?.isRendering ?? false;
  const renderProgress = appLogic?.renderProgress ?? 0;
  const progressStatus = appLogic?.progressStatus ?? null;
  const hasEnoughCredits = appLogic?.hasEnoughCredits ?? true;
  const userCredits = appLogic?.userCredits ?? null;
  const addNotification = appLogic?.addNotification ?? (() => {});

  // Playback
  const currentPanelIndex = appLogic?.currentPanelIndex ?? 0;
  const setCurrentPanelIndex = appLogic?.setCurrentPanelIndex ?? (() => {});
  const [activePreviewTab, setActivePreviewTab] = useState("editor");
  const handleSetActivePreviewTab = (tab: string) => {
    setActivePreviewTab(tab);
    if (tab === "timeline") {
      setLayoutConfig((prev) => ({ ...prev, timeline: true }));
    }
  };

  // Audio / Video properties
  const [currentAspectRatio, setCurrentAspectRatio] = useState<string>(() => {
    return appLogic?.aspectRatio || "original";
  });
  const handleAspectRatioChange = (ratio: string) => {
    setCurrentAspectRatio(ratio);
    appLogic?.setAspectRatio?.(ratio);
  };
  const volume = appLogic?.volume ?? 80;
  const setVolume = appLogic?.setVolume;
  const voiceActor = appLogic?.voiceActor ?? "";
  const setVoiceActor = appLogic?.setVoiceActor;
  const musicTheme = appLogic?.musicTheme ?? "";
  const setMusicTheme = appLogic?.setMusicTheme;
  const frameRate = appLogic?.frameRate ?? null;
  const setFrameRate = appLogic?.setFrameRate;

  // Effects / Adjust
  const cropSensitivity = appLogic?.cropSensitivity ?? 50;
  const setCropSensitivity = appLogic?.setCropSensitivity;

  const handleReturn = () => {
    if (onBackToApp) {
      onBackToApp();
    } else if (navigateTo) {
      navigateTo("/scraper/editor");
    } else {
      window.history.back();
    }
  };

  const handleExport = () => {
    if (appLogic?.handleRenderFinalVideo) {
      appLogic.handleRenderFinalVideo();
    } else {
      alert("Starting high-resolution video export render…");
    }
  };

  const handleSave = () => {
    if (appLogic?.saveProject) {
      appLogic.saveProject();
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#06060c] text-white overflow-hidden select-none font-sans fixed inset-0 z-[100]">
      {/* Subtle ambient background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(88,28,235,0.08),transparent)] z-0" />

      {/* ── Top Header Bar ──────────────────────────────────────────────────── */}
      <VideoEditorHeader
        seriesTitle={seriesTitle}
        chapterTitle={chapterTitle}
        chapterNumber={chapterNumber ? String(chapterNumber) : undefined}
        onBackToApp={handleReturn}
        onExport={handleExport}
        onSave={handleSave}
        isRendering={isRendering}
        renderProgress={renderProgress}
        isSaving={isSaving}
        isDirty={isDirty}
        userCredits={userCredits}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        layoutConfig={layoutConfig}
        onTogglePanel={handleTogglePanel}
        panelsCount={panels.length}
        navigateTo={navigateTo}
        user={user || appLogic?.user}
      />

      {/* ── Slide-Out Full Sidebar Drawer ───────────────────────────────────── */}
      <VideoEditorSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        seriesTitle={seriesTitle}
        chapterTitle={chapterTitle}
        panelsCount={panels.length}
        onBackToApp={handleReturn}
        navigateTo={navigateTo}
      />

      {/* ── Main Workspace Row ───────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 relative select-none">
        {/* Left: Workspace Panel (MiniSidebar + active workspace) */}
        <div
          className="h-full flex shrink-0 overflow-hidden"
          style={{ width: layoutConfig.mediaBin ? leftWidth : 96 }}
        >
          <WorkspacePanel
            defaultWorkspace="imported_assets"
            onBackToApp={handleReturn}
            showContent={layoutConfig.mediaBin}
            appLogic={appLogic}
          />
        </div>

        {/* Left Vertical Resizer Splitter */}
        {layoutConfig.mediaBin && (
          <div
            onMouseDown={handleLeftResizeStart}
            onDoubleClick={() => {
              setLeftWidth(DEFAULT_LEFT_WIDTH);
              localStorage.setItem("sonikoma_left_panel_w", String(DEFAULT_LEFT_WIDTH));
            }}
            className={`w-1.5 h-full relative cursor-col-resize select-none shrink-0 z-20 group transition-colors duration-150 flex items-center justify-center border-l border-r border-white/5 ${
              isDraggingLeft
                ? "bg-[#2A2A2A] "
                : "bg-white/[0.04] hover:bg-[#3B82F6]/50"
            }`}
            title="Drag to resize Left Panel (Double click to reset)"
          >
            <div className="w-[2px] h-6 rounded-full bg-white/20 group-hover:bg-[#2A2A2A] transition-colors" />
          </div>
        )}

        {/* Studio Content Column (Preview Player Top + Timeline Bottom) */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* ── Upper Row: Preview Player + Right Inspector ───────────────── */}
          <div className="flex-1 flex min-h-0 w-full overflow-hidden">
            {/* Center: Adaptation Player (full) */}
            <EditorViewport
              panels={panels}
              videoUrl={videoUrl}
              setVideoUrl={setVideoUrl}
              currentPanelIndex={currentPanelIndex}
              setCurrentPanelIndex={setCurrentPanelIndex}
              activePreviewTab={activePreviewTab}
              setActivePreviewTab={handleSetActivePreviewTab}
              allowEditorTab={true}
              musicTheme={musicTheme}
              voiceActor={voiceActor}
              navigateTo={navigateTo ?? (() => {})}
              seriesTitle={seriesTitle}
              chapterNumber={chapterNumber}
              chapterTitle={chapterTitle}
              targetUrl={targetUrl}
              isRendering={isRendering}
              renderProgress={renderProgress}
              onExportVideo={handleExport}
              handleRenderFinalVideo={handleExport}
              onExport={handleExport}
              progressStatus={progressStatus}
              hasEnoughCredits={hasEnoughCredits}
              addNotification={addNotification}
              onOpenVideoEditor={() => {}}
              variant="embedded"
              zoomLevel={viewportZoom}
              onZoomLevelChange={handleZoomLevelChange}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onZoomReset={handleZoomReset}
              onSave={handleSave}
              isSaving={isSaving}
              isDirty={isDirty}
              aspectRatio={currentAspectRatio}
              onAspectRatioChange={handleAspectRatioChange}
            />

            {/* Right Vertical Resizer Splitter */}
            {layoutConfig.rightInspector && (
              <div
                onMouseDown={handleRightResizeStart}
                onDoubleClick={() => {
                  setRightWidth(DEFAULT_RIGHT_WIDTH);
                  localStorage.setItem("sonikoma_right_panel_w", String(DEFAULT_RIGHT_WIDTH));
                }}
                className={`w-1.5 h-full relative cursor-col-resize select-none shrink-0 z-20 group transition-colors duration-150 flex items-center justify-center border-l border-r border-white/5 ${
                  isDraggingRight
                    ? "bg-[#2A2A2A] "
                    : "bg-white/[0.04] hover:bg-[#3B82F6]/50"
                }`}
                title="Drag to resize Inspector Panel (Double click to reset)"
              >
                <div className="w-[2px] h-6 rounded-full bg-white/20 group-hover:bg-[#2A2A2A] transition-colors" />
              </div>
            )}

            {/* Right: Inspector Panel */}
            {layoutConfig.rightInspector && (
              <div
                className="h-full shrink-0 overflow-hidden"
                style={{ width: rightWidth }}
              >
                <InspectorPanel />
              </div>
            )}
          </div>

          {/* Bottom Horizontal Resizer Splitter */}
          {layoutConfig.timeline && (
            <div
              onMouseDown={handleTimelineResizeStart}
              onDoubleClick={() => {
                setTimelineHeight(DEFAULT_TIMELINE_HEIGHT);
                localStorage.setItem("sonikoma_timeline_h", String(DEFAULT_TIMELINE_HEIGHT));
              }}
              className={`h-2 w-full relative cursor-row-resize select-none shrink-0 z-20 group transition-colors duration-150 flex items-center justify-center border-t border-b border-white/[0.06] ${
                isDraggingTimeline
                  ? "bg-[#2A2A2A] "
                  : "bg-[#0c0c14] hover:bg-[#3B82F6]/30"
              }`}
              title="Drag to resize Timeline (Double click to reset)"
            >
              <div className="h-[2px] w-12 rounded-full bg-white/20 group-hover:bg-[#2A2A2A] transition-colors" />
            </div>
          )}

          {/* ── Bottom Multi-Track NLE Timeline ─────────────────────────────── */}
          {layoutConfig.timeline && (
            <div
              className="w-full shrink-0 overflow-hidden"
              style={{ height: timelineHeight }}
            >
              <Timeline
                panels={panels}
                currentPanelIndex={currentPanelIndex}
                setCurrentPanelIndex={setCurrentPanelIndex}
                musicTheme={musicTheme}
                voiceActor={voiceActor}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(VideoEditorPage);
