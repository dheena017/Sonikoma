import React from "react";
import {
  Sparkles,
  Loader2,
  HelpCircle,
  Terminal,
  Gamepad2,
  Volume2,
  VolumeX,
  Trophy,
  Activity,
  Maximize2,
  Zap,
  Clock,
  Cpu,
  X,
  Keyboard,
  Info,
  FolderOpen,
  Send,
  AlertTriangle,
  RotateCcw,
  Bomb,
  Award,
  Shield,
} from "lucide-react";

interface LoadingPageProps {
  status?: string;
  progress?: number;
}

// 1. Simulated Webtoon Project Context Definitions
interface WebtoonProject {
  id: string;
  name: string;
  genre: string;
  panels: number;
  resolution: string;
  translation: string;
  voice: string;
  vramMultiplier: number;
  tempBase: number;
  logs: string[];
}

const SIMULATED_PROJECTS: WebtoonProject[] = [
  {
    id: "proj-1",
    name: "Return of the Shadow Sovereign",
    genre: "Action / Dark Fantasy",
    panels: 24,
    resolution: "1080x1920 (9:16 Vertical Video)",
    translation: "Korean -> English (Gemini AI)",
    voice: "EdgeTTS US Neural (Deep Male)",
    vramMultiplier: 1.15,
    tempBase: 64,
    logs: [
      "[SYSTEM] Loading raw Shadow Sovereign vertical panels...",
      "[CV] Row-wise background pixel variance scanner online.",
      "[CV] Detected 24 panel boundaries from 18,200px comic strip.",
      "[AI] OCR completed on speech bubbles: 'I shall rise...'",
      "[VOICE] Synthesizing speech stems for Character 'Shadow Lord'...",
      "[AUDIO] Mixing atmospheric sound effects: 'Dungeon_Reverb.wav'...",
    ],
  },
  {
    id: "proj-2",
    name: "Vampire Butler's Secret Recipe",
    genre: "Romance / Comedy / Cooking",
    panels: 16,
    resolution: "1080x1920 (9:16 Vertical Video)",
    translation: "Korean -> Japanese (Gemini AI)",
    voice: "EdgeTTS JP Neural (Soft Butler)",
    vramMultiplier: 0.85,
    tempBase: 58,
    logs: [
      "[SYSTEM] Retrieving Kitchen Manor comic assets...",
      "[CV] Analyzing strip dimensions: 800px x 10,400px...",
      "[CV] Detected 16 panel boundaries (padding=15px).",
      "[AI] OCR Translation: 'Would you care for a taste, My Lord?'",
      "[VOICE] Synthesizing cute butler voice tracks...",
      "[AUDIO] Adding background sounds: 'Sizzling_Steak.mp3'...",
    ],
  },
  {
    id: "proj-3",
    name: "Solo Leveling Level Up Again",
    genre: "Fantasy / Adventure",
    panels: 35,
    resolution: "1920x1080 (16:9 Widescreen Video)",
    translation: "Korean -> English / French (Gemini AI)",
    voice: "EdgeTTS Multilingual Neural Cast",
    vramMultiplier: 1.55,
    tempBase: 71,
    logs: [
      "[SYSTEM] Ingesting high-resolution dungeon action tiles...",
      "[CV] Analyzing dense layout panels with high color saturation...",
      "[CV] Isolated 35 complex widescreen panels.",
      "[AI] Gemini OCR: 'The gate is opening! Run!'",
      "[VOICE] Multi-actor speech synthesis online (12 unique voice stems)...",
      "[AUDIO] Injecting cinematic audio tracks & sub-bass sweeps...",
    ],
  },
  {
    id: "proj-4",
    name: "My Roommate is a Nine-Tailed Fox",
    genre: "Drama / Fantasy",
    panels: 20,
    resolution: "1080x1920 (9:16 Vertical Video)",
    translation: "Korean -> English / Spanish (Gemini AI)",
    voice: "EdgeTTS ES Neural (Female-Male Duet)",
    vramMultiplier: 0.95,
    tempBase: 61,
    logs: [
      "[SYSTEM] Syncing Nine-Tailed Fox chapter 12 storyboard...",
      "[CV] Found 20 panels. Gutter detection sensitivity optimized.",
      "[AI] OCR translation verified for Spanish subtitles.",
      "[VOICE] Synthesizing narrative voiceover dialogue tracks...",
      "[AUDIO] Blending soft acoustic background score: 'Rainy_Day.mp3'...",
    ],
  },
];

const LOADING_TIPS = [
  "Did you know? Anivox uses advanced variance-based CV row scanning to isolate webtoon panels.",
  "Tip: Adjust the sensitivity slider in edit mode if panels have thin borders or extra spacing.",
  "Tip: Zoom and pan camera paths can be customized to follow action panels dynamically.",
  "Did you know? You can translate comic scripts into multiple languages using Gemini AI in the storyboard.",
  "Tip: Multi-character dialogue tracks are auto-generated and aligned with voiceover speech rate.",
  "Connecting to GPU-accelerated video compilation modules...",
  "Rendering keyframes, layering audio mixers, and synthesizing voice tracks...",
];

const PIPELINE_STAGES = [
  {
    id: 1,
    label: "Scraping",
    range: [0, 20],
    desc: "Retrieving webtoon strip",
  },
  {
    id: 2,
    label: "CV Slicing",
    range: [21, 45],
    desc: "Detecting panel gutters",
  },
  {
    id: 3,
    label: "AI Translate",
    range: [46, 65],
    desc: "OCR & script translations",
  },
  {
    id: 4,
    label: "Audio Mix",
    range: [66, 85],
    desc: "Narration & soundscapes",
  },
  {
    id: 5,
    label: "Compile",
    range: [86, 100],
    desc: "Compiling MP4 video stream",
  },
];

// Soundtrack Preset Configurations
type SoundStyle = "lofi" | "retro" | "techno" | "space";

const SOUND_PRESETS: Record<
  SoundStyle,
  { name: string; bpm: number; chords: number[][]; oscType: OscillatorType }
> = {
  lofi: {
    name: "Lofi Chill Beat",
    bpm: 80,
    chords: [
      [110.0, 130.81, 164.81, 220.0], // Am7
      [87.31, 110.0, 130.81, 174.61], // Fmaj7
      [65.41, 98.0, 130.81, 164.81], // Cmaj7
      [98.0, 123.47, 146.83, 196.0], // G7
    ],
    oscType: "sine",
  },
  retro: {
    name: "8-Bit Retro Arcade",
    bpm: 115,
    chords: [
      [130.81, 196.0, 261.63, 392.0], // C major
      [110.0, 164.81, 220.0, 330.0], // A minor
      [87.31, 130.81, 174.61, 261.63], // F major
      [98.0, 146.83, 196.0, 293.66], // G major
    ],
    oscType: "triangle",
  },
  techno: {
    name: "Techno Pulse",
    bpm: 130,
    chords: [
      [73.42, 110.0, 146.83, 220.0], // D minor
      [65.41, 98.0, 130.81, 196.0], // C major
      [55.0, 82.41, 110.0, 164.81], // A minor
      [87.31, 130.81, 174.61, 261.63], // F major
    ],
    oscType: "sawtooth",
  },
  space: {
    name: "Ethereal Deep Space",
    bpm: 60,
    chords: [
      [146.83, 220.0, 293.66, 440.0], // D minor chord
      [164.81, 246.94, 329.63, 493.88], // E minor chord
      [130.81, 196.0, 261.63, 392.0], // C major chord
      [146.83, 220.0, 293.66, 440.0], // D minor chord
    ],
    oscType: "sine",
  },
};

