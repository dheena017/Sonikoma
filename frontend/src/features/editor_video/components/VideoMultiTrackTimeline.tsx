import React, { useState, useRef } from "react";
import {
  Undo,
  Redo,
  Scissors,
  Trash2,
  Copy,
  Lock,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Plus,
  Minus,
  Diamond,
  Magnet,
  LayoutGrid,
  ChevronRight,
} from "lucide-react";

interface VideoMultiTrackTimelineProps {
  panels?: any[];
  currentPanelIndex?: number;
  setCurrentPanelIndex?: (idx: number) => void;
  musicTheme?: string;
  voiceActor?: string;
}

const WAVEFORM = [40, 70, 30, 90, 55, 100, 62, 80, 42, 88, 34, 65, 78, 44, 92, 50, 72, 36, 95, 60, 45, 85, 52, 100, 40, 74, 32, 90, 56, 70];

const VideoMultiTrackTimeline: React.FC<VideoMultiTrackTimelineProps> = ({
  panels = [],
  currentPanelIndex = 0,
  setCurrentPanelIndex,
  musicTheme = "Orchestral Battle Theme",
  voiceActor = "Standard Comic Narrator",
}) => {
  const [zoomLevel, setZoomLevel] = useState(50);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [mutedTracks, setMutedTracks] = useState<Record<string, boolean>>({});
  const [soloTrack, setSoloTrack] = useState<string | null>(null);
  const [lockedTracks, setLockedTracks] = useState<Record<string, boolean>>({});
  const [hiddenTracks, setHiddenTracks] = useState<Record<string, boolean>>({});
  const trackAreaRef = useRef<HTMLDivElement>(null);

  const totalPanels = Math.max(panels.length, 1);
  const playheadPercent = Math.min(Math.max(((currentPanelIndex + 0.5) / totalPanels) * 100, 2), 98);

  const toggleMute = (id: string) => setMutedTracks((p) => ({ ...p, [id]: !p[id] }));
  const toggleLock = (id: string) => setLockedTracks((p) => ({ ...p, [id]: !p[id] }));
  const toggleHide = (id: string) => setHiddenTracks((p) => ({ ...p, [id]: !p[id] }));
  const toggleSolo = (id: string) => setSoloTrack((p) => (p === id ? null : id));

  const handleClipClick = (key: string, panelIdx: number) => {
    setSelectedClip(key);
    setCurrentPanelIndex?.(panelIdx);
  };

  const clipClass = (key: string, base: string) =>
    `absolute font-mono font-bold px-2 flex items-center cursor-pointer truncate transition-all border rounded-md ${base} ${
      selectedClip === key
        ? "ring-2 ring-white/40 brightness-125 z-10"
        : "hover:brightness-110"
    }`;

  const TrackHeader = ({
    id, label, color, type,
  }: { id: string; label: string; color: string; type: "video" | "audio" }) => (
    <div className="w-36 h-full px-2 bg-[#0a0a0e] border-r border-neutral-800/60 flex items-center justify-between text-xs font-mono shrink-0 group">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={`font-black text-[11px] ${color} shrink-0`}>{id}</span>
        <span className="text-neutral-500 text-[10px] truncate">{label}</span>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => toggleLock(id)} title={lockedTracks[id] ? "Unlock" : "Lock"}
          className={`p-0.5 rounded transition-colors cursor-pointer ${lockedTracks[id] ? "text-amber-400" : "text-neutral-600 hover:text-white"}`}
        ><Lock className="h-2.5 w-2.5" /></button>
        <button onClick={() => toggleHide(id)} title={hiddenTracks[id] ? "Show" : "Hide"}
          className={`p-0.5 rounded transition-colors cursor-pointer ${hiddenTracks[id] ? "text-neutral-600" : "text-neutral-400 hover:text-white"}`}
        >{hiddenTracks[id] ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}</button>
        {type === "audio" && (
          <button onClick={() => toggleMute(id)} title={mutedTracks[id] ? "Unmute" : "Mute"}
            className={`p-0.5 rounded transition-colors cursor-pointer ${mutedTracks[id] ? "text-red-400" : "text-neutral-400 hover:text-white"}`}
          >{mutedTracks[id] ? <VolumeX className="h-2.5 w-2.5" /> : <Volume2 className="h-2.5 w-2.5" />}</button>
        )}
        {type === "audio" && (
          <button onClick={() => toggleSolo(id)} title="Solo"
            className={`p-0.5 rounded text-[8px] font-black border transition-colors cursor-pointer leading-none ${
              soloTrack === id ? "bg-amber-500/20 text-amber-300 border-amber-500/50" : "text-neutral-600 border-neutral-700 hover:text-white"
            }`}
          >S</button>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full bg-[#07070b] border-t border-neutral-800/80 flex flex-col shrink-0 select-none h-80 z-20">

      {/* Toolbar */}
      <div className="h-10 px-3 border-b border-neutral-800/70 flex items-center justify-between bg-[#0b0b10] shrink-0">
        <div className="flex items-center gap-0.5">
          {([{ icon: Undo, title: "Undo" }, { icon: Redo, title: "Redo" }] as {icon: React.ElementType, title: string}[]).map(({ icon: Icon, title }) => (
            <button key={title} title={title} className="p-1.5 text-neutral-500 hover:text-white rounded hover:bg-neutral-800/60 transition-colors cursor-pointer">
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
          <div className="h-4 w-px bg-neutral-800 mx-1.5" />
          <button title="Split Clip (S)" className="p-1.5 text-purple-400 hover:bg-purple-500/20 rounded transition-colors cursor-pointer border border-purple-500/30 hover:border-purple-400">
            <Scissors className="h-3.5 w-3.5" />
          </button>
          <button title="Delete" className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button title="Duplicate" className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800/60 rounded transition-colors cursor-pointer">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button title="Add Keyframe" className="p-1.5 text-neutral-500 hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors cursor-pointer">
            <Diamond className="h-3.5 w-3.5" />
          </button>
          <div className="h-4 w-px bg-neutral-800 mx-1.5" />
          <button onClick={() => setSnapEnabled((p) => !p)} title="Snap to Grid"
            className={`p-1.5 rounded transition-colors cursor-pointer border ${snapEnabled ? "text-purple-300 bg-purple-500/15 border-purple-500/40" : "text-neutral-600 border-neutral-800 hover:text-white"}`}
          ><Magnet className="h-3.5 w-3.5" /></button>
          <button title="Fit View" className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800/60 rounded transition-colors cursor-pointer">
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500">
          <span className="hidden sm:block">
            Panel <span className="text-purple-300 font-bold">{currentPanelIndex + 1}</span> / <span className="text-neutral-400">{totalPanels}</span>
          </span>
          <ChevronRight className="h-3 w-3" />
          {snapEnabled && <span className="text-amber-400/70 font-bold text-[9px]">SNAP</span>}
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={() => setZoomLevel((z) => Math.max(10, z - 10))} className="text-neutral-500 hover:text-white cursor-pointer p-1 rounded hover:bg-neutral-800">
            <Minus className="h-3 w-3" />
          </button>
          <input type="range" min={10} max={100} value={zoomLevel}
            onChange={(e) => setZoomLevel(Number(e.target.value))}
            className="w-20 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <button onClick={() => setZoomLevel((z) => Math.min(100, z + 10))} className="text-neutral-500 hover:text-white cursor-pointer p-1 rounded hover:bg-neutral-800">
            <Plus className="h-3 w-3" />
          </button>
          <span className="text-[9px] font-mono text-neutral-600 w-7 text-right">{zoomLevel}%</span>
        </div>
      </div>

      {/* Track Workspace */}
      <div className="flex-1 flex flex-col relative overflow-hidden min-h-0 bg-[#06060a]" ref={trackAreaRef}>

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-px z-40 pointer-events-none transition-all duration-300"
          style={{ left: `calc(9rem + (100% - 9rem) * ${playheadPercent / 100})`, background: "linear-gradient(to bottom, rgba(168,85,247,1), rgba(99,102,241,0.4))" }}
        >
          <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-purple-500 rotate-45 rounded-sm shadow-[0_0_14px_rgba(168,85,247,1)] border-2 border-purple-300" />
        </div>

        {/* Panel ruler */}
        <div className="h-6 border-b border-neutral-800/80 flex items-end bg-[#090910] text-[9px] font-mono text-neutral-600 shrink-0 relative">
          <div className="w-36 border-r border-neutral-800/60 shrink-0 h-full flex items-center px-3">
            <span className="text-[9px] text-neutral-700 font-bold uppercase tracking-widest">Track</span>
          </div>
          <div className="flex-1 relative h-full">
            {Array.from({ length: Math.min(totalPanels, 20) }).map((_, idx) => {
              const pct = totalPanels <= 1 ? 0 : (idx / (Math.min(totalPanels, 20) - 1)) * 100;
              const panelNum = Math.round((idx / Math.max(Math.min(totalPanels, 20) - 1, 1)) * (totalPanels - 1)) + 1;
              return (
                <div key={idx} className="absolute flex flex-col items-center" style={{ left: `${pct}%` }}>
                  <div className={`w-px ${idx % 5 === 0 ? "h-3 bg-neutral-600" : "h-1.5 bg-neutral-800"}`} />
                  {idx % 5 === 0 && <span className="absolute top-3 text-[8px] text-neutral-600 -translate-x-1/2 whitespace-nowrap">P{panelNum}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrollable tracks */}
        <div className="flex-1 overflow-y-auto [scrollbar-width:none]">

          {/* V3 OVERLAY */}
          {!hiddenTracks["V3"] && (
            <div className="h-12 border-b border-neutral-800/40 flex items-center bg-purple-950/5 hover:bg-purple-950/10 transition-colors">
              <TrackHeader id="V3" label="Overlay" color="text-purple-300" type="video" />
              <div className="flex-1 relative h-full flex items-center px-1">
                {panels.map((panel: any, idx: number) => {
                  const text = panel.text_narration || panel.dialogue || panel.caption || `Narration #${idx + 1}`;
                  const key = `v3-${idx}`;
                  return (
                    <div key={key} onClick={() => handleClipClick(key, idx)} title={text}
                      className={clipClass(key, "bg-gradient-to-r from-purple-900/80 to-purple-800/60 border-purple-500/50 text-purple-200 text-[9px] shadow-[0_0_6px_rgba(168,85,247,0.1)]")}
                      style={{ left: `${(idx / totalPanels) * 90}%`, width: `${(1 / totalPanels) * 90}%`, height: "2rem" }}
                    ><span className="truncate">{text}</span></div>
                  );
                })}
              </div>
            </div>
          )}

          {/* V2 EFFECTS */}
          {!hiddenTracks["V2"] && (
            <div className="h-12 border-b border-neutral-800/40 flex items-center bg-indigo-950/5 hover:bg-indigo-950/10 transition-colors">
              <TrackHeader id="V2" label="Effects" color="text-indigo-300" type="video" />
              <div className="flex-1 relative h-full flex items-center px-1">
                {panels.map((panel: any, idx: number) => {
                  const fx = panel.effect || panel.transition || panel.overlay || `Cut #${idx + 1}`;
                  const key = `v2-${idx}`;
                  return (
                    <div key={key} onClick={() => handleClipClick(key, idx)} title={fx}
                      className={clipClass(key, "bg-gradient-to-r from-indigo-900/70 to-indigo-800/50 border-indigo-500/40 text-indigo-200 text-[9px]")}
                      style={{ left: `${(idx / totalPanels) * 85}%`, width: `${(1 / totalPanels) * 85}%`, height: "2rem" }}
                    ><span className="truncate">{fx}</span></div>
                  );
                })}
              </div>
            </div>
          )}

          {/* V1 MAIN VIDEO */}
          {!hiddenTracks["V1"] && (
            <div className="h-16 border-b border-neutral-800/40 flex items-center bg-neutral-950/60 hover:bg-neutral-900/20 transition-colors">
              <TrackHeader id="V1" label="Video" color="text-white" type="video" />
              <div className="flex-1 relative h-full flex items-center px-1.5 overflow-x-auto [scrollbar-width:none]">
                <div className="flex items-center gap-1 h-12">
                  {panels.map((panel: any, idx: number) => {
                    const imgUrl = panel.img_url || panel.image_url || panel.panel_url || panel.src ||
                      `https://placehold.co/120x180/121218/a855f7?text=${idx + 1}`;
                    const isActive = idx === currentPanelIndex;
                    return (
                      <React.Fragment key={`v1-${idx}`}>
                        <div onClick={() => handleClipClick(`v1-${idx}`, idx)}
                          className={`h-full rounded-md overflow-hidden relative group flex-none cursor-pointer transition-all border ${
                            isActive
                              ? "border-purple-400 ring-2 ring-purple-500/50 shadow-[0_0_14px_rgba(168,85,247,0.5)] w-20"
                              : "border-neutral-700/60 hover:border-purple-400/60 w-14"
                          }`}
                        >
                          <img src={imgUrl} alt={`P${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <span className="absolute bottom-0.5 left-0.5 text-[8px] font-mono font-black bg-black/70 text-purple-300 px-1 rounded leading-tight">#{idx + 1}</span>
                          {isActive && <div className="absolute inset-0 bg-purple-500/10" />}
                        </div>
                        {idx < panels.length - 1 && (
                          <div title="Transition" className="w-3 h-3 rounded-sm bg-neutral-900 border border-neutral-700 text-[7px] font-bold text-neutral-500 flex items-center justify-center cursor-pointer hover:text-purple-300 hover:border-purple-500/60 shrink-0 transition-colors">
                            ?
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* A1 MUSIC */}
          {!hiddenTracks["A1"] && (
            <div className={`h-12 border-b border-neutral-800/40 flex items-center transition-colors ${mutedTracks["A1"] ? "opacity-40" : "bg-emerald-950/8 hover:bg-emerald-950/15"}`}>
              <TrackHeader id="A1" label="Music" color="text-emerald-400" type="audio" />
              <div className="flex-1 relative h-full flex items-center px-1">
                <div onClick={() => handleClipClick("a1-0", 0)}
                  className={`absolute h-8 rounded-md overflow-hidden cursor-pointer transition-all border ${selectedClip === "a1-0" ? "border-emerald-400 ring-1 ring-emerald-400/30" : "border-emerald-500/50 hover:border-emerald-400"}`}
                  style={{ left: "1%", width: "92%", background: "linear-gradient(90deg,rgba(6,78,59,0.9),rgba(5,46,22,0.85))" }}
                >
                  <div className="absolute inset-0 flex items-center gap-px px-1 opacity-50 pointer-events-none">
                    {WAVEFORM.map((h, i) => <div key={i} className="flex-1 bg-emerald-400 rounded-full" style={{ height: `${h}%` }} />)}
                  </div>
                  <span className="relative z-10 text-emerald-200 text-[10px] font-bold px-2 truncate">{musicTheme}</span>
                </div>
              </div>
            </div>
          )}

          {/* A2 SFX */}
          {!hiddenTracks["A2"] && (
            <div className={`h-12 border-b border-neutral-800/40 flex items-center transition-colors ${mutedTracks["A2"] ? "opacity-40" : "bg-cyan-950/5 hover:bg-cyan-950/10"}`}>
              <TrackHeader id="A2" label="SFX" color="text-cyan-400" type="audio" />
              <div className="flex-1 relative h-full flex items-center px-1">
                {panels.map((panel: any, idx: number) => {
                  const sfx = panel.sfx_name || panel.sfx || panel.sound_effect || `SFX #${idx + 1}`;
                  const key = `a2-${idx}`;
                  return (
                    <div key={key} onClick={() => handleClipClick(key, idx)} title={sfx}
                      className={clipClass(key, "bg-gradient-to-r from-cyan-950/90 to-cyan-900/70 border-cyan-500/50 text-cyan-300 text-[9px]")}
                      style={{ left: `${(idx / totalPanels) * 85}%`, width: `${Math.max((1 / totalPanels) * 38, 3)}%`, height: "1.8rem" }}
                    ><span className="truncate">{sfx}</span></div>
                  );
                })}
              </div>
            </div>
          )}

          {/* A3 VOICEOVER */}
          {!hiddenTracks["A3"] && (
            <div className={`h-12 border-b border-neutral-800/40 flex items-center transition-colors ${mutedTracks["A3"] ? "opacity-40" : "bg-blue-950/5 hover:bg-blue-950/10"}`}>
              <TrackHeader id="A3" label="Voiceover" color="text-blue-400" type="audio" />
              <div className="flex-1 relative h-full flex items-center px-1">
                {panels.map((panel: any, idx: number) => {
                  const label = voiceActor ? `${voiceActor} — P${idx + 1}` : panel.text_narration || panel.dialogue || `Voiceover P${idx + 1}`;
                  const key = `a3-${idx}`;
                  return (
                    <div key={key} onClick={() => handleClipClick(key, idx)} title={label}
                      className={clipClass(key, "bg-gradient-to-r from-blue-950/90 to-blue-900/70 border-blue-500/50 text-blue-300 text-[9px]")}
                      style={{ left: `${(idx / totalPanels) * 85}%`, width: `${(1 / totalPanels) * 85}%`, height: "1.8rem" }}
                    ><span className="truncate">{label}</span></div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Status Bar */}
      <div className="h-6 px-3 border-t border-neutral-800/60 bg-[#080810] flex items-center justify-between shrink-0 text-[9px] font-mono text-neutral-600">
        <div className="flex items-center gap-3">
          <span><span className="text-purple-400/70">{totalPanels}</span> panels</span>
          <span className={musicTheme ? "text-emerald-400/70" : ""}>BGM {musicTheme ? "?" : "—"}</span>
          <span className={voiceActor ? "text-blue-400/70" : ""}>VO {voiceActor ? "?" : "—"}</span>
        </div>
        <div className="flex items-center gap-3">
          {soloTrack && <span className="text-amber-400/70 font-bold">SOLO: {soloTrack}</span>}
          <span>Zoom {zoomLevel}%</span>
          <span className={snapEnabled ? "text-purple-400/70" : ""}>{snapEnabled ? "Snap ON" : "Snap OFF"}</span>
        </div>
      </div>

    </div>
  );
};

export default React.memo(VideoMultiTrackTimeline);
