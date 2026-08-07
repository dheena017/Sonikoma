import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Undo, Redo, Scissors, Trash2, Copy, Lock, Eye, EyeOff,
  Volume2, VolumeX, Plus, Minus, Diamond, Magnet, LayoutGrid,
  ChevronRight, Music, ClipboardPaste, SplitSquareHorizontal,
  CopyPlus, TimerOff, Timer, Play,
} from "lucide-react";

export interface TimelineProps {
  panels?: any[];
  currentPanelIndex?: number;
  setCurrentPanelIndex?: (idx: number) => void;
  musicTheme?: string;
  voiceActor?: string;
}

interface ContextMenuState {
  x: number; y: number; clipKey: string; panelIdx: number; clipDuration: number;
}

const WAVEFORM = [40, 70, 30, 90, 55, 100, 62, 80, 42, 88, 34, 65, 78, 44, 92, 50, 72, 36, 95, 60, 45, 85, 52, 100, 40, 74, 32, 90, 56, 70];
const DEFAULT_PANEL_DURATION = 2.1;

/**
 * Timeline — Multi-track NLE timeline subsystem.
 * Canonical location: timeline/Timeline.tsx
 * Migrated from components/VideoMultiTrackTimeline.tsx
 */
const Timeline: React.FC<TimelineProps> = ({
  panels = [],
  currentPanelIndex = 0,
  setCurrentPanelIndex,
  musicTheme = "Orchestral Battle Theme",
  voiceActor = "Standard Comic Narrator",
}) => {
  const [zoomLevel, setZoomLevel] = useState(31);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [mutedTracks, setMutedTracks] = useState<Record<string, boolean>>({});
  const [soloTrack, setSoloTrack] = useState<string | null>(null);
  const [lockedTracks, setLockedTracks] = useState<Record<string, boolean>>({});
  const [hiddenTracks, setHiddenTracks] = useState<Record<string, boolean>>({});
  const [captionsVisible, setCaptionsVisible] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [clipboard, setClipboard] = useState<string | null>(null);
  const [clipDurations, setClipDurations] = useState<Record<string, number>>({});

  const trackAreaRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const totalPanels = Math.max(panels.length, 1);
  const totalDuration = totalPanels * DEFAULT_PANEL_DURATION;
  const playheadPercent = Math.min(Math.max(((currentPanelIndex + 0.5) / totalPanels) * 100, 2), 98);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getClipDuration = (key: string) => clipDurations[key] ?? DEFAULT_PANEL_DURATION;
  const selectedDuration = selectedClip ? getClipDuration(selectedClip) : null;

  const toggleMute  = (id: string) => setMutedTracks((p) => ({ ...p, [id]: !p[id] }));
  const toggleLock  = (id: string) => setLockedTracks((p) => ({ ...p, [id]: !p[id] }));
  const toggleHide  = (id: string) => setHiddenTracks((p) => ({ ...p, [id]: !p[id] }));
  const toggleSolo  = (id: string) => setSoloTrack((p) => (p === id ? null : id));

  const handleClipClick = (key: string, panelIdx: number) => {
    setSelectedClip(key);
    setCurrentPanelIndex?.(panelIdx);
    setContextMenu(null);
  };

  const openContextMenu = (e: React.MouseEvent, clipKey: string, panelIdx: number) => {
    e.preventDefault(); e.stopPropagation();
    setSelectedClip(clipKey);
    setCurrentPanelIndex?.(panelIdx);
    setContextMenu({ x: e.clientX, y: e.clientY, clipKey, panelIdx, clipDuration: getClipDuration(clipKey) });
  };
  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  useEffect(() => {
    if (!contextMenu) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeContextMenu(); };
    const onClick = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) closeContextMenu();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("mousedown", onClick); };
  }, [contextMenu, closeContextMenu]);

  const handleCopy               = () => { if (contextMenu) setClipboard(contextMenu.clipKey); closeContextMenu(); };
  const handlePaste              = () => closeContextMenu();
  const handleDuplicate          = () => { if (contextMenu) { const d = getClipDuration(contextMenu.clipKey); setClipDurations((p) => ({ ...p, [`${contextMenu.clipKey}-dup`]: d })); } closeContextMenu(); };
  const handleRemoveDuration     = () => { if (contextMenu) setClipDurations((p) => ({ ...p, [contextMenu.clipKey]: 0 })); closeContextMenu(); };
  const handleApplyDurationToAll = () => { if (contextMenu) { const d = getClipDuration(contextMenu.clipKey); const track = contextMenu.clipKey.replace(/-\d+$/, ""); const u: Record<string, number> = {}; for (let i = 0; i < panels.length; i++) u[`${track}-${i}`] = d; setClipDurations((p) => ({ ...p, ...u })); } closeContextMenu(); };
  const handleSplit              = () => closeContextMenu();

  const hasSelection = !!selectedClip;
  const hasDuration  = hasSelection && getClipDuration(selectedClip!) > 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedClip) return;
      if (e.key === "s" || e.key === "S") handleSplit();
      if (e.key === "Delete" || e.key === "Backspace") handleRemoveDuration();
      if ((e.ctrlKey || e.metaKey) && e.key === "c") setClipboard(selectedClip);
      if ((e.ctrlKey || e.metaKey) && e.key === "d") { e.preventDefault(); handleDuplicate(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedClip, clipDurations]);

  const getRulerTicks = () => {
    const interval = totalDuration <= 15 ? 1 : totalDuration <= 60 ? 5 : 10;
    const ticks: number[] = [];
    for (let t = 0; t <= totalDuration + interval; t += interval) ticks.push(t);
    return { ticks, interval };
  };
  const { ticks, interval } = getRulerTicks();

  const clipClass = (key: string, base: string) =>
    `absolute flex items-center cursor-pointer truncate transition-all rounded-lg border text-[10px] font-semibold px-2 ${base} ${
      selectedClip === key ? "ring-2 ring-white/50 brightness-115 z-10" : "hover:brightness-110"
    }`;

  const TrackLabel = ({ id, label, color, type }: { id: string; label: string; color: string; type: "video" | "audio" }) => (
    <div className="w-28 shrink-0 h-full flex items-center gap-1.5 px-3 border-r border-white/5 group relative">
      <span className={`text-[10px] font-bold ${color} shrink-0`}>{id}</span>
      <span className="text-neutral-500 text-[10px] truncate">{label}</span>
      <div className="absolute right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => toggleLock(id)} className={`p-0.5 rounded cursor-pointer ${lockedTracks[id] ? "text-amber-400" : "text-neutral-700 hover:text-white"}`}><Lock className="h-2.5 w-2.5" /></button>
        <button onClick={() => toggleHide(id)} className="p-0.5 rounded cursor-pointer text-neutral-700 hover:text-white">{hiddenTracks[id] ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}</button>
        {type === "audio" && <button onClick={() => toggleMute(id)} className={`p-0.5 rounded cursor-pointer ${mutedTracks[id] ? "text-red-400" : "text-neutral-700 hover:text-white"}`}>{mutedTracks[id] ? <VolumeX className="h-2.5 w-2.5" /> : <Volume2 className="h-2.5 w-2.5" />}</button>}
      </div>
    </div>
  );

  const ContextMenuPopup = () => {
    if (!contextMenu) return null;
    const menuW = 224, menuH = 260;
    const x = Math.min(contextMenu.x, window.innerWidth  - menuW - 8);
    const y = Math.min(contextMenu.y, window.innerHeight - menuH - 8);
    const items = [
      { icon: Copy,                  label: "Copy",                  shortcut: "Ctrl + C", action: handleCopy,               disabled: false },
      { icon: ClipboardPaste,        label: "Paste",                 shortcut: "Ctrl + V", action: handlePaste,              disabled: !clipboard },
      { icon: CopyPlus,              label: "Duplicate",             shortcut: "Ctrl + D", action: handleDuplicate,          disabled: false },
      { divider: true },
      { icon: TimerOff,              label: "Remove duration",       shortcut: "Delete",   action: handleRemoveDuration,     disabled: !hasDuration },
      { icon: Timer,                 label: "Apply duration to all", shortcut: "",         action: handleApplyDurationToAll, disabled: !hasDuration },
      { divider: true },
      { icon: SplitSquareHorizontal, label: "Split",                 shortcut: "S",        action: handleSplit,              disabled: false },
    ];
    return (
      <div ref={contextMenuRef} className="fixed z-[9999] bg-white/96 backdrop-blur-xl rounded-xl shadow-2xl border border-neutral-200/80 py-1.5 overflow-hidden" style={{ left: x, top: y, width: menuW }}>
        {items.map((item, i) => {
          if ("divider" in item) return <div key={i} className="h-px bg-neutral-200/70 mx-2 my-1" />;
          const { icon: Icon, label, shortcut, action, disabled } = item as any;
          return (
            <button key={label} onClick={disabled ? undefined : action}
              className={`w-full flex items-center justify-between px-3 py-[7px] text-sm transition-colors ${disabled ? "text-neutral-400 cursor-not-allowed" : "text-neutral-800 hover:bg-neutral-100 cursor-pointer"}`}
            >
              <div className="flex items-center gap-2.5"><Icon className="h-3.5 w-3.5 shrink-0" /><span className="font-medium">{label}</span></div>
              {shortcut && <span className="text-[11px] text-neutral-400 font-mono">{shortcut}</span>}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full bg-[#111116] border-t border-white/[0.06] flex flex-col shrink-0 select-none h-[220px] z-20 font-sans">

      {/* Toolbar */}
      <div className="h-10 px-3 border-b border-white/[0.05] flex items-center justify-between bg-[#0d0d12] shrink-0">
        <div className="flex items-center gap-0.5">
          {([{ icon: Undo, title: "Undo" }, { icon: Redo, title: "Redo" }] as { icon: React.ElementType; title: string }[]).map(({ icon: Icon, title }) => (
            <button key={title} title={title} className="p-1.5 text-neutral-500 hover:text-white rounded hover:bg-white/5 transition-colors cursor-pointer">
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
          <div className="h-4 w-px bg-white/10 mx-1.5" />
          <button onClick={() => setCaptionsVisible((v) => !v)} title="Captions (CC)"
            className={`px-1.5 py-1 rounded transition-colors cursor-pointer border text-[10px] font-black tracking-tight ${captionsVisible ? "text-white bg-purple-500/20 border-purple-500/50" : "text-neutral-500 border-white/10 hover:text-white"}`}
          >CC</button>
          <button title="Split (S)" onClick={handleSplit} className="p-1.5 ml-0.5 text-purple-400 hover:bg-purple-500/20 rounded transition-colors cursor-pointer border border-purple-500/20 hover:border-purple-400">
            <SplitSquareHorizontal className="h-3.5 w-3.5" />
          </button>
          <button title="Delete" className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
          <button title="Duplicate" onClick={() => { if (selectedClip) { const d = getClipDuration(selectedClip); setClipDurations((p) => ({ ...p, [`${selectedClip}-dup`]: d })); }}} className="p-1.5 text-neutral-500 hover:text-white hover:bg-white/5 rounded transition-colors cursor-pointer"><CopyPlus className="h-3.5 w-3.5" /></button>
          <button title="Add Keyframe" className="p-1.5 text-neutral-500 hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors cursor-pointer"><Diamond className="h-3.5 w-3.5" /></button>
          <div className="h-4 w-px bg-white/10 mx-1.5" />
          <button onClick={() => setSnapEnabled((p) => !p)} title="Snap"
            className={`p-1.5 rounded transition-colors cursor-pointer border ${snapEnabled ? "text-purple-300 bg-purple-500/15 border-purple-500/40" : "text-neutral-600 border-white/10 hover:text-white"}`}
          ><Magnet className="h-3.5 w-3.5" /></button>
          <button title="Fit View" className="p-1.5 text-neutral-500 hover:text-white hover:bg-white/5 rounded transition-colors cursor-pointer"><LayoutGrid className="h-3.5 w-3.5" /></button>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500">
          <span>Panel <span className="text-purple-300 font-bold">{currentPanelIndex + 1}</span> / {totalPanels}</span>
          <ChevronRight className="h-3 w-3" />
          {snapEnabled && <span className="text-amber-400/80 font-bold text-[9px] tracking-wide">SNAP</span>}
          {selectedDuration != null && selectedDuration > 0 && (
            <span className="ml-1 text-white font-bold bg-white/8 px-2 py-0.5 rounded border border-white/10">
              {selectedDuration.toFixed(1)}s
            </span>
          )}
          <button title="Preview" className="ml-0.5 p-1 text-neutral-500 hover:text-white hover:bg-white/5 rounded transition-colors cursor-pointer">
            <Play className="h-3 w-3" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={() => setZoomLevel((z) => Math.max(10, z - 10))} className="text-neutral-600 hover:text-white cursor-pointer p-1 rounded hover:bg-white/5"><Minus className="h-3 w-3" /></button>
          <input type="range" min={10} max={100} value={zoomLevel} onChange={(e) => setZoomLevel(Number(e.target.value))}
            className="w-20 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500" />
          <button onClick={() => setZoomLevel((z) => Math.min(100, z + 10))} className="text-neutral-600 hover:text-white cursor-pointer p-1 rounded hover:bg-white/5"><Plus className="h-3 w-3" /></button>
          <span className="text-[9px] font-mono text-neutral-600 w-7 text-right">{zoomLevel}%</span>
        </div>
      </div>

      {/* Track Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative" ref={trackAreaRef}>
        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-[1.5px] z-30 pointer-events-none"
          style={{
            left: `calc(7rem + (100% - 7rem) * ${playheadPercent / 100})`,
            background: "linear-gradient(to bottom, #a855f7, rgba(99,102,241,0.3))",
          }}
        >
          <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-purple-500 rotate-45 rounded-sm shadow-[0_0_12px_rgba(168,85,247,0.9)] border border-purple-300" />
        </div>

        {/* Timecode Ruler */}
        <div className="h-7 flex shrink-0 bg-[#0d0d12] border-b border-white/[0.05]">
          <div className="w-28 shrink-0 border-r border-white/[0.05]" />
          <div className="flex-1 relative overflow-hidden">
            {ticks.map((t) => {
              const pct = totalDuration <= 0 ? 0 : (t / totalDuration) * 100;
              const isMinor = (interval >= 5) ? (t % interval !== 0) : false;
              return (
                <div key={t} className="absolute bottom-0 flex flex-col items-center" style={{ left: `${pct}%` }}>
                  <span className="text-[9px] font-mono text-neutral-500 mb-0.5 -translate-x-1/2 whitespace-nowrap select-none">
                    {t === 0 ? "0s" : `${t}s`}
                  </span>
                  <div className={`w-px ${isMinor ? "h-1.5 bg-white/10" : "h-2.5 bg-white/20"}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Track Rows */}
        <div className="flex-1 overflow-y-auto [scrollbar-width:none]">

          {/* V3 — Overlay / Captions */}
          {!hiddenTracks["V3"] && captionsVisible && (
            <div className="h-10 border-b border-white/[0.04] flex items-center">
              <TrackLabel id="V3" label="Overlay" color="text-purple-400" type="video" />
              <div className="flex-1 relative h-8 mx-1">
                {panels.map((panel: any, idx: number) => {
                  const text = panel.text_narration || panel.caption || `Caption #${idx + 1}`;
                  const key = `v3-${idx}`;
                  return (
                    <div key={key} onClick={() => handleClipClick(key, idx)} onContextMenu={(e) => openContextMenu(e, key, idx)}
                      className={clipClass(key, "bg-purple-800/70 border-purple-500/40 text-purple-100 h-full")}
                      style={{ left: `${(idx / totalPanels) * 90}%`, width: `${(1 / totalPanels) * 90 - 0.5}%` }}
                    >{text}</div>
                  );
                })}
              </div>
            </div>
          )}

          {/* V2 — Effects */}
          {!hiddenTracks["V2"] && (
            <div className="h-10 border-b border-white/[0.04] flex items-center">
              <TrackLabel id="V2" label="Effects" color="text-indigo-400" type="video" />
              <div className="flex-1 relative h-8 mx-1">
                {panels.map((panel: any, idx: number) => {
                  const fx = panel.effect || panel.transition || `Cut #${idx + 1}`;
                  const key = `v2-${idx}`;
                  return (
                    <div key={key} onClick={() => handleClipClick(key, idx)} onContextMenu={(e) => openContextMenu(e, key, idx)}
                      className={clipClass(key, "bg-indigo-800/60 border-indigo-500/30 text-indigo-200 h-full")}
                      style={{ left: `${(idx / totalPanels) * 85}%`, width: `${(1 / totalPanels) * 85 - 0.5}%` }}
                    >{fx}</div>
                  );
                })}
              </div>
            </div>
          )}

          {/* V1 — Main Video */}
          {!hiddenTracks["V1"] && (
            <div className="h-14 border-b border-white/[0.04] flex items-center">
              <TrackLabel id="V1" label="Video" color="text-white" type="video" />
              <div className="flex-1 relative h-11 mx-1 overflow-x-auto [scrollbar-width:none]">
                <div className="flex items-center gap-1 h-full">
                  {panels.map((panel: any, idx: number) => {
                    const imgUrl = panel.img_url || panel.image_url || panel.panel_url || panel.src ||
                      `https://placehold.co/100x160/1a1a24/a855f7?text=${idx + 1}`;
                    const isActive = idx === currentPanelIndex;
                    const key = `v1-${idx}`;
                    return (
                      <React.Fragment key={key}>
                        <div
                          onClick={() => handleClipClick(key, idx)}
                          onContextMenu={(e) => openContextMenu(e, key, idx)}
                          className={`h-full rounded-lg overflow-hidden relative flex-none cursor-pointer transition-all border group ${
                            isActive
                              ? "border-purple-400 ring-2 ring-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.45)] w-16"
                              : "border-white/10 hover:border-purple-400/50 w-11"
                          }`}
                        >
                          <img src={imgUrl} alt={`P${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                          <span className="absolute bottom-0.5 left-0.5 text-[7px] font-mono font-black bg-black/60 text-purple-300 px-0.5 rounded leading-tight">#{idx + 1}</span>
                          {isActive && <div className="absolute inset-0 bg-purple-500/10" />}
                          {isActive && (
                            <span className="absolute top-0.5 right-0.5 text-[7px] font-mono bg-black/80 text-white px-0.5 rounded leading-tight">
                              {getClipDuration(key).toFixed(1)}s
                            </span>
                          )}
                        </div>
                        {idx < panels.length - 1 && (
                          <div className="w-2.5 h-2.5 rounded-sm bg-[#1a1a24] border border-white/10 text-[7px] font-bold text-neutral-600 flex items-center justify-center cursor-pointer hover:text-purple-300 hover:border-purple-500/50 shrink-0 transition-colors">?</div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* A1 — Music */}
          {!hiddenTracks["A1"] && (
            <div className={`h-10 border-b border-white/[0.04] flex items-center ${mutedTracks["A1"] ? "opacity-40" : ""}`}>
              <TrackLabel id="A1" label="Music" color="text-emerald-400" type="audio" />
              <div className="flex-1 relative h-8 mx-1">
                <div
                  onClick={() => handleClipClick("a1-0", 0)}
                  onContextMenu={(e) => openContextMenu(e, "a1-0", 0)}
                  className={`absolute inset-y-0 rounded-lg overflow-hidden cursor-pointer transition-all border ${
                    selectedClip === "a1-0" ? "border-emerald-400 ring-1 ring-emerald-400/30" : "border-emerald-600/40 hover:border-emerald-400/70"
                  }`}
                  style={{ left: "0%", right: "2%", background: "linear-gradient(90deg, #064e3b 0%, #065f46 50%, #047857 100%)" }}
                >
                  <div className="absolute inset-0 flex items-center gap-[1.5px] px-2 opacity-60 pointer-events-none">
                    {WAVEFORM.map((h, i) => <div key={i} className="flex-1 bg-emerald-400 rounded-full" style={{ height: `${h}%` }} />)}
                  </div>
                  <div className="relative z-10 h-full flex items-center px-2 gap-2">
                    <span className="text-emerald-200 text-[10px] font-semibold truncate">{musicTheme}</span>
                    <span className="ml-auto text-[8px] font-mono text-emerald-400/60 shrink-0">{totalDuration.toFixed(1)}s</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* A2 — SFX */}
          {!hiddenTracks["A2"] && (
            <div className={`h-10 border-b border-white/[0.04] flex items-center ${mutedTracks["A2"] ? "opacity-40" : ""}`}>
              <TrackLabel id="A2" label="SFX" color="text-cyan-400" type="audio" />
              <div className="flex-1 relative h-8 mx-1">
                {panels.map((panel: any, idx: number) => {
                  const sfx = panel.sfx_name || panel.sfx || panel.sound_effect || `SFX #${idx + 1}`;
                  const key = `a2-${idx}`;
                  return (
                    <div key={key} onClick={() => handleClipClick(key, idx)} onContextMenu={(e) => openContextMenu(e, key, idx)}
                      className={clipClass(key, "bg-cyan-900/70 border-cyan-600/40 text-cyan-200 h-full")}
                      style={{ left: `${(idx / totalPanels) * 85}%`, width: `${Math.max((1 / totalPanels) * 36, 2.5)}%` }}
                    >{sfx}</div>
                  );
                })}
              </div>
            </div>
          )}

          {/* A3 — Voiceover */}
          {!hiddenTracks["A3"] && (
            <div className={`h-10 border-b border-white/[0.04] flex items-center ${mutedTracks["A3"] ? "opacity-40" : ""}`}>
              <TrackLabel id="A3" label="Voiceover" color="text-blue-400" type="audio" />
              <div className="flex-1 relative h-8 mx-1">
                {panels.map((panel: any, idx: number) => {
                  const lbl = voiceActor ? `${voiceActor} — P${idx + 1}` : panel.dialogue || `VO P${idx + 1}`;
                  const key = `a3-${idx}`;
                  return (
                    <div key={key} onClick={() => handleClipClick(key, idx)} onContextMenu={(e) => openContextMenu(e, key, idx)}
                      className={clipClass(key, "bg-blue-900/70 border-blue-600/40 text-blue-200 h-full")}
                      style={{ left: `${(idx / totalPanels) * 85}%`, width: `${(1 / totalPanels) * 82 - 0.5}%` }}
                    >{lbl}</div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add Track Row */}
          <div className="h-10 flex items-center border-b border-white/[0.03] group hover:bg-white/[0.02] transition-colors">
            <div className="w-28 shrink-0 border-r border-white/[0.04] h-full flex items-center justify-center">
              <button className="w-5 h-5 rounded-full bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/50 text-neutral-500 hover:text-purple-300 transition-all cursor-pointer flex items-center justify-center">
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <div className="flex-1 flex items-center px-3">
              <span className="text-[11px] text-neutral-600 group-hover:text-neutral-500 transition-colors select-none">or drag and drop media</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="h-8 px-3 border-t border-white/[0.05] bg-[#0d0d12] flex items-center justify-between shrink-0">
        <button title="Add audio track" className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-purple-500/15 border border-white/8 hover:border-purple-500/40 text-neutral-400 hover:text-purple-200 transition-all cursor-pointer text-[11px] font-medium">
          <Music className="h-3 w-3" />
          <span>Add audio</span>
        </button>

        <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-500">
          {soloTrack && <span className="text-amber-400/70 font-bold">SOLO: {soloTrack}</span>}
          <span className="text-neutral-600">{formatTime((currentPanelIndex + 0.5) * DEFAULT_PANEL_DURATION)}</span>
          <span className="text-neutral-700">/</span>
          <span className="text-neutral-500">{formatTime(totalDuration)}</span>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-600">
          <button onClick={() => setZoomLevel((z) => Math.max(10, z - 10))} className="text-neutral-700 hover:text-white cursor-pointer"><Minus className="h-3 w-3" /></button>
          <input type="range" min={10} max={100} value={zoomLevel} onChange={(e) => setZoomLevel(Number(e.target.value))}
            className="w-16 h-0.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500" />
          <button onClick={() => setZoomLevel((z) => Math.min(100, z + 10))} className="text-neutral-700 hover:text-white cursor-pointer"><Plus className="h-3 w-3" /></button>
          <span className="w-7 text-right">{zoomLevel}%</span>
          <span className="text-neutral-700 mx-1">|</span>
          <span className={snapEnabled ? "text-purple-400/70" : ""}>Snap {snapEnabled ? "ON" : "OFF"}</span>
        </div>
      </div>

      <ContextMenuPopup />
    </div>
  );
};

export default React.memo(Timeline);
export { Timeline };
