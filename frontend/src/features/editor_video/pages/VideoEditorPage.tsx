import React, { useState } from "react";
import VideoEditorHeader from "@/features/editor_video/components/VideoEditorHeader";
import VideoEditorMiniSidebar from "@/features/editor_video/components/VideoEditorMiniSidebar";
import VideoEditorSidebar from "@/features/editor_video/components/VideoEditorSidebar";
import VideoMediaBin from "@/features/editor_video/components/VideoMediaBin";
import AdaptationPlayer from "@/features/video_preview/components/AdaptationPlayer";
import VideoPropertyInspector from "@/features/editor_video/components/VideoPropertyInspector";
import VideoMultiTrackTimeline from "@/features/editor_video/components/VideoMultiTrackTimeline";

interface VideoEditorPageProps {
  appLogic?: any;
  navigateTo?: (path: string) => void;
  onBackToApp?: () => void;
  projectTitle?: string;
}

const VideoEditorPage: React.FC<VideoEditorPageProps> = ({
  appLogic,
  navigateTo,
  onBackToApp,
  projectTitle,
}) => {
  const [activeNav, setActiveNav] = useState("project");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [layoutConfig, setLayoutConfig] = useState({
    mediaBin: true,
    rightInspector: true,
    timeline: true,
  });

  const handleTogglePanel = (panel: "mediaBin" | "rightInspector" | "timeline") => {
    setLayoutConfig((prev) => ({ ...prev, [panel]: !prev[panel] }));
  };

  // ─── Destructure all live state from appLogic ──────────────────────────────
  const panels = appLogic?.panels ?? [];
  const scrapedImages = appLogic?.scrapedImages ?? [];
  const videoUrl = appLogic?.videoUrl ?? null;
  const setVideoUrl = appLogic?.setVideoUrl ?? (() => {});
  const seriesTitle = appLogic?.seriesTitle ?? "";
  const chapterTitle = appLogic?.chapterTitle ?? "";
  const chapterNumber = appLogic?.chapterNumber ?? "";
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
  const [activePreviewTab, setActivePreviewTab] = useState("video");

  // Audio / Video properties
  const aspectRatio = appLogic?.aspectRatio ?? "16:9";
  const setAspectRatio = appLogic?.setAspectRatio;
  const volume = appLogic?.volume ?? 80;
  const setVolume = appLogic?.setVolume;
  const voiceActor = appLogic?.voiceActor ?? "";
  const setVoiceActor = appLogic?.setVoiceActor;
  const musicTheme = appLogic?.musicTheme ?? "Synthwave Neon";
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
      navigateTo("/workspace/editor");
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
    <div className="flex flex-col h-screen w-screen bg-[#050508] text-white overflow-hidden select-none font-sans fixed inset-0 z-[100]">
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
      <div className="flex-1 flex min-h-0 relative">
        {/* Far-Left Vertical Icon Mini Sidebar Nav */}
        <VideoEditorMiniSidebar
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          onBackToApp={handleReturn}
        />

        {/* Studio Content Column (3-Panel Top Row + Timeline Bottom) */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* ── Upper 3-Panel Row ────────────────────────────────────────────── */}
          <div className="flex-1 flex min-h-0 w-full overflow-hidden">
            {/* Left: Asset Media Bin */}
            {layoutConfig.mediaBin && (
              <VideoMediaBin
                scrapedImages={scrapedImages}
                panels={panels}
                currentPanelIndex={currentPanelIndex}
                setCurrentPanelIndex={setCurrentPanelIndex}
                musicTheme={musicTheme}
                voiceActor={voiceActor}
              />
            )}

            {/* Center: Adaptation Player (full) */}
            <AdaptationPlayer
              panels={panels}
              videoUrl={videoUrl}
              setVideoUrl={setVideoUrl}
              currentPanelIndex={currentPanelIndex}
              setCurrentPanelIndex={setCurrentPanelIndex}
              activePreviewTab={activePreviewTab}
              setActivePreviewTab={setActivePreviewTab}
              musicTheme={musicTheme}
              voiceActor={voiceActor}
              navigateTo={navigateTo ?? (() => {})}
              seriesTitle={seriesTitle}
              chapterNumber={chapterNumber}
              chapterTitle={chapterTitle}
              targetUrl={targetUrl}
              isRendering={isRendering}
              renderProgress={renderProgress}
              handleRenderFinalVideo={handleExport}
              progressStatus={progressStatus}
              hasEnoughCredits={hasEnoughCredits}
              addNotification={addNotification}
              onOpenVideoEditor={() => {}}
              variant="embedded"
            />

            {/* Right: Property Inspector */}
            {layoutConfig.rightInspector && (
              <VideoPropertyInspector
                voiceActor={voiceActor}
                setVoiceActor={setVoiceActor}
                musicTheme={musicTheme}
                setMusicTheme={setMusicTheme}
                aspectRatio={aspectRatio}
                setAspectRatio={setAspectRatio}
                frameRate={frameRate}
                setFrameRate={setFrameRate}
                volume={volume}
                setVolume={setVolume}
                cropSensitivity={cropSensitivity}
                setCropSensitivity={setCropSensitivity}
              />
            )}
          </div>

          {/* ── Bottom Multi-Track NLE Timeline ─────────────────────────────── */}
          {layoutConfig.timeline && (
            <VideoMultiTrackTimeline
              panels={panels}
              currentPanelIndex={currentPanelIndex}
              setCurrentPanelIndex={setCurrentPanelIndex}
              musicTheme={musicTheme}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(VideoEditorPage);