export default function LoadingPage({
  status = "Connecting to Computational Engine...",
  progress,
}: LoadingPageProps) {
  // Local simulated progress for active bar updates
  const [simulatedProgress, setSimulatedProgress] = React.useState(10);
  const [activeTipIdx, setActiveTipIdx] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState<
    "tip" | "game" | "terminal" | "drumpad"
  >("tip");

  // Selected Simulated Project
  const [selectedProjectId, setSelectedProjectId] = React.useState("proj-1");
  const currentProject = React.useMemo(() => {
    return (
      SIMULATED_PROJECTS.find((p) => p.id === selectedProjectId) ||
      SIMULATED_PROJECTS[0]
    );
  }, [selectedProjectId]);

  // Audio synthesis state
  const [isPlayingMusic, setIsPlayingMusic] = React.useState(false);
  const [synthVolume, setSynthVolume] = React.useState(35); // 0-100%
  const [activePreset, setActivePreset] = React.useState<SoundStyle>("lofi");
  const [synthTempo, setSynthTempo] = React.useState(80); // BPM
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const beatsTimerRef = React.useRef<any>(null);
  const masterGainRef = React.useRef<GainNode | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const canvasVisualizerRef = React.useRef<HTMLCanvasElement | null>(null);

  const volumeRef = React.useRef(35);
  const tempoRef = React.useRef(80);
  const presetRef = React.useRef(activePreset);

  // Sync volume state to ref
  React.useEffect(() => {
    volumeRef.current = synthVolume;
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(
        synthVolume / 500,
        audioCtxRef.current.currentTime
      );
    }
  }, [synthVolume]);

  // Sync tempo state to ref
  React.useEffect(() => {
    tempoRef.current = synthTempo;
    if (isPlayingMusic) {
      stopProceduralMusic();
      startProceduralMusic();
    }
  }, [synthTempo]);

  // Sync preset state to ref
  React.useEffect(() => {
    presetRef.current = activePreset;
    setSynthTempo(SOUND_PRESETS[activePreset].bpm);
  }, [activePreset]);

  // Mini-game state
  const [gameScore, setGameScore] = React.useState(0);
  const [gameDifficulty, setGameDifficulty] = React.useState<
    "easy" | "normal" | "chaos"
  >("normal");
  const [gameHighScore, setGameHighScore] = React.useState(() => {
    try {
      return parseInt(
        localStorage.getItem("anivox_pre_render_high_score") || "0"
      );
    } catch (e) {
      return 0;
    }
  });
  const [comboCount, setComboCount] = React.useState(0);
  const [lastPopTime, setLastPopTime] = React.useState(0);
  const [gameTimer, setGameTimer] = React.useState(30);
  const [isScreenShaking, setIsScreenShaking] = React.useState(false);
  const [poppers, setPoppers] = React.useState<
    {
      id: number;
      x: number;
      y: number;
      scale: number;
      speed: number;
      hue: number;
      isPowerUp?: boolean;
      type?: string; // "auto-pop" | "double-score"
      isBomb?: boolean;
      isGolden?: boolean;
    }[]
  >([]);
  const popperIdCounter = React.useRef(0);

  // Power Up state
  const [activePowerUp, setActivePowerUp] = React.useState<string | null>(null);
  const [powerUpTimeLeft, setPowerUpTimeLeft] = React.useState(0);

  // Pipeline stage inspection
  const [inspectedStageId, setInspectedStageId] = React.useState<number | null>(
    null
  );

  // Overclock boost multiplier
  const [isOverclocked, setIsOverclocked] = React.useState(false);

  // Telemetry status state
  const [telemetry, setTelemetry] = React.useState({
    latency: 1.2,
    vram: 8.2,
    temp: 64,
    threads: 18,
  });

  // Terminal log simulation state
  const [terminalLogs, setTerminalLogs] = React.useState<string[]>([]);
  const [terminalInput, setTerminalInput] = React.useState("");
  const [matrixActive, setMatrixActive] = React.useState(false);
  const logIndex = React.useRef(0);

  // Initialize logs from active project
  React.useEffect(() => {
    setTerminalLogs([
      `[${new Date().toLocaleTimeString()}] [SYSTEM] Loading environment configuration...`,
      `[${new Date().toLocaleTimeString()}] [SYSTEM] Active Project: ${currentProject.name}`,
      `[${new Date().toLocaleTimeString()}] [GPU] Found NVIDIA CUDA v12.1 runtime core.`,
      `[${new Date().toLocaleTimeString()}] [DOCKER] Spawning container instance for ffmpeg-codec...`,
      ...currentProject.logs.map(
        (log) => `[${new Date().toLocaleTimeString()}] ${log}`
      ),
    ]);
    logIndex.current = 0;
  }, [selectedProjectId]);

  // Auto-increment progress slowly if parent doesn't provide a real progress value
  React.useEffect(() => {
    if (progress !== undefined) return;

    const interval = setInterval(() => {
      setSimulatedProgress((prev) => {
        if (prev >= 99) return 99;
        const multiplier = isOverclocked ? 0.15 : 0.035;
        const increment = (99 - prev) * multiplier;
        return Math.min(99, prev + Math.max(0.1, increment));
      });
    }, 250);

    return () => clearInterval(interval);
  }, [progress, isOverclocked]);

  // Cycle through loading tips
  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveTipIdx((prev) => (prev + 1) % LOADING_TIPS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Telemetry jitter simulator
  React.useEffect(() => {
    const interval = setInterval(() => {
      const vramWeight = currentProject.vramMultiplier;
      const tempWeight = isOverclocked ? 15 : 0;
      const latencyWeight = isOverclocked ? -0.4 : 0;

      setTelemetry({
        latency: parseFloat(
          Math.max(0.3, 1.1 + latencyWeight + Math.random() * 0.3).toFixed(2)
        ),
        vram: parseFloat((8.0 * vramWeight + Math.random() * 0.4).toFixed(2)),
        temp: Math.floor(currentProject.tempBase + tempWeight + Math.random() * 4),
        threads: isOverclocked
          ? 32
          : Math.floor(14 + Math.random() * 8) +
            Math.floor(currentProject.panels / 2),
      });
    }, 800);
    return () => clearInterval(interval);
  }, [selectedProjectId, isOverclocked]);

  // Clean up audio and animation frames on unmount
  React.useEffect(() => {
    return () => {
      stopProceduralMusic();
    };
  }, []);

  // Procedural lo-fi / retro beat loop sequencer using Web Audio API
  const startProceduralMusic = () => {
    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      // Master gain node
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volumeRef.current / 500, ctx.currentTime);
      masterGainRef.current = masterGain;

      masterGain.connect(analyser);
      analyser.connect(ctx.destination);

      let step = 0;

      const playStep = () => {
        if (!audioCtxRef.current) return;
        const time = ctx.currentTime;
        const activeSoundPreset = SOUND_PRESETS[presetRef.current];
        const chordIdx = Math.floor(step / 8) % activeSoundPreset.chords.length;
        const currentChord = activeSoundPreset.chords[chordIdx];

        // 1. Play Soft Pad Chord Node
        if (step % 4 === 0) {
          currentChord.forEach((freq) => {
            const osc = ctx.createOscillator();
            osc.type = activeSoundPreset.oscType;
            osc.frequency.setValueAtTime(freq, time);

            const filter = ctx.createBiquadFilter();
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(
              presetRef.current === "retro"
                ? 1000
                : presetRef.current === "techno"
                ? 800
                : 350,
              time
            );

            const oscGain = ctx.createGain();
            oscGain.gain.setValueAtTime(0, time);
            oscGain.gain.linearRampToValueAtTime(0.18, time + 0.3);
            oscGain.gain.exponentialRampToValueAtTime(
              0.001,
              time + (presetRef.current === "space" ? 3.0 : 1.8)
            );

            osc.connect(filter);
            filter.connect(oscGain);
            oscGain.connect(masterGain);

            osc.start(time);
            osc.stop(time + (presetRef.current === "space" ? 3.2 : 2.0));
          });
        }

        // 2. Play snare / noise drum
        if (
          (presetRef.current !== "space" && step % 8 === 4) ||
          (presetRef.current === "techno" && step % 4 === 2)
        ) {
          const bufferSize = ctx.sampleRate * 0.12;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }

          const noiseNode = ctx.createBufferSource();
          noiseNode.buffer = buffer;

          const noiseFilter = ctx.createBiquadFilter();
          noiseFilter.type = "bandpass";
          noiseFilter.frequency.setValueAtTime(
            presetRef.current === "techno" ? 1200 : 900,
            time
          );

          const noiseGain = ctx.createGain();
          noiseGain.gain.setValueAtTime(
            presetRef.current === "techno" ? 0.18 : 0.12,
            time
          );
          noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

          noiseNode.connect(noiseFilter);
          noiseFilter.connect(noiseGain);
          noiseGain.connect(masterGain);

          noiseNode.start(time);
        }

        // 3. Play closed hi-hat / click
        if (step % 2 === 0 && presetRef.current !== "space") {
          const osc = ctx.createOscillator();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(8000, time);

          const oscGain = ctx.createGain();
          oscGain.gain.setValueAtTime(0.05, time);
          oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

          osc.connect(oscGain);
          oscGain.connect(masterGain);
          osc.start(time);
          osc.stop(time + 0.04);
        }

        // 4. Play heavy kick (Techno)
        if (presetRef.current === "techno" && step % 4 === 0) {
          const osc = ctx.createOscillator();
          osc.frequency.setValueAtTime(150, time);
          osc.frequency.exponentialRampToValueAtTime(40, time + 0.15);

          const kickGain = ctx.createGain();
          kickGain.gain.setValueAtTime(0.3, time);
          kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

          osc.connect(kickGain);
          kickGain.connect(masterGain);
          osc.start(time);
          osc.stop(time + 0.17);
        }

        step = (step + 1) % 32;
      };

      const stepDelay = 15000 / tempoRef.current;
      beatsTimerRef.current = setInterval(playStep, stepDelay);
      setIsPlayingMusic(true);
    } catch (e) {
      console.warn("Failed to initialize audio beat sequencer", e);
    }
  };

  const stopProceduralMusic = () => {
    if (beatsTimerRef.current) {
      clearInterval(beatsTimerRef.current);
      beatsTimerRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }
    setIsPlayingMusic(false);
  };

  const toggleMusic = () => {
    if (isPlayingMusic) {
      stopProceduralMusic();
    } else {
      startProceduralMusic();
    }
  };

  // Canvas visualizer loop
  React.useEffect(() => {
    const canvas = canvasVisualizerRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let localAnimId: number;
    const bufferLength = 32;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      localAnimId = requestAnimationFrame(draw);

      const width = (canvas.width = canvas.offsetWidth);
      const height = (canvas.height = canvas.offsetHeight);

      ctx.clearRect(0, 0, width, height);

      if (analyserRef.current && isPlayingMusic) {
        analyserRef.current.getByteFrequencyData(dataArray);
      } else {
        // Slow float placeholder wave
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] =
            20 +
            Math.sin(Date.now() * 0.003 + i * 0.5) * 15 +
            Math.random() * 5;
        }
      }

      ctx.lineWidth = 2.5;
      const grad = ctx.createLinearGradient(0, 0, width, 0);
      grad.addColorStop(0, "rgba(168, 85, 247, 0.7)");
      grad.addColorStop(0.5, "rgba(99, 102, 241, 0.7)");
      grad.addColorStop(1, "rgba(16, 185, 129, 0.7)");
      ctx.strokeStyle = grad;

      ctx.beginPath();
      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const value = dataArray[i] / 255;
        const y =
          height / 2 +
          value * (height * 0.45) * Math.sin(i * 0.25 + Date.now() * 0.006);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.lineTo(width, height / 2);
      ctx.stroke();
    };

    draw();
    return () => cancelAnimationFrame(localAnimId);
  }, [isPlayingMusic]);

  // Sound effect generator for panel pops (Pitch-modulated for combos!)
  const playPopSFX = (pitchMultiplier: number) => {
    try {
      const ctx =
        audioCtxRef.current ||
        new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      const startFreq = 400 + pitchMultiplier * 80;
      osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        startFreq * 2.5,
        ctx.currentTime + 0.12
      );

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch (e) {}
  };

  // Drum Pad Synthesizer triggers
  const playDrumPad = (padType: string) => {
    try {
      const ctx =
        audioCtxRef.current ||
        new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!audioCtxRef.current) {
        audioCtxRef.current = ctx;
      }
      const time = ctx.currentTime;
      const padGain = ctx.createGain();
      padGain.gain.setValueAtTime(synthVolume / 200, time);
      padGain.connect(ctx.destination);

      if (padType === "kick") {
        const osc = ctx.createOscillator();
        osc.frequency.setValueAtTime(160, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.14);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(1.0, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

        osc.connect(gainNode);
        gainNode.connect(padGain);
        osc.start(time);
        osc.stop(time + 0.16);
      } else if (padType === "snare") {
        const bufferSize = ctx.sampleRate * 0.15;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1000, time);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.8, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(padGain);
        noise.start(time);
        noise.stop(time + 0.14);
      } else if (padType === "hat") {
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(9500, time);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.25, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

        osc.connect(gainNode);
        gainNode.connect(padGain);
        osc.start(time);
        osc.stop(time + 0.05);
      } else if (padType === "cowbell") {
        const osc1 = ctx.createOscillator();
        osc1.type = "square";
        osc1.frequency.setValueAtTime(540, time);

        const osc2 = ctx.createOscillator();
        osc2.type = "square";
        osc2.frequency.setValueAtTime(800, time);

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1100, time);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.4, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(padGain);

        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + 0.23);
        osc2.stop(time + 0.23);
      } else if (padType === "laser") {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(2000, time);
        osc.frequency.exponentialRampToValueAtTime(60, time + 0.25);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.35, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

        osc.connect(gainNode);
        gainNode.connect(padGain);
        osc.start(time);
        osc.stop(time + 0.26);
      } else if (padType === "synth") {
        const chordFreqs = [261.63, 329.63, 392.00, 523.25]; // C major
        chordFreqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, time);

          const gainNode = ctx.createGain();
          gainNode.gain.setValueAtTime(0.2, time);
          gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.5 + idx * 0.08);

          osc.connect(gainNode);
          gainNode.connect(padGain);
          osc.start(time + idx * 0.03);
          osc.stop(time + 0.7);
        });
      }
    } catch (e) {}
  };

  // Keyboard bindings for drum pads (keys 1 to 6)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keys = ["1", "2", "3", "4", "5", "6"];
      const pads = ["kick", "snare", "hat", "cowbell", "laser", "synth"];
      const index = keys.indexOf(e.key);
      if (index !== -1) {
        e.preventDefault();
        playDrumPad(pads[index]);
        // Trigger temporary visual highlight
        const btn = document.getElementById(`drumpad-btn-${pads[index]}`);
        if (btn) {
          btn.classList.add("scale-95", "bg-purple-500/40", "border-purple-400");
          setTimeout(() => {
            btn.classList.remove(
              "scale-95",
              "bg-purple-500/40",
              "border-purple-400"
            );
          }, 150);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [synthVolume]);

  // Game timer countdown tick
  React.useEffect(() => {
    if (activeTab !== "game" || gameTimer <= 0) return;
    const timer = setInterval(() => {
      setGameTimer((prev) => {
        if (prev <= 1) {
          setGameHighScore((oldHigh) => {
            if (gameScore > oldHigh) {
              try {
                localStorage.setItem(
                  "anivox_pre_render_high_score",
                  gameScore.toString()
                );
              } catch (e) {}
              return gameScore;
            }
            return oldHigh;
          });
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTab, gameTimer, gameScore]);

  // Power-up countdown and Auto-Popper logic
  React.useEffect(() => {
    if (powerUpTimeLeft <= 0) {
      setActivePowerUp(null);
      return;
    }
    const timer = setInterval(() => {
      setPowerUpTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [powerUpTimeLeft]);

  React.useEffect(() => {
    if (activePowerUp !== "auto-pop" || poppers.length === 0 || gameTimer <= 0)
      return;

    const interval = setInterval(() => {
      setPoppers((prev) => {
        if (prev.length === 0) return prev;
        const target = prev.find((p) => !p.isBomb) || prev[0];
        if (target.isBomb) return prev; // Do not auto-pop bombs!
        playPopSFX(2);
        setGameScore((s) => s + 15);
        return prev.filter((p) => p.id !== target.id);
      });
    }, 600);

    return () => clearInterval(interval);
  }, [activePowerUp, poppers, gameTimer]);

  // Game Spawner
  React.useEffect(() => {
    if (activeTab !== "game" || gameTimer <= 0) return;

    let spawnDelay = 850;
    if (gameDifficulty === "easy") spawnDelay = 1200;
    if (gameDifficulty === "chaos") spawnDelay = 400;

    const interval = setInterval(() => {
      setPoppers((prev) => {
        if (prev.length >= 8) return prev;
        popperIdCounter.current += 1;

        const isBomb = Math.random() < (gameDifficulty === "chaos" ? 0.35 : 0.18);
        const isGolden = !isBomb && Math.random() < 0.25;
        const isPowerUp = !isBomb && !isGolden && Math.random() < 0.15;
        const type = Math.random() < 0.5 ? "auto-pop" : "double-score";

        let baseSpeed = Math.random() * 1.5 + 1.0;
        if (gameDifficulty === "easy") baseSpeed *= 0.75;
        if (gameDifficulty === "chaos") baseSpeed *= 1.8;
        if (isGolden) baseSpeed *= 1.5;

        return [
          ...prev,
          {
            id: popperIdCounter.current,
            x: Math.random() * 80 + 10,
            y: 100,
            scale: isGolden
              ? 0.8
              : isBomb
              ? 1.1
              : Math.random() * 0.2 + 0.9,
            speed: baseSpeed,
            hue: isBomb ? 0 : isGolden ? 50 : Math.random() * 360,
            isPowerUp,
            type,
            isBomb,
            isGolden,
          },
        ];
      });
    }, spawnDelay);

    return () => clearInterval(interval);
  }, [activeTab, gameTimer, gameDifficulty]);

  // Game Animation ticks
  React.useEffect(() => {
    if (activeTab !== "game" || poppers.length === 0) return;

    const interval = setInterval(() => {
      setPoppers((prev) =>
        prev.map((p) => ({ ...p, y: p.y - p.speed })).filter((p) => p.y > -20)
      );
    }, 25);

    return () => clearInterval(interval);
  }, [activeTab, poppers]);

  const handlePop = (id: number) => {
    const popped = poppers.find((p) => p.id === id);
    if (!popped) return;

    if (popped.isBomb) {
      // Trigger Explosion sound & Screen Shake
      playPopSFX(-3);
      setIsScreenShaking(true);
      setTimeout(() => setIsScreenShaking(false), 450);
      setGameScore((prev) => Math.max(0, prev - 30));
      setComboCount(0);
      setPoppers((prev) => prev.filter((p) => p.id !== id));
      return;
    }

    const now = Date.now();
    let newCombo = 1;
    if (now - lastPopTime < 1200) {
      newCombo = Math.min(5, comboCount + 1);
    }

    setComboCount(newCombo);
    setLastPopTime(now);
    playPopSFX(newCombo);

    if (popped.isPowerUp && popped.type) {
      setActivePowerUp(popped.type);
      setPowerUpTimeLeft(6);
    } else {
      let points = popped.isGolden ? 50 : 10;
      let multiplier = newCombo;
      if (activePowerUp === "double-score") {
        multiplier *= 2;
      }
      setGameScore((prev) => prev + points * multiplier);
    }

    setPoppers((prev) => prev.filter((p) => p.id !== id));
  };

  const handleRestartGame = () => {
    setGameScore(0);
    setGameTimer(30);
    setComboCount(0);
    setPoppers([]);
  };

  // Terminal simulated logging feed
  React.useEffect(() => {
    if (activeTab !== "terminal" || matrixActive) return;

    const logs = [
      "[SYSTEM] Loading computer vision segmenters...",
      "[CV] Row-wise background pixel variance scanner online.",
      "[API] Fetching high-resolution webtoon strip tiles...",
      "[CV] Analyzing strip dimensions: 800px x 14200px...",
      `[CV] Isolated panels for current Webtoon: ${currentProject.name}`,
      `[CV] Detected ${currentProject.panels} panel bounding rectangles.`,
      `[AI] OCR translation target: ${currentProject.translation}`,
      "[AI] OCR completed successfully in 480ms.",
      "[VOICE] Synthesizing speech stems via EdgeTTS engine...",
      `[AUDIO] Voice tracks generated. Cast profile: ${currentProject.voice}`,
      "[AUDIO] Mixing background sound effects...",
      "[VIDEO] Rendering frames using auto-zoom-pan animations...",
      "[VIDEO] Sticking keyframes to audio beats...",
      "[COMPILER] Compiling final frames into H.264 mp4 stream...",
      "[COMPILER] Injecting audio tracks and sound effects...",
      "[SYSTEM] Pipeline completed successfully. Output ready.",
    ];

    const interval = setInterval(() => {
      setTerminalLogs((prev) => {
        const nextLog = logs[logIndex.current % logs.length];
        logIndex.current += 1;
        return [
          ...prev.slice(-14),
          `[${new Date().toLocaleTimeString()}] ${nextLog}`,
        ];
      });
    }, 1400);

    return () => clearInterval(interval);
  }, [activeTab, selectedProjectId, matrixActive]);

  // Terminal Interactive Command Shell Interpreter
  const handleSendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim().toLowerCase();
    const args = cmd.split(" ");
    const command = args[0];
    const timestamp = new Date().toLocaleTimeString();

    let outputLogs = [`[${timestamp}] anivox-compilation-daemon:~$ ${terminalInput}`];

    if (command === "help") {
      outputLogs.push(
        `[SYSTEM] Available Commands:`,
        ` - help: Shows this help directory.`,
        ` - clear: Clears the terminal screen.`,
        ` - status: Prints detailed hardware and pipeline metrics.`,
        ` - boost: Overclocks computational threads (spikes progress bar speed).`,
        ` - matrix: Renders scrolling digital code rain.`,
        ` - hack-game: Secret cheat to boost Render Popper score +1000.`,
        ` - sound-preset <preset>: Sets background audio loop style (lofi / retro / techno / space).`
      );
    } else if (command === "clear") {
      setTerminalLogs([]);
      setTerminalInput("");
      return;
    } else if (command === "status") {
      outputLogs.push(
        `[STATUS] --- Active Compilation Engine State ---`,
        ` - Project: ${currentProject.name}`,
        ` - Slices: ${currentProject.panels} Detected`,
        ` - Codec: H.264 High Profile / AAC Audio`,
        ` - Target Resolution: ${currentProject.resolution}`,
        ` - GPU State: ${isOverclocked ? "OVERCLOCKED (125% Load)" : "Normal (72% Load)"}`,
        ` - Temp: ${telemetry.temp}°C | VRAM: ${telemetry.vram} GB`,
        ` - Sound preset: ${SOUND_PRESETS[activePreset].name} @ ${synthTempo} BPM`
      );
    } else if (command === "boost" || command === "accelerate") {
      setIsOverclocked(true);
      outputLogs.push(
        `[WARNING] --- OVERCLOCK ACTIVE ---`,
        `[GPU] Boosting core clock to 2100MHz. Fans to 100%.`,
        `[SYSTEM] Compilation process accelerated by 300%.`
      );
    } else if (command === "matrix") {
      setMatrixActive(true);
      outputLogs.push(`[SYSTEM] Initiating digital rain interface...`);
      // Start scrolling matrix simulation
      let count = 0;
      const matrixTimer = setInterval(() => {
        const matrixLine = Array.from({ length: 4 })
          .map(() =>
            Math.random()
              .toString(2)
              .substring(2, 10 + Math.floor(Math.random() * 8))
          )
          .join("   ");
        setTerminalLogs((prev) => [...prev.slice(-14), `[MATRIX] ${matrixLine}`]);
        count += 1;
        if (count >= 15) {
          clearInterval(matrixTimer);
          setMatrixActive(false);
          setTerminalLogs((prev) => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] [SYSTEM] Digital rain connection closed.`,
          ]);
        }
      }, 350);
    } else if (command === "hack-game") {
      setGameScore((s) => s + 1000);
      setActivePowerUp("auto-pop");
      setPowerUpTimeLeft(30);
      outputLogs.push(
        `[CHEAT] Gutter hack active! score +1000. Auto-pop unlocked for 30s.`
      );
    } else if (command === "sound-preset") {
      const targetPreset = args[1] as SoundStyle;
      if (SOUND_PRESETS[targetPreset]) {
        setActivePreset(targetPreset);
        outputLogs.push(
          `[AUDIO] Switched soundtrack preset to: ${SOUND_PRESETS[targetPreset].name}`
        );
      } else {
        outputLogs.push(
          `[ERROR] Invalid preset. Try: lofi, retro, techno, space.`
        );
      }
    } else {
      outputLogs.push(
        `[ERROR] Unknown command: '${command}'. Type 'help' for options.`
      );
    }

    setTerminalLogs((prev) => [...prev.slice(-14), ...outputLogs]);
    setTerminalInput("");
  };

  const displayProgress = progress !== undefined ? progress : simulatedProgress;
  const currentStage =
    PIPELINE_STAGES.find(
      (stage) =>
        displayProgress >= stage.range[0] && displayProgress <= stage.range[1]
    ) || PIPELINE_STAGES[0];

  return (
    <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center p-6 text-center space-y-6 relative overflow-hidden text-white font-sans">
      {/* Decorative premium background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />

      {/* Floating Ambient Synth & Beats Controller panel */}
      <div className="absolute top-6 right-6 z-20 bg-black/60 border border-white/5 rounded-2xl p-3 backdrop-blur-md text-left space-y-2.5 max-w-[210px]">
        <button
          onClick={toggleMusic}
          className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
            isPlayingMusic
              ? "bg-purple-600/20 border-purple-500/30 text-purple-400"
              : "bg-white/5 border-white/5 text-neutral-400 hover:text-white"
          }`}
        >
          <span className="flex items-center gap-1">
            {isPlayingMusic ? (
              <Volume2 className="w-3.5 h-3.5 animate-bounce" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            Beats
          </span>
          <span>{isPlayingMusic ? "ON" : "OFF"}</span>
        </button>

        {/* Soundtrack Preset Selection */}
        <div className="space-y-1 text-[9px] font-bold text-neutral-500 uppercase tracking-wide">
          <span>Preset Soundtrack</span>
          <select
            value={activePreset}
            onChange={(e) => setActivePreset(e.target.value as SoundStyle)}
            className="w-full bg-neutral-900/60 border border-white/5 rounded-lg py-1 px-2 text-[10px] text-white focus:outline-none cursor-pointer"
          >
            <option value="lofi">Lofi Ambient</option>
            <option value="retro">8-Bit Retro</option>
            <option value="techno">Techno Pulse</option>
            <option value="space">Deep Space Drone</option>
          </select>
        </div>

        {/* Volume Sliders */}
        <div className="space-y-1.5 text-[9px] font-bold text-neutral-500 uppercase tracking-wide">
          <div className="flex items-center justify-between">
            <span>Volume</span>
            <span className="text-white font-mono">{synthVolume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={synthVolume}
            onChange={(e) => setSynthVolume(parseInt(e.target.value))}
            className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>

        <div className="space-y-1.5 text-[9px] font-bold text-neutral-500 uppercase tracking-wide">
          <div className="flex items-center justify-between">
            <span>Tempo</span>
            <span className="text-white font-mono">{synthTempo} BPM</span>
          </div>
          <input
            type="range"
            min="60"
            max="140"
            value={synthTempo}
            onChange={(e) => setSynthTempo(parseInt(e.target.value))}
            className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>
      </div>

      {/* Floating Active Webtoon Project Selector */}
      <div className="absolute top-6 left-6 z-20 bg-black/60 border border-white/5 rounded-2xl p-3 backdrop-blur-md text-left space-y-2 max-w-[230px]">
        <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-purple-400 uppercase tracking-wider">
          <FolderOpen className="w-3.5 h-3.5" />
          Active Compilation Context
        </div>

        <div className="space-y-1">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full bg-neutral-900/60 border border-white/5 rounded-lg py-1 px-2 text-[11px] text-white focus:outline-none cursor-pointer font-semibold"
          >
            {SIMULATED_PROJECTS.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>

        {/* Project Metadata Card */}
        <div className="border-t border-white/5 pt-2 space-y-1 text-[9px] text-neutral-400 font-mono">
          <div>
            Genre: <span className="text-white">{currentProject.genre}</span>
          </div>
          <div>
            Panels Sliced:{" "}
            <span className="text-purple-400 font-bold">
              {currentProject.panels}
            </span>
          </div>
          <div>
            Translation:{" "}
            <span className="text-emerald-400">{currentProject.translation}</span>
          </div>
          <div>
            Voice Actor: <span className="text-indigo-400">{currentProject.voice}</span>
          </div>
          <div>
            Aspect Ratio: <span className="text-amber-400">{currentProject.resolution}</span>
          </div>
        </div>
      </div>

      <div className="relative flex flex-col items-center">
        <div className="absolute inset-0 bg-purple-600/25 blur-[55px] rounded-full animate-pulse-slow animate-pulse" />

        {/* Logo Icon */}
        <div className="relative w-20 h-20 rounded-[28px] bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-purple-900/50 animate-bounce-slow">
          <Sparkles className="w-10 h-10 text-white" />
        </div>

        {/* Waveform Visualizer Canvas */}
        <div className="w-48 h-8 relative mt-3.5">
          <canvas
            ref={canvasVisualizerRef}
            className="w-full h-full opacity-60"
          />
        </div>
      </div>

      <div className="space-y-6 max-w-lg w-full relative z-10">
        {/* App Title & Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-2xl font-black tracking-tight text-white uppercase bg-gradient-to-r from-white via-white to-purple-400 bg-clip-text text-transparent">
              Anivox Studio
            </h2>
            {isOverclocked && (
              <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[8px] font-black tracking-widest uppercase animate-pulse">
                Overclocked 3x
              </span>
            )}
          </div>
          <p className="text-purple-400/80 text-xs font-mono tracking-widest uppercase animate-pulse">
            {status}
          </p>
        </div>

        {/* Visual Render Pipeline Steps Indicator */}
        <div className="grid grid-cols-5 gap-1.5 bg-neutral-900/40 p-2 rounded-2xl border border-white/5 relative overflow-hidden">
          {PIPELINE_STAGES.map((stage) => {
            const isCompleted = displayProgress > stage.range[1];
            const isActive =
              displayProgress >= stage.range[0] &&
              displayProgress <= stage.range[1];

            return (
              <button
                key={stage.id}
                onClick={() => setInspectedStageId(stage.id)}
                className={`flex flex-col items-center justify-center py-1.5 rounded-lg border transition-all cursor-pointer ${
                  inspectedStageId === stage.id
                    ? "bg-purple-600/35 border-purple-400 text-white scale-105"
                    : isActive
                    ? "bg-purple-600/20 border-purple-500 text-purple-400 shadow-md shadow-purple-900/10 scale-105"
                    : isCompleted
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-black/20 border-white/5 text-neutral-600"
                }`}
                title={`Click to inspect diagnostic parameters for ${stage.label}`}
              >
                <span className="text-[9px] font-black uppercase tracking-wider">
                  {stage.label}
                </span>
                <div
                  className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                    inspectedStageId === stage.id
                      ? "bg-white"
                      : isActive
                      ? "bg-purple-400 animate-ping"
                      : isCompleted
                      ? "bg-emerald-500"
                      : "bg-neutral-800"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Progress Bar Widget */}
        <div className="space-y-2">
          <div className="relative h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
            <div
              className={`absolute top-0 left-0 h-full bg-gradient-to-r ${
                isOverclocked
                  ? "from-rose-600 via-purple-500 to-amber-500"
                  : "from-purple-600 via-indigo-500 to-emerald-500"
              } transition-all duration-300 rounded-full`}
              style={{ width: `${displayProgress}%` }}
            />
            {progress === undefined && (
              <div className="absolute top-0 left-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
            )}
          </div>

          <div className="flex items-center justify-between text-[9px] font-bold text-neutral-500 uppercase tracking-wider px-1">
            <div className="flex items-center gap-1 text-purple-400/70">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="font-sans font-extrabold">
                {currentStage.desc}
              </span>
            </div>
            <span className="text-white bg-white/5 border border-white/5 px-2 py-0.5 rounded-full font-mono">
              {Math.round(displayProgress)}%
            </span>
          </div>
        </div>

        {/* Stage Inspection details box */}
        {inspectedStageId !== null && (
          <div className="bg-[#0f0f13]/85 border border-purple-500/30 p-4 rounded-2xl text-left text-xs animate-in slide-in-from-top-2 duration-300 relative shadow-xl shadow-purple-900/10">
            <button
              onClick={() => setInspectedStageId(null)}
              className="absolute top-3 right-3 text-neutral-500 hover:text-white p-1 rounded-full cursor-pointer bg-white/5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-extrabold text-purple-400 uppercase text-[10px] tracking-widest">
                <Cpu className="w-3.5 h-3.5 animate-pulse" />
                Diagnostic Parameters:{" "}
                {PIPELINE_STAGES.find((s) => s.id === inspectedStageId)?.label}
              </div>
              <div className="grid grid-cols-2 gap-3 text-[10px] font-mono text-neutral-400 border-t border-white/5 pt-2">
                {inspectedStageId === 1 && (
                  <>
                    <div>
                      Fetch Status: <span className="text-white">200 OK</span>
                    </div>
                    <div>
                      Source Threads:{" "}
                      <span className="text-white">
                        {isOverclocked ? "24 Overclocked Workers" : "8 Async Workers"}
                      </span>
                    </div>
                    <div>
                      Content-Type:{" "}
                      <span className="text-white">image/png / image/webp</span>
                    </div>
                    <div>
                      Total Size:{" "}
                      <span className="text-white">
                        {(currentProject.panels * 0.7).toFixed(1)} MB
                      </span>
                    </div>
                  </>
                )}
                {inspectedStageId === 2 && (
                  <>
                    <div>
                      CV Detector:{" "}
                      <span className="text-white">Gutter-Agnostic CV Sizer</span>
                    </div>
                    <div>
                      Gutter spacing: <span className="text-white">12px min</span>
                    </div>
                    <div>
                      Confidence:{" "}
                      <span className="text-white">99.85% accurate</span>
                    </div>
                    <div>
                      Panel Count:{" "}
                      <span className="text-purple-400 font-bold">
                        {currentProject.panels} bounds detected
                      </span>
                    </div>
                  </>
                )}
                {inspectedStageId === 3 && (
                  <>
                    <div>
                      OCR Model:{" "}
                      <span className="text-white">Gemini 1.5 Flash</span>
                    </div>
                    <div>
                      Target pipeline:{" "}
                      <span className="text-white">{currentProject.translation}</span>
                    </div>
                    <div>
                      Confidence:{" "}
                      <span className="text-white">99.4% OCR accuracy</span>
                    </div>
                    <div>
                      Text blocks:{" "}
                      <span className="text-white">
                        {currentProject.panels * 2} regions
                      </span>
                    </div>
                  </>
                )}
                {inspectedStageId === 4 && (
                  <>
                    <div>
                      TTS Model:{" "}
                      <span className="text-white">EdgeTTS Neural Core</span>
                    </div>
                    <div>
                      Cast Voice:{" "}
                      <span className="text-white">{currentProject.voice}</span>
                    </div>
                    <div>
                      Soundscape:{" "}
                      <span className="text-white">Dynamic cinematic mix</span>
                    </div>
                    <div>
                      Bitrate: <span className="text-white">192kbps MP3</span>
                    </div>
                  </>
                )}
                {inspectedStageId === 5 && (
                  <>
                    <div>
                      Resolution:{" "}
                      <span className="text-white">
                        {currentProject.resolution.split(" ")[0]}
                      </span>
                    </div>
                    <div>
                      Codec: <span className="text-white">H.264 / AAC MP4</span>
                    </div>
                    <div>
                      VBR Bitrate: <span className="text-white">8500 kbps</span>
                    </div>
                    <div>
                      GPU Driver:{" "}
                      <span className="text-emerald-400 font-bold">
                        NVIDIA NVENC CUDA
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Multi-Tab Onscreen Dashboard Widget */}
        <div className="bg-[#0f0f13]/60 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          {/* Header Tabs Navigation */}
          <div className="grid grid-cols-4 border-b border-white/5 bg-black/40 p-1">
            <button
              onClick={() => setActiveTab("tip")}
              className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 text-[10px] font-bold tracking-tight transition-all cursor-pointer ${
                activeTab === "tip"
                  ? "bg-purple-600/10 border border-purple-500/20 text-purple-400"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              💡 Tips
            </button>
            <button
              onClick={() => setActiveTab("drumpad")}
              className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 text-[10px] font-bold tracking-tight transition-all cursor-pointer ${
                activeTab === "drumpad"
                  ? "bg-purple-600/10 border border-purple-500/20 text-purple-400"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              🥁 Synth Pad
            </button>
            <button
              onClick={() => setActiveTab("game")}
              className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 text-[10px] font-bold tracking-tight transition-all cursor-pointer ${
                activeTab === "game"
                  ? "bg-purple-600/10 border border-purple-500/20 text-purple-400"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              🎮 Popper
            </button>
            <button
              onClick={() => setActiveTab("terminal")}
              className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 text-[10px] font-bold tracking-tight transition-all cursor-pointer ${
                activeTab === "terminal"
                  ? "bg-purple-600/10 border border-purple-500/20 text-purple-400"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              💻 Engine logs
            </button>
          </div>

          {/* Tab Content Display Area */}
          <div className="p-4 min-h-[160px] flex flex-col justify-center relative overflow-hidden">
            {activeTab === "tip" && (
              <div className="space-y-1.5 text-left py-1 animate-in fade-in duration-300">
                <span className="text-[9px] font-extrabold tracking-wider uppercase text-purple-400 flex items-center gap-1">
                  💡 Creator Pro Tip
                </span>
                <div className="relative h-14 mt-1">
                  {LOADING_TIPS.map((tip, idx) => {
                    const isActive = idx === activeTipIdx;
                    return (
                      <p
                        key={idx}
                        className={`absolute inset-0 text-neutral-400 text-xs font-medium leading-relaxed transition-all duration-700 ${
                          isActive
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-3 pointer-events-none"
                        }`}
                      >
                        {tip}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "drumpad" && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center justify-between text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 px-1">
                  <span>🎹 Live Synth Pads</span>
                  <span className="text-purple-400">Press keys 1 - 6</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: "kick", label: "🥁 Kick", color: "hover:border-rose-500/40 hover:bg-rose-500/5", key: "1" },
                    { type: "snare", label: "⚡ Snare", color: "hover:border-purple-500/40 hover:bg-purple-500/5", key: "2" },
                    { type: "hat", label: "✨ Hi-Hat", color: "hover:border-indigo-500/40 hover:bg-indigo-500/5", key: "3" },
                    { type: "cowbell", label: "🔔 Cowbell", color: "hover:border-amber-500/40 hover:bg-amber-500/5", key: "4" },
                    { type: "laser", label: "💥 Laser", color: "hover:border-cyan-500/40 hover:bg-cyan-500/5", key: "5" },
                    { type: "synth", label: "🔮 Synth", color: "hover:border-emerald-500/40 hover:bg-emerald-500/5", key: "6" },
                  ].map((pad) => (
                    <button
                      id={`drumpad-btn-${pad.type}`}
                      key={pad.type}
                      onClick={() => playDrumPad(pad.type)}
                      className={`py-3 px-2 rounded-xl bg-black/40 border border-white/5 text-[10px] font-bold tracking-wide uppercase transition-all duration-100 cursor-pointer active:scale-95 flex flex-col items-center justify-center gap-1 ${pad.color}`}
                    >
                      <span>{pad.label}</span>
                      <span className="text-[8px] text-neutral-500 bg-white/5 px-1.5 py-0.2 rounded font-mono">
                        Key {pad.key}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "game" && (
              <div
                className={`relative h-40 w-full bg-black/40 border border-white/5 rounded-xl overflow-hidden select-none animate-in fade-in duration-300 ${
                  isScreenShaking ? "animate-shake" : ""
                }`}
              >
                {/* Game Top HUD */}
                <div className="absolute top-2 inset-x-2 z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-md border border-white/5 text-[9px] font-bold text-purple-400">
                      <Trophy className="w-3 h-3 text-amber-500" />
                      <span>Score: {gameScore}</span>
                    </div>

                    {comboCount > 1 && (
                      <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-md border border-amber-500/20 text-[9px] font-bold">
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span>{comboCount}x Combo!</span>
                      </div>
                    )}
                  </div>

                  {/* Difficulty selector (Only shown before start / restart) */}
                  <div className="flex items-center gap-1.5 bg-black/60 px-1.5 py-0.5 rounded-md border border-white/5 text-[9px] font-bold">
                    <span className="text-neutral-500 uppercase text-[8px]">Diff:</span>
                    <button
                      onClick={() => setGameDifficulty("easy")}
                      className={`px-1 py-0.2 rounded ${
                        gameDifficulty === "easy" ? "bg-emerald-500/20 text-emerald-400" : "text-neutral-400"
                      }`}
                    >
                      Easy
                    </button>
                    <button
                      onClick={() => setGameDifficulty("normal")}
                      className={`px-1 py-0.2 rounded ${
                        gameDifficulty === "normal" ? "bg-purple-500/20 text-purple-400" : "text-neutral-400"
                      }`}
                    >
                      Med
                    </button>
                    <button
                      onClick={() => setGameDifficulty("chaos")}
                      className={`px-1 py-0.2 rounded ${
                        gameDifficulty === "chaos" ? "bg-rose-500/20 text-rose-400 animate-pulse" : "text-neutral-400"
                      }`}
                    >
                      Chaos
                    </button>
                  </div>

                  <div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-md border border-white/5 text-[9px] font-bold text-neutral-400 font-mono">
                    <Clock className="w-3 h-3 text-neutral-400" />
                    <span>{gameTimer}s</span>
                  </div>
                </div>

                {activePowerUp && (
                  <div className="absolute bottom-2 inset-x-2 z-10 flex items-center justify-center">
                    <div className="bg-amber-500 text-black px-2.5 py-0.5 rounded-full text-[8px] font-extrabold tracking-wider uppercase animate-pulse flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-black text-black" />
                      <span>
                        POWER-UP: {activePowerUp.toUpperCase()} ({powerUpTimeLeft}s)
                      </span>
                    </div>
                  </div>
                )}

                {gameTimer <= 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-black/70 animate-in fade-in">
                    <Trophy className="w-8 h-8 text-amber-500 animate-bounce mb-2" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider block">
                      Game Finished!
                    </span>
                    <span className="text-[10px] text-neutral-400 block mt-1">
                      Final Score: {gameScore} • High Score: {gameHighScore}
                    </span>
                    <button
                      onClick={handleRestartGame}
                      className="mt-3 bg-purple-600 hover:bg-purple-500 text-white font-bold py-1 px-4 rounded-lg text-[10px] transition-all cursor-pointer active:scale-95"
                    >
                      Play Again
                    </button>
                  </div>
                ) : (
                  poppers.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handlePop(p.id)}
                      className={`absolute p-2 rounded-lg border hover:scale-105 active:scale-95 transition-all text-white text-[9px] font-bold shadow-lg cursor-pointer ${
                        p.isBomb
                          ? "bg-rose-500/20 border-rose-500/60 shadow-rose-500/10"
                          : p.isGolden
                          ? "bg-amber-500 text-black border-amber-400 shadow-amber-500/20"
                          : p.isPowerUp
                          ? "bg-purple-500/20 border-purple-400 shadow-purple-500/20 animate-pulse"
                          : "bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border-purple-500/40 hover:border-purple-400"
                      }`}
                      style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        transform: `translate(-50%, -50%) scale(${p.scale})`,
                        borderColor: p.isBomb
                          ? undefined
                          : p.isGolden
                          ? undefined
                          : p.isPowerUp
                          ? undefined
                          : `hsl(${p.hue}, 70%, 50%)`,
                        backgroundColor: p.isBomb
                          ? undefined
                          : p.isGolden
                          ? undefined
                          : p.isPowerUp
                          ? undefined
                          : `hsl(${p.hue}, 60%, 20%, 0.15)`,
                      }}
                    >
                      <span className="flex items-center gap-1">
                        {p.isBomb ? (
                          <>
                            <Bomb className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
                            Gutter Bomb
                          </>
                        ) : p.isGolden ? (
                          <>
                            <Award className="w-2.5 h-2.5 fill-black" />
                            Gold Panel (+50)
                          </>
                        ) : p.isPowerUp ? (
                          <>
                            <Zap className="w-2.5 h-2.5 fill-purple-400 text-purple-400" />
                            {p.type === "auto-pop" ? "Auto-Pop" : "Double Pt"}
                          </>
                        ) : (
                          <>
                            <Maximize2 className="w-2.5 h-2.5 text-neutral-400" />
                            Panel
                          </>
                        )}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}

            {activeTab === "terminal" && (
              <div className="w-full bg-black/80 rounded-xl border border-white/5 p-3 text-[10px] font-mono text-neutral-400 text-left h-44 flex flex-col justify-between animate-in fade-in duration-300">
                <div className="overflow-y-auto space-y-1 flex-1 mb-2 select-text selection:bg-purple-950">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
                    <Activity className="w-3.5 h-3.5 animate-pulse" />
                    <span>anivox-compilation-daemon --verbose</span>
                  </div>
                  {terminalLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`${
                        log.includes("completed") || log.includes("Daemon:") || log.includes("daemon:")
                          ? "text-emerald-400"
                          : log.includes("MATRIX")
                          ? "text-emerald-500 font-bold matrix-text"
                          : log.includes("Detected") || log.includes("Active Project:")
                          ? "text-indigo-300"
                          : log.includes("CHEAT") || log.includes("cheat")
                          ? "text-amber-400 font-black"
                          : log.includes("WARNING") || log.includes("warning")
                          ? "text-rose-400 animate-pulse font-bold"
                          : "text-neutral-500"
                      }`}
                    >
                      {log}
                    </div>
                  ))}
                </div>

                {/* Interactive Console Shell Input */}
                <form
                  onSubmit={handleSendCommand}
                  className="flex items-center gap-1.5 border-t border-white/5 pt-2"
                >
                  <span className="text-purple-400 font-extrabold shrink-0">
                    Anivox-Daemon:~$
                  </span>
                  <input
                    type="text"
                    disabled={matrixActive}
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    placeholder={
                      matrixActive
                        ? "Streaming rain..."
                        : "Type 'help', 'status', 'boost', 'matrix'..."
                    }
                    className="bg-transparent border-none text-white focus:outline-none focus:ring-0 text-[10px] font-mono w-full placeholder:text-neutral-600"
                  />
                  <button
                    type="submit"
                    className="p-1 hover:text-white text-neutral-500 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Floating GPU-accelerated telemetry monitor */}
        <div className="grid grid-cols-4 gap-2 bg-[#09090c]/60 p-3.5 rounded-2xl border border-white/5 text-[9px] font-bold text-neutral-400 text-left shadow-lg">
          <div className="space-y-0.5">
            <span className="text-[8px] text-neutral-500 block uppercase">
              CUDA Latency
            </span>
            <span className="text-purple-400 font-mono">
              {telemetry.latency}ms
            </span>
          </div>
          <div className="space-y-0.5 border-l border-white/5 pl-2.5">
            <span className="text-[8px] text-neutral-500 block uppercase">
              VRAM Allocation
            </span>
            <span className="text-indigo-400 font-mono">
              {telemetry.vram}GB
            </span>
          </div>
          <div className="space-y-0.5 border-l border-white/5 pl-2.5">
            <span className="text-[8px] text-neutral-500 block uppercase">
              GPU Temp
            </span>
            <span className={`font-mono ${telemetry.temp > 75 ? "text-rose-400 animate-pulse" : "text-amber-500"}`}>
              {telemetry.temp}°C
            </span>
          </div>
          <div className="space-y-0.5 border-l border-white/5 pl-2.5">
            <span className="text-[8px] text-neutral-500 block uppercase">
              Compute Cores
            </span>
            <span className="text-emerald-400 font-mono">
              {telemetry.threads} Cores
            </span>
          </div>
        </div>
      </div>

      {/* Footer message */}
      <div className="absolute bottom-6 left-0 right-0 z-10">
        <p className="text-neutral-600 text-[10px] uppercase font-black tracking-[0.25em]">
          Built for the future of webcomics
        </p>
      </div>

      {/* Embed stylesheet in JSX */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shimmer {
          animation: shimmer 2.5s infinite linear;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3.5s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.55; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        @keyframes shake {
          0%, 100% { transform: translate(0, 0); }
          10%, 30%, 50%, 70%, 90% { transform: translate(-4px, 2px); }
          20%, 40%, 60%, 80% { transform: translate(4px, -2px); }
        }
        .animate-shake {
          animation: shake 0.45s ease-in-out;
        }
      `,
        }}
      />
    </div>
  );
}
