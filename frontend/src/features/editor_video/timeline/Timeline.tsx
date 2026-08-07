// ─── Timeline (Orchestrator) ──────────────────────────────────────────────────
// Canonical location: timeline/Timeline.tsx
// Migrated from components/VideoMultiTrackTimeline.tsx
//
// All state lives in useTimelineState, and visual sections are modularized.

import React, { useRef } from "react";
import { TimelineProps } from "./types";
import { useTimelineState } from "./useTimelineState";
import { useAIPacing } from "./hooks/useAIPacing";
import TimelineToolbar    from "./components/TimelineToolbar";
import TimelineRuler      from "./components/TimelineRuler";
import TimelinePlayhead   from "./components/TimelinePlayhead";
import TimelineBottomBar  from "./components/TimelineBottomBar";
import AddTrackRow        from "./components/AddTrackRow";
import ContextMenuPopup   from "./components/ContextMenuPopup";
import MediaPickerModal   from "./components/MediaPickerModal";
import KeyframePanel      from "./components/keyframes/KeyframePanel";
import VideoTrackV1       from "./components/tracks/VideoTrackV1";
import VideoTrackV2       from "./components/tracks/VideoTrackV2";
import VideoTrackV3       from "./components/tracks/VideoTrackV3";
import AudioTrackA1       from "./components/tracks/AudioTrackA1";
import AudioTrackA2       from "./components/tracks/AudioTrackA2";
import AudioTrackA3       from "./components/tracks/AudioTrackA3";
import { DEFAULT_PANEL_DURATION } from "./types";

export type { TimelineProps };

