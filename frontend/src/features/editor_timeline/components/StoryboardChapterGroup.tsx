import React from "react";
import { GeneratedPanel } from "@/types";
import StoryboardCard from "@/features/editor_timeline/components/StoryboardCard";
import {
  formatDisplayEpisodeLabel,
  getSortedEpisodeGroups,
  HorizontalScrollContainer,
} from "@/features/editor_imported_images/components/ImportedImagesSidebar";

type ChapterGroupRecord = {
  episodeLabel: string;
  startIndex: number;
  count: number;
};

interface StoryboardChapterGroupProps {
  episodeGroups: ChapterGroupRecord[];
  selectedTimelineEp: number | "all";
  panels: GeneratedPanel[];
  currentPanelIndex: number;
  activePreviewTab: "video" | "timeline";
  setCurrentPanelIndex: (idx: number) => void;
  setActivePreviewTab: (tab: "video" | "timeline") => void;
  setPlaybackTime: (time: number) => void;
  isAnalyzingAll: boolean;
  analyzingPanelId: number | null;
  selectedPanelIds: Set<number>;
  togglePanelSelection: (id: number) => void;
  handlePanelClick: (
    idx: number,
    panelId: number,
    shiftKey: boolean,
    ctrlOrMeta: boolean
  ) => void;
  handlePanelDoubleClick: (idx: number, panelId: number) => void;
  handleShiftPanel: (idx: number, direction: "left" | "right") => void;
  handleModifySpeechText: (idx: number, value: string) => void;
  handleModifyMotion: (idx: number, value: string) => void;
  handleModifyDuration: (idx: number, value: number) => void;
  handleModifySFX: (idx: number, value: string) => void;
  handleModifyVisualDescription: (idx: number, value: string) => void;
  handleModifyNarrative: (idx: number, value: string) => void;
  handleAnalyzePanel: (panelId: number, imageUrl: string) => void;
  handleCancelAnalysis?: () => void;
  playStoryboardAudio?: (idx: number, forcePlay?: boolean) => void;
  autoPlayAudio?: boolean;
  addNotification?: (message: string, type: any) => void;
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  fetchWithInterceptor?: typeof fetch;
  voiceActor?: string;
  speechRate?: number;
  speechPitch?: number;
  storyboardViewLayout: "scroll" | "grid";
}

