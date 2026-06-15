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
  X
} from "lucide-react";

interface LoadingPageProps {
  status?: string;
  progress?: number;
}

const LOADING_TIPS = [
  "Did you know? Anivox uses advanced variance-based CV row scanning to isolate webtoon panels.",
  "Tip: Adjust the sensitivity slider in edit mode if panels have thin borders or extra spacing.",
  "Tip: Zoom and pan camera paths can be customized to follow action panels dynamically.",
  "Did you know? You can translate comic scripts into multiple languages using Gemini AI in the storyboard.",
  "Tip: Multi-character dialogue tracks are auto-generated and aligned with voiceover speech rate.",
  "Connecting to GPU-accelerated video compilation modules...",
  "Rendering keyframes, layering audio mixers, and synthesizing voice tracks..."
];

const PIPELINE_STAGES = [
  { id: 1, label: "Scraping", range: [0, 20], desc: "Retrieving webtoon strip" },
  { id: 2, label: "CV Slicing", range: [21, 45], desc: "Detecting panel gutters" },
  { id: 3, label: "AI Translate", range: [46, 65], desc: "OCR & script translations" },
  { id: 4, label: "Audio Mix", range: [66, 85], desc: "Narration & soundscapes" },
  { id: 5, label: "Compile", range: [86, 100], desc: "Compiling MP4 video stream" }
];

