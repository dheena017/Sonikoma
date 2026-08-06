import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Sliders,
  Volume2,
  Sparkles,
  SunMedium,
  Mic,
  Music,
  Activity,
  Scissors,
  Palette,
  Gauge,
  Ratio,
  Zap,
} from "lucide-react";

interface VideoPropertyInspectorProps {
  voiceActor?: string;
  setVoiceActor?: (v: string) => void;
  musicTheme?: string;
  setMusicTheme?: (v: string) => void;
  aspectRatio?: string;
  setAspectRatio?: (r: string) => void;
  frameRate?: number | null;
  setFrameRate?: (f: number | null) => void;
  volume?: number;
  setVolume?: (v: number) => void;
  bgmVolume?: number;
  setBgmVolume?: (v: number) => void;
  speechRate?: number;
  setSpeechRate?: (v: number) => void;
  speechPitch?: number;
  setSpeechPitch?: (v: number) => void;
  audioReactiveShake?: boolean;
  setAudioReactiveShake?: (v: boolean) => void;
  shakeIntensity?: number;
  setShakeIntensity?: (v: number) => void;
  cropSensitivity?: number;
  setCropSensitivity?: (v: number) => void;
}

const inspectorTabs = [
  { id: "video", label: "Video", icon: Sliders },
  { id: "audio", label: "Audio", icon: Volume2 },
  { id: "effects", label: "FX", icon: Sparkles },
  { id: "color", label: "Color", icon: Palette },
  { id: "adjust", label: "Adjust", icon: SunMedium },
];

const VOICE_ACTOR_PRESETS = [
  "Standard Comic Narrator (Male)",
  "Kokoro Voice",
  "Naruto Style EN",
  "Anime Female Energetic",
  "Cinematic Deep Narrator",
  "Sci-Fi AI Assistant",
];

const MUSIC_THEME_PRESETS = [
  "Orchestral Battle Theme",
  "Synthwave Neon",
  "Cyberpunk Action Synth",
  "Lo-Fi Ambient Chill",
  "Dark Suspense Horror",
];

