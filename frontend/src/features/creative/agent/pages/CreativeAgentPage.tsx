import React, { useState } from "react";
import { useCreativeAgent } from "../hooks/useCreativeAgent";
import { AgentHeroBanner } from "../components/AgentHeroBanner";
import { AgentInputCard } from "../components/AgentInputCard";
import { AgentProgressTracker } from "../components/AgentProgressTracker";
import { AgentTerminalLogs } from "../components/AgentTerminalLogs";
import { AgentPanelsPreview } from "../components/AgentPanelsPreview";
import { AgentYouTubeSuccessCard } from "../components/AgentYouTubeSuccessCard";
import { AgentHistoryModal } from "../components/AgentHistoryModal";
import DeleteConfirmModal from "@/shared/ui/modal/DeleteConfirmModal";

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
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

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
    activeRun,
    isLoading,
    history,
    handleLaunch,
    handleApprove,
    handleReset,
    selectHistoryRun,
  } = useCreativeAgent(fetchWithInterceptor, addNotification);

  const isCompleted = activeRun?.status === "completed";
  const isReviewAwaiting = activeRun?.status === "awaiting_review";

  const handlePromptReset = () => {
    if (activeRun && activeRun.status !== "completed") {
      setShowResetConfirmModal(true);
    } else {
      handleReset();
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto py-4 sm:py-6 animate-fade-in text-left text-[#E5E5E5]">
      {/* ── MAIN STUDIO WRAPPER FRAME ── */}
      <div className="rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-6 sm:p-8 lg:p-9 shadow-2xl space-y-8 relative overflow-hidden text-left">
        {/* ── Top Hero Header ── */}
        <AgentHeroBanner
          onOpenHistory={() => setIsHistoryOpen(true)}
          historyCount={history.length}
        />

        {/* ── Completed YouTube Success Card ── */}
        {isCompleted && (
          <AgentYouTubeSuccessCard
            youtubeUrl={activeRun.youtube_url}
            videoUrl={activeRun.video_url}
            metadata={activeRun.youtube_metadata}
            scrapedTitle={activeRun.scraped_title}
            onReset={handleReset}
          />
        )}

        {/* ── Active Execution Tracker & Live Stream ── */}
        {activeRun && !isCompleted && (
          <div className="space-y-6">
            {/* Top Action Bar with Start New Run Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1A1A1A] border border-[#2F2F2F] rounded-2xl px-5 py-3 shadow-inner">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-semibold text-white">
                  Active Run: <span className="font-mono text-blue-400">{activeRun.run_id}</span>
                </span>
                {activeRun.panels && activeRun.panels.length > 0 && (
                  <span className="text-xs text-[#9CA3AF] px-2.5 py-0.5 rounded-full bg-[#262626] font-mono border border-[#333]">
                    {activeRun.panels.length} Panels Loaded
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handlePromptReset}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#262626] hover:bg-[#333] border border-[#3F3F3F] text-gray-200 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                title="Discard this run and launch a fresh episode"
              >
                Start New Run / Launch Another URL
              </button>
            </div>

            <AgentProgressTracker
              status={activeRun.status}
              progress={activeRun.progress}
              currentAction={activeRun.current_action}
              onApprove={handleApprove}
              onReset={handlePromptReset}
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

        {/* ── Input Launch Form ── */}
        {(!activeRun || isCompleted) && (
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
      />

      {/* ── Delete / Discard Confirmation Modal ── */}
      {showResetConfirmModal && (
        <DeleteConfirmModal
          title="Discard Active Run?"
          message="Are you sure you want to discard this in-progress autonomous agent run and start a new URL? Any unfinished progress will be reset."
          confirmText="Discard & Reset"
          cancelText="Keep Running"
          onConfirm={() => {
            handleReset();
            setShowResetConfirmModal(false);
          }}
          onCancel={() => setShowResetConfirmModal(false)}
        />
      )}
    </div>
  );
};

export default CreativeAgentPage;
