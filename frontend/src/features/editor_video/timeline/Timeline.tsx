// ─── Timeline (Orchestrator) ──────────────────────────────────────────────────
// Canonical location: timeline/Timeline.tsx
// Migrated from components/VideoMultiTrackTimeline.tsx
//
// All state lives in useTimelineState, and visual sections are modularized.

import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { TimelineProps } from "./types";
import { useTimelineState } from "./useTimelineState";
import { useAIPacing } from "./hooks/useAIPacing";
import TimelineToolbar from "./components/TimelineToolbar";
import TimelineRuler from "./components/TimelineRuler";
import TimelinePlayhead from "./components/TimelinePlayhead";
import TimelineBottomBar from "./components/TimelineBottomBar";
import AddTrackRow from "./components/AddTrackRow";
import ContextMenuPopup from "./components/ContextMenuPopup";
import KeyframePanel from "./components/keyframes/KeyframePanel";
import TimelineStoryPanelsTrack from "./components/tracks/TimelineStoryPanelsTrack";
import TimelineCameraFxTrack from "./components/tracks/TimelineCameraFxTrack";
import TimelineSubtitlesTrack from "./components/tracks/TimelineSubtitlesTrack";
import TimelineMusicTrack from "./components/tracks/TimelineMusicTrack";
import TimelineSoundFxTrack from "./components/tracks/TimelineSoundFxTrack";
import TimelineVoiceoverTrack from "./components/tracks/TimelineVoiceoverTrack";
import { useProjectStore } from "@/shared/hooks/useProjectStore";

export type { TimelineProps };