const VideoPropertyInspector: React.FC<VideoPropertyInspectorProps> = ({
  voiceActor,
  setVoiceActor,
  musicTheme,
  setMusicTheme,
  aspectRatio = "16:9",
  setAspectRatio,
  frameRate = 24,
  setFrameRate,
  volume = 80,
  setVolume,
  bgmVolume = 50,
  setBgmVolume,
  speechRate = 1.0,
  setSpeechRate,
  speechPitch = 1.0,
  setSpeechPitch,
  audioReactiveShake = true,
  setAudioReactiveShake,
  shakeIntensity = 50,
  setShakeIntensity,
  cropSensitivity = 75,
  setCropSensitivity,
}) => {
  // Build dynamic option lists — always surface the active project value at top
  const activeVoice = voiceActor || "";
  const voiceActorsList = activeVoice && !VOICE_ACTOR_PRESETS.includes(activeVoice)
    ? [activeVoice, ...VOICE_ACTOR_PRESETS]
    : VOICE_ACTOR_PRESETS;

  const activeMusic = musicTheme || "";
  const musicThemesList = activeMusic && !MUSIC_THEME_PRESETS.includes(activeMusic)
    ? [activeMusic, ...MUSIC_THEME_PRESETS]
    : MUSIC_THEME_PRESETS;
  const [activeTab, setActiveTab] = useState("video");
  const [scale, setScale] = useState(100);
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [opacity, setOpacity] = useState(100);
  const [blendMode, setBlendMode] = useState("Normal");
  const [speed, setSpeed] = useState(1.0);
  const [localFrameRate, setLocalFrameRate] = useState<number>(frameRate ?? 24);

  // Color grade state
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [sharpness, setSharpness] = useState(50);
  const [noiseReduction, setNoiseReduction] = useState(0);

  const [openTransform, setOpenTransform] = useState(true);
  const [openCompositing, setOpenCompositing] = useState(true);
  const [openOutput, setOpenOutput] = useState(true);

  return (
    <div className="w-64 sm:w-72 lg:w-80 bg-[#0c0c12] border-l border-neutral-800/80 flex flex-col h-full shrink-0 select-none overflow-hidden text-xs">
      {/* Inspector Tabs Header */}
      <div className="flex items-center gap-0.5 border-b border-neutral-800/70 p-1.5 bg-[#0a0a0e] overflow-x-auto [scrollbar-width:none]">
        {inspectorTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-1.5 px-1 flex flex-col items-center gap-0.5 font-bold rounded-lg transition-all cursor-pointer min-w-[40px] ${
                isActive
                  ? "bg-purple-600/25 text-purple-300 border border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.2)]"
                  : "text-neutral-500 hover:text-neutral-300 border border-transparent"
              }`}
            >
              <Icon className={`h-3 w-3 ${isActive ? "text-purple-400" : "text-neutral-600"}`} />
              <span className="text-[9px] uppercase tracking-wide">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Inspector Content by Active Tab */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3 [scrollbar-width:none]">
        {activeTab === "video" && (
          <>
            {/* TRANSFORM ACCORDION */}
            <div className="border border-neutral-800/80 rounded-xl bg-neutral-900/40 overflow-hidden">
              <button
                onClick={() => setOpenTransform(!openTransform)}
                className="w-full flex items-center justify-between p-2.5 font-bold text-neutral-200 hover:bg-neutral-900/80 cursor-pointer"
              >
                <span>Transform</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setScale(100);
                      setPosX(0);
                      setPosY(0);
                    }}
                    className="text-neutral-500 hover:text-white p-1 rounded"
                    title="Reset Transform"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                  {openTransform ? (
                    <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-neutral-400" />
                  )}
                </div>
              </button>

              {openTransform && (
                <div className="p-2.5 border-t border-neutral-800/60 space-y-2.5 font-mono text-[11px]">
                  {/* Scale slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-neutral-400">
                      <span>Scale</span>
                      <span className="text-white font-bold">{scale}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={200}
                      value={scale}
                      onChange={(e) => setScale(Number(e.target.value))}
                      className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>

                  {/* Position X / Y */}
                  <div className="flex items-center justify-between text-neutral-400 gap-1">
                    <span>Position</span>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800 min-w-[42px] justify-between">
                        <span className="text-neutral-600 text-[10px]">X</span>
                        <span className="text-white font-bold">{posX}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800 min-w-[42px] justify-between">
                        <span className="text-neutral-600 text-[10px]">Y</span>
                        <span className="text-white font-bold">{posY}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* COMPOSITING ACCORDION */}
            <div className="border border-neutral-800/80 rounded-xl bg-neutral-900/40 overflow-hidden">
              <button
                onClick={() => setOpenCompositing(!openCompositing)}
                className="w-full flex items-center justify-between p-2.5 font-bold text-neutral-200 hover:bg-neutral-900/80 cursor-pointer"
              >
                <span>Compositing</span>
                {openCompositing ? (
                  <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-neutral-400" />
                )}
              </button>

              {openCompositing && (
                <div className="p-2.5 border-t border-neutral-800/60 space-y-2.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Blend Mode</span>
                    <select
                      value={blendMode}
                      onChange={(e) => setBlendMode(e.target.value)}
                      className="bg-neutral-950 text-white border border-neutral-800 rounded px-2 py-1 text-xs cursor-pointer outline-none focus:border-purple-500"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Screen">Screen</option>
                      <option value="Multiply">Multiply</option>
                      <option value="Overlay">Overlay</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-neutral-400">
                      <span>Opacity</span>
                      <span className="text-white font-bold">{opacity}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={opacity}
                      onChange={(e) => setOpacity(Number(e.target.value))}
                      className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* OUTPUT SETTINGS ACCORDION */}
            <div className="border border-neutral-800/80 rounded-xl bg-neutral-900/40 overflow-hidden">
              <button
                onClick={() => setOpenOutput(!openOutput)}
                className="w-full flex items-center justify-between p-2.5 font-bold text-neutral-200 hover:bg-neutral-900/80 cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5 text-purple-400" />
                  <span>Output Settings</span>
                </div>
                {openOutput ? <ChevronDown className="h-3.5 w-3.5 text-neutral-400" /> : <ChevronRight className="h-3.5 w-3.5 text-neutral-400" />}
              </button>
              {openOutput && (
                <div className="p-2.5 border-t border-neutral-800/60 space-y-2.5 font-mono text-[11px]">
                  {/* Frame Rate */}
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Frame Rate</span>
                    <div className="flex items-center gap-1">
                      {[24, 30, 60].map((fps) => (
                        <button
                          key={fps}
                          onClick={() => { setLocalFrameRate(fps); setFrameRate?.(fps); }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                            localFrameRate === fps
                              ? "bg-purple-600/30 text-purple-300 border-purple-500/50"
                              : "text-neutral-500 border-neutral-800 hover:text-white"
                          }`}
                        >{fps}</button>
                      ))}
                      <span className="text-neutral-600">fps</span>
                    </div>
                  </div>

                  {/* Playback Speed */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-neutral-400">
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-amber-400" />
                        <span>Playback Speed</span>
                      </div>
                      <span className="text-white font-bold">{speed.toFixed(1)}x</span>
                    </div>
                    <input type="range" min={25} max={200} value={speed * 100}
                      onChange={(e) => setSpeed(Number(e.target.value) / 100)}
                      className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <div className="flex justify-between text-[9px] text-neutral-700">
                      <span>0.25x</span><span>1.0x</span><span>2.0x</span>
                    </div>
                  </div>

                  {/* Aspect Ratio */}
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Aspect Ratio</span>
                    <div className="flex items-center gap-1">
                      {["9:16", "16:9", "1:1"].map((r) => (
                        <button
                          key={r}
                          onClick={() => setAspectRatio?.(r)}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                            aspectRatio === r
                              ? "bg-indigo-600/30 text-indigo-300 border-indigo-500/50"
                              : "text-neutral-500 border-neutral-800 hover:text-white"
                          }`}
                        >{r}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "audio" && (
          <div className="space-y-3 font-mono text-[11px]">
            {/* Voice Actor Selector */}
            <div className="border border-neutral-800/80 rounded-xl bg-neutral-900/40 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                <Mic className="h-3.5 w-3.5" />
                <span>Voice Actor</span>
              </div>
              <select
                value={activeVoice || voiceActorsList[0]}
                onChange={(e) => setVoiceActor?.(e.target.value)}
                className="w-full bg-neutral-950 text-white border border-neutral-800 rounded px-2 py-1.5 text-xs outline-none focus:border-purple-500"
              >
                {voiceActorsList.map((actor) => (
                  <option key={actor} value={actor}>
                    {actor}
                  </option>
                ))}
              </select>
            </div>

            {/* Music Theme Selector */}
            <div className="border border-neutral-800/80 rounded-xl bg-neutral-900/40 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                <Music className="h-3.5 w-3.5" />
                <span>Music Theme</span>
              </div>
              <select
                value={activeMusic || musicThemesList[0]}
                onChange={(e) => setMusicTheme?.(e.target.value)}
                className="w-full bg-neutral-950 text-white border border-neutral-800 rounded px-2 py-1.5 text-xs outline-none focus:border-purple-500"
              >
                {musicThemesList.map((theme) => (
                  <option key={theme} value={theme}>
                    {theme}
                  </option>
                ))}
              </select>
            </div>

            {/* BGM & Main Volume Sliders */}
            <div className="border border-neutral-800/80 rounded-xl bg-neutral-900/40 p-3 space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-neutral-400">
                  <span>Main Volume</span>
                  <span className="text-white font-bold">{volume}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(e) => setVolume?.(Number(e.target.value))}
                  className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-neutral-400">
                  <span>BGM Volume</span>
                  <span className="text-white font-bold">{bgmVolume}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={bgmVolume}
                  onChange={(e) => setBgmVolume?.(Number(e.target.value))}
                  className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "effects" && (
          <div className="space-y-3 font-mono text-[11px]">
            <div className="border border-neutral-800/80 rounded-xl bg-neutral-900/40 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                  <Activity className="h-3.5 w-3.5" />
                  <span>Audio-Reactive Shake</span>
                </div>
                <input
                  type="checkbox"
                  checked={audioReactiveShake}
                  onChange={(e) => setAudioReactiveShake?.(e.target.checked)}
                  className="accent-purple-500 cursor-pointer h-4 w-4"
                />
              </div>

              {audioReactiveShake && (
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-neutral-400">
                    <span>Shake Intensity</span>
                    <span className="text-white font-bold">{shakeIntensity}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={shakeIntensity}
                    onChange={(e) => setShakeIntensity?.(Number(e.target.value))}
                    className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── COLOR GRADE TAB ─────────────────────────────────────────────── */}
        {activeTab === "color" && (
          <div className="space-y-3 font-mono text-[11px]">
            <div className="border border-neutral-800/80 rounded-xl bg-neutral-900/40 p-3 space-y-3">
              <div className="flex items-center gap-1.5 text-purple-300 font-bold mb-1">
                <Palette className="h-3.5 w-3.5" />
                <span>Color Grading</span>
              </div>

              {([
                { label: "Hue", value: hue, set: setHue, min: -180, max: 180, color: "accent-purple-500", unit: "°" },
                { label: "Saturation", value: saturation, set: setSaturation, min: 0, max: 200, color: "accent-pink-500", unit: "%" },
                { label: "Brightness", value: brightness, set: setBrightness, min: 0, max: 200, color: "accent-yellow-500", unit: "%" },
                { label: "Contrast", value: contrast, set: setContrast, min: 0, max: 200, color: "accent-orange-500", unit: "%" },
              ] as {label: string, value: number, set: (v:number)=>void, min:number, max:number, color:string, unit:string}[]).map(({ label, value, set, min, max, color, unit }) => (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between text-neutral-400">
                    <span>{label}</span>
                    <span className="text-white font-bold">{value}{unit}</span>
                  </div>
                  <input type="range" min={min} max={max} value={value}
                    onChange={(e) => set(Number(e.target.value))}
                    className={`w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer ${color}`}
                  />
                </div>
              ))}
            </div>

            {/* LUT Presets */}
            <div className="border border-neutral-800/80 rounded-xl bg-neutral-900/40 p-3 space-y-2">
              <span className="text-neutral-400 font-bold">LUT Presets</span>
              <div className="grid grid-cols-2 gap-1.5">
                {["Cinematic Cold", "Warm Anime", "Dark Noir", "Vivid Pop", "Pastel Dream", "Matte Film"].map((lut) => (
                  <button key={lut}
                    className="px-2 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-400 hover:text-white hover:border-purple-500/50 transition-colors cursor-pointer text-left font-semibold"
                  >{lut}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "adjust" && (
          <div className="space-y-3 font-mono text-[11px]">
            <div className="border border-neutral-800/80 rounded-xl bg-neutral-900/40 p-3 space-y-3">
              <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                <Scissors className="h-3.5 w-3.5" />
                <span>Panel Auto-Crop</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-neutral-400">
                  <span>Sensitivity</span>
                  <span className="text-white font-bold">{cropSensitivity}%</span>
                </div>
                <input type="range" min={10} max={100} value={cropSensitivity}
                  onChange={(e) => setCropSensitivity?.(Number(e.target.value))}
                  className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>

            <div className="border border-neutral-800/80 rounded-xl bg-neutral-900/40 p-3 space-y-3">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <Ratio className="h-3.5 w-3.5" />
                <span>Image Processing</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-neutral-400">
                  <span>Sharpness</span>
                  <span className="text-white font-bold">{sharpness}%</span>
                </div>
                <input type="range" min={0} max={100} value={sharpness}
                  onChange={(e) => setSharpness(Number(e.target.value))}
                  className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-neutral-400">
                  <span>Noise Reduction</span>
                  <span className="text-white font-bold">{noiseReduction}%</span>
                </div>
                <input type="range" min={0} max={100} value={noiseReduction}
                  onChange={(e) => setNoiseReduction(Number(e.target.value))}
                  className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(VideoPropertyInspector);
