import React, { useState } from "react";
import { useCreativeAgent } from "../hooks/useCreativeAgent";
import {
  AgentHeroBanner,
  AgentInputCard,
  AgentProgressTracker,
  AgentTerminalLogs,
  AgentPanelsPreview,
  AgentYouTubeSuccessCard,
  AgentHistoryModal,
  AgentBackgroundActionModal,
} from "../components";
import { Sparkles, Trash2, Smartphone, Monitor } from "lucide-react";

interface CreativeAgentPageProps {
  fetchWithInterceptor?: any;
  addNotification?: (msg: string, type: any) => void;
  navigateTo?: (path: string) => void;
}

export const CreativeAgentPage: React.FC<CreativeAgentPageProps> = ({
  fetchWithInterceptor,
  addNotification,
}) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);

  const {
    url,
    setUrl,
    videoFormat,
    setVideoFormat,
    language,
    setLanguage,
    voice,
    setVoice,
    privacyStatus,
    setPrivacyStatus,
    reviewMode,
    setReviewMode,
    maxPanels,
    setMaxPanels,
    titleOverride,
    setTitleOverride,
    activeRun,
    isCreatingNew,
    setIsCreatingNew,
    isLoading,
    history,
    isHistoryLoading,
    fetchHistory,
    handleLaunch,
    handleApprove,
    handleReset,
    sendToBackgroundAndStartNew,
    startNewAgent,
    switchToRun,
    selectHistoryRun,
  } = useCreativeAgent(fetchWithInterceptor, addNotification);

  const runningJob = history.find((r) =>
    [
      "initializing",
      "scraping",
      "processing_images",
      "generating_narrative",
      "synthesizing_audio",
      "rendering_video",
      "publishing_youtube",
      "awaiting_review",
    ].includes(r.status)
  );

  const isCompleted = activeRun?.status === "completed";
  const isReviewAwaiting = activeRun?.status === "awaiting_review";

  const handlePromptDiscard = () => {
    if (activeRun && activeRun.status !== "completed") {
      setShowBackgroundModal(true);
    } else {
      handleReset();
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto py-4 sm:py-6 animate-fade-in text-left text-[#E5E5E5]">
      {/* ── MAIN STUDIO WRAPPER FRAME ── */}
      <div className="rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-6 sm:p-8 lg:p-9 shadow-2xl space-y-8 relative text-left">
        {/* ── Top Hero Header ── */}
        <AgentHeroBanner
          onOpenHistory={() => {
            fetchHistory();
            setIsHistoryOpen(true);
          }}
          historyCount={history.length}
          onStartNew={() => {
            if (activeRun && !isCreatingNew) {
              sendToBackgroundAndStartNew();
            } else {
              startNewAgent();
            }
          }}
          isCreatingNew={isCreatingNew || !activeRun}
          hasActiveRun={!!activeRun || !!runningJob}
          onViewActiveRun={() => {
            if (activeRun) {
              setIsCreatingNew(false);
            } else if (runningJob) {
              switchToRun(runningJob);
            }
          }}
        />

        {/* ── Completed YouTube Success Card ── */}
        {!isCreatingNew && isCompleted && activeRun && (
          <AgentYouTubeSuccessCard
            youtubeUrl={activeRun.youtube_url}
            videoUrl={activeRun.video_url}
            metadata={activeRun.youtube_metadata}
            scrapedTitle={activeRun.scraped_title}
            videoFormat={activeRun.video_format || videoFormat}
            onReset={startNewAgent}
          />
        )}

        {/* ── Active Execution Tracker & Live Stream ── */}
        {!isCreatingNew && activeRun && !isCompleted && (
          <div className="space-y-6">
            {/* Top Action Bar with Multi-Agent Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1A1A1A] border border-[#2F2F2F] rounded-2xl px-5 py-3 shadow-inner">
              <div className="flex flex-wrap items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-semibold text-white">
                  Active Agent:{" "}
                  <span className="font-mono text-blue-400">{activeRun.run_id}</span>
                </span>
                {activeRun.scraped_title && (
                  <span className="text-xs text-gray-300 font-medium truncate max-w-[200px] sm:max-w-[320px]">
                    "{activeRun.scraped_title}"
                  </span>
                )}
                {/* Format Badge */}
                {activeRun.video_format === "shorts" ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-purple-400" />
                    Shorts 9:16
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                    <Monitor className="w-3 h-3 text-blue-400" />
                    16:9 Landscape
                  </span>
                )}
                {activeRun.panels && activeRun.panels.length > 0 && (
                  <span className="text-xs text-[#9CA3AF] px-2.5 py-0.5 rounded-full bg-[#262626] font-mono border border-[#333]">
                    {activeRun.panels.length} Panels Loaded
                  </span>
                )}
              </div>

              {/* Action Buttons: Background & New vs Discard */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={sendToBackgroundAndStartNew}
                  className="px-4 py-2 rounded-xl text-xs font-bold font-mono text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/20 border border-blue-400/40 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Let this agent run in the background and configure another video"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                  <span>Run in Background &amp; Create New</span>
                </button>
                <button
                  type="button"
                  onClick={handlePromptDiscard}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#262626] hover:bg-[#333] border border-[#3F3F3F] text-gray-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
                  title="Discard or clear this agent run"
                >
                  <Trash2 className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Discard</span>
                </button>
              </div>
            </div>

            <AgentProgressTracker
              status={activeRun.status}
              progress={activeRun.progress}
              currentAction={activeRun.current_action}
              onApprove={handleApprove}
              onReset={handlePromptDiscard}
              isReviewAwaiting={isReviewAwaiting}
            />

            {/* Panels preview when panels are available */}
            {activeRun.panels && activeRun.panels.length > 0 && (
              <AgentPanelsPreview
                panels={activeRun.panels}
                scrapedTitle={activeRun.scraped_title}
              />
            )}

            {/* Terminal log output */}
            <AgentTerminalLogs logs={activeRun.logs} />
          </div>
        )}

        {/* ── Input Launch Form: Shown when starting new or no active run selected ── */}
        {(isCreatingNew || !activeRun) && (
          <AgentInputCard
            url={url}
            setUrl={setUrl}
            videoFormat={videoFormat}
            setVideoFormat={setVideoFormat}
            language={language}
            setLanguage={setLanguage}
            voice={voice}
            setVoice={setVoice}
            privacyStatus={privacyStatus}
            setPrivacyStatus={setPrivacyStatus}
            reviewMode={reviewMode}
            setReviewMode={setReviewMode}
            maxPanels={maxPanels}
            setMaxPanels={setMaxPanels}
            titleOverride={titleOverride}
            setTitleOverride={setTitleOverride}
            onLaunch={handleLaunch}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* ── History Modal ── */}
      <AgentHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectRun={selectHistoryRun}
        onRefresh={fetchHistory}
        isLoading={isHistoryLoading}
      />

      {/* ── Multi-Agent Background Transition / Discard Modal ── */}
      {showBackgroundModal && activeRun && (
        <AgentBackgroundActionModal
          runId={activeRun.run_id}
          scrapedTitle={activeRun.scraped_title}
          onRunInBackgroundAndStartNew={() => {
            sendToBackgroundAndStartNew();
            setShowBackgroundModal(false);
          }}
          onDiscard={() => {
            handleReset();
            setShowBackgroundModal(false);
          }}
          onCancel={() => setShowBackgroundModal(false)}
        />
      )}
    </div>
  );
};

export default CreativeAgentPage;