/** Multi-track NLE timeline subsystem. */
const Timeline: React.FC<TimelineProps> = ({
  panels = [],
  currentPanelIndex = 0,
  setCurrentPanelIndex,
  musicTheme = "Orchestral Battle Theme",
  voiceActor = "Standard Comic Narrator",
}) => {
  const s = useTimelineState(setCurrentPanelIndex);
  const pacing = useAIPacing(panels, s.clipDurations);

  // Always show at least 1 panel slot — empty array = 1 placeholder panel
  const displayPanels = panels.length > 0 ? panels : [{}];

  const totalPanels    = displayPanels.length;
  const totalDuration  = totalPanels * DEFAULT_PANEL_DURATION;
  const playheadPct    = Math.min(Math.max(((currentPanelIndex + 0.5) / totalPanels) * 100, 2), 98);

  // Selected keyframe for inspector
  const activeClipKeyframes = s.selectedClip ? s.keyframesState.getKeyframesForClip(s.selectedClip) : [];
  const selectedKeyframe = activeClipKeyframes.find((k) => k.id === s.keyframesState.selectedKeyframeId) ?? null;

  // ── Shared clip-interaction callbacks ───────────────────────────────────────
  const clipCbs = {
    onClipClick:   s.handleClipClick,
    onContextMenu: s.openContextMenu,
  };

  // ── Shared track-control factory ─────────────────────────────────────────────
  const trackControls = (id: string) => ({
    locked:       !!s.lockedTracks[id],
    hidden:       !!s.hiddenTracks[id],
    muted:        !!s.mutedTracks[id],
    onToggleLock: () => s.toggleLock(id),
    onToggleHide: () => s.toggleHide(id),
    onToggleMute: () => s.toggleMute(id),
  });

  const rulerRef = useRef<HTMLDivElement | null>(null);

  // ── Playhead Scrubbing & Dragging ─────────────────────────────────────────────
  const handlePlayheadScrubStart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!rulerRef.current) return;

    const calculateAndSeek = (clientX: number) => {
      if (!rulerRef.current) return;
      const rail = rulerRef.current.querySelector<HTMLDivElement>(".timeline-ruler-track");
      if (!rail) return;

      const rect = rail.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const pct = Math.max(0, Math.min(1, relativeX / Math.max(1, rect.width)));
      const rawIndex = pct * totalPanels;
      const targetPanelIdx = Math.min(
        totalPanels - 1,
        Math.max(0, Math.round(rawIndex - 0.5))
      );
      setCurrentPanelIndex?.(targetPanelIdx);
    };

    calculateAndSeek(e.clientX);

    const onMouseMove = (moveEvent: MouseEvent) => {
      calculateAndSeek(moveEvent.clientX);
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div className="w-full bg-[#111116] border-t border-white/[0.06] flex flex-col shrink-0 select-none h-[280px] z-20 font-sans relative">

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <TimelineToolbar
        currentPanelIndex={currentPanelIndex}
        totalPanels={totalPanels}
        snapEnabled={s.snapEnabled}
        captionsVisible={s.captionsVisible}
        keyframesVisible={s.keyframesState.keyframeRowsVisible}
        selectedDuration={s.selectedDuration}
        selectedClip={s.selectedClip}
        onToggleSnap={() => s.setSnapEnabled((v) => !v)}
        onToggleCaptions={() => s.setCaptionsVisible((v) => !v)}
        onToggleKeyframes={s.keyframesState.toggleKeyframeRows}
        onSplit={s.handleSplit}
        onDelete={() => {}}
        onDuplicate={() => {
          if (s.selectedClip) {
            const d = s.getClipDuration(s.selectedClip);
            s.updateClipDuration(`${s.selectedClip}-dup`, d);
          }
        }}
      />


      {/* ── Track Workspace ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative" ref={s.trackAreaRef}>

        <TimelinePlayhead playheadPercent={playheadPct} onScrubStart={handlePlayheadScrubStart} />
        <TimelineRuler    totalDuration={totalDuration} onScrubStart={handlePlayheadScrubStart} ref={rulerRef} />

        {/* ── Track Scroll Area: vertical + horizontal scrollbars ─────── */}
        <div
          className="timeline-scroll-area flex-1 overflow-auto min-h-0"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#6d28d9 #0d0d14",
          }}
        >
          {/* Inner wrapper — wide enough to scroll horizontally */}
          <div className="min-w-[max(100%,800px)] min-h-full relative">

            {/* V3 — Overlay / Captions (conditional) */}
            {!s.hiddenTracks["V3"] && s.captionsVisible && (
              <VideoTrackV3
                panels={displayPanels}
                totalPanels={totalPanels}
                selectedClip={s.selectedClip}
                {...trackControls("V3")}
                {...clipCbs}
              />
            )}

            {/* V2 — Effects */}
            {!s.hiddenTracks["V2"] && (
              <VideoTrackV2
                panels={displayPanels}
                totalPanels={totalPanels}
                selectedClip={s.selectedClip}
                {...trackControls("V2")}
                {...clipCbs}
              />
            )}

            {/* V1 — Main Video */}
            {!s.hiddenTracks["V1"] && (
              <VideoTrackV1
                panels={displayPanels}
                currentPanelIndex={currentPanelIndex}
                selectedClip={s.selectedClip}
                getClipDuration={s.getClipDuration}
                onDurationChange={s.updateClipDuration}
                keyframesVisible={s.keyframesState.keyframeRowsVisible}
                keyframesByClip={s.keyframesState.keyframes}
                selectedKeyframeId={s.keyframesState.selectedKeyframeId}
                onSelectKeyframe={s.keyframesState.selectKeyframe}
                onCycleEasing={s.keyframesState.cycleEasing}
                onAddKeyframe={(clipKey, t) => s.keyframesState.addKeyframe(clipKey, t, "scale", 1.0)}
                {...trackControls("V1")}
                {...clipCbs}
              />
            )}

            {/* A1 — Music */}
            {!s.hiddenTracks["A1"] && (
              <AudioTrackA1
                musicTheme={musicTheme}
                totalDuration={totalDuration}
                selectedClip={s.selectedClip}
                {...trackControls("A1")}
                {...clipCbs}
              />
            )}

            {/* A2 — SFX */}
            {!s.hiddenTracks["A2"] && (
              <AudioTrackA2
                panels={displayPanels}
                totalPanels={totalPanels}
                selectedClip={s.selectedClip}
                {...trackControls("A2")}
                {...clipCbs}
              />
            )}

            {/* A3 — Voiceover */}
            {!s.hiddenTracks["A3"] && (
              <AudioTrackA3
                panels={displayPanels}
                totalPanels={totalPanels}
                voiceActor={voiceActor}
                selectedClip={s.selectedClip}
                {...trackControls("A3")}
                {...clipCbs}
              />
            )}

            <AddTrackRow onOpenMediaPicker={s.openMediaPicker} />
          </div>
        </div>
      </div>

      {/* ── Bottom Bar ───────────────────────────────────────────────────────── */}
      <TimelineBottomBar
        currentPanelIndex={currentPanelIndex}
        totalDuration={totalDuration}
        snapEnabled={s.snapEnabled}
        soloTrack={s.soloTrack}
        pacingScore={`${pacing.pacingScore} (${pacing.avgDuration}s avg)`}
        onOpenMediaPicker={s.openMediaPicker}
      />

      {/* ── Keyframe Inspector Slide-over ───────────────────────────────────── */}
      {selectedKeyframe && s.selectedClip && (
        <KeyframePanel
          keyframe={selectedKeyframe}
          onClose={() => s.keyframesState.selectKeyframe(null)}
          onUpdate={(patch) => s.keyframesState.updateKeyframe(s.selectedClip!, selectedKeyframe.id, patch)}
          onDelete={() => s.keyframesState.removeKeyframe(s.selectedClip!, selectedKeyframe.id)}
        />
      )}

      {/* ── Context Menu (fixed overlay) ────────────────────────────────────── */}
      <ContextMenuPopup
        contextMenu={s.contextMenu}
        contextMenuRef={s.contextMenuRef}
        clipboard={s.clipboard}
        hasDuration={s.hasDuration}
        onCopy={s.handleCopy}
        onPaste={s.handlePaste}
        onDuplicate={s.handleDuplicate}
        onRemoveDuration={s.handleRemoveDuration}
        onApplyDurationToAll={() => s.handleApplyDurationToAll(panels)}
        onSplit={s.handleSplit}
      />

      {/* ── Media Picker Modal ──────────────────────────────────────────────── */}
      <MediaPickerModal
        isOpen={s.isMediaPickerOpen}
        onClose={s.closeMediaPicker}
        onSelectMedia={s.handleSelectMedia}
      />
    </div>
  );
};

export default React.memo(Timeline);
export { Timeline };