export default function LoadingPage({
  status = "Connecting to Computational Engine...",
  progress,
}: LoadingPageProps) {
  // Local simulated progress for active bar updates
  const [simulatedProgress, setSimulatedProgress] = React.useState(10);
  const [activeTipIdx, setActiveTipIdx] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState<"tip" | "game" | "terminal">("tip");

  // Audio synthesis state
  const [isPlayingMusic, setIsPlayingMusic] = React.useState(false);
  const [synthVolume, setSynthVolume] = React.useState(35); // 0-100%
  const [synthTempo, setSynthTempo] = React.useState(80); // BPM
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const beatsTimerRef = React.useRef<any>(null);
  const masterGainRef = React.useRef<GainNode | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const canvasVisualizerRef = React.useRef<HTMLCanvasElement | null>(null);

  const volumeRef = React.useRef(35);
  const tempoRef = React.useRef(80);

  // Sync volume state to ref
  React.useEffect(() => {
    volumeRef.current = synthVolume;
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(synthVolume / 500, audioCtxRef.current.currentTime);
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

  // Mini-game state
  const [gameScore, setGameScore] = React.useState(0);
  const [gameHighScore, setGameHighScore] = React.useState(() => {
    try {
      return parseInt(localStorage.getItem("anivox_pre_render_high_score") || "0");
    } catch(e) { return 0; }
  });
  const [comboCount, setComboCount] = React.useState(0);
  const [lastPopTime, setLastPopTime] = React.useState(0);
  const [gameTimer, setGameTimer] = React.useState(30);
  const [poppers, setPoppers] = React.useState<{ id: number; x: number; y: number; scale: number; speed: number; hue: number; isPowerUp?: boolean; type?: string }[]>([]);
  const popperIdCounter = React.useRef(0);

  // Power Up state
  const [activePowerUp, setActivePowerUp] = React.useState<string | null>(null);
  const [powerUpTimeLeft, setPowerUpTimeLeft] = React.useState(0);

  // Pipeline stage inspection
  const [inspectedStageId, setInspectedStageId] = React.useState<number | null>(null);

  // Telemetry status state
  const [telemetry, setTelemetry] = React.useState({
    latency: 1.2,
    vram: 8.2,
    temp: 64,
    threads: 18
  });

  // Terminal log simulation state
  const [terminalLogs, setTerminalLogs] = React.useState<string[]>([
    "[SYSTEM] Initiating compilation environment...",
    "[GPU] Found NVIDIA CUDA v12.1 runtime core.",
    "[DOCKER] Spawning container instance for ffmpeg-codec..."
  ]);
  const logIndex = React.useRef(0);

  // Auto-increment progress slowly if parent doesn't provide a real progress value
  React.useEffect(() => {
    if (progress !== undefined) return;
    
    const interval = setInterval(() => {
      setSimulatedProgress((prev) => {
        if (prev >= 99) return 99;
        const increment = (99 - prev) * 0.035;
        return Math.min(99, prev + Math.max(0.1, increment));
      });
    }, 250);

    return () => clearInterval(interval);
  }, [progress]);

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
      setTelemetry({
        latency: parseFloat((1.1 + Math.random() * 0.3).toFixed(2)),
        vram: parseFloat((8.0 + Math.random() * 0.4).toFixed(2)),
        temp: Math.floor(62 + Math.random() * 5),
        threads: Math.floor(14 + Math.random() * 8)
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // Clean up audio and animation frames on unmount
  React.useEffect(() => {
    return () => {
      stopProceduralMusic();
    };
  }, []);

  // Procedural lo-fi beat loop sequencer using Web Audio API
  const startProceduralMusic = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
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
      const chords = [
        [110.00, 130.81, 164.81, 220.00], // Am
        [87.31, 110.00, 130.81, 174.61],  // F
        [65.41, 98.00, 130.81, 164.81],   // C
        [98.00, 123.47, 146.83, 196.00]   // G
      ];

      const playStep = () => {
        if (!audioCtxRef.current) return;
        const time = ctx.currentTime;
        const chordIdx = Math.floor(step / 8) % chords.length;
        const currentChord = chords[chordIdx];

        // 1. Play Soft Pad Chord Node
        if (step % 4 === 0) {
          currentChord.forEach((freq) => {
            const osc = ctx.createOscillator();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, time);

            const filter = ctx.createBiquadFilter();
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(350, time);

            const oscGain = ctx.createGain();
            oscGain.gain.setValueAtTime(0, time);
            oscGain.gain.linearRampToValueAtTime(0.18, time + 0.3);
            oscGain.gain.exponentialRampToValueAtTime(0.001, time + 1.8);

            osc.connect(filter);
            filter.connect(oscGain);
            oscGain.connect(masterGain);

            osc.start(time);
            osc.stop(time + 1.9);
          });
        }

        // 2. Play soft snare noise drum
        if (step % 8 === 4) {
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
          noiseFilter.frequency.setValueAtTime(900, time);

          const noiseGain = ctx.createGain();
          noiseGain.gain.setValueAtTime(0.12, time);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

          noiseNode.connect(noiseFilter);
          noiseFilter.connect(noiseGain);
          noiseGain.connect(masterGain);

          noiseNode.start(time);
        }

        // 3. Play closed hi-hat click
        if (step % 2 === 0) {
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
      try { audioCtxRef.current.close(); } catch(e){}
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
      
      const width = canvas.width = canvas.offsetWidth;
      const height = canvas.height = canvas.offsetHeight;
      
      ctx.clearRect(0, 0, width, height);
      
      if (analyserRef.current && isPlayingMusic) {
        analyserRef.current.getByteFrequencyData(dataArray);
      } else {
        // Slow float placeholder wave
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = 20 + Math.sin(Date.now() * 0.003 + i * 0.5) * 15 + Math.random() * 5;
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
        const y = height/2 + (value * (height * 0.45) * Math.sin(i * 0.25 + Date.now() * 0.006));
        
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
      const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      const startFreq = 400 + (pitchMultiplier * 80);
      osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(startFreq * 2.5, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch (e){}
  };

  // Game timer countdown tick
  React.useEffect(() => {
    if (activeTab !== "game" || gameTimer <= 0) return;
    const timer = setInterval(() => {
      setGameTimer((prev) => {
        if (prev <= 1) {
          setGameHighScore((oldHigh) => {
            if (gameScore > oldHigh) {
              try {
                localStorage.setItem("anivox_pre_render_high_score", gameScore.toString());
              } catch(e){}
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
    if (activePowerUp !== "auto-pop" || poppers.length === 0 || gameTimer <= 0) return;
    
    const interval = setInterval(() => {
      setPoppers((prev) => {
        if (prev.length === 0) return prev;
        const target = prev[0];
        playPopSFX(2);
        setGameScore((s) => s + 15);
        return prev.filter(p => p.id !== target.id);
      });
    }, 700);

    return () => clearInterval(interval);
  }, [activePowerUp, poppers, gameTimer]);

  // Game Spawner
  React.useEffect(() => {
    if (activeTab !== "game" || gameTimer <= 0) return;

    const interval = setInterval(() => {
      setPoppers((prev) => {
        if (prev.length >= 6) return prev;
        popperIdCounter.current += 1;
        const isPowerUp = Math.random() < 0.20;
        const type = Math.random() < 0.5 ? "auto-pop" : "double-score";
        return [
          ...prev,
          {
            id: popperIdCounter.current,
            x: Math.random() * 80 + 10,
            y: 100,
            scale: Math.random() * 0.2 + 0.9,
            speed: Math.random() * 1.5 + 1.0,
            hue: isPowerUp ? 50 : Math.random() * 360,
            isPowerUp,
            type
          }
        ];
      });
    }, 850);

    return () => clearInterval(interval);
  }, [activeTab, gameTimer]);

  // Game Animation ticks
  React.useEffect(() => {
    if (activeTab !== "game" || poppers.length === 0) return;

    const interval = setInterval(() => {
      setPoppers((prev) => 
        prev
          .map(p => ({ ...p, y: p.y - p.speed }))
          .filter(p => p.y > -20)
      );
    }, 25);

    return () => clearInterval(interval);
  }, [activeTab, poppers]);

  const handlePop = (id: number) => {
    const popped = poppers.find(p => p.id === id);
    if (!popped) return;

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
      let multiplier = newCombo;
      if (activePowerUp === "double-score") {
        multiplier *= 2;
      }
      setGameScore((prev) => prev + (10 * multiplier));
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
    if (activeTab !== "terminal") return;

    const logs = [
      "[SYSTEM] Loading computer vision segmenters...",
      "[CV] Row-wise background pixel variance scanner online.",
      "[API] Fetching high-resolution webtoon strip tiles...",
      "[CV] Analyzing strip dimensions: 800px x 14200px...",
      "[CV] Detected 12 panel bounding rectangles.",
      "[CV] Aligning vertical gutter crop bounds (padding=12px)...",
      "[AI] Calling Gemini API for speech bubble text OCR...",
      "[AI] OCR completed successfully in 480ms.",
      "[AI] Character profiles identified: 'Hero', 'Antagonist'.",
      "[VOICE] Synthesizing speech stems via EdgeTTS engine...",
      "[AUDIO] Voice tracks generated for character dialogue.",
      "[AUDIO] Mixing background sound effects: 'Wind_Ambiance.mp3'...",
      "[VIDEO] Rendering frames using auto-zoom-pan animations...",
      "[VIDEO] Sticking keyframes to audio beats...",
      "[COMPILER] Compiling final frames into H.264 mp4 stream...",
      "[COMPILER] Injecting audio tracks and sound effects...",
      "[SYSTEM] Pipeline completed successfully. Output ready."
    ];

    const interval = setInterval(() => {
      setTerminalLogs(prev => {
        const nextLog = logs[logIndex.current % logs.length];
        logIndex.current += 1;
        return [...prev.slice(-14), `[${new Date().toLocaleTimeString()}] ${nextLog}`];
      });
    }, 1400);

    return () => clearInterval(interval);
  }, [activeTab]);

  const displayProgress = progress !== undefined ? progress : simulatedProgress;
  const currentStage = PIPELINE_STAGES.find(
    (stage) => displayProgress >= stage.range[0] && displayProgress <= stage.range[1]
  ) || PIPELINE_STAGES[0];

  return (
    <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center p-6 text-center space-y-6 relative overflow-hidden text-white font-sans">
      
      {/* Decorative premium background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />
      
      {/* Floating Ambient Synth & Beats Controller panel */}
      <div className="absolute top-6 right-6 z-20 bg-black/60 border border-white/5 rounded-2xl p-3 backdrop-blur-md text-left space-y-2.5 max-w-[200px]">
        <button
          onClick={toggleMusic}
          className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
            isPlayingMusic 
              ? "bg-purple-600/20 border-purple-500/30 text-purple-400" 
              : "bg-white/5 border-white/5 text-neutral-400 hover:text-white"
          }`}
        >
          <span className="flex items-center gap-1">
            {isPlayingMusic ? <Volume2 className="w-3.5 h-3.5 animate-bounce" /> : <VolumeX className="w-3.5 h-3.5" />}
            Beats
          </span>
          <span>{isPlayingMusic ? "ON" : "OFF"}</span>
        </button>
        
        {/* Sliders */}
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

      <div className="relative flex flex-col items-center">
        <div className="absolute inset-0 bg-purple-600/25 blur-[55px] rounded-full animate-pulse-slow animate-pulse" />

        {/* Logo Icon */}
        <div className="relative w-20 h-20 rounded-[28px] bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-purple-900/50 animate-bounce-slow">
          <Sparkles className="w-10 h-10 text-white" />
        </div>

        {/* Waveform Visualizer Canvas */}
        <div className="w-48 h-8 relative mt-3.5">
          <canvas ref={canvasVisualizerRef} className="w-full h-full opacity-60" />
        </div>
      </div>

      <div className="space-y-6 max-w-md w-full relative z-10">
        
        {/* App Title & Status */}
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-white uppercase bg-gradient-to-r from-white via-white to-purple-400 bg-clip-text text-transparent">
            Anivox Studio
          </h2>
          <p className="text-purple-400/80 text-xs font-mono tracking-widest uppercase animate-pulse">
            {status}
          </p>
        </div>

        {/* Visual Render Pipeline Steps Indicator */}
        <div className="grid grid-cols-5 gap-1.5 bg-neutral-900/40 p-2 rounded-2xl border border-white/5 relative overflow-hidden">
          {PIPELINE_STAGES.map((stage) => {
            const isCompleted = displayProgress > stage.range[1];
            const isActive = displayProgress >= stage.range[0] && displayProgress <= stage.range[1];
            
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
                <span className="text-[9px] font-black uppercase tracking-wider">{stage.label}</span>
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                  inspectedStageId === stage.id
                    ? "bg-white"
                    : isActive 
                    ? "bg-purple-400 animate-ping" 
                    : isCompleted 
                    ? "bg-emerald-500" 
                    : "bg-neutral-800"
                }`} />
              </button>
            );
          })}
        </div>

        {/* Progress Bar Widget */}
        <div className="space-y-2">
          <div className="relative h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${displayProgress}%` }}
            />
            {progress === undefined && (
              <div className="absolute top-0 left-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
            )}
          </div>

          <div className="flex items-center justify-between text-[9px] font-bold text-neutral-500 uppercase tracking-wider px-1">
            <div className="flex items-center gap-1 text-purple-400/70">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="font-sans font-extrabold">{currentStage.desc}</span>
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
                Diagnostic Parameters: {PIPELINE_STAGES.find(s => s.id === inspectedStageId)?.label}
              </div>
              <div className="grid grid-cols-2 gap-3 text-[10px] font-mono text-neutral-400 border-t border-white/5 pt-2">
                {inspectedStageId === 1 && (
                  <>
                    <div>Fetch Status: <span className="text-white">200 OK</span></div>
                    <div>Source Threads: <span className="text-white">8 Async Workers</span></div>
                    <div>Content-Type: <span className="text-white">image/png</span></div>
                    <div>Total Size: <span className="text-white">12.4 MB</span></div>
                  </>
                )}
                {inspectedStageId === 2 && (
                  <>
                    <div>CV Detector: <span className="text-white">Variance CV Sizer</span></div>
                    <div>Gutter size: <span className="text-white">18px min</span></div>
                    <div>Confidence: <span className="text-white">99.8% accurate</span></div>
                    <div>Panel Count: <span className="text-white">12 bounds detected</span></div>
                  </>
                )}
                {inspectedStageId === 3 && (
                  <>
                    <div>OCR Model: <span className="text-white">Gemini 1.5 Flash</span></div>
                    <div>Target language: <span className="text-white">KR -&gt; EN / JA</span></div>
                    <div>Confidence: <span className="text-white">99.2% OCR accuracy</span></div>
                    <div>Text blocks: <span className="text-white">24 regions</span></div>
                  </>
                )}
                {inspectedStageId === 4 && (
                  <>
                    <div>TTS Model: <span className="text-white">EdgeTTS Neural</span></div>
                    <div>Pitch Variance: <span className="text-white">Matched (0.85)</span></div>
                    <div>Soundscape: <span className="text-white">Ambient Winds</span></div>
                    <div>Bitrate: <span className="text-white">192kbps MP3</span></div>
                  </>
                )}
                {inspectedStageId === 5 && (
                  <>
                    <div>Resolution: <span className="text-white">1080p @ 60fps</span></div>
                    <div>Codec: <span className="text-white">H.264 / AAC</span></div>
                    <div>VBR Bitrate: <span className="text-white">8500 kbps</span></div>
                    <div>GPU Driver: <span className="text-white">NVIDIA NVENC CUDA</span></div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Multi-Tab Onscreen Dashboard Widget */}
        <div className="bg-[#0f0f13]/60 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          
          {/* Header Tabs Navigation */}
          <div className="grid grid-cols-3 border-b border-white/5 bg-black/40 p-1">
            <button
              onClick={() => setActiveTab("tip")}
              className={`py-2 px-1.5 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-tight transition-all cursor-pointer ${
                activeTab === "tip"
                  ? "bg-purple-600/10 border border-purple-500/20 text-purple-400"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              💡 Creator Tips
            </button>
            <button
              onClick={() => setActiveTab("game")}
              className={`py-2 px-1.5 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-tight transition-all cursor-pointer ${
                activeTab === "game"
                  ? "bg-purple-600/10 border border-purple-500/20 text-purple-400"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              🎮 Render Popper
            </button>
            <button
              onClick={() => setActiveTab("terminal")}
              className={`py-2 px-1.5 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-tight transition-all cursor-pointer ${
                activeTab === "terminal"
                  ? "bg-purple-600/10 border border-purple-500/20 text-purple-400"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              💻 Engine Logs
            </button>
          </div>

          {/* Tab Content Display Area */}
          <div className="p-4 min-h-[150px] flex flex-col justify-center relative overflow-hidden">
            
            {activeTab === "tip" && (
              <div className="space-y-1.5 text-left py-1 animate-in fade-in duration-300">
                <span className="text-[9px] font-extrabold tracking-wider uppercase text-purple-400 flex items-center gap-1">
                  💡 Creator Pro Tip
                </span>
                <div className="relative h-12 mt-1">
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

            {activeTab === "game" && (
              <div className="relative h-36 w-full bg-black/40 border border-white/5 rounded-xl overflow-hidden select-none animate-in fade-in duration-300">
                <div className="absolute top-2 inset-x-2 z-10 flex items-center justify-between">
                  <div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-md border border-white/5 text-[9px] font-bold text-purple-400">
                    <Trophy className="w-3 h-3 text-amber-500" />
                    <span>Score: {gameScore}</span>
                  </div>
                  
                  {comboCount > 1 && (
                    <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-md border border-amber-500/20 text-[9px] font-bold animate-ping-once">
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span>{comboCount}x Combo!</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-md border border-white/5 text-[9px] font-bold text-neutral-400 font-mono">
                    <Clock className="w-3 h-3 text-neutral-400" />
                    <span>{gameTimer}s</span>
                  </div>
                </div>

                {activePowerUp && (
                  <div className="absolute bottom-2 inset-x-2 z-10 flex items-center justify-center">
                    <div className="bg-amber-500 text-black px-2.5 py-0.5 rounded-full text-[8px] font-extrabold tracking-wider uppercase animate-pulse flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-black text-black" />
                      <span>POWER-UP: {activePowerUp.toUpperCase()} ({powerUpTimeLeft}s)</span>
                    </div>
                  </div>
                )}
                
                {gameTimer <= 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-black/70 animate-in fade-in">
                    <Trophy className="w-8 h-8 text-amber-500 animate-bounce mb-2" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider block">Game Finished!</span>
                    <span className="text-[10px] text-neutral-400 block mt-1">Final Score: {gameScore} • High Score: {gameHighScore}</span>
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
                        p.isPowerUp 
                          ? "bg-amber-500 text-black border-amber-400 animate-bounce shadow-amber-500/20" 
                          : "bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border-purple-500/40 hover:border-purple-400"
                      }`}
                      style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        transform: `translate(-50%, -50%) scale(${p.scale})`,
                        borderColor: p.isPowerUp ? undefined : `hsl(${p.hue}, 70%, 50%)`,
                        backgroundColor: p.isPowerUp ? undefined : `hsl(${p.hue}, 60%, 20%, 0.15)`
                      }}
                    >
                      <span className="flex items-center gap-1">
                        {p.isPowerUp ? (
                          <>
                            <Zap className="w-2.5 h-2.5 fill-black" />
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
              <div className="w-full bg-black/80 rounded-xl border border-white/5 p-3 text-[10px] font-mono text-neutral-400 text-left h-36 overflow-y-auto space-y-1 animate-in fade-in duration-300 selection:bg-purple-950">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  <span>anivox-compilation-daemon --verbose</span>
                </div>
                {terminalLogs.map((log, idx) => (
                  <div 
                    key={idx} 
                    className={`${log.includes("completed") ? "text-emerald-400" : log.includes("Detected") ? "text-indigo-300" : "text-neutral-500"}`}
                  >
                    {log}
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* Floating GPU-accelerated telemetry monitor */}
        <div className="grid grid-cols-4 gap-2 bg-[#09090c]/60 p-3.5 rounded-2xl border border-white/5 text-[9px] font-bold text-neutral-400 text-left shadow-lg">
          <div className="space-y-0.5">
            <span className="text-[8px] text-neutral-500 block uppercase">CUDA Latency</span>
            <span className="text-purple-400 font-mono">{telemetry.latency}ms</span>
          </div>
          <div className="space-y-0.5 border-l border-white/5 pl-2.5">
            <span className="text-[8px] text-neutral-500 block uppercase">VRAM Allocation</span>
            <span className="text-indigo-400 font-mono">{telemetry.vram}GB</span>
          </div>
          <div className="space-y-0.5 border-l border-white/5 pl-2.5">
            <span className="text-[8px] text-neutral-500 block uppercase">GPU Temp</span>
            <span className="text-amber-500 font-mono">{telemetry.temp}°C</span>
          </div>
          <div className="space-y-0.5 border-l border-white/5 pl-2.5">
            <span className="text-[8px] text-neutral-500 block uppercase">Compute Cores</span>
            <span className="text-emerald-400 font-mono">{telemetry.threads} Cores</span>
          </div>
        </div>

      </div>

      {/* Footer message */}
      <div className="absolute bottom-6 left-0 right-0 z-10">
        <p className="text-neutral-600 text-[10px] uppercase font-black tracking-[0.25em]">
          Built for the future of webcomics
        </p>
      </div>

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
        @keyframes ping-once {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.15); opacity: 0.8; }
        }
        .animate-ping-once {
          animation: ping-once 0.4s ease-out;
        }
      `,
        }}
      />
    </div>
  );
}