/** Multi-track NLE timeline subsystem. */
const Timeline: React.FC<TimelineProps> = ({
  panels: propsPanels = [],
  currentPanelIndex = 0,
  setCurrentPanelIndex,
  musicTheme = "",
  voiceActor = "",
}) => {
  const projectStore = useProjectStore();
  const activePanels = projectStore?.activeProjectData?.panels ?? [];
  const panels = propsPanels.length > 0 ? propsPanels : activePanels;

  const s = useTimelineState(setCurrentPanelIndex);
  const pacing = useAIPacing(panels, s.clipDurations);

  // Accurate panel timings mapping (based on master frame duration)
  const panelTimings = useMemo(() => {
    let currentTime = 0;
    const durations = panels.map((p, idx) => {
      const explicit = s.clipDurations[`v1-${idx}`];
      if (explicit !== undefined && explicit > 0) return explicit;
      return p.duration || (p as any).duration_sec || p.voice_duration || 3.0;
    });
    const total = durations.reduce((acc, d) => acc + d, 0) || panels.length * 3.0 || 1;

    const pxPerSec = 30;
    return panels.map((panel, index) => {
      const duration = durations[index];
      const startTime = currentTime;
      const endTime = startTime + duration;
      currentTime = endTime;
      const startPct = (startTime / total) * 100;
      const widthPct = (duration / total) * 100;
      const startPx = startTime * pxPerSec;
      const widthPx = duration * pxPerSec;
      return {
        index,
        duration,
        startTime,
        endTime,
        startPct,
        widthPct,
        startPx,
        widthPx,
      };
    });
  }, [panels, s.clipDurations]);

  const totalDuration = useMemo(() => {
    let max =
      panelTimings.reduce((acc, t) => acc + t.duration, 0) ||
      panels.length * 3.0 ||
      1;

    // Check all tracks for clips extending beyond panels (including drag offsets)
    panelTimings.forEach((t, idx) => {
      const p = panels[idx] || {};
      const baseStart = t.startTime;

      // Account for drag offset on V1 (story panels)
      const v1OffsetSecs = (s.clipOffsets[`v1-${idx}`] ?? 0) / 30;
      const v1End = baseStart + v1OffsetSecs + t.duration;

      const v2End =
        baseStart +
        (s.clipDurations[`v2-${idx}`] ??
          p.camera_duration ??
          p.fx_duration ??
          t.duration ??
          3.0);
      const v3End =
        baseStart +
        (s.clipDurations[`v3-${idx}`] ??
          p.subtitle_duration ??
          t.duration ??
          3.0);
      const a2End =
        baseStart +
        (s.clipDurations[`a2-${idx}`] ??
          p.sfx_duration ??
          t.duration ??
          2.0);
      const a3End =
        baseStart +
        (s.clipDurations[`a3-${idx}`] ??
          p.voice_duration ??
          t.duration ??
          3.0);
      max = Math.max(max, v1End, v2End, v3End, a2End, a3End);
    });

    // Check music track duration only if music is present and not deleted
    const hasMusic =
      s.clipDurations["a1-0"] !== 0 &&
      ((!!musicTheme && musicTheme !== "none" && musicTheme !== "No Music" && musicTheme.trim() !== "") ||
      !!(projectStore?.activeProjectData as any)?.bgm_url ||
      !!(projectStore?.activeProjectData as any)?.music_url ||
      !!(projectStore?.activeProjectData as any)?.music_theme);

    if (hasMusic) {
      const musicDur = s.clipDurations["a1-0"];
      if (musicDur && musicDur > max) {
        max = musicDur;
      }
    }

    return Math.max(max + 2, 1); // +2s buffer at the end
  }, [panelTimings, panels, s.clipDurations, s.clipOffsets, musicTheme, projectStore?.activeProjectData]);

  const getPanelIndexAtTime = useCallback(
    (time: number): number => {
      if (panelTimings.length === 0) return 0;
      const clamped = Math.max(0, Math.min(time, totalDuration));
      const found = panelTimings.findIndex(
        (t) => clamped >= t.startTime && clamped < t.endTime
      );
      return found !== -1 ? found : Math.max(0, panelTimings.length - 1);
    },
    [panelTimings, totalDuration]
  );

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [timelineTime, setTimelineTime] = useState(0);
  const currentPanelIndexRef = useRef(currentPanelIndex);
  const animationFrameRef = useRef<number | null>(null);
  const [rulerHoverPct, setRulerHoverPct] = useState<number | null>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [trackBounds, setTrackBounds] = useState<{
    left: number;
    width: number;
  } | null>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  const fitTimelineView = useCallback(() => {
    const scrollArea = timelineScrollRef.current;
    if (!scrollArea) return;

    const trackHeaderWidth = 224;
    const visibleTrackWidth = Math.max(1, scrollArea.clientWidth - trackHeaderWidth);
    const fitDuration = Math.max(60, totalDuration + 30);
    const fitZoom = Math.max(10, Math.min(120, visibleTrackWidth / fitDuration));

    s.setZoomLevel(fitZoom);
    scrollArea.scrollLeft = 0;
  }, [s, totalDuration]);

  // Dedicated wheel listener: clean separation of horizontal timeline scrolling vs vertical track scrolling
  useEffect(() => {
    const el = timelineScrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Allow browser zoom or system modifiers (Ctrl/Cmd) to pass through
      if (e.ctrlKey || e.metaKey) return;

      // Check if mouse is hovering over the left track headers / action columns
      const target = e.target as HTMLElement | null;
      const isOverTrackHeader = Boolean(
        target?.closest('[data-track-header="true"]') ||
        target?.closest('.w-48')
      );

      if (isOverTrackHeader || e.shiftKey) {
        // Vertical track scrolling across rows/lanes
        if (Math.abs(e.deltaY) > 0) {
          el.scrollTop += e.deltaY;
          e.preventDefault();
        }
      } else {
        // Horizontal timeline time scrolling
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
          // Native touchpad horizontal swipe
          el.scrollLeft += e.deltaX;
          setScrollLeft(el.scrollLeft);
          e.preventDefault();
        } else if (Math.abs(e.deltaY) > 0) {
          // Standard mouse wheel up/down -> scroll left/right along timeline
          el.scrollLeft += e.deltaY;
          setScrollLeft(el.scrollLeft);
          e.preventDefault();
        }
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, []);

  const displayPanels = panels;
  const totalPanels = displayPanels.length;
  const playheadPct =
    totalDuration > 0
      ? Math.min(Math.max((timelineTime / totalDuration) * 100, 0), 100)
      : 0;

  // Keep ref synced without overriding user clicks/scrubs
  useEffect(() => {
    if (currentPanelIndex !== currentPanelIndexRef.current) {
      currentPanelIndexRef.current = currentPanelIndex;
      if (!isPlaying && panelTimings[currentPanelIndex]) {
        const curTime = timelineTime;
        const targetPanel = panelTimings[currentPanelIndex];
        // Only jump time if current time is completely outside the selected panel
        if (targetPanel && (curTime < targetPanel.startTime || curTime >= targetPanel.endTime)) {
          setTimelineTime(targetPanel.startTime);
        }
      }
    }
  }, [currentPanelIndex, isPlaying, panelTimings, timelineTime]);

  useEffect(() => {
    if (!isPlaying) return;

    let lastTimestamp = performance.now();

    const step = (timestamp: number) => {
      const delta = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      setTimelineTime((prevTime) => {
        const nextTime = Math.min(prevTime + delta, totalDuration);
        const nextPanelIndex = getPanelIndexAtTime(nextTime);

        if (nextPanelIndex !== currentPanelIndexRef.current) {
          currentPanelIndexRef.current = nextPanelIndex;
          setCurrentPanelIndex?.(nextPanelIndex);
        }

        if (nextTime >= totalDuration) {
          setIsPlaying(false);
          return totalDuration;
        }

        return nextTime;
      });

      if (animationFrameRef.current !== null) {
        animationFrameRef.current = requestAnimationFrame(step);
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, totalDuration, getPanelIndexAtTime, setCurrentPanelIndex]);

  const togglePlayback = () => setIsPlaying((prev) => !prev);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        togglePlayback();
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        setTimelineTime(0);
        setCurrentPanelIndex?.(0);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        setTimelineTime(totalDuration);
        const lastIdx = Math.max(0, panelTimings.length - 1);
        setCurrentPanelIndex?.(lastIdx);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        const step = event.shiftKey ? 2.0 : 0.5;
        setTimelineTime((prev) => {
          const next = Math.max(0, prev - step);
          const nextIdx = getPanelIndexAtTime(next);
          setCurrentPanelIndex?.(nextIdx);
          return next;
        });
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        const step = event.shiftKey ? 2.0 : 0.5;
        const maxSeekDuration = Math.max(60, totalDuration + 30);
        setTimelineTime((prev) => {
          const next = Math.min(maxSeekDuration, prev + step);
          const nextIdx = getPanelIndexAtTime(next);
          setCurrentPanelIndex?.(nextIdx);
          return next;
        });
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [totalDuration, getPanelIndexAtTime, setCurrentPanelIndex, panelTimings.length]);

  const seekToPosition = (clientX: number) => {
    if (!rulerRef.current && !s.trackAreaRef.current) return;
    const rail = rulerRef.current?.querySelector<HTMLDivElement>(
      ".timeline-ruler-track"
    );
    if (!rail) return;

    const rect = rail.getBoundingClientRect();
    const relativeX = Math.max(0, clientX - rect.left);
    const maxSeekDuration = Math.max(60, totalDuration + 30);
    const pxPerSec = s.zoomLevel || 30;
    const nextTime = Math.max(0, Math.min(maxSeekDuration, relativeX / pxPerSec));
    const nextPanelIndex = getPanelIndexAtTime(nextTime);

    currentPanelIndexRef.current = nextPanelIndex;
    setCurrentPanelIndex?.(nextPanelIndex);
    setTimelineTime(nextTime);
  };

  const getTrackBounds = () => {
    if (!rulerRef.current || !s.trackAreaRef.current) return null;
    const track = rulerRef.current.querySelector<HTMLDivElement>(
      ".timeline-ruler-track"
    );
    if (!track) return null;

    const containerRect = s.trackAreaRef.current.getBoundingClientRect();
    const trackRect = track.getBoundingClientRect();
    return {
      left: trackRect.left - containerRect.left,
      width: trackRect.width,
    };
  };

  const updateTrackBounds = () => {
    const bounds = getTrackBounds();
    setTrackBounds(bounds);
    return bounds;
  };

  useEffect(() => {
    updateTrackBounds();
    window.addEventListener("resize", updateTrackBounds);

    let observer: ResizeObserver | null = null;
    if (s.trackAreaRef.current) {
      observer = new ResizeObserver(() => {
        updateTrackBounds();
      });
      observer.observe(s.trackAreaRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateTrackBounds);
      observer?.disconnect();
    };
  }, []);

  const handlePlayheadScrubStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPlaying(false);
    updateTrackBounds();
    seekToPosition(e.clientX);

    const onMouseMove = (moveEvent: MouseEvent) => {
      seekToPosition(moveEvent.clientX);
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handlePlayClick = () => {
    const maxSeekDuration = Math.max(60, totalDuration + 30);
    if (timelineTime >= maxSeekDuration) {
      setTimelineTime(0);
      currentPanelIndexRef.current = 0;
      setCurrentPanelIndex?.(0);
    }
    togglePlayback();
  };

  // Selected keyframe for inspector
  const activeClipKeyframes = s.selectedClip
    ? s.keyframesState.getKeyframesForClip(s.selectedClip)
    : [];
  const selectedKeyframe =
    activeClipKeyframes.find(
      (k) => k.id === s.keyframesState.selectedKeyframeId
    ) ?? null;

  // ── Shared clip-interaction callbacks ───────────────────────────────────────
  const handleDurationChange = useCallback(
    (key: string, newDuration: number) => {
      s.updateClipDuration(key, newDuration);
      const match = key.match(/^([a-z0-9]+)-(\d+)$/i);
      if (match) {
        const trackPrefix = match[1].toLowerCase();
        const idx = parseInt(match[2], 10);
        if (projectStore?.setPanels && projectStore.activeProjectData?.panels) {
          const updated = projectStore.activeProjectData.panels.map(
            (p: any, i: number) => {
              if (i !== idx) return p;
              if (trackPrefix === "v1") {
                return { ...p, duration: newDuration };
              } else if (trackPrefix === "v2") {
                return { ...p, camera_duration: newDuration, fx_duration: newDuration };
              } else if (trackPrefix === "v3") {
                return { ...p, subtitle_duration: newDuration };
              } else if (trackPrefix === "a2") {
                return { ...p, sfx_duration: newDuration };
              } else if (trackPrefix === "a3") {
                return { ...p, voice_duration: newDuration };
              }
              return p;
            }
          );
          projectStore.setPanels(updated);
        }
      }
    },
    [s, projectStore]
  );

  const clipCbs = {
    onClipClick: (key: string, idx: number) => {
      s.handleClipClick(key, idx);
    },
    onContextMenu: s.openContextMenu,
    onDurationChange: handleDurationChange,
    onOffsetChange: (key: string, offsetPx: number) => {
      s.updateClipOffset(key, offsetPx);
    },
  };

  // ── Shared track-control factory ─────────────────────────────────────────────
  const trackControls = (id: string) => ({
    locked: !!s.lockedTracks[id],
    hidden: !!s.hiddenTracks[id],
    muted: !!s.mutedTracks[id],
    onToggleLock: () => s.toggleLock(id),
    onToggleHide: () => s.toggleHide(id),
    onToggleMute: () => s.toggleMute(id),
  });

  const rulerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="w-full h-full bg-[#121212] backdrop-blur-2xl border-t border-[#2F2F2F] flex flex-col shrink-0 select-none z-20 font-sans relative shadow-[0_-8px_32px_rgba(0,0,0,0.5)]">
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <TimelineToolbar
        currentPanelIndex={currentPanelIndex}
        totalPanels={totalPanels}
        snapEnabled={s.snapEnabled}
        captionsVisible={s.captionsVisible}
        keyframesVisible={s.keyframesState.keyframeRowsVisible}
        isPlaying={isPlaying}
        playbackTime={timelineTime}
        totalDuration={totalDuration}
        zoomLevel={s.zoomLevel}
        onToggleSnap={s.toggleSnap}
        onToggleCaptions={() => s.setCaptionsVisible((v) => !v)}
        onToggleKeyframes={s.keyframesState.toggleKeyframeRows}
        onSplit={s.handleSplit}
        onDelete={s.handleRemoveDuration}
        onPlay={handlePlayClick}
        onDuplicate={s.handleDuplicate}
        onUndo={projectStore.undo}
        onRedo={projectStore.redo}
        canUndo={projectStore.canUndo}
        canRedo={projectStore.canRedo}
        onFitView={fitTimelineView}
        onZoomIn={s.handleZoomIn}
        onZoomOut={s.handleZoomOut}
        onZoomReset={s.handleZoomReset}
      />

      {/* ── Track Workspace ──────────────────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col overflow-hidden min-h-0 relative"
        ref={s.trackAreaRef}
      >
        {/* ── Track Scroll Area: vertical + horizontal scrollbars ─────── */}
        <div
          ref={timelineScrollRef}
          onWheel={(e) => {
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              if (e.deltaY < 0) {
                s.handleZoomIn();
              } else {
                s.handleZoomOut();
              }
              return;
            }
            if (!timelineScrollRef.current) return;
            if (e.shiftKey) {
              timelineScrollRef.current.scrollLeft += e.deltaY || e.deltaX;
            } else if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
              timelineScrollRef.current.scrollLeft += e.deltaX;
            } else {
              timelineScrollRef.current.scrollTop += e.deltaY;
            }
          }}
          onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
          className="timeline-scroll-area flex-1 overflow-auto min-h-0 relative"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#3B82F6 #18181B",
          }}
        >
          {/* Inner wrapper with flush right edge, generous end-buffer and synchronized tracks */}
          <div
            className="min-h-full relative"
            onMouseDown={(e) => {
              const target = e.target as HTMLElement | null;
              if (
                target &&
                !target.closest("button") &&
                !target.closest(".group") &&
                !target.closest(".pointer-events-auto")
              ) {
                handlePlayheadScrubStart(e);
              }
            }}
            style={{
              minWidth: `${Math.max(1800, Math.max(60, totalDuration + 30) * s.zoomLevel + 224 + 60)}px`,
            }}
          >
            {/* Sticky Synchronized Top Ruler */}
            <div className="sticky top-0 z-40 bg-[#121212]">
              <TimelineRuler
                totalDuration={totalDuration}
                zoomLevel={s.zoomLevel}
                onScrubStart={handlePlayheadScrubStart}
                onHoverPctChange={(pct) => {
                  setRulerHoverPct(pct);
                }}
                ref={rulerRef}
              />
            </div>

            {/* Synchronized Playhead Scrubber */}
            <TimelinePlayhead
              currentTime={timelineTime}
              playheadPercent={playheadPct}
              zoomLevel={s.zoomLevel}
              scrollLeft={scrollLeft}
              onScrubStart={handlePlayheadScrubStart}
            />

            {/* ── Video Tracks ──────────────────────────────────────────────── */}
            {/* V1 — Story Panels (Main Video Track) */}
            {!s.hiddenTracks["V1"] && (
              <TimelineStoryPanelsTrack
                panels={displayPanels}
                panelTimings={panelTimings}
                currentPanelIndex={currentPanelIndex}
                selectedClip={s.selectedClip}
                totalDuration={totalDuration}
                zoomLevel={s.zoomLevel}
                getClipDuration={s.getClipDuration}
                onDurationChange={handleDurationChange}
                keyframesVisible={s.keyframesState.keyframeRowsVisible}
                keyframesByClip={s.keyframesState.keyframes}
                selectedKeyframeId={s.keyframesState.selectedKeyframeId}
                onSelectKeyframe={s.keyframesState.selectKeyframe}
                onCycleEasing={s.keyframesState.cycleEasing}
                onAddKeyframe={(clipKey, t) =>
                  s.keyframesState.addKeyframe(clipKey, t, "scale", 1.0)
                }
                {...trackControls("V1")}
                {...clipCbs}
                onAddPanel={s.openPanelsPicker}
              />
            )}

            {/* V2 — Camera FX (Motion / Zoom Track) */}
            {!s.hiddenTracks["V2"] && (
              <TimelineCameraFxTrack
                panels={displayPanels}
                panelTimings={panelTimings}
                totalPanels={totalPanels}
                selectedClip={s.selectedClip}
                totalDuration={totalDuration}
                zoomLevel={s.zoomLevel}
                {...trackControls("V2")}
                {...clipCbs}
                onAddFx={s.openFxPicker}
              />
            )}

            {/* V3 — Subtitles / Overlay Track */}
            {!s.hiddenTracks["V3"] && s.captionsVisible && (
              <TimelineSubtitlesTrack
                panels={displayPanels}
                panelTimings={panelTimings}
                totalPanels={totalPanels}
                selectedClip={s.selectedClip}
                totalDuration={totalDuration}
                zoomLevel={s.zoomLevel}
                {...trackControls("V3")}
                {...clipCbs}
                onAddSubtitle={s.openSubtitlesPicker}
              />
            )}

            {/* ── Audio Tracks ──────────────────────────────────────────────── */}
            {/* A1 — Voiceover & Narration Track */}
            {!s.hiddenTracks["A1"] && (
              <TimelineVoiceoverTrack
                panels={displayPanels}
                panelTimings={panelTimings}
                totalPanels={totalPanels}
                voiceActor={voiceActor}
                selectedClip={s.selectedClip}
                totalDuration={totalDuration}
                zoomLevel={s.zoomLevel}
                {...trackControls("A1")}
                {...clipCbs}
                onAddVoice={s.openVoicePicker}
              />
            )}

            {/* A2 — Sound FX / Ambient Track */}
            {!s.hiddenTracks["A2"] && (
              <TimelineSoundFxTrack
                panels={displayPanels}
                panelTimings={panelTimings}
                totalPanels={totalPanels}
                selectedClip={s.selectedClip}
                totalDuration={totalDuration}
                zoomLevel={s.zoomLevel}
                {...trackControls("A2")}
                {...clipCbs}
                onAddSfx={s.openSfxPicker}
              />
            )}

            {/* A3 — Background Music (BGM) Track */}
            {!s.hiddenTracks["A3"] && (
              <TimelineMusicTrack
                musicTheme={
                  (projectStore?.activeProjectData as any)?.bgm_theme ||
                  (projectStore?.activeProjectData as any)?.bgm_name ||
                  (projectStore?.activeProjectData as any)?.music_name ||
                  ""
                }
                musicUrl={
                  (projectStore?.activeProjectData as any)?.bgm_url ||
                  (projectStore?.activeProjectData as any)?.music_url ||
                  (musicTheme?.startsWith("http") || musicTheme?.startsWith("/") || musicTheme?.startsWith("blob:")
                    ? musicTheme
                    : undefined)
                }
                duration={s.clipDurations["a3-0"]}
                totalDuration={totalDuration}
                zoomLevel={s.zoomLevel}
                selectedClip={s.selectedClip}
                {...trackControls("A3")}
                {...clipCbs}
                onAddMusic={s.openMusicPicker}
              />
            )}

            <AddTrackRow onOpenMediaPicker={s.openMediaPicker} />
          </div>
        </div>
      </div>

      {/* ── Bottom Bar ───────────────────────────────────────────────────────── */}
      <TimelineBottomBar
        currentPanelIndex={currentPanelIndex}
        currentTimeSecs={panelTimings[currentPanelIndex]?.startTime ?? 0}
        totalDuration={totalDuration}
        snapEnabled={s.snapEnabled}
        soloTrack={s.soloTrack}
        pacingScore={`${pacing.pacingScore} (${pacing.avgDuration}s avg)`}
        onOpenMediaPicker={s.openMediaPicker}
        scrollRef={timelineScrollRef}
        zoomLevel={s.zoomLevel}
        onZoomIn={s.handleZoomIn}
        onZoomOut={s.handleZoomOut}
        onZoomReset={s.handleZoomReset}
      />

      {/* ── Keyframe Inspector Slide-over ───────────────────────────────────── */}
      {selectedKeyframe && s.selectedClip && (
        <KeyframePanel
          keyframe={selectedKeyframe}
          onClose={() => s.keyframesState.selectKeyframe(null)}
          onUpdate={(patch) =>
            s.keyframesState.updateKeyframe(
              s.selectedClip!,
              selectedKeyframe.id,
              patch
            )
          }
          onDelete={() =>
            s.keyframesState.removeKeyframe(
              s.selectedClip!,
              selectedKeyframe.id
            )
          }
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
        onClose={s.closeContextMenu}
      />

    </div>
  );
};

export default React.memo(Timeline);
export { Timeline };
