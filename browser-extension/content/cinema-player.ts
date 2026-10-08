/**
 * extension/content/cinema-player.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Cinema Reader Engine v3.0 for Sonikoma AI Manga Studio.
 * Features:
 *   - Hands-Free Smooth Subpixel Autoscroll with Adaptive AI Director Pacing
 *   - Web Audio Multi-Mood Soundscapes (Lo-Fi Chords, Rain Waves, Cyber Drone, Action Pulse, Zen Chimes)
 *   - Cinematic Visual Shaders (OLED Dark, Warm Sepia, Cyber Neon, Noir Ink, Blue-Light Guard)
 *   - AI Voice Narration Assistant (Web Speech Synthesis + Dynamic Scene Narration)
 *   - Dynamic Reading Spotlight Focus Vignette & Theater Dimmer
 *   - Interactive Timeline Scrubber with Live Hover Tooltip & Scene Markers
 *   - Auto Next Chapter Transitioner & Countdown Bridge
 *   - Native Fullscreen Immersion, Custom Docking (Top/Bottom), & Auto-Dimming HUD
 *   - 1-Click Fast Scene Snip & Studio Bookmarking
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type SoundscapeMood =
  | "off"
  | "lofi"
  | "rain"
  | "space"
  | "pulse"
  | "zen";

export interface MoodConfig {
  id: SoundscapeMood;
  name: string;
  icon: string;
  desc: string;
}

export const SOUNDSCAPE_MOODS: MoodConfig[] = [
  { id: "off", name: "Mute", icon: "🔇", desc: "No background audio" },
  {
    id: "lofi",
    name: "Lo-Fi Chords",
    icon: "🎵",
    desc: "Calm warm cinematic chords",
  },
  {
    id: "rain",
    name: "Rain Waves",
    icon: "🌧️",
    desc: "Organic rain & ocean swell",
  },
  {
    id: "space",
    name: "Cyber Drone",
    icon: "🌌",
    desc: "432Hz ethereal ambient drone",
  },
  {
    id: "pulse",
    name: "Action Pulse",
    icon: "⚡",
    desc: "Tense rhythmic sub-bass pulse",
  },
  {
    id: "zen",
    name: "Zen Harmony",
    icon: "🎋",
    desc: "Peaceful acoustic resonant harmonics",
  },
];

export type CinemaShader =
  | "normal"
  | "oled"
  | "sepia"
  | "cyber"
  | "noir"
  | "warm";

export interface ShaderConfig {
  id: CinemaShader;
  name: string;
  icon: string;
  filterCss: string;
}

export const CINEMA_SHADERS: ShaderConfig[] = [
  { id: "normal", name: "Natural", icon: "🖼️", filterCss: "none" },
  {
    id: "oled",
    name: "OLED Dark",
    icon: "🕶️",
    filterCss: "contrast(1.18) brightness(0.92) saturate(1.08)",
  },
  {
    id: "sepia",
    name: "Warm Sepia",
    icon: "📜",
    filterCss: "sepia(0.38) contrast(1.08) brightness(0.96) hue-rotate(-12deg)",
  },
  {
    id: "cyber",
    name: "Cyber Neon",
    icon: "🎆",
    filterCss: "saturate(1.45) contrast(1.15) hue-rotate(8deg)",
  },
  {
    id: "noir",
    name: "Noir Ink",
    icon: "🖤",
    filterCss: "grayscale(1) contrast(1.3) brightness(0.95)",
  },
  {
    id: "warm",
    name: "Night Amber",
    icon: "🕯️",
    filterCss: "sepia(0.55) brightness(0.92) hue-rotate(-25deg)",
  },
];

class AmbientSoundscapeEngine {
  private ctx: AudioContext | null = null;
  public currentMood: SoundscapeMood = "off";
  private masterGain: GainNode | null = null;
  private activeNodes: (AudioNode & { stop?: () => void })[] = [];
  public volume: number = 0.65;

  constructor() {
    this.unlockAudioOnGesture();
  }

  private unlockAudioOnGesture() {
    const unlock = () => {
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("pointerdown", unlock);
    };
    window.addEventListener("click", unlock, { once: true, passive: true });
    window.addEventListener("keydown", unlock, { once: true, passive: true });
    window.addEventListener("pointerdown", unlock, { once: true, passive: true });
  }

  public cycleMood(): MoodConfig {
    const idx = SOUNDSCAPE_MOODS.findIndex((m) => m.id === this.currentMood);
    const nextIdx = (idx + 1) % SOUNDSCAPE_MOODS.length;
    this.setMood(SOUNDSCAPE_MOODS[nextIdx].id);
    return SOUNDSCAPE_MOODS[nextIdx];
  }

  public setMood(mood: SoundscapeMood) {
    this.currentMood = mood;
    if (mood === "off") {
      this.stop();
    } else {
      this.startMood(mood);
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      try {
        const targetGain = this.volume === 0 ? 0 : this.volume * 0.35;
        this.masterGain.gain.setValueAtTime(
          targetGain,
          this.ctx.currentTime
        );
      } catch (_) {}
    }
  }

  private initCtx(): AudioContext {
    if (!this.ctx || this.ctx.state === "closed") {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private stopActiveNodes() {
    this.activeNodes.forEach((node) => {
      try {
        if (typeof node.stop === "function") node.stop();
        node.disconnect();
      } catch (_) {}
    });
    this.activeNodes = [];
  }

  private startMood(mood: SoundscapeMood) {
    try {
      const ctx = this.initCtx();
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      // Synchronously stop previous mood nodes immediately (no delayed timer destruction!)
      this.stopActiveNodes();

      if (this.masterGain) {
        try {
          this.masterGain.disconnect();
        } catch (_) {}
      }

      this.masterGain = ctx.createGain();
      const targetGain = this.volume === 0 ? 0 : this.volume * 0.35;
      this.masterGain.gain.setValueAtTime(0.02, ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(
        targetGain,
        ctx.currentTime + 0.25
      );
      this.masterGain.connect(ctx.destination);

      if (mood === "lofi") {
        // Cmaj9 warm jazz ambient chord
        const freqs = [130.81, 164.81, 196.0, 246.94, 293.66];
        freqs.forEach((f, i) => {
          const osc = ctx.createOscillator();
          osc.type = i === 0 ? "triangle" : "sine";
          osc.frequency.setValueAtTime(f, ctx.currentTime);

          const filter = ctx.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(1400, ctx.currentTime);

          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.frequency.setValueAtTime(0.12 + i * 0.04, ctx.currentTime);
          lfoGain.gain.setValueAtTime(2.5, ctx.currentTime);
          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);
          lfo.start();

          osc.connect(filter);
          filter.connect(this.masterGain!);
          osc.start();
          this.activeNodes.push(osc, filter, lfo, lfoGain);
        });
      } else if (mood === "rain") {
        // Organic Brownian rainfall swell
        const bufferSize = Math.floor(ctx.sampleRate * 2);
        const noiseBuffer = ctx.createBuffer(
          1,
          bufferSize,
          ctx.sampleRate
        );
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(950, ctx.currentTime);

        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.18, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(320, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();

        whiteNoise.connect(filter);
        filter.connect(this.masterGain!);
        whiteNoise.start();
        this.activeNodes.push(whiteNoise, filter, lfo, lfoGain);
      } else if (mood === "space") {
        // 432Hz deep cosmic harmonic drone
        const freqs = [108, 216, 432, 648];
        freqs.forEach((f, i) => {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.setValueAtTime(f, ctx.currentTime);

          const subGain = ctx.createGain();
          subGain.gain.setValueAtTime(0.35 / (i + 1), ctx.currentTime);

          osc.connect(subGain);
          subGain.connect(this.masterGain!);
          osc.start();
          this.activeNodes.push(osc, subGain);
        });
      } else if (mood === "pulse") {
        // Action pulse sub-bass rhythm
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(55, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(240, ctx.currentTime);
        filter.Q.setValueAtTime(5, ctx.currentTime);

        const lfo = ctx.createOscillator();
        lfo.type = "square";
        lfo.frequency.setValueAtTime(2.0, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(160, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();

        osc.connect(filter);
        filter.connect(this.masterGain!);
        osc.start();
        this.activeNodes.push(osc, filter, lfo, lfoGain);
      } else if (mood === "zen") {
        // Japanese Insen harmonic chimes (D, A, D, F#, A)
        const harmonics = [146.83, 220.0, 293.66, 369.99, 440.0];
        harmonics.forEach((f, i) => {
          const osc = ctx.createOscillator();
          osc.type = i === 0 ? "triangle" : "sine";
          osc.frequency.setValueAtTime(f, ctx.currentTime);

          const subGain = ctx.createGain();
          subGain.gain.setValueAtTime(0.3 / (i + 1), ctx.currentTime);

          const lfo = ctx.createOscillator();
          lfo.frequency.setValueAtTime(0.08 + i * 0.03, ctx.currentTime);
          const lfoGain = ctx.createGain();
          lfoGain.gain.setValueAtTime(0.09, ctx.currentTime);
          lfo.connect(lfoGain);
          lfoGain.connect(subGain.gain);
          lfo.start();

          osc.connect(subGain);
          subGain.connect(this.masterGain!);
          osc.start();
          this.activeNodes.push(osc, subGain, lfo, lfoGain);
        });
      }
    } catch (e) {
      console.warn("[Sonikoma Audio] Failed to start mood:", e);
    }
  }

  public stop() {
    this.currentMood = "off";
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      } catch (_) {}
    }
    this.stopActiveNodes();
  }
}

class AIVoiceNarratorEngine {
  private isVoiceActive: boolean = false;
  private onSubtitleCallback: ((text: string) => void) | null = null;

  public setSubtitleCallback(cb: (text: string) => void) {
    this.onSubtitleCallback = cb;
  }

  public toggle(): boolean {
    this.isVoiceActive = !this.isVoiceActive;
    if (!this.isVoiceActive) {
      this.stop();
    }
    return this.isVoiceActive;
  }

  public get isActive(): boolean {
    return this.isVoiceActive;
  }

  public speak(text: string) {
    if (!this.isVoiceActive || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 1.05;
      utt.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Natural") ||
            v.name.includes("Google") ||
            v.name.includes("Samantha"))
      );
      if (preferred) utt.voice = preferred;

      if (this.onSubtitleCallback) {
        this.onSubtitleCallback(text);
      }

      utt.onend = () => {
        if (this.onSubtitleCallback) {
          this.onSubtitleCallback("");
        }
      };

      utt.onerror = () => {
        if (this.onSubtitleCallback) {
          this.onSubtitleCallback("");
        }
      };

      window.speechSynthesis.speak(utt);
    } catch (_) {}
  }

  public stop() {
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
    if (this.onSubtitleCallback) {
      this.onSubtitleCallback("");
    }
  }
}

export class CinemaPlayer {
  private scanner: any;
  private isPlaying: boolean = false;
  private scrollSpeed: number = 1.0;
  private baseSpeedPxPerSec: number = 65;
  private animationFrameId: number | null = null;
  private lastTimestamp: number | null = null;
  private subpixelAccumulator: number = 0;

  // DOM Elements
  private hudElement: HTMLElement | null = null;
  private dimmerElement: HTMLElement | null = null;
  private spotlightElement: HTMLElement | null = null;
  private toastElement: HTMLElement | null = null;
  private subtitleElement: HTMLElement | null = null;
  private nextChapterBanner: HTMLElement | null = null;

  // Feature States
  private isDimmed: boolean = false;
  private isSpotlight: boolean = false;
  private isAdaptivePacing: boolean = true;
  private isAutoDimHud: boolean = true;
  private isHideDistractions: boolean = true;
  private isAutoAdvanceChapter: boolean = true;
  private isNightInvert: boolean = false;
  private currentStripWidth: "fit" | "comfort" | "cinematic" | "compact" = "fit";
  private isDockTop: boolean = true;
  private isSettingsOpen: boolean = false;
  private isTemporarilyPausedForUser: boolean = false;
  private manualScrollTimeout: any = null;
  private hudDimTimer: any = null;
  private currentShader: CinemaShader = "normal";

  // Panel & Timing Data
  private detectedPanels: any[] = [];
  private currentPanelIndex: number = 0;
  private panelPauseTimer: number = 0;
  private lastPausedPanelIdx: number = -1;
  private lastNarratedPanelIdx: number = -1;
  private nextChapterCountdown: number = 0;
  private nextChapterTimerId: any = null;

  // Soundscape & Voice Engines
  private soundscape: AmbientSoundscapeEngine = new AmbientSoundscapeEngine();
  private voiceNarrator: AIVoiceNarratorEngine = new AIVoiceNarratorEngine();

  constructor(scanner?: any) {
    this.scanner = scanner || (window as any).DomMangaScanner;
    this.init();
  }

  private init() {
    this.createCinemaHUD();
    this.createDimmerOverlay();
    this.createSpotlightOverlay();
    this.createSubtitleOverlay();
    this.bindGlobalShortcuts();
    this.bindUserScrollInterceptors();
    this.bindMouseActivityInterceptors();

    this.voiceNarrator.setSubtitleCallback((text) => {
      this.updateSubtitle(text);
    });
  }

  private bindGlobalShortcuts() {
    window.addEventListener("keydown", (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      const isHudVisible =
        this.hudElement &&
        !this.hudElement.classList.contains("sonikoma-hidden");
      if (!isHudVisible) return;

      if (e.code === "Space") {
        e.preventDefault();
        if (this.isPlaying) this.pause();
        else this.play();
      } else if (e.code === "ArrowUp") {
        e.preventDefault();
        this.adjustSpeed(0.25);
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        this.adjustSpeed(-0.25);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        this.jumpToNextPanel();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        this.jumpToPrevPanel();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        this.cycleSoundscape();
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        this.cycleShader();
      } else if (e.key === "v" || e.key === "V") {
        e.preventDefault();
        this.toggleVoiceNarrator();
      } else if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        this.toggleTheaterDimmer();
      } else if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        this.toggleSpotlight();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        this.toggleFullscreen();
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        this.snipActiveScene();
      } else if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        this.bookmarkActiveScene();
      } else if (e.code === "Escape") {
        if (this.nextChapterBanner) {
          this.cancelNextChapterCountdown();
        } else if (this.isSettingsOpen) {
          this.toggleSettingsFlyout(false);
        } else {
          this.stop();
        }
      }
    });
  }

  private bindUserScrollInterceptors() {
    const handleUserScroll = () => {
      if (!this.isPlaying || this.isTemporarilyPausedForUser) return;
      this.isTemporarilyPausedForUser = true;
      this.updateStatusBadge("Manual", "↕");

      if (this.manualScrollTimeout) clearTimeout(this.manualScrollTimeout);
      this.manualScrollTimeout = setTimeout(() => {
        this.isTemporarilyPausedForUser = false;
        if (this.isPlaying) {
          this.updateStatusBadge("Pause", "⏸");
          this.lastTimestamp = performance.now();
        }
      }, 1300);
    };

    window.addEventListener("wheel", handleUserScroll, { passive: true });
    window.addEventListener("touchmove", handleUserScroll, { passive: true });
  }

  private bindMouseActivityInterceptors() {
    const handleMouseMove = () => {
      if (this.hudElement) {
        this.hudElement.style.opacity = "1";
      }
      if (this.hudDimTimer) clearTimeout(this.hudDimTimer);
      if (this.isPlaying && this.isAutoDimHud) {
        this.hudDimTimer = setTimeout(() => {
          if (this.isPlaying && this.hudElement && !this.isSettingsOpen) {
            this.hudElement.style.opacity = "0.22";
          }
        }, 2800);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
  }

  private createDimmerOverlay() {
    let dimmer = document.getElementById(
      "sonikoma-theater-dimmer"
    ) as HTMLElement;
    if (!dimmer) {
      dimmer = document.createElement("div");
      dimmer.id = "sonikoma-theater-dimmer";
      dimmer.className = "sonikoma-theater-dimmer sonikoma-hidden";
      (document.body || document.documentElement).appendChild(dimmer);
    }
    this.dimmerElement = dimmer;
  }

  private createSpotlightOverlay() {
    let spot = document.getElementById(
      "sonikoma-cinema-spotlight"
    ) as HTMLElement;
    if (!spot) {
      spot = document.createElement("div");
      spot.id = "sonikoma-cinema-spotlight";
      spot.className = "sonikoma-cinema-spotlight sonikoma-hidden";
      (document.body || document.documentElement).appendChild(spot);
    }
    this.spotlightElement = spot;
  }

  private createSubtitleOverlay() {
    let sub = document.getElementById(
      "sonikoma-cinema-subtitles"
    ) as HTMLElement;
    if (!sub) {
      sub = document.createElement("div");
      sub.id = "sonikoma-cinema-subtitles";
      sub.className = "sonikoma-cinema-subtitles sonikoma-hidden";
      (document.body || document.documentElement).appendChild(sub);
    }
    this.subtitleElement = sub;
  }

  private updateSubtitle(text: string) {
    if (!this.subtitleElement) return;
    if (!text) {
      this.subtitleElement.classList.add("sonikoma-hidden");
      this.subtitleElement.style.setProperty("display", "none", "important");
      return;
    }
    this.subtitleElement.innerHTML = `
      <span class="sonikoma-sub-icon">🎙️</span>
      <span class="sonikoma-sub-text">${text}</span>
    `;
    this.subtitleElement.classList.remove("sonikoma-hidden");
    this.subtitleElement.style.setProperty("display", "flex", "important");
  }

  private showToast(msg: string) {
    if (!this.toastElement) {
      const toast = document.createElement("div");
      toast.id = "sonikoma-cinema-toast";
      toast.className = "sonikoma-cinema-toast sonikoma-hidden";
      (document.body || document.documentElement).appendChild(toast);
      this.toastElement = toast;
    }
    this.toastElement.textContent = msg;
    this.toastElement.classList.remove("sonikoma-hidden");
    this.toastElement.style.setProperty("display", "flex", "important");
    setTimeout(() => {
      if (this.toastElement) {
        this.toastElement.classList.add("sonikoma-hidden");
        this.toastElement.style.setProperty("display", "none", "important");
      }
    }, 2200);
  }

  private createCinemaHUD() {
    let hud = document.getElementById("sonikoma-cinema-hud") as HTMLElement;
    if (!hud) {
      hud = document.createElement("div");
      hud.id = "sonikoma-cinema-hud";
      hud.className = "sonikoma-cinema-hud sonikoma-dock-top sonikoma-hidden";
      hud.innerHTML = `
        <div class="sonikoma-cinema-bar">
          <!-- Drag Handle -->
          <div id="sonikoma-hud-drag-handle" class="sonikoma-drag-handle" title="Drag to move Cinema Bar anywhere">
            ⠿
          </div>

          <!-- Brand Badge -->
          <div class="sonikoma-cinema-brand" title="Sonikoma Immersive Cinema Engine v3.0">
            <span class="sonikoma-cinema-glow-dot"></span>
            <span class="sonikoma-cinema-badge">CINEMA</span>
            <span id="sonikoma-cinema-series" class="sonikoma-cinema-series">Sonikoma Reader</span>
          </div>

          <div class="sonikoma-cinema-divider"></div>

          <!-- Play/Pause Toggle -->
          <button type="button" id="sonikoma-btn-cinema-toggle" class="sonikoma-hud-btn-primary" title="Play / Pause Auto-Scroll (Spacebar)">
            <span id="sonikoma-cinema-icon">▶</span>
            <span id="sonikoma-cinema-status">Play</span>
          </button>

          <div class="sonikoma-cinema-divider"></div>

          <!-- Panel Jumper (Prev/Next) -->
          <div class="sonikoma-panel-jumper">
            <button type="button" id="sonikoma-btn-prev-panel" class="sonikoma-hud-btn-mini" title="Previous Panel (←)">⏮</button>
            <span id="sonikoma-panel-readout" class="sonikoma-panel-readout">Scene 1/1</span>
            <button type="button" id="sonikoma-btn-next-panel" class="sonikoma-hud-btn-mini" title="Next Panel (→)">⏭</button>
          </div>

          <div class="sonikoma-cinema-divider"></div>

          <!-- Speed Stepper -->
          <div class="sonikoma-speed-stepper">
            <button type="button" id="sonikoma-btn-speed-minus" class="sonikoma-hud-btn-mini" title="Slow Down (↓)">-</button>
            <span id="sonikoma-speed-readout" class="sonikoma-speed-badge">1.0x</span>
            <button type="button" id="sonikoma-btn-speed-plus" class="sonikoma-hud-btn-mini" title="Speed Up (↑)">+</button>
          </div>

          <div class="sonikoma-cinema-divider"></div>

          <!-- Quick Action Buttons -->
          <!-- Ambient Soundscape Mood Button -->
          <button type="button" id="sonikoma-btn-cinema-bgm" class="sonikoma-hud-icon-btn" title="Ambient Soundscape (M) • Lo-Fi, Rain, Drone, Pulse, Zen">
            <span id="sonikoma-bgm-icon">🎵</span>
          </button>

          <!-- Cinematic Visual Shader -->
          <button type="button" id="sonikoma-btn-cinema-shader" class="sonikoma-hud-icon-btn" title="Cinematic Visual Shaders (C) • OLED, Sepia, Neon, Noir, Amber">
            <span id="sonikoma-shader-icon">🎨</span>
          </button>

          <!-- AI Voice Narrator -->
          <button type="button" id="sonikoma-btn-cinema-voice" class="sonikoma-hud-icon-btn" title="AI Voice Narrator (V) • Hands-Free Speech Reading">
            🎙️
          </button>

          <!-- Spotlight Focus -->
          <button type="button" id="sonikoma-btn-cinema-spotlight" class="sonikoma-hud-icon-btn" title="Toggle Reading Spotlight Focus (L)">
            🔦
          </button>

          <!-- Theater Dimmer -->
          <button type="button" id="sonikoma-btn-cinema-dimmer" class="sonikoma-hud-icon-btn" title="Toggle Theater Dimmer (D)">
            🌑
          </button>

          <!-- Snip Active Scene -->
          <button type="button" id="sonikoma-btn-cinema-snip" class="sonikoma-hud-icon-btn" title="Instant Capture Active Scene (S)">
            ✂️
          </button>

          <!-- Bookmark Active Scene -->
          <button type="button" id="sonikoma-btn-cinema-bookmark" class="sonikoma-hud-icon-btn" title="Bookmark Chapter Position (B)">
            📌
          </button>

          <!-- Fullscreen Toggle -->
          <button type="button" id="sonikoma-btn-cinema-fs" class="sonikoma-hud-icon-btn" title="Toggle Fullscreen Immersion (F)">
            ⛶
          </button>

          <!-- Settings Flyout Toggle -->
          <button type="button" id="sonikoma-btn-cinema-settings" class="sonikoma-hud-icon-btn" title="Cinema Settings & AI Director (⚙️)">
            ⚙️
          </button>

          <!-- Dock Position Flip (Top/Bottom) -->
          <button type="button" id="sonikoma-btn-cinema-dock" class="sonikoma-hud-icon-btn" title="Flip Dock Position (Top / Bottom)">
            ⇅
          </button>

          <!-- Exit Cinema -->
          <button type="button" id="sonikoma-btn-cinema-close" class="sonikoma-hud-btn-danger" title="Exit Cinema Mode (Esc)">
            ✕ Exit
          </button>

          <!-- Bottom Clickable Timeline Scrubber & Live Progress Track -->
          <div id="sonikoma-hud-timeline" class="sonikoma-hud-progress-track" title="Click anywhere to jump to chapter percentage">
            <div id="sonikoma-hud-progress-fill" class="sonikoma-hud-progress-fill" style="width: 0%;"></div>
            <div id="sonikoma-scrubber-tooltip" class="sonikoma-scrubber-tooltip sonikoma-hidden">0%</div>
          </div>
        </div>

        <!-- Settings & AI Director Flyout Drawer -->
        <div id="sonikoma-cinema-flyout" class="sonikoma-cinema-flyout sonikoma-hidden" style="color-scheme: dark !important;">
          <div id="sonikoma-flyout-drag-header" class="sonikoma-flyout-header" title="Drag to move Settings anywhere">
            <div class="sonikoma-flyout-title-box">
              <span class="sonikoma-drag-icon">⠿</span>
              <span>Cinema Studio Master Controls</span>
            </div>
            <button type="button" id="sonikoma-btn-close-flyout" class="sonikoma-flyout-close" title="Close Settings">✕</button>
          </div>

          <!-- Fixed Scrollable Settings Body -->
          <div class="sonikoma-flyout-body" style="color-scheme: dark !important; scrollbar-color: #3f3f3f #181818 !important;">
            <!-- SECTION 1: PACING & MOTION -->
            <div class="sonikoma-flyout-section-title">⚡ PACING & MOTION</div>

            <div class="sonikoma-flyout-row">
              <span class="sonikoma-flyout-label">Scroll Speed Presets</span>
              <div class="sonikoma-flyout-speed-group">
                <button type="button" class="sonikoma-pill-btn" data-speed="0.5">0.5x</button>
                <button type="button" class="sonikoma-pill-btn sonikoma-active" data-speed="1.0">1.0x</button>
                <button type="button" class="sonikoma-pill-btn" data-speed="1.5">1.5x</button>
                <button type="button" class="sonikoma-pill-btn" data-speed="2.0">2.0x</button>
              </div>
            </div>

            <div class="sonikoma-flyout-row">
              <span class="sonikoma-flyout-label">AI Adaptive Pacing</span>
              <button type="button" id="sonikoma-btn-toggle-pacing" class="sonikoma-toggle-switch sonikoma-active" title="Slows automatically for dense speech bubbles">ON</button>
            </div>

            <div class="sonikoma-flyout-row">
              <span class="sonikoma-flyout-label">HUD Auto-Dimming</span>
              <button type="button" id="sonikoma-btn-toggle-autodim" class="sonikoma-toggle-switch sonikoma-active" title="Fades HUD during uninterrupted reading">ON</button>
            </div>

            <div class="sonikoma-flyout-row">
              <span class="sonikoma-flyout-label">Distraction-Free Immersion</span>
              <button type="button" id="sonikoma-btn-toggle-distractions" class="sonikoma-toggle-switch sonikoma-active" title="Hides native website drawers, pills & floating buttons">ON</button>
            </div>

            <div class="sonikoma-flyout-row">
              <span class="sonikoma-flyout-label">Auto-Advance Next Chapter</span>
              <button type="button" id="sonikoma-btn-toggle-autonext" class="sonikoma-toggle-switch sonikoma-active" title="Prompts & auto-loads next episode on chapter finish">ON</button>
            </div>

            <!-- SECTION 2: VISUALS & DISPLAY -->
            <div class="sonikoma-flyout-section-title">🎨 VISUALS & DISPLAY</div>

            <div class="sonikoma-flyout-row">
              <span class="sonikoma-flyout-label">Visual Shader Filter</span>
              <button type="button" id="sonikoma-flyout-btn-shader" class="sonikoma-flyout-btn-action" title="Click to cycle shaders (C)">🎨 Natural</button>
            </div>

            <div class="sonikoma-flyout-row">
              <span class="sonikoma-flyout-label">Strip Column Width</span>
              <button type="button" id="sonikoma-flyout-btn-width" class="sonikoma-flyout-btn-action" title="Click to cycle reading strip width clamp">Fit Screen</button>
            </div>

            <div class="sonikoma-flyout-row">
              <span class="sonikoma-flyout-label">Spotlight Focus Lamp</span>
              <button type="button" id="sonikoma-btn-toggle-spotlight" class="sonikoma-toggle-switch" title="Center reading spotlight focus (L)">OFF</button>
            </div>

            <div class="sonikoma-flyout-row">
              <span class="sonikoma-flyout-label">Theater Ambient Dimmer</span>
              <button type="button" id="sonikoma-btn-toggle-dimmer" class="sonikoma-toggle-switch" title="Darkens background border regions (D)">OFF</button>
            </div>

            <div class="sonikoma-flyout-row">
              <span class="sonikoma-flyout-label">Night Manga Inversion</span>
              <button type="button" id="sonikoma-btn-toggle-invert" class="sonikoma-toggle-switch" title="High-contrast dark mode inversion for white panels">OFF</button>
            </div>

            <!-- SECTION 3: AUDIO & SOUNDSCAPE -->
            <div class="sonikoma-flyout-section-title">🎵 SOUNDSCAPE & AI VOICE</div>

            <div class="sonikoma-flyout-row">
              <span class="sonikoma-flyout-label">Soundscape Mood</span>
              <button type="button" id="sonikoma-flyout-btn-soundscape" class="sonikoma-flyout-btn-action" title="Click to cycle soundscapes (M)">🎵 Lo-Fi Chords</button>
            </div>

            <div class="sonikoma-flyout-row">
              <span class="sonikoma-flyout-label">Audio Volume</span>
              <div class="sonikoma-flyout-vol-box">
                <input type="range" id="sonikoma-volume-slider" min="0" max="100" value="65" class="sonikoma-slider-input" />
                <span id="sonikoma-volume-readout" class="sonikoma-volume-readout">65%</span>
              </div>
            </div>

            <div class="sonikoma-flyout-row">
              <span class="sonikoma-flyout-label">AI Voice Narrator</span>
              <button type="button" id="sonikoma-flyout-btn-voice" class="sonikoma-toggle-switch" title="Text-to-speech scene reading (V)">OFF</button>
            </div>

            <!-- SECTION 4: READING PROGRESS & STATS -->
            <div class="sonikoma-flyout-section-title">📊 PROGRESS & TIMING</div>

            <div class="sonikoma-flyout-row">
              <span class="sonikoma-flyout-label">Est. Time Remaining</span>
              <span id="sonikoma-flyout-eta" class="sonikoma-flyout-val">~2 min left (0%)</span>
            </div>

            <!-- SECTION 5: STUDIO QUICK ACTIONS -->
            <div class="sonikoma-flyout-section-title">🛠️ STUDIO QUICK ACTIONS</div>

            <div class="sonikoma-flyout-tools-row">
              <button type="button" id="sonikoma-flyout-act-snip" class="sonikoma-flyout-tool-btn" title="Snip Active Scene (S)">
                <span>📸</span> Snip
              </button>
              <button type="button" id="sonikoma-flyout-act-bookmark" class="sonikoma-flyout-tool-btn" title="Save Bookmark (B)">
                <span>📌</span> Bookmark
              </button>
              <button type="button" id="sonikoma-flyout-act-fullscreen" class="sonikoma-flyout-tool-btn" title="Toggle Fullscreen (F)">
                <span>⛶</span> Fullscreen
              </button>
              <button type="button" id="sonikoma-flyout-act-dock" class="sonikoma-flyout-tool-btn" title="Switch Top/Bottom Dock Position">
                <span>↕</span> Dock
              </button>
            </div>

            <!-- KEYBOARD SHORTCUTS REFERENCE -->
            <div class="sonikoma-flyout-shortcuts">
              <span class="sonikoma-shortcut-tag"><kbd>Space</kbd> Play/Pause</span>
              <span class="sonikoma-shortcut-tag"><kbd>↑/↓</kbd> Speed</span>
              <span class="sonikoma-shortcut-tag"><kbd>←/→</kbd> Panel</span>
              <span class="sonikoma-shortcut-tag"><kbd>M</kbd> Music</span>
              <span class="sonikoma-shortcut-tag"><kbd>C</kbd> Shader</span>
              <span class="sonikoma-shortcut-tag"><kbd>V</kbd> Voice</span>
              <span class="sonikoma-shortcut-tag"><kbd>L</kbd> Light</span>
              <span class="sonikoma-shortcut-tag"><kbd>D</kbd> Dimmer</span>
              <span class="sonikoma-shortcut-tag"><kbd>S</kbd> Snip</span>
              <span class="sonikoma-shortcut-tag"><kbd>B</kbd> Bookmark</span>
              <span class="sonikoma-shortcut-tag"><kbd>F</kbd> Fullscreen</span>
            </div>
          </div>
        </div>
      `;

      (document.body || document.documentElement).appendChild(hud);

      // Button event listeners
      hud
        .querySelector("#sonikoma-btn-cinema-toggle")
        ?.addEventListener("click", () => {
          if (this.isPlaying) this.pause();
          else this.play();
        });

      hud
        .querySelector("#sonikoma-btn-cinema-close")
        ?.addEventListener("click", () => this.stop());
      hud
        .querySelector("#sonikoma-btn-speed-minus")
        ?.addEventListener("click", () => this.adjustSpeed(-0.25));
      hud
        .querySelector("#sonikoma-btn-speed-plus")
        ?.addEventListener("click", () => this.adjustSpeed(0.25));
      hud
        .querySelector("#sonikoma-btn-prev-panel")
        ?.addEventListener("click", () => this.jumpToPrevPanel());
      hud
        .querySelector("#sonikoma-btn-next-panel")
        ?.addEventListener("click", () => this.jumpToNextPanel());
      hud
        .querySelector("#sonikoma-btn-cinema-bgm")
        ?.addEventListener("click", () => this.cycleSoundscape());
      hud
        .querySelector("#sonikoma-btn-cinema-shader")
        ?.addEventListener("click", () => this.cycleShader());
      hud
        .querySelector("#sonikoma-btn-cinema-voice")
        ?.addEventListener("click", () => this.toggleVoiceNarrator());
      hud
        .querySelector("#sonikoma-btn-cinema-dimmer")
        ?.addEventListener("click", () => this.toggleTheaterDimmer());
      hud
        .querySelector("#sonikoma-btn-cinema-spotlight")
        ?.addEventListener("click", () => this.toggleSpotlight());
      hud
        .querySelector("#sonikoma-btn-cinema-fs")
        ?.addEventListener("click", () => this.toggleFullscreen());
      hud
        .querySelector("#sonikoma-btn-cinema-snip")
        ?.addEventListener("click", () => this.snipActiveScene());
      hud
        .querySelector("#sonikoma-btn-cinema-bookmark")
        ?.addEventListener("click", () => this.bookmarkActiveScene());
      hud
        .querySelector("#sonikoma-btn-cinema-settings")
        ?.addEventListener("click", () => this.toggleSettingsFlyout());
      hud
        .querySelector("#sonikoma-btn-close-flyout")
        ?.addEventListener("click", () => this.toggleSettingsFlyout(false));
      hud
        .querySelector("#sonikoma-btn-cinema-dock")
        ?.addEventListener("click", () => this.toggleDockPosition());

      // Volume Slider
      hud
        .querySelector("#sonikoma-volume-slider")
        ?.addEventListener("input", (e: any) => {
          const val = parseInt(e.target.value, 10) / 100;
          this.soundscape.setVolume(val);
        });

      // Interactive Timeline Scrubber & Live Tooltip
      const timelineTrack = hud.querySelector(
        "#sonikoma-hud-timeline"
      ) as HTMLElement;
      const tooltip = hud.querySelector(
        "#sonikoma-scrubber-tooltip"
      ) as HTMLElement;

      if (timelineTrack && tooltip) {
        timelineTrack.addEventListener("mousemove", (e: MouseEvent) => {
          const rect = timelineTrack.getBoundingClientRect();
          const ratio = Math.max(
            0,
            Math.min(1, (e.clientX - rect.left) / rect.width)
          );
          const pct = Math.round(ratio * 100);
          tooltip.textContent = `Jump to ${pct}%`;
          tooltip.style.left = `${e.clientX - rect.left}px`;
          tooltip.classList.remove("sonikoma-hidden");
        });

        timelineTrack.addEventListener("mouseleave", () => {
          tooltip.classList.add("sonikoma-hidden");
        });

        timelineTrack.addEventListener("click", (e: MouseEvent) => {
          const rect = timelineTrack.getBoundingClientRect();
          const clickRatio = Math.max(
            0,
            Math.min(1, (e.clientX - rect.left) / rect.width)
          );
          const maxScroll = Math.max(
            1,
            (document.documentElement.scrollHeight ||
              document.body.scrollHeight) - window.innerHeight
          );
          window.scrollTo({ top: clickRatio * maxScroll, behavior: "smooth" });
          this.showToast(`Jumped to ${Math.round(clickRatio * 100)}%`);
        });
      }

      // Speed Preset Pills in Flyout
      hud.querySelectorAll(".sonikoma-pill-btn[data-speed]").forEach((btn) => {
        btn.addEventListener("click", (e: any) => {
          const spd = parseFloat(e.target.getAttribute("data-speed") || "1");
          this.setSpeed(spd);
        });
      });

      // Adaptive Pacing Switch
      hud
        .querySelector("#sonikoma-btn-toggle-pacing")
        ?.addEventListener("click", (e: any) => {
          this.isAdaptivePacing = !this.isAdaptivePacing;
          e.target.textContent = this.isAdaptivePacing ? "ON" : "OFF";
          if (this.isAdaptivePacing) e.target.classList.add("sonikoma-active");
          else e.target.classList.remove("sonikoma-active");
          this.showToast(
            this.isAdaptivePacing
              ? "AI Director Pacing ON"
              : "AI Director Pacing OFF"
          );
        });

      // HUD Auto-Dimming Switch
      hud
        .querySelector("#sonikoma-btn-toggle-autodim")
        ?.addEventListener("click", (e: any) => {
          this.isAutoDimHud = !this.isAutoDimHud;
          e.target.textContent = this.isAutoDimHud ? "ON" : "OFF";
          if (this.isAutoDimHud) e.target.classList.add("sonikoma-active");
          else {
            e.target.classList.remove("sonikoma-active");
            if (this.hudElement) this.hudElement.style.opacity = "1";
          }
          this.showToast(
            this.isAutoDimHud ? "HUD Auto-Dimming ON" : "HUD Auto-Dimming OFF"
          );
        });

      // Distraction-Free Immersion Switch
      hud
        .querySelector("#sonikoma-btn-toggle-distractions")
        ?.addEventListener("click", (e: any) => {
          this.isHideDistractions = !this.isHideDistractions;
          e.target.textContent = this.isHideDistractions ? "ON" : "OFF";
          if (this.isHideDistractions) {
            e.target.classList.add("sonikoma-active");
            this.hideNativeDistractions();
            this.showToast("Distraction-Free Immersion ON");
          } else {
            e.target.classList.remove("sonikoma-active");
            this.restoreNativeDistractions();
            this.showToast("Distraction-Free Immersion OFF");
          }
        });

      // Auto-Advance Next Chapter Switch
      hud
        .querySelector("#sonikoma-btn-toggle-autonext")
        ?.addEventListener("click", (e: any) => {
          this.isAutoAdvanceChapter = !this.isAutoAdvanceChapter;
          e.target.textContent = this.isAutoAdvanceChapter ? "ON" : "OFF";
          if (this.isAutoAdvanceChapter)
            e.target.classList.add("sonikoma-active");
          else e.target.classList.remove("sonikoma-active");
          this.showToast(
            this.isAutoAdvanceChapter
              ? "Auto-Advance Next Chapter ON"
              : "Auto-Advance Next Chapter OFF"
          );
        });

      // Flyout Interactive Shader Cycle Button
      hud
        .querySelector("#sonikoma-flyout-btn-shader")
        ?.addEventListener("click", () => this.cycleShader());

      // Flyout Strip Column Width Cycle Button
      hud
        .querySelector("#sonikoma-flyout-btn-width")
        ?.addEventListener("click", () => this.setStripWidth());

      // Spotlight Focus Toggle in Flyout
      hud
        .querySelector("#sonikoma-btn-toggle-spotlight")
        ?.addEventListener("click", () => this.toggleSpotlight());

      // Theater Dimmer Toggle in Flyout
      hud
        .querySelector("#sonikoma-btn-toggle-dimmer")
        ?.addEventListener("click", () => this.toggleTheaterDimmer());

      // Night Manga Invert Toggle in Flyout
      hud
        .querySelector("#sonikoma-btn-toggle-invert")
        ?.addEventListener("click", () => this.toggleNightInvert());

      // Flyout Interactive Soundscape Cycle Button
      hud
        .querySelector("#sonikoma-flyout-btn-soundscape")
        ?.addEventListener("click", () => this.cycleSoundscape());

      // Flyout AI Voice Narrator Toggle Button
      hud
        .querySelector("#sonikoma-flyout-btn-voice")
        ?.addEventListener("click", () => this.toggleVoiceNarrator());

      // Volume Slider with live percentage readout
      hud
        .querySelector("#sonikoma-volume-slider")
        ?.addEventListener("input", (e: any) => {
          const val = parseInt(e.target.value, 10);
          this.soundscape.setVolume(val / 100);
          const ro = document.getElementById("sonikoma-volume-readout");
          if (ro) ro.textContent = `${val}%`;
        });

      // Studio Quick Action Buttons
      hud
        .querySelector("#sonikoma-flyout-act-snip")
        ?.addEventListener("click", () => this.snipActiveScene());
      hud
        .querySelector("#sonikoma-flyout-act-bookmark")
        ?.addEventListener("click", () => this.bookmarkActiveScene());
      hud
        .querySelector("#sonikoma-flyout-act-fullscreen")
        ?.addEventListener("click", () => this.toggleFullscreen());
      hud
        .querySelector("#sonikoma-flyout-act-dock")
        ?.addEventListener("click", () => this.toggleDockPosition());

      // Make both Cinema HUD and Settings Flyout Draggable & Moveable
      const hudDragHandle = hud.querySelector(
        "#sonikoma-hud-drag-handle"
      ) as HTMLElement;
      const cinemaBar = hud.querySelector(
        ".sonikoma-cinema-bar"
      ) as HTMLElement;
      if (cinemaBar) {
        this.enableDraggable(hud, cinemaBar);
      }
      if (hudDragHandle) {
        this.enableDraggable(hud, hudDragHandle);
      }

      const flyout = hud.querySelector(
        "#sonikoma-cinema-flyout"
      ) as HTMLElement;
      if (flyout) {
        (document.body || document.documentElement).appendChild(flyout);
      }
      const flyoutHeader = (flyout || hud).querySelector(
        "#sonikoma-flyout-drag-header"
      ) as HTMLElement;
      if (flyout && flyoutHeader) {
        this.enableDraggable(flyout, flyoutHeader);
      }
    }

    this.hudElement = hud;
  }

  private enableDraggable(target: HTMLElement, handle: HTMLElement) {
    const isExplicitHandle =
      handle.id === "sonikoma-hud-drag-handle" ||
      handle.classList.contains("sonikoma-drag-handle") ||
      handle.classList.contains("sonikoma-flyout-header");

    if (isExplicitHandle) {
      handle.style.cursor = "grab";
    }

    handle.addEventListener("pointerdown", (e: PointerEvent) => {
      // Don't drag on non-primary mouse clicks (e.g. right-click, middle-click)
      if (e.button !== 0 && e.pointerType === "mouse") {
        return;
      }

      // Don't drag if user clicked an interactive control or button
      const clickTarget = e.target as HTMLElement | null;
      if (
        clickTarget &&
        (clickTarget.tagName === "BUTTON" ||
          clickTarget.tagName === "INPUT" ||
          clickTarget.tagName === "SELECT" ||
          clickTarget.tagName === "A" ||
          clickTarget.closest(
            "button, input, select, a, [role='button'], .sonikoma-hud-progress-track, .sonikoma-flyout-close"
          ))
      ) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const pointerId = e.pointerId;
      try {
        handle.setPointerCapture(pointerId);
      } catch (_) {}

      let isDragging = true;
      const startX = e.clientX;
      const startY = e.clientY;

      const rect = target.getBoundingClientRect();
      const initialLeft = rect.left;
      const initialTop = rect.top;

      // Immediately freeze transition & set absolute viewport coordinates to avoid jump
      target.style.setProperty("transition", "none", "important");
      target.style.setProperty("position", "fixed", "important");
      target.style.setProperty("margin", "0", "important");
      target.style.setProperty("transform", "none", "important");
      target.style.setProperty("left", `${Math.round(initialLeft)}px`, "important");
      target.style.setProperty("top", `${Math.round(initialTop)}px`, "important");
      target.style.setProperty("right", "auto", "important");
      target.style.setProperty("bottom", "auto", "important");
      target.classList.remove("sonikoma-dock-top", "sonikoma-dock-bottom");

      target.classList.add("sonikoma-dragging");
      document.documentElement.classList.add("sonikoma-dragging-active");
      document.body.style.userSelect = "none";

      let rafId: number | null = null;
      let lastClientX = startX;
      let lastClientY = startY;

      const updatePosition = () => {
        if (!isDragging) return;
        const dx = lastClientX - startX;
        const dy = lastClientY - startY;

        const maxLeft = Math.max(10, window.innerWidth - target.offsetWidth - 10);
        // Ensure at least 80px of top header remains reachable on screen
        const maxTop = Math.max(
          10,
          window.innerHeight - Math.min(target.offsetHeight, 80) - 10
        );

        const newLeft = Math.min(Math.max(10, initialLeft + dx), maxLeft);
        const newTop = Math.min(Math.max(10, initialTop + dy), maxTop);

        target.style.setProperty("left", `${Math.round(newLeft)}px`, "important");
        target.style.setProperty("top", `${Math.round(newTop)}px`, "important");
        rafId = null;
      };

      const onPointerMove = (pe: PointerEvent) => {
        if (!isDragging) return;
        pe.preventDefault();
        lastClientX = pe.clientX;
        lastClientY = pe.clientY;

        if (rafId === null) {
          rafId = requestAnimationFrame(updatePosition);
        }
      };

      const onPointerEnd = (pe: PointerEvent) => {
        if (!isDragging) return;
        isDragging = false;

        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }

        try {
          handle.releasePointerCapture(pointerId);
        } catch (_) {}

        handle.removeEventListener("pointermove", onPointerMove);
        handle.removeEventListener("pointerup", onPointerEnd);
        handle.removeEventListener("pointercancel", onPointerEnd);

        if (isExplicitHandle) {
          handle.style.cursor = "grab";
        } else {
          handle.style.removeProperty("cursor");
        }

        target.classList.remove("sonikoma-dragging");
        document.documentElement.classList.remove("sonikoma-dragging-active");
        document.body.style.userSelect = "";

        // Mark that this element has been manually dragged by the user
        target.setAttribute("data-sk-dragged", "true");
        target.style.removeProperty("transition");
      };

      handle.addEventListener("pointermove", onPointerMove);
      handle.addEventListener("pointerup", onPointerEnd);
      handle.addEventListener("pointercancel", onPointerEnd);
    });
  }

  adjustSpeed(delta: number) {
    const speeds = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0];
    let currentIndex = speeds.findIndex(
      (s) => Math.abs(s - this.scrollSpeed) < 0.01
    );
    if (currentIndex === -1) currentIndex = 3;

    if (delta > 0) currentIndex = Math.min(speeds.length - 1, currentIndex + 1);
    else currentIndex = Math.max(0, currentIndex - 1);

    this.scrollSpeed = speeds[currentIndex];
    const readout = document.getElementById("sonikoma-speed-readout");
    if (readout) readout.textContent = `${this.scrollSpeed}x`;
    this.updateSpeedPills();
    this.showToast(`Speed: ${this.scrollSpeed}x`);
  }

  setSpeed(targetSpeed: number) {
    this.scrollSpeed = Math.max(0.25, Math.min(4.0, targetSpeed));
    const readout = document.getElementById("sonikoma-speed-readout");
    if (readout) readout.textContent = `${this.scrollSpeed}x`;
    this.updateSpeedPills();
    this.showToast(`Speed: ${this.scrollSpeed}x`);
  }

  private updateSpeedPills() {
    document
      .querySelectorAll(".sonikoma-pill-btn[data-speed]")
      .forEach((btn) => {
        const spd = parseFloat(btn.getAttribute("data-speed") || "1");
        if (Math.abs(spd - this.scrollSpeed) < 0.05) {
          btn.classList.add("sonikoma-active");
        } else {
          btn.classList.remove("sonikoma-active");
        }
      });
  }

  setStripWidth(mode?: "fit" | "comfort" | "cinematic" | "compact") {
    const modes: Array<"fit" | "comfort" | "cinematic" | "compact"> = [
      "fit",
      "comfort",
      "cinematic",
      "compact",
    ];
    if (mode) {
      this.currentStripWidth = mode;
    } else {
      const idx = modes.indexOf(this.currentStripWidth);
      this.currentStripWidth = modes[(idx + 1) % modes.length];
    }

    document.body.classList.remove(
      "sonikoma-strip-comfort",
      "sonikoma-strip-cinematic",
      "sonikoma-strip-compact"
    );

    const labels: Record<string, string> = {
      fit: "Fit Screen",
      comfort: "Comfort (850px)",
      cinematic: "Cinematic (1050px)",
      compact: "Compact (680px)",
    };

    if (this.currentStripWidth === "comfort") {
      document.body.classList.add("sonikoma-strip-comfort");
    } else if (this.currentStripWidth === "cinematic") {
      document.body.classList.add("sonikoma-strip-cinematic");
    } else if (this.currentStripWidth === "compact") {
      document.body.classList.add("sonikoma-strip-compact");
    }

    const btn = document.getElementById("sonikoma-flyout-btn-width");
    if (btn) {
      btn.textContent = labels[this.currentStripWidth] || "Fit Screen";
    }
    this.showToast(`Strip Width: ${labels[this.currentStripWidth]}`);
  }

  toggleNightInvert() {
    this.isNightInvert = !this.isNightInvert;
    if (this.isNightInvert) {
      document.body.classList.add("sonikoma-night-invert");
    } else {
      document.body.classList.remove("sonikoma-night-invert");
    }
    const btn = document.getElementById("sonikoma-btn-toggle-invert");
    if (btn) {
      btn.textContent = this.isNightInvert ? "ON" : "OFF";
      if (this.isNightInvert) btn.classList.add("sonikoma-active");
      else btn.classList.remove("sonikoma-active");
    }
    this.showToast(this.isNightInvert ? "Night Invert ON" : "Night Invert OFF");
  }

  cycleSoundscape() {
    const mood = this.soundscape.cycleMood();
    const btn = document.getElementById("sonikoma-btn-cinema-bgm");
    const icon = document.getElementById("sonikoma-bgm-icon");
    const flyoutBtn = document.getElementById("sonikoma-flyout-btn-soundscape");

    if (icon) icon.textContent = mood.icon;
    if (flyoutBtn) flyoutBtn.textContent = `${mood.icon} ${mood.name}`;

    if (btn) {
      if (mood.id !== "off") btn.classList.add("sonikoma-active");
      else btn.classList.remove("sonikoma-active");
    }
    this.showToast(`Soundscape: ${mood.icon} ${mood.name}`);
  }

  cycleShader() {
    const idx = CINEMA_SHADERS.findIndex((s) => s.id === this.currentShader);
    const nextIdx = (idx + 1) % CINEMA_SHADERS.length;
    const shader = CINEMA_SHADERS[nextIdx];
    this.currentShader = shader.id;

    // Apply filter to body / images container
    const filterTarget = document.documentElement;
    if (shader.id === "normal") {
      filterTarget.style.filter = "";
    } else {
      filterTarget.style.filter = shader.filterCss;
    }

    const btn = document.getElementById("sonikoma-btn-cinema-shader");
    const flyoutBtn = document.getElementById("sonikoma-flyout-btn-shader");
    if (flyoutBtn) flyoutBtn.textContent = `${shader.icon} ${shader.name}`;

    if (btn) {
      if (shader.id !== "normal") btn.classList.add("sonikoma-active");
      else btn.classList.remove("sonikoma-active");
    }
    this.showToast(`Shader: ${shader.icon} ${shader.name}`);
  }

  toggleVoiceNarrator() {
    const active = this.voiceNarrator.toggle();
    const btn = document.getElementById("sonikoma-btn-cinema-voice");
    const flyoutBtn = document.getElementById("sonikoma-flyout-btn-voice");

    if (btn) {
      if (active) btn.classList.add("sonikoma-active");
      else btn.classList.remove("sonikoma-active");
    }
    if (flyoutBtn) {
      flyoutBtn.textContent = active ? "ON" : "OFF";
      if (active) flyoutBtn.classList.add("sonikoma-active");
      else flyoutBtn.classList.remove("sonikoma-active");
    }

    this.showToast(
      active ? "🎙️ Voice Narrator Active" : "🎙️ Voice Narrator Off"
    );
    if (active) {
      this.narrateCurrentScene();
    }
  }

  private narrateCurrentScene() {
    if (!this.voiceNarrator.isActive) return;
    const curIdx = this.currentPanelIndex + 1;
    const total = this.detectedPanels.length || 1;
    this.voiceNarrator.speak(`Entering Scene ${curIdx} of ${total}`);
  }

  toggleTheaterDimmer() {
    this.isDimmed = !this.isDimmed;
    const btn = document.getElementById("sonikoma-btn-cinema-dimmer");
    const flyoutBtn = document.getElementById("sonikoma-btn-toggle-dimmer");
    if (this.dimmerElement) {
      if (this.isDimmed) {
        this.dimmerElement.classList.remove("sonikoma-hidden");
        this.dimmerElement.style.setProperty("display", "block", "important");
      } else {
        this.dimmerElement.classList.add("sonikoma-hidden");
        this.dimmerElement.style.setProperty("display", "none", "important");
      }
    }
    if (btn) {
      if (this.isDimmed) btn.classList.add("sonikoma-active");
      else btn.classList.remove("sonikoma-active");
    }
    if (flyoutBtn) {
      flyoutBtn.textContent = this.isDimmed ? "ON" : "OFF";
      if (this.isDimmed) flyoutBtn.classList.add("sonikoma-active");
      else flyoutBtn.classList.remove("sonikoma-active");
    }
    this.showToast(this.isDimmed ? "Theater Dimmer ON" : "Theater Dimmer OFF");
  }

  toggleSpotlight() {
    this.isSpotlight = !this.isSpotlight;
    const btn = document.getElementById("sonikoma-btn-cinema-spotlight");
    const flyoutBtn = document.getElementById("sonikoma-btn-toggle-spotlight");
    if (this.spotlightElement) {
      if (this.isSpotlight) {
        this.spotlightElement.classList.remove("sonikoma-hidden");
        this.spotlightElement.style.setProperty(
          "display",
          "block",
          "important"
        );
      } else {
        this.spotlightElement.classList.add("sonikoma-hidden");
        this.spotlightElement.style.setProperty("display", "none", "important");
      }
    }
    if (btn) {
      if (this.isSpotlight) btn.classList.add("sonikoma-active");
      else btn.classList.remove("sonikoma-active");
    }
    if (flyoutBtn) {
      flyoutBtn.textContent = this.isSpotlight ? "ON" : "OFF";
      if (this.isSpotlight) flyoutBtn.classList.add("sonikoma-active");
      else flyoutBtn.classList.remove("sonikoma-active");
    }
    this.showToast(
      this.isSpotlight ? "Spotlight Focus ON" : "Spotlight Focus OFF"
    );
  }

  toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        this.showToast("Fullscreen Immersion ON");
      } else {
        if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
        this.showToast("Fullscreen OFF");
      }
    } catch (_) {}
  }

  snipActiveScene() {
    const curIdx = this.currentPanelIndex;
    const currentPanel = this.detectedPanels[curIdx];
    this.showToast(`📸 Captured Scene #${curIdx + 1}!`);

    if (
      typeof chrome !== "undefined" &&
      chrome.runtime &&
      chrome.runtime.sendMessage
    ) {
      chrome.runtime.sendMessage({
        type: "TRIGGER_ACTIVE_SCENE_SNIP",
        payload: {
          panelIndex: curIdx + 1,
          src: currentPanel?.src || "",
          url: window.location.href,
        },
      });
    }
  }

  bookmarkActiveScene() {
    const curIdx = this.currentPanelIndex + 1;
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const maxScroll = Math.max(
      1,
      (document.documentElement.scrollHeight || document.body.scrollHeight) -
        window.innerHeight
    );
    const progress = Math.round((scrollY / maxScroll) * 100);

    const bookmark = {
      url: window.location.href,
      title: document.title,
      scene: curIdx,
      progress,
      timestamp: Date.now(),
    };

    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.get("sonikoma_bookmarks", (data) => {
        const list = Array.isArray(data?.sonikoma_bookmarks)
          ? data.sonikoma_bookmarks
          : [];
        list.unshift(bookmark);
        chrome.storage.local.set(
          { sonikoma_bookmarks: list.slice(0, 50) },
          () => {
            this.showToast(
              `📌 Bookmark saved at Scene ${curIdx} (${progress}%)`
            );
          }
        );
      });
    } else {
      this.showToast(`📌 Bookmark saved at Scene ${curIdx} (${progress}%)`);
    }
  }

  toggleSettingsFlyout(force?: boolean) {
    const flyout = document.getElementById("sonikoma-cinema-flyout");
    if (!flyout) return;
    this.isSettingsOpen =
      typeof force === "boolean" ? force : !this.isSettingsOpen;
    if (this.isSettingsOpen) {
      flyout.classList.remove("sonikoma-hidden");
      flyout.style.setProperty("display", "flex", "important");
      flyout.style.setProperty("visibility", "visible", "important");
      flyout.style.setProperty("opacity", "1", "important");

      // Position neatly right near HUD if not dragged yet
      if (!flyout.getAttribute("data-sk-dragged") && this.hudElement) {
        const hudRect = this.hudElement.getBoundingClientRect();
        const flyoutWidth = flyout.offsetWidth || 320;
        const left = Math.max(
          10,
          Math.min(
            window.innerWidth - flyoutWidth - 10,
            hudRect.right - flyoutWidth
          )
        );
        const top = this.isDockTop
          ? hudRect.bottom + 12
          : Math.max(10, hudRect.top - 520);

        flyout.style.setProperty("position", "fixed", "important");
        flyout.style.setProperty("left", `${Math.round(left)}px`, "important");
        flyout.style.setProperty("top", `${Math.round(top)}px`, "important");
        flyout.style.setProperty("right", "auto", "important");
        flyout.style.setProperty("bottom", "auto", "important");
        flyout.style.setProperty("transform", "none", "important");
      }
    } else {
      flyout.classList.add("sonikoma-hidden");
      flyout.style.setProperty("display", "none", "important");
    }
  }

  toggleDockPosition() {
    this.isDockTop = !this.isDockTop;
    if (this.hudElement) {
      this.hudElement.removeAttribute("data-sk-dragged");
      this.hudElement.style.removeProperty("left");
      this.hudElement.style.removeProperty("top");
      this.hudElement.style.removeProperty("right");
      this.hudElement.style.removeProperty("bottom");
      this.hudElement.style.removeProperty("transform");
      this.hudElement.style.removeProperty("margin");

      if (this.isDockTop) {
        this.hudElement.classList.remove("sonikoma-dock-bottom");
        this.hudElement.classList.add("sonikoma-dock-top");
      } else {
        this.hudElement.classList.remove("sonikoma-dock-top");
        this.hudElement.classList.add("sonikoma-dock-bottom");
      }
    }
    this.showToast(this.isDockTop ? "Docked to Top" : "Docked to Bottom");
  }

  jumpToNextPanel() {
    if (!this.detectedPanels || this.detectedPanels.length === 0) {
      this.refreshPanels();
    }
    const currentY = window.scrollY + 120;
    const nextIdx = this.detectedPanels.findIndex((p) => p.top > currentY);
    if (nextIdx !== -1) {
      this.currentPanelIndex = nextIdx;
      window.scrollTo({
        top: this.detectedPanels[nextIdx].top - 80,
        behavior: "smooth",
      });
      this.updatePanelReadout();
      if (this.voiceNarrator.isActive) {
        this.voiceNarrator.speak(`Scene ${nextIdx + 1}`);
      }
    }
  }

  jumpToPrevPanel() {
    if (!this.detectedPanels || this.detectedPanels.length === 0) {
      this.refreshPanels();
    }
    const currentY = window.scrollY - 100;
    let prevIdx = -1;
    for (let i = this.detectedPanels.length - 1; i >= 0; i--) {
      if (this.detectedPanels[i].top < currentY) {
        prevIdx = i;
        break;
      }
    }
    if (prevIdx !== -1) {
      this.currentPanelIndex = prevIdx;
      window.scrollTo({
        top: Math.max(0, this.detectedPanels[prevIdx].top - 80),
        behavior: "smooth",
      });
      this.updatePanelReadout();
      if (this.voiceNarrator.isActive) {
        this.voiceNarrator.speak(`Scene ${prevIdx + 1}`);
      }
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  private refreshPanels() {
    if (this.scanner?.scanChapterImages) {
      this.detectedPanels = this.scanner.scanChapterImages();
    }
    if (this.scanner?.scanChapterImagesAsync) {
      this.scanner
        .scanChapterImagesAsync()
        .then((panels: any) => {
          if (panels && panels.length > 0) {
            this.detectedPanels = panels;
            this.updatePanelReadout();
          }
        })
        .catch(() => {});
    }
  }

  private updatePanelReadout() {
    const readout = document.getElementById("sonikoma-panel-readout");
    if (readout) {
      const total = this.detectedPanels.length || 1;
      const cur = Math.min(total, this.currentPanelIndex + 1);
      readout.textContent = `Scene ${cur}/${total}`;
    }
  }

  private updateStatusBadge(text: string, icon: string) {
    const statusText = document.getElementById("sonikoma-cinema-status");
    const iconElem = document.getElementById("sonikoma-cinema-icon");
    if (statusText) statusText.textContent = text;
    if (iconElem) iconElem.textContent = icon;
  }

  private triggerNextChapterPrompt() {
    if (!this.isAutoAdvanceChapter) return;
    if (this.nextChapterBanner) return;

    const banner = document.createElement("div");
    banner.id = "sonikoma-next-chapter-banner";
    banner.className = "sonikoma-next-chapter-banner";
    this.nextChapterCountdown = 6;

    const findNextUrl = (): string => {
      // 1. Search for common next chapter links
      const links = Array.from(document.querySelectorAll("a"));
      for (const a of links) {
        const text = (a.textContent || "").toLowerCase();
        const href = a.getAttribute("href") || "";
        if (
          (text.includes("next chapter") ||
            text.includes("next episode") ||
            text.includes("next >") ||
            a.className.includes("next")) &&
          href &&
          !href.startsWith("#") &&
          !href.startsWith("javascript")
        ) {
          return a.href;
        }
      }
      // 2. Try incrementing chapter in current URL
      const match = window.location.href.match(
        /(chapter|ep|episode)[-_/](\d+)/i
      );
      if (match) {
        const nextNum = parseInt(match[2], 10) + 1;
        return window.location.href.replace(match[0], `${match[1]}-${nextNum}`);
      }
      return "";
    };

    const nextUrl = findNextUrl();

    banner.innerHTML = `
      <div class="sonikoma-next-content">
        <span class="sonikoma-next-title">🎉 Chapter Finished!</span>
        <span id="sonikoma-next-timer" class="sonikoma-next-subtitle">
          ${
            nextUrl
              ? `Auto-advancing to Next Chapter in <strong id="sk-countdown">6</strong>s...`
              : "You have reached the end of this chapter."
          }
        </span>
      </div>
      <div class="sonikoma-next-actions">
        ${
          nextUrl
            ? `<a href="${nextUrl}" id="sonikoma-btn-read-next" class="sonikoma-btn-next-act">Next Chapter ➔</a>`
            : ""
        }
        <button type="button" id="sonikoma-btn-cancel-next" class="sonikoma-btn-cancel-act">Stay Here</button>
      </div>
    `;

    (document.body || document.documentElement).appendChild(banner);
    this.nextChapterBanner = banner;

    banner
      .querySelector("#sonikoma-btn-cancel-next")
      ?.addEventListener("click", () => {
        this.cancelNextChapterCountdown();
      });

    if (nextUrl) {
      this.nextChapterTimerId = setInterval(() => {
        this.nextChapterCountdown--;
        const countSpan = document.getElementById("sk-countdown");
        if (countSpan) countSpan.textContent = `${this.nextChapterCountdown}`;

        if (this.nextChapterCountdown <= 0) {
          clearInterval(this.nextChapterTimerId);
          window.location.href = nextUrl;
        }
      }, 1000);
    }
  }

  private cancelNextChapterCountdown() {
    if (this.nextChapterTimerId) {
      clearInterval(this.nextChapterTimerId);
      this.nextChapterTimerId = null;
    }
    if (this.nextChapterBanner) {
      this.nextChapterBanner.remove();
      this.nextChapterBanner = null;
    }
  }

  start() {
    this.createCinemaHUD();
    this.createDimmerOverlay();
    this.createSpotlightOverlay();
    this.createSubtitleOverlay();

    if (this.hudElement) {
      this.hudElement.classList.remove("sonikoma-hidden");
      this.hudElement.style.setProperty("display", "block", "important");
      this.hudElement.style.setProperty("visibility", "visible", "important");
      this.hudElement.style.setProperty("opacity", "1", "important");
      this.hudElement.style.setProperty("z-index", "2147483647", "important");
    }

    this.refreshPanels();
    this.updatePanelReadout();

    if (this.scanner?.extractPageMetadata) {
      const meta = this.scanner.extractPageMetadata();
      const seriesElem = document.getElementById("sonikoma-cinema-series");
      if (seriesElem)
        seriesElem.textContent = meta.seriesTitle || "Sonikoma Reader";
    }

    // Default to Lo-Fi soundscape on start if off
    if (this.soundscape.currentMood === "off") {
      this.cycleSoundscape();
    }

    this.isPlaying = false;
    this.updateStatusBadge("Play", "▶");
    this.subpixelAccumulator = 0;
    this.hideNativeDistractions();
    setTimeout(() => this.hideNativeDistractions(), 800);
    this.showToast("Cinema Mode Ready • Click Play or Space to Scroll");
  }

  play() {
    this.isPlaying = true;
    this.isTemporarilyPausedForUser = false;
    this.updateStatusBadge("Pause", "⏸");
    this.lastTimestamp = performance.now();
    this.loop(this.lastTimestamp);
  }

  pause() {
    this.isPlaying = false;
    this.updateStatusBadge("Play", "▶");
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  stop() {
    this.pause();
    this.soundscape.stop();
    this.voiceNarrator.stop();
    this.toggleSettingsFlyout(false);
    this.cancelNextChapterCountdown();

    document.documentElement.style.filter = "";

    if (this.hudElement) {
      this.hudElement.classList.add("sonikoma-hidden");
      this.hudElement.style.setProperty("display", "none", "important");
    }
    if (this.dimmerElement) {
      this.dimmerElement.classList.add("sonikoma-hidden");
      this.dimmerElement.style.setProperty("display", "none", "important");
      this.isDimmed = false;
    }
    if (this.spotlightElement) {
      this.spotlightElement.classList.add("sonikoma-hidden");
      this.spotlightElement.style.setProperty("display", "none", "important");
      this.isSpotlight = false;
    }
    if (this.subtitleElement) {
      this.subtitleElement.classList.add("sonikoma-hidden");
      this.subtitleElement.style.setProperty("display", "none", "important");
    }

    document.body.classList.remove(
      "sonikoma-night-invert",
      "sonikoma-strip-comfort",
      "sonikoma-strip-cinematic",
      "sonikoma-strip-compact"
    );

    this.restoreNativeDistractions();
  }

  private hideNativeDistractions() {
    if (!this.isHideDistractions) return;
    document.body.classList.add("sonikoma-cinema-immersion-active");
    document.documentElement.classList.add("sonikoma-cinema-immersion-active");

    try {
      const candidates = document.querySelectorAll(
        "div, button, a, span, aside, nav, footer, p, i, section"
      );
      candidates.forEach((node) => {
        const el = node as HTMLElement;
        if (!el || typeof el.getBoundingClientRect !== "function") return;
        if (el.closest("[id^='sonikoma-'], [class*='sonikoma']")) return;
        if (
          el.id?.startsWith("sonikoma") ||
          el.className?.toString().includes("sonikoma")
        )
          return;

        const tag = el.tagName.toUpperCase();
        if (["IMG", "CANVAS", "VIDEO", "AUDIO", "PICTURE"].includes(tag))
          return;

        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        // 1. Precise match for bottom capsule pills (e.g. drawer pull bar shown in screenshot)
        const isPillShape =
          rect.width >= 20 &&
          rect.width <= 160 &&
          rect.height >= 4 &&
          rect.height <= 50;

        const isNearBottomCenter =
          (rect.bottom >= window.innerHeight - 220 ||
            rect.top >= window.innerHeight - 220) &&
          Math.abs(rect.left + rect.width / 2 - window.innerWidth / 2) < 220;

        const text = (el.textContent || "").trim();
        const hasLittleText = text.length <= 4;

        if (isPillShape && isNearBottomCenter && hasLittleText) {
          el.classList.add("sonikoma-native-distraction-hidden");
          el.setAttribute("data-sk-distraction", "true");
          el.style.setProperty("display", "none", "important");
          el.style.setProperty("opacity", "0", "important");
          el.style.setProperty("visibility", "hidden", "important");
          el.style.setProperty("pointer-events", "none", "important");
          el.style.setProperty("box-shadow", "none", "important");

          const parent = el.parentElement;
          if (
            parent &&
            parent.children.length === 1 &&
            !parent.closest("[id^='sonikoma-'], [class*='sonikoma']")
          ) {
            const pRect = parent.getBoundingClientRect();
            if (pRect.height <= 70) {
              parent.classList.add("sonikoma-native-distraction-hidden");
              parent.setAttribute("data-sk-distraction", "true");
              parent.style.setProperty("display", "none", "important");
            }
          }
          return;
        }

        // 2. Fixed & Sticky floating widgets (drawers, scroll-to-top buttons)
        const style = window.getComputedStyle(el);
        if (
          style.position === "fixed" ||
          style.position === "sticky" ||
          style.position === "absolute"
        ) {
          const isBottomDocked =
            rect.bottom >= window.innerHeight - 120 && rect.height <= 140;
          const isCornerFloat =
            rect.width > 0 &&
            rect.width <= 110 &&
            rect.height > 0 &&
            rect.height <= 110 &&
            (rect.bottom >= window.innerHeight - 150 ||
              rect.right >= window.innerWidth - 120 ||
              rect.left <= 120);

          const cls = (el.className || "").toString().toLowerCase();
          const id = (el.id || "").toLowerCase();
          const isDrawerOrHandle =
            cls.includes("handle") ||
            cls.includes("drawer") ||
            cls.includes("pull") ||
            cls.includes("drag") ||
            cls.includes("indicator") ||
            cls.includes("pill") ||
            id.includes("handle") ||
            id.includes("drawer") ||
            id.includes("pull");

          if (isBottomDocked || isCornerFloat || isDrawerOrHandle) {
            el.classList.add("sonikoma-native-distraction-hidden");
            el.setAttribute("data-sk-distraction", "true");
            el.style.setProperty("display", "none", "important");
            el.style.setProperty("opacity", "0", "important");
            el.style.setProperty("visibility", "hidden", "important");
            el.style.setProperty("box-shadow", "none", "important");
          }
        }
      });
    } catch {
      // Ignore query errors
    }
  }

  private restoreNativeDistractions() {
    document.body.classList.remove("sonikoma-cinema-immersion-active");
    document.documentElement.classList.remove("sonikoma-cinema-immersion-active");
    try {
      const hiddenElements = document.querySelectorAll(
        "[data-sk-distraction='true']"
      );
      hiddenElements.forEach((node) => {
        node.classList.remove("sonikoma-native-distraction-hidden");
        node.removeAttribute("data-sk-distraction");
      });
    } catch {}
  }

  private loop(timestamp: number) {
    if (!this.isPlaying) return;

    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    const deltaTimeSec = Math.min(0.1, (timestamp - this.lastTimestamp) / 1000);
    this.lastTimestamp = timestamp;

    if (!this.isTemporarilyPausedForUser) {
      let effectiveSpeed = this.scrollSpeed;

      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const maxScroll = Math.max(
        1,
        (document.documentElement.scrollHeight || document.body.scrollHeight) -
          window.innerHeight
      );

      // AI Director Adaptive Pacing
      if (this.isAdaptivePacing && this.detectedPanels.length > 0) {
        const nextPanelIdx = this.detectedPanels.findIndex(
          (p) => Math.abs(p.top - (scrollY + 100)) < 70
        );
        if (nextPanelIdx !== -1 && nextPanelIdx !== this.lastPausedPanelIdx) {
          if (this.panelPauseTimer < 1.2) {
            this.panelPauseTimer += deltaTimeSec;
            effectiveSpeed = this.scrollSpeed * 0.35; // gentle easing
          } else {
            this.lastPausedPanelIdx = nextPanelIdx;
            this.panelPauseTimer = 0;
            if (
              this.voiceNarrator.isActive &&
              this.lastNarratedPanelIdx !== nextPanelIdx
            ) {
              this.lastNarratedPanelIdx = nextPanelIdx;
              this.voiceNarrator.speak(`Scene ${nextPanelIdx + 1}`);
            }
          }
        } else {
          this.panelPauseTimer = 0;
        }
      }

      const scrollPixels =
        this.baseSpeedPxPerSec * effectiveSpeed * deltaTimeSec;
      this.subpixelAccumulator += scrollPixels;

      const wholePixels = Math.floor(this.subpixelAccumulator);
      if (wholePixels >= 1) {
        this.subpixelAccumulator -= wholePixels;
        window.scrollBy(0, wholePixels);
      }

      // Progress bar calculation
      const progressPercent = Math.min(
        100,
        Math.max(0, Math.round((scrollY / maxScroll) * 100))
      );
      const fill = document.getElementById("sonikoma-hud-progress-fill");
      if (fill) fill.style.width = `${progressPercent}%`;

      // Live ETA calculation
      const remainingPixels = Math.max(0, maxScroll - scrollY);
      const remainingSeconds = Math.round(
        remainingPixels / Math.max(1, this.baseSpeedPxPerSec * this.scrollSpeed)
      );
      const remainingMinutes = Math.ceil(remainingSeconds / 60);
      const etaElem = document.getElementById("sonikoma-flyout-eta");
      if (etaElem) {
        etaElem.textContent =
          remainingMinutes > 1
            ? `~${remainingMinutes} min left (${progressPercent}%)`
            : `< 1 min left (${progressPercent}%)`;
      }

      // Track active panel index
      if (this.detectedPanels.length > 0) {
        const activeIdx = this.detectedPanels.findIndex(
          (p) => p.top > scrollY + 150
        );
        if (activeIdx !== -1 && activeIdx !== this.currentPanelIndex) {
          this.currentPanelIndex = Math.max(0, activeIdx - 1);
          this.updatePanelReadout();
        }
      }

      // Reached bottom / end of chapter
      if (scrollY >= maxScroll - 20) {
        this.pause();
        this.updateStatusBadge("Finished", "✓");
        this.showToast("🎉 Chapter Completed!");
        this.triggerNextChapterPrompt();
        return;
      }
    }

    this.animationFrameId = requestAnimationFrame((ts) => this.loop(ts));
  }
}

if (typeof window !== "undefined") {
  (window as any).CinemaPlayer = CinemaPlayer;
}