export const StoryboardChapterGroup = ({
  episodeGroups,
  selectedTimelineEp,
  panels,
  currentPanelIndex,
  activePreviewTab,
  setCurrentPanelIndex,
  setActivePreviewTab,
  setPlaybackTime,
  isAnalyzingAll,
  analyzingPanelId,
  selectedPanelIds,
  togglePanelSelection,
  handlePanelClick,
  handlePanelDoubleClick,
  handleShiftPanel,
  handleModifySpeechText,
  handleModifyMotion,
  handleModifyDuration,
  handleModifySFX,
  handleModifyVisualDescription,
  handleModifyNarrative,
  handleAnalyzePanel,
  handleCancelAnalysis,
  playStoryboardAudio,
  autoPlayAudio,
  addNotification,
  setPanels,
  fetchWithInterceptor,
  voiceActor,
  speechRate,
  speechPitch,
  storyboardViewLayout,
}: StoryboardChapterGroupProps) => {
  if (episodeGroups.length === 0) {
    return (
      <div className="w-full flex-1 min-w-0">
        {storyboardViewLayout === "scroll" ? (
          <HorizontalScrollContainer className="py-2">
            {panels.map((panel, idx) => (
              <StoryboardCard
                key={panel.id}
                panel={panel}
                idx={idx}
                currentPanelIndex={currentPanelIndex}
                activePreviewTab={activePreviewTab}
                setCurrentPanelIndex={setCurrentPanelIndex}
                setActivePreviewTab={setActivePreviewTab}
                setPlaybackTime={setPlaybackTime}
                analyzingPanelId={analyzingPanelId}
                isAnalyzingAll={isAnalyzingAll}
                handleShiftPanel={handleShiftPanel}
                panelsLength={panels.length}
                handleModifySpeechText={handleModifySpeechText}
                handleModifyMotion={handleModifyMotion}
                handleModifyDuration={handleModifyDuration}
                handleModifySFX={handleModifySFX}
                handleModifyVisualDescription={handleModifyVisualDescription}
                handleModifyNarrative={handleModifyNarrative}
                handleAnalyzePanel={handleAnalyzePanel}
                handleCancelAnalysis={handleCancelAnalysis}
                isSelected={selectedPanelIds.has(panel.id)}
                onToggleSelect={() => togglePanelSelection(panel.id)}
                onPanelClick={handlePanelClick}
                onPanelDoubleClick={handlePanelDoubleClick}
                playStoryboardAudio={playStoryboardAudio}
                autoPlayAudio={autoPlayAudio}
                addNotification={addNotification}
                setPanels={setPanels}
                fetchWithInterceptor={fetchWithInterceptor}
                voiceActor={voiceActor}
                speechRate={speechRate}
                speechPitch={speechPitch}
                viewLayout="scroll"
              />
            ))}
          </HorizontalScrollContainer>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-3.5 px-1 w-full">
            {panels.map((panel, idx) => (
              <StoryboardCard
                key={panel.id}
                panel={panel}
                idx={idx}
                currentPanelIndex={currentPanelIndex}
                activePreviewTab={activePreviewTab}
                setCurrentPanelIndex={setCurrentPanelIndex}
                setActivePreviewTab={setActivePreviewTab}
                setPlaybackTime={setPlaybackTime}
                analyzingPanelId={analyzingPanelId}
                isAnalyzingAll={isAnalyzingAll}
                handleShiftPanel={handleShiftPanel}
                panelsLength={panels.length}
                handleModifySpeechText={handleModifySpeechText}
                handleModifyMotion={handleModifyMotion}
                handleModifyDuration={handleModifyDuration}
                handleModifySFX={handleModifySFX}
                handleModifyVisualDescription={handleModifyVisualDescription}
                handleModifyNarrative={handleModifyNarrative}
                handleAnalyzePanel={handleAnalyzePanel}
                handleCancelAnalysis={handleCancelAnalysis}
                isSelected={selectedPanelIds.has(panel.id)}
                onToggleSelect={() => togglePanelSelection(panel.id)}
                onPanelClick={handlePanelClick}
                onPanelDoubleClick={handlePanelDoubleClick}
                playStoryboardAudio={playStoryboardAudio}
                autoPlayAudio={autoPlayAudio}
                addNotification={addNotification}
                setPanels={setPanels}
                fetchWithInterceptor={fetchWithInterceptor}
                voiceActor={voiceActor}
                speechRate={speechRate}
                speechPitch={speechPitch}
                viewLayout="grid"
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const sortedGroups = getSortedEpisodeGroups(episodeGroups);
  const visibleGroups =
    selectedTimelineEp === "all"
      ? sortedGroups.map(({ grp, originalIdx }) => ({ grp, gIdx: originalIdx }))
      : episodeGroups[selectedTimelineEp]
      ? [
          {
            grp: episodeGroups[selectedTimelineEp],
            gIdx: selectedTimelineEp as number,
          },
        ]
      : sortedGroups.map(({ grp, originalIdx }) => ({
          grp,
          gIdx: originalIdx,
        }));

  return (
    <div className="flex-1 w-full min-w-0 space-y-6">
      {visibleGroups.map(({ grp, gIdx }) => {
        const grpPanels = panels.filter((panel, globalIdx) => {
          if (panel.episode_label) {
            return panel.episode_label === grp.episodeLabel;
          }
          return (
            globalIdx >= grp.startIndex &&
            globalIdx < grp.startIndex + grp.count
          );
        });

        return (
          <div
            key={`timeline-ep-${gIdx}`}
            className="bg-neutral-955 border border-neutral-850 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-neutral-850/80 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 rounded-xl bg-purple-950/90 border border-purple-800/60 text-purple-200 font-mono text-xs font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  {formatDisplayEpisodeLabel(grp.episodeLabel)}
                </div>
                <span className="text-[10px] font-mono font-bold bg-neutral-900 text-neutral-400 px-2.5 py-1 rounded-lg border border-neutral-800">
                  {grpPanels.length} PANELS
                </span>
              </div>
              {isAnalyzingAll && (
                <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-500 text-[10px] font-bold font-mono tracking-wide animate-pulse">
                  ANALYZING ALL...
                </div>
              )}
            </div>

            {storyboardViewLayout === "scroll" ? (
              <HorizontalScrollContainer className="py-2">
                {grpPanels.map((panel, localIdx) => {
                  const globalIdx = grp.startIndex + localIdx;
                  return (
                    <StoryboardCard
                      key={panel.id}
                      panel={panel}
                      idx={globalIdx}
                      currentPanelIndex={currentPanelIndex}
                      activePreviewTab={activePreviewTab}
                      setCurrentPanelIndex={setCurrentPanelIndex}
                      setActivePreviewTab={setActivePreviewTab}
                      setPlaybackTime={setPlaybackTime}
                      analyzingPanelId={analyzingPanelId}
                      isAnalyzingAll={isAnalyzingAll}
                      handleShiftPanel={handleShiftPanel}
                      panelsLength={panels.length}
                      handleModifySpeechText={handleModifySpeechText}
                      handleModifyMotion={handleModifyMotion}
                      handleModifyDuration={handleModifyDuration}
                      handleModifySFX={handleModifySFX}
                      handleModifyVisualDescription={
                        handleModifyVisualDescription
                      }
                      handleModifyNarrative={handleModifyNarrative}
                      handleAnalyzePanel={handleAnalyzePanel}
                      handleCancelAnalysis={handleCancelAnalysis}
                      isSelected={selectedPanelIds.has(panel.id)}
                      onToggleSelect={() => togglePanelSelection(panel.id)}
                      onPanelClick={handlePanelClick}
                      onPanelDoubleClick={handlePanelDoubleClick}
                      playStoryboardAudio={playStoryboardAudio}
                      autoPlayAudio={autoPlayAudio}
                      addNotification={addNotification}
                      setPanels={setPanels}
                      fetchWithInterceptor={fetchWithInterceptor}
                      voiceActor={voiceActor}
                      speechRate={speechRate}
                      speechPitch={speechPitch}
                      viewLayout="scroll"
                    />
                  );
                })}
              </HorizontalScrollContainer>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-3.5 px-1 w-full">
                {grpPanels.map((panel, localIdx) => {
                  const globalIdx = grp.startIndex + localIdx;
                  return (
                    <StoryboardCard
                      key={panel.id}
                      panel={panel}
                      idx={globalIdx}
                      currentPanelIndex={currentPanelIndex}
                      activePreviewTab={activePreviewTab}
                      setCurrentPanelIndex={setCurrentPanelIndex}
                      setActivePreviewTab={setActivePreviewTab}
                      setPlaybackTime={setPlaybackTime}
                      analyzingPanelId={analyzingPanelId}
                      isAnalyzingAll={isAnalyzingAll}
                      handleShiftPanel={handleShiftPanel}
                      panelsLength={panels.length}
                      handleModifySpeechText={handleModifySpeechText}
                      handleModifyMotion={handleModifyMotion}
                      handleModifyDuration={handleModifyDuration}
                      handleModifySFX={handleModifySFX}
                      handleModifyVisualDescription={
                        handleModifyVisualDescription
                      }
                      handleModifyNarrative={handleModifyNarrative}
                      handleAnalyzePanel={handleAnalyzePanel}
                      handleCancelAnalysis={handleCancelAnalysis}
                      isSelected={selectedPanelIds.has(panel.id)}
                      onToggleSelect={() => togglePanelSelection(panel.id)}
                      onPanelClick={handlePanelClick}
                      onPanelDoubleClick={handlePanelDoubleClick}
                      playStoryboardAudio={playStoryboardAudio}
                      autoPlayAudio={autoPlayAudio}
                      addNotification={addNotification}
                      setPanels={setPanels}
                      fetchWithInterceptor={fetchWithInterceptor}
                      voiceActor={voiceActor}
                      speechRate={speechRate}
                      speechPitch={speechPitch}
                      viewLayout="grid"
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const StoryboardEpisodeGroup = StoryboardChapterGroup;
export default StoryboardChapterGroup;
