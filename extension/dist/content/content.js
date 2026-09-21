/**
 * Sonikoma Cinema Reader & DOM Scanner Content Script Bundle v3.1
 * Fully self-contained IIFE for in-browser injection with draggable HUD & Moveable Settings Flyout.
 */
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// ─── 1. DOM Manga Scanner ─────────────────────────────────────────────────────
class DomMangaScanner {
  static getRealImageSrc(el) {
    if (!el) return "";
    const attrs = [
      "data-url", "data-src", "data-original", "data-lazy-src",
      "data-echo", "data-real-src", "data-cdn", "data-full-url",
      "data-srcset", "srcset", "src"
    ];
    for (const attr of attrs) {
      const val = el.getAttribute(attr);
      if (val && typeof val === "string") {
        const trimmed = val.trim();
        if (
          trimmed.length > 5 &&
          !trimmed.startsWith("data:image/gif") &&
          !trimmed.startsWith("data:image/svg") &&
          !trimmed.includes("blank.gif") &&
          !trimmed.includes("spacer.gif") &&
          !trimmed.includes("placeholder")
        ) {
          const first = trimmed.split(",")[0].trim().split(" ")[0].trim();
          if (first.startsWith("//")) return `https:${first}`;
          if (first.startsWith("http://") || first.startsWith("https://")) return first;
          if (first.startsWith("/")) return `${window.location.origin}${first}`;
          return first;
        }
      }
    }
    const bg = el.style?.backgroundImage || window.getComputedStyle(el).backgroundImage;
    if (bg && bg.includes("url(")) {
      const match = bg.match(/url\(['"]?([^'"]+)['"]?\)/);
      if (match && match[1]) {
        let clean = match[1].trim();
        if (clean.startsWith("//")) clean = `https:${clean}`;
        if (clean.startsWith("/")) clean = `${window.location.origin}${clean}`;
        if (!clean.startsWith("data:image/gif") && !clean.startsWith("data:image/svg") && !clean.includes("blank.gif")) {
          return clean;
        }
      }
    }
    return "";
  }

  static scanChapterImages() {
    const list = [];
    const seen = new Set();
    const selectors = [
      "#_imageList img", "#_imageList img._images", "img._images", "#_viewerBox img",
      ".viewer_lst img", ".viewer_img img", ".viewer_lst .viewer_img img", ".wt_viewer img",
      "#comic_view_area img", ".view_area img", ".reader-area img", ".comic-page img",
      ".chapter-content img", ".reading-content img", ".entry-content img", ".page-break img",
      ".container-chapter-reader img", ".v-reader img", "#reader img", "#viewer img",
      "#chapter-images img", "div[class*='viewer'] img", "div[class*='reader'] img",
      "div[id*='viewer'] img", "div[id*='reader'] img", "img[data-url]", "img[data-src]",
      "img[data-original]", "article img", "main img", "img"
    ];

    let foundElements = [];
    for (const sel of selectors) {
      try {
        const query = Array.from(document.querySelectorAll(sel));
        if (query.length >= 2 && query.some((i) => !!this.getRealImageSrc(i))) {
          foundElements = query;
          break;
        }
      } catch (_) {}
    }

    if (foundElements.length === 0) {
      foundElements = Array.from(document.querySelectorAll("img, picture source, [style*='background-image']"));
    }

    for (const el of foundElements) {
      const src = this.getRealImageSrc(el);
      if (!src || seen.has(src)) continue;

      const rect = el.getBoundingClientRect();
      const img = el;
      const w = img.naturalWidth || rect.width || 0;
      const h = img.naturalHeight || rect.height || 0;

      const isDataHeavy = !!(
        el.getAttribute("data-url") || el.getAttribute("data-src") ||
        el.getAttribute("data-original") || el.getAttribute("data-lazy-src") ||
        el.getAttribute("data-real-src") || el.getAttribute("data-echo") ||
        el.getAttribute("data-cdn") || el.getAttribute("data-full-url")
      );

      if (!isDataHeavy && w > 0 && w < 80 && h > 0 && h < 80) continue;

      const lower = src.toLowerCase();
      const isAdOrIcon =
        lower.includes("favicon") || lower.includes("avatar") ||
        lower.includes("logo") || lower.includes("banner") ||
        lower.includes("share_") || lower.includes("btn_") ||
        lower.includes("tracking") || lower.includes("analytics");

      if (isAdOrIcon) continue;

      seen.add(src);
      const absTop = window.scrollY + rect.top;
      list.push({
        index: list.length,
        src,
        top: Math.round(absTop),
        height: Math.round(rect.height || h || 800),
        width: Math.round(rect.width || w || 600)
      });
    }

    list.sort((a, b) => a.top - b.top);
    return list;
  }

  static extractPageMetadata() {
    let seriesTitle = "";
    let chapterTitle = "";

    const titleEl = document.querySelector(
      "h1, .subj, .title, .manga-title, .comic-title, .chapter-title, .entry-title"
    );
    if (titleEl && titleEl.textContent) {
      seriesTitle = titleEl.textContent.trim().split("\n")[0].substring(0, 50);
    }

    const chapEl = document.querySelector(
      ".chapter-name, .episode_title, .chap-title, .c-breadcrumb li:last-child"
    );
    if (chapEl && chapEl.textContent) {
      chapterTitle = chapEl.textContent.trim().split("\n")[0].substring(0, 40);
    }

    if (!seriesTitle) {
      const docTitle = document.title || "";
      const parts = docTitle.split(/[-|•»]/);
      seriesTitle = (parts[0] || "Unknown Manga").trim();
      if (parts.length > 1) {
        chapterTitle = parts[1].trim();
      }
    }

    return {
      seriesTitle: seriesTitle || "Sonikoma Manga",
      chapterTitle: chapterTitle || "Chapter 1",
      pageUrl: window.location.href,
      totalPanels: 0,
      timestamp: Date.now()
    };
  }
}

// ─── 2. Web Audio Ambient Soundscapes ────────────────────────────────────────
const SOUNDSCAPE_MOODS = [
  { id: "off", name: "Mute", icon: "🔇", desc: "No background audio" },
  { id: "lofi", name: "Lo-Fi Chords", icon: "🎵", desc: "Calm warm cinematic chords" },
  { id: "rain", name: "Rain Waves", icon: "🌧️", desc: "Organic rain & ocean swell" },
  { id: "space", name: "Cyber Drone", icon: "🌌", desc: "432Hz ethereal ambient drone" },
  { id: "pulse", name: "Action Pulse", icon: "⚡", desc: "Tense rhythmic sub-bass pulse" },
  { id: "zen", name: "Zen Harmony", icon: "🎋", desc: "Peaceful acoustic resonant harmonics" },
];

class AmbientSoundscapeEngine {
  constructor() {
    this.ctx = null;
    this.currentMood = "off";
    this.masterGain = null;
    this.activeNodes = [];
    this.volume = 0.65;
  }

  cycleMood() {
    const idx = SOUNDSCAPE_MOODS.findIndex((m) => m.id === this.currentMood);
    const nextIdx = (idx + 1) % SOUNDSCAPE_MOODS.length;
    this.setMood(SOUNDSCAPE_MOODS[nextIdx].id);
    return SOUNDSCAPE_MOODS[nextIdx];
  }

  setMood(mood) {
    this.currentMood = mood;
    if (mood === "off") {
      this.stop();
    } else {
      this.startMood(mood);
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.setValueAtTime(0.08 * this.volume, this.ctx.currentTime);
      } catch (_) {}
    }
  }

  initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  startMood(mood) {
    try {
      this.initCtx();
      this.stop();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      const targetGain = 0.08 * this.volume;
      this.masterGain.gain.exponentialRampToValueAtTime(targetGain, this.ctx.currentTime + 2.0);
      this.masterGain.connect(this.ctx.destination);

      if (mood === "lofi") {
        const freqs = [65.41, 130.81, 196.0, 311.13, 392.0];
        freqs.forEach((f, i) => {
          const osc = this.ctx.createOscillator();
          osc.type = i === 0 ? "sine" : i % 2 === 0 ? "triangle" : "sine";
          osc.frequency.setValueAtTime(f, this.ctx.currentTime);

          const lfo = this.ctx.createOscillator();
          const lfoGain = this.ctx.createGain();
          lfo.frequency.setValueAtTime(0.08 + i * 0.03, this.ctx.currentTime);
          lfoGain.gain.setValueAtTime(1.5, this.ctx.currentTime);
          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);
          lfo.start();

          osc.connect(this.masterGain);
          osc.start();
          this.activeNodes.push(osc, lfo, lfoGain);
        });
      } else if (mood === "rain") {
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
          b6 = white * 0.115926;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(800, this.ctx.currentTime);

        const lfo = this.ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime);
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(300, this.ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();

        whiteNoise.connect(filter);
        filter.connect(this.masterGain);
        whiteNoise.start();
        this.activeNodes.push(whiteNoise, filter, lfo, lfoGain);
      } else if (mood === "space") {
        const freqs = [108, 216, 432, 648];
        freqs.forEach((f, i) => {
          const osc = this.ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.setValueAtTime(f, this.ctx.currentTime);

          const pan = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
          if (pan) {
            pan.pan.setValueAtTime(i % 2 === 0 ? -0.4 : 0.4, this.ctx.currentTime);
            osc.connect(pan);
            pan.connect(this.masterGain);
            this.activeNodes.push(pan);
          } else {
            osc.connect(this.masterGain);
          }
          osc.start();
          this.activeNodes.push(osc);
        });
      } else if (mood === "pulse") {
        const osc = this.ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(55, this.ctx.currentTime);

        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(220, this.ctx.currentTime);
        filter.Q.setValueAtTime(4, this.ctx.currentTime);

        const lfo = this.ctx.createOscillator();
        lfo.type = "square";
        lfo.frequency.setValueAtTime(2.0, this.ctx.currentTime);
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(140, this.ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();

        osc.connect(filter);
        filter.connect(this.masterGain);
        osc.start();
        this.activeNodes.push(osc, filter, lfo, lfoGain);
      } else if (mood === "zen") {
        const harmonics = [144, 288, 432, 576, 864];
        harmonics.forEach((f, i) => {
          const osc = this.ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.setValueAtTime(f, this.ctx.currentTime);

          const subGain = this.ctx.createGain();
          subGain.gain.setValueAtTime(1 / (i + 1.5), this.ctx.currentTime);

          const lfo = this.ctx.createOscillator();
          lfo.frequency.setValueAtTime(0.05 + i * 0.02, this.ctx.currentTime);
          const lfoGain = this.ctx.createGain();
          lfoGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
          lfo.connect(lfoGain);
          lfoGain.connect(subGain.gain);
          lfo.start();

          osc.connect(subGain);
          subGain.connect(this.masterGain);
          osc.start();
          this.activeNodes.push(osc, subGain, lfo, lfoGain);
        });
      }
    } catch (_) {}
  }

  stop() {
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      } catch (_) {}
    }
    setTimeout(() => {
      this.activeNodes.forEach((node) => {
        try {
          if (typeof node.stop === "function") node.stop();
        } catch (_) {}
      });
      this.activeNodes = [];
    }, 350);
  }
}

// ─── 3. Visual Shaders & AI Voice Engines ────────────────────────────────────
const CINEMA_SHADERS = [
  { id: "normal", name: "Natural", icon: "🖼️", filterCss: "none" },
  { id: "oled", name: "OLED Dark", icon: "🕶️", filterCss: "contrast(1.18) brightness(0.92) saturate(1.08)" },
  { id: "sepia", name: "Warm Sepia", icon: "📜", filterCss: "sepia(0.38) contrast(1.08) brightness(0.96) hue-rotate(-12deg)" },
  { id: "cyber", name: "Cyber Neon", icon: "🎆", filterCss: "saturate(1.45) contrast(1.15) hue-rotate(8deg)" },
  { id: "noir", name: "Noir Ink", icon: "🖤", filterCss: "grayscale(1) contrast(1.3) brightness(0.95)" },
  { id: "warm", name: "Night Amber", icon: "🕯️", filterCss: "sepia(0.55) brightness(0.92) hue-rotate(-25deg)" },
];

class AIVoiceNarratorEngine {
  constructor() {
    this.isVoiceActive = false;
    this.onSubtitleCallback = null;
  }

  setSubtitleCallback(cb) {
    this.onSubtitleCallback = cb;
  }

  toggle() {
    this.isVoiceActive = !this.isVoiceActive;
    if (!this.isVoiceActive) this.stop();
    return this.isVoiceActive;
  }

  get isActive() {
    return this.isVoiceActive;
  }

  speak(text) {
    if (!this.isVoiceActive || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 1.05;
      utt.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha"))
      );
      if (preferred) utt.voice = preferred;

      if (this.onSubtitleCallback) this.onSubtitleCallback(text);
      utt.onend = () => {
        if (this.onSubtitleCallback) this.onSubtitleCallback("");
      };
      window.speechSynthesis.speak(utt);
    } catch (_) {}
  }

  stop() {
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
    if (this.onSubtitleCallback) this.onSubtitleCallback("");
  }
}

// ─── 4. Main Cinema Player v3.1 with Moveable HUD & Flyout ───────────────────
class CinemaPlayer {
  constructor(scanner) {
    this.scanner = scanner || DomMangaScanner;
    this.isPlaying = false;
    this.scrollSpeed = 1.0;
    this.baseSpeedPxPerSec = 65;
    this.animationFrameId = null;
    this.lastTimestamp = null;
    this.subpixelAccumulator = 0;

    // DOM Elements
    this.hudElement = null;
    this.dimmerElement = null;
    this.spotlightElement = null;
    this.toastElement = null;
    this.subtitleElement = null;
    this.scrubberTooltipElement = null;
    this.nextChapterBanner = null;

    // Feature States
    this.isDimmed = false;
    this.isSpotlight = false;
    this.isAdaptivePacing = true;
    this.isAutoDimHud = true;
    this.isDockTop = true;
    this.isSettingsOpen = false;
    this.isTemporarilyPausedForUser = false;
    this.manualScrollTimeout = null;
    this.hudDimTimer = null;
    this.currentShader = "normal";

    // Panel & Timing Data
    this.detectedPanels = [];
    this.currentPanelIndex = 0;
    this.panelPauseTimer = 0;
    this.lastPausedPanelIdx = -1;
    this.lastNarratedPanelIdx = -1;
    this.nextChapterCountdown = 0;
    this.nextChapterTimerId = null;

    this.soundscape = new AmbientSoundscapeEngine();
    this.voiceNarrator = new AIVoiceNarratorEngine();

    this.init();
  }

  init() {
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

  bindGlobalShortcuts() {
    window.addEventListener("keydown", (e) => {
      const target = e.target;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) {
        return;
      }

      const isHudVisible = this.hudElement && !this.hudElement.classList.contains("sonikoma-hidden");
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

  bindUserScrollInterceptors() {
    const handleUserScroll = () => {
      if (!this.isPlaying || this.isTemporarilyPausedForUser) return;
      this.isTemporarilyPausedForUser = true;
      this.updateStatusBadge("Paused", "⏸");

      if (this.manualScrollTimeout) clearTimeout(this.manualScrollTimeout);
      this.manualScrollTimeout = setTimeout(() => {
        this.isTemporarilyPausedForUser = false;
        if (this.isPlaying) {
          this.updateStatusBadge("Playing", "▶");
          this.lastTimestamp = performance.now();
        }
      }, 1300);
    };

    window.addEventListener("wheel", handleUserScroll, { passive: true });
    window.addEventListener("touchmove", handleUserScroll, { passive: true });
  }

  bindMouseActivityInterceptors() {
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

  createDimmerOverlay() {
    let dimmer = document.getElementById("sonikoma-theater-dimmer");
    if (!dimmer) {
      dimmer = document.createElement("div");
      dimmer.id = "sonikoma-theater-dimmer";
      dimmer.className = "sonikoma-theater-dimmer sonikoma-hidden";
      (document.body || document.documentElement).appendChild(dimmer);
    }
    this.dimmerElement = dimmer;
  }

  createSpotlightOverlay() {
    let spot = document.getElementById("sonikoma-cinema-spotlight");
    if (!spot) {
      spot = document.createElement("div");
      spot.id = "sonikoma-cinema-spotlight";
      spot.className = "sonikoma-cinema-spotlight sonikoma-hidden";
      (document.body || document.documentElement).appendChild(spot);
    }
    this.spotlightElement = spot;
  }

  createSubtitleOverlay() {
    let sub = document.getElementById("sonikoma-cinema-subtitles");
    if (!sub) {
      sub = document.createElement("div");
      sub.id = "sonikoma-cinema-subtitles";
      sub.className = "sonikoma-cinema-subtitles sonikoma-hidden";
      (document.body || document.documentElement).appendChild(sub);
    }
    this.subtitleElement = sub;
  }

  updateSubtitle(text) {
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

  showToast(msg) {
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

  createCinemaHUD() {
    let hud = document.getElementById("sonikoma-cinema-hud");
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
            <span id="sonikoma-cinema-icon">⏸</span>
            <span id="sonikoma-cinema-status">Pause</span>
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
          <button type="button" id="sonikoma-btn-cinema-bgm" class="sonikoma-hud-icon-btn" title="Ambient Soundscape (M) • Lo-Fi, Rain, Drone, Pulse, Zen">
            <span id="sonikoma-bgm-icon">🎵</span>
          </button>

          <button type="button" id="sonikoma-btn-cinema-shader" class="sonikoma-hud-icon-btn" title="Cinematic Visual Shaders (C) • OLED, Sepia, Neon, Noir, Amber">
            <span id="sonikoma-shader-icon">🎨</span>
          </button>

          <button type="button" id="sonikoma-btn-cinema-voice" class="sonikoma-hud-icon-btn" title="AI Voice Narrator (V) • Hands-Free Speech Reading">
            🎙️
          </button>

          <button type="button" id="sonikoma-btn-cinema-spotlight" class="sonikoma-hud-icon-btn" title="Toggle Reading Spotlight Focus (L)">
            🔦
          </button>

          <button type="button" id="sonikoma-btn-cinema-dimmer" class="sonikoma-hud-icon-btn" title="Toggle Theater Dimmer (D)">
            🌑
          </button>

          <button type="button" id="sonikoma-btn-cinema-snip" class="sonikoma-hud-icon-btn" title="Instant Capture Active Scene (S)">
            ✂️
          </button>

          <button type="button" id="sonikoma-btn-cinema-bookmark" class="sonikoma-hud-icon-btn" title="Bookmark Chapter Position (B)">
            📌
          </button>

          <button type="button" id="sonikoma-btn-cinema-fs" class="sonikoma-hud-icon-btn" title="Toggle Fullscreen Immersion (F)">
            ⛶
          </button>

          <button type="button" id="sonikoma-btn-cinema-settings" class="sonikoma-hud-icon-btn" title="Cinema Settings & AI Director (⚙️)">
            ⚙️
          </button>

          <button type="button" id="sonikoma-btn-cinema-dock" class="sonikoma-hud-icon-btn" title="Flip Dock Position (Top / Bottom)">
            ⇅
          </button>

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
        <div id="sonikoma-cinema-flyout" class="sonikoma-cinema-flyout sonikoma-hidden">
          <div id="sonikoma-flyout-drag-header" class="sonikoma-flyout-header" title="Drag to move Settings anywhere">
            <div class="sonikoma-flyout-title-box">
              <span class="sonikoma-drag-icon">⠿</span>
              <span>Cinema Studio Master Controls</span>
            </div>
            <button type="button" id="sonikoma-btn-close-flyout" class="sonikoma-flyout-close">✕</button>
          </div>

          <div class="sonikoma-flyout-row">
            <span class="sonikoma-flyout-label">AI Director Adaptive Pacing</span>
            <button type="button" id="sonikoma-btn-toggle-pacing" class="sonikoma-toggle-switch sonikoma-active">ON</button>
          </div>

          <div class="sonikoma-flyout-row">
            <span class="sonikoma-flyout-label">HUD Auto-Dimming (Immersion)</span>
            <button type="button" id="sonikoma-btn-toggle-autodim" class="sonikoma-toggle-switch sonikoma-active">ON</button>
          </div>

          <div class="sonikoma-flyout-row">
            <span class="sonikoma-flyout-label">Soundscape Mode</span>
            <span id="sonikoma-flyout-soundscape-name" class="sonikoma-flyout-val">Lo-Fi Chords</span>
          </div>

          <div class="sonikoma-flyout-row">
            <span class="sonikoma-flyout-label">Audio Volume</span>
            <input type="range" id="sonikoma-volume-slider" min="0" max="100" value="65" class="sonikoma-slider-input" />
          </div>

          <div class="sonikoma-flyout-row">
            <span class="sonikoma-flyout-label">Visual Shader Filter</span>
            <span id="sonikoma-flyout-shader-name" class="sonikoma-flyout-val">Natural</span>
          </div>

          <div class="sonikoma-flyout-row">
            <span class="sonikoma-flyout-label">AI Voice Narrator</span>
            <span id="sonikoma-flyout-voice-status" class="sonikoma-flyout-val">OFF</span>
          </div>

          <div class="sonikoma-flyout-row">
            <span class="sonikoma-flyout-label">Remaining Reading Time</span>
            <span id="sonikoma-flyout-eta" class="sonikoma-flyout-val">~2 min left</span>
          </div>

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
      `;

      (document.body || document.documentElement).appendChild(hud);

      hud.querySelector("#sonikoma-btn-cinema-toggle")?.addEventListener("click", () => {
        if (this.isPlaying) this.pause();
        else this.play();
      });

      hud.querySelector("#sonikoma-btn-cinema-close")?.addEventListener("click", () => this.stop());
      hud.querySelector("#sonikoma-btn-speed-minus")?.addEventListener("click", () => this.adjustSpeed(-0.25));
      hud.querySelector("#sonikoma-btn-speed-plus")?.addEventListener("click", () => this.adjustSpeed(0.25));
      hud.querySelector("#sonikoma-btn-prev-panel")?.addEventListener("click", () => this.jumpToPrevPanel());
      hud.querySelector("#sonikoma-btn-next-panel")?.addEventListener("click", () => this.jumpToNextPanel());
      hud.querySelector("#sonikoma-btn-cinema-bgm")?.addEventListener("click", () => this.cycleSoundscape());
      hud.querySelector("#sonikoma-btn-cinema-shader")?.addEventListener("click", () => this.cycleShader());
      hud.querySelector("#sonikoma-btn-cinema-voice")?.addEventListener("click", () => this.toggleVoiceNarrator());
      hud.querySelector("#sonikoma-btn-cinema-dimmer")?.addEventListener("click", () => this.toggleTheaterDimmer());
      hud.querySelector("#sonikoma-btn-cinema-spotlight")?.addEventListener("click", () => this.toggleSpotlight());
      hud.querySelector("#sonikoma-btn-cinema-fs")?.addEventListener("click", () => this.toggleFullscreen());
      hud.querySelector("#sonikoma-btn-cinema-snip")?.addEventListener("click", () => this.snipActiveScene());
      hud.querySelector("#sonikoma-btn-cinema-bookmark")?.addEventListener("click", () => this.bookmarkActiveScene());
      hud.querySelector("#sonikoma-btn-cinema-settings")?.addEventListener("click", () => this.toggleSettingsFlyout());
      hud.querySelector("#sonikoma-btn-close-flyout")?.addEventListener("click", () => this.toggleSettingsFlyout(false));
      hud.querySelector("#sonikoma-btn-cinema-dock")?.addEventListener("click", () => this.toggleDockPosition());

      hud.querySelector("#sonikoma-volume-slider")?.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10) / 100;
        this.soundscape.setVolume(val);
      });

      const timelineTrack = hud.querySelector("#sonikoma-hud-timeline");
      const tooltip = hud.querySelector("#sonikoma-scrubber-tooltip");
      this.scrubberTooltipElement = tooltip;

      if (timelineTrack && tooltip) {
        timelineTrack.addEventListener("mousemove", (e) => {
          const rect = timelineTrack.getBoundingClientRect();
          const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          const pct = Math.round(ratio * 100);
          tooltip.textContent = `Jump to ${pct}%`;
          tooltip.style.left = `${e.clientX - rect.left}px`;
          tooltip.classList.remove("sonikoma-hidden");
        });

        timelineTrack.addEventListener("mouseleave", () => {
          tooltip.classList.add("sonikoma-hidden");
        });

        timelineTrack.addEventListener("click", (e) => {
          const rect = timelineTrack.getBoundingClientRect();
          const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          const maxScroll = Math.max(
            1,
            (document.documentElement.scrollHeight || document.body.scrollHeight) - window.innerHeight
          );
          window.scrollTo({ top: clickRatio * maxScroll, behavior: "smooth" });
          this.showToast(`Jumped to ${Math.round(clickRatio * 100)}%`);
        });
      }

      hud.querySelector("#sonikoma-btn-toggle-pacing")?.addEventListener("click", (e) => {
        this.isAdaptivePacing = !this.isAdaptivePacing;
        e.target.textContent = this.isAdaptivePacing ? "ON" : "OFF";
        if (this.isAdaptivePacing) e.target.classList.add("sonikoma-active");
        else e.target.classList.remove("sonikoma-active");
        this.showToast(this.isAdaptivePacing ? "AI Director Pacing ON" : "AI Director Pacing OFF");
      });

      // Make both Cinema HUD and Settings Flyout Draggable & Moveable
      const hudDragHandle = hud.querySelector("#sonikoma-hud-drag-handle");
      const cinemaBar = hud.querySelector(".sonikoma-cinema-bar");
      this.enableDraggable(hud, hudDragHandle || cinemaBar);

      const flyout = hud.querySelector("#sonikoma-cinema-flyout");
      const flyoutHeader = hud.querySelector("#sonikoma-flyout-drag-header");
      if (flyout && flyoutHeader) {
        this.enableDraggable(flyout, flyoutHeader);
      }
    }

    this.hudElement = hud;
  }

  enableDraggable(target, handle) {
    handle.style.cursor = "grab";

    handle.addEventListener("mousedown", (e) => {
      const clickTarget = e.target;
      if (
        clickTarget &&
        (clickTarget.tagName === "BUTTON" ||
          clickTarget.tagName === "INPUT" ||
          clickTarget.closest("button") ||
          clickTarget.classList.contains("sonikoma-flyout-close"))
      ) {
        return;
      }

      e.preventDefault();
      let isDragging = true;
      const startX = e.clientX;
      const startY = e.clientY;

      const rect = target.getBoundingClientRect();
      const initialLeft = rect.left;
      const initialTop = rect.top;

      target.style.setProperty("position", "fixed", "important");
      target.style.setProperty("margin", "0", "important");
      target.style.setProperty("transform", "none", "important");
      target.style.setProperty("left", `${initialLeft}px`, "important");
      target.style.setProperty("top", `${initialTop}px`, "important");
      target.style.setProperty("right", "auto", "important");
      target.style.setProperty("bottom", "auto", "important");
      target.classList.remove("sonikoma-dock-top", "sonikoma-dock-bottom");

      handle.style.cursor = "grabbing";
      target.classList.add("sonikoma-dragging");
      document.body.style.userSelect = "none";

      const onMouseMove = (me) => {
        if (!isDragging) return;
        const dx = me.clientX - startX;
        const dy = me.clientY - startY;
        const newLeft = Math.max(10, Math.min(window.innerWidth - target.offsetWidth - 10, initialLeft + dx));
        const newTop = Math.max(10, Math.min(window.innerHeight - target.offsetHeight - 10, initialTop + dy));
        target.style.setProperty("left", `${newLeft}px`, "important");
        target.style.setProperty("top", `${newTop}px`, "important");
      };

      const onMouseUp = () => {
        isDragging = false;
        handle.style.cursor = "grab";
        target.classList.remove("sonikoma-dragging");
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    });
  }

  adjustSpeed(delta) {
    const speeds = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0];
    let currentIndex = speeds.findIndex((s) => Math.abs(s - this.scrollSpeed) < 0.01);
    if (currentIndex === -1) currentIndex = 3;

    if (delta > 0) currentIndex = Math.min(speeds.length - 1, currentIndex + 1);
    else currentIndex = Math.max(0, currentIndex - 1);

    this.scrollSpeed = speeds[currentIndex];
    const readout = document.getElementById("sonikoma-speed-readout");
    if (readout) readout.textContent = `${this.scrollSpeed}x`;
    this.showToast(`Speed: ${this.scrollSpeed}x`);
  }

  cycleSoundscape() {
    const mood = this.soundscape.cycleMood();
    const btn = document.getElementById("sonikoma-btn-cinema-bgm");
    const icon = document.getElementById("sonikoma-bgm-icon");
    const flyoutName = document.getElementById("sonikoma-flyout-soundscape-name");

    if (icon) icon.textContent = mood.icon;
    if (flyoutName) flyoutName.textContent = mood.name;

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

    const filterTarget = document.documentElement;
    if (shader.id === "normal") {
      filterTarget.style.filter = "";
    } else {
      filterTarget.style.filter = shader.filterCss;
    }

    const btn = document.getElementById("sonikoma-btn-cinema-shader");
    const flyoutName = document.getElementById("sonikoma-flyout-shader-name");
    if (flyoutName) flyoutName.textContent = shader.name;

    if (btn) {
      if (shader.id !== "normal") btn.classList.add("sonikoma-active");
      else btn.classList.remove("sonikoma-active");
    }
    this.showToast(`Shader: ${shader.icon} ${shader.name}`);
  }

  toggleVoiceNarrator() {
    const active = this.voiceNarrator.toggle();
    const btn = document.getElementById("sonikoma-btn-cinema-voice");
    const flyoutStatus = document.getElementById("sonikoma-flyout-voice-status");

    if (btn) {
      if (active) btn.classList.add("sonikoma-active");
      else btn.classList.remove("sonikoma-active");
    }
    if (flyoutStatus) {
      flyoutStatus.textContent = active ? "ON" : "OFF";
    }

    this.showToast(active ? "🎙️ Voice Narrator Active" : "🎙️ Voice Narrator Off");
    if (active) {
      this.narrateCurrentScene();
    }
  }

  narrateCurrentScene() {
    if (!this.voiceNarrator.isActive) return;
    const curIdx = this.currentPanelIndex + 1;
    const total = this.detectedPanels.length || 1;
    this.voiceNarrator.speak(`Entering Scene ${curIdx} of ${total}`);
  }

  toggleTheaterDimmer() {
    this.isDimmed = !this.isDimmed;
    const btn = document.getElementById("sonikoma-btn-cinema-dimmer");
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
    this.showToast(this.isDimmed ? "Theater Dimmer ON" : "Theater Dimmer OFF");
  }

  toggleSpotlight() {
    this.isSpotlight = !this.isSpotlight;
    const btn = document.getElementById("sonikoma-btn-cinema-spotlight");
    if (this.spotlightElement) {
      if (this.isSpotlight) {
        this.spotlightElement.classList.remove("sonikoma-hidden");
        this.spotlightElement.style.setProperty("display", "block", "important");
      } else {
        this.spotlightElement.classList.add("sonikoma-hidden");
        this.spotlightElement.style.setProperty("display", "none", "important");
      }
    }
    if (btn) {
      if (this.isSpotlight) btn.classList.add("sonikoma-active");
      else btn.classList.remove("sonikoma-active");
    }
    this.showToast(this.isSpotlight ? "Spotlight Focus ON" : "Spotlight Focus OFF");
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

    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
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
      (document.documentElement.scrollHeight || document.body.scrollHeight) - window.innerHeight
    );
    const progress = Math.round((scrollY / maxScroll) * 100);

    const bookmark = {
      url: window.location.href,
      title: document.title,
      scene: curIdx,
      progress,
      timestamp: Date.now(),
    };

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get("sonikoma_bookmarks", (data) => {
        const list = Array.isArray(data?.sonikoma_bookmarks) ? data.sonikoma_bookmarks : [];
        list.unshift(bookmark);
        chrome.storage.local.set({ sonikoma_bookmarks: list.slice(0, 50) }, () => {
          this.showToast(`📌 Bookmark saved at Scene ${curIdx} (${progress}%)`);
        });
      });
    } else {
      this.showToast(`📌 Bookmark saved at Scene ${curIdx} (${progress}%)`);
    }
  }

  toggleSettingsFlyout(force) {
    const flyout = document.getElementById("sonikoma-cinema-flyout");
    if (!flyout) return;
    this.isSettingsOpen = typeof force === "boolean" ? force : !this.isSettingsOpen;
    if (this.isSettingsOpen) {
      flyout.classList.remove("sonikoma-hidden");
      flyout.style.setProperty("display", "flex", "important");
    } else {
      flyout.classList.add("sonikoma-hidden");
      flyout.style.setProperty("display", "none", "important");
    }
  }

  toggleDockPosition() {
    this.isDockTop = !this.isDockTop;
    if (this.hudElement) {
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
      window.scrollTo({ top: this.detectedPanels[nextIdx].top - 80, behavior: "smooth" });
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
      window.scrollTo({ top: Math.max(0, this.detectedPanels[prevIdx].top - 80), behavior: "smooth" });
      this.updatePanelReadout();
      if (this.voiceNarrator.isActive) {
        this.voiceNarrator.speak(`Scene ${prevIdx + 1}`);
      }
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  refreshPanels() {
    if (this.scanner?.scanChapterImages) {
      this.detectedPanels = this.scanner.scanChapterImages();
    }
  }

  updatePanelReadout() {
    const readout = document.getElementById("sonikoma-panel-readout");
    if (readout) {
      const total = this.detectedPanels.length || 1;
      const cur = Math.min(total, this.currentPanelIndex + 1);
      readout.textContent = `Scene ${cur}/${total}`;
    }
  }

  updateStatusBadge(text, icon) {
    const statusText = document.getElementById("sonikoma-cinema-status");
    const iconElem = document.getElementById("sonikoma-cinema-icon");
    if (statusText) statusText.textContent = text;
    if (iconElem) iconElem.textContent = icon;
  }

  triggerNextChapterPrompt() {
    if (this.nextChapterBanner) return;

    const banner = document.createElement("div");
    banner.id = "sonikoma-next-chapter-banner";
    banner.className = "sonikoma-next-chapter-banner";
    this.nextChapterCountdown = 6;

    const findNextUrl = () => {
      const links = Array.from(document.querySelectorAll("a"));
      for (const a of links) {
        const text = (a.textContent || "").toLowerCase();
        const href = a.getAttribute("href") || "";
        if (
          (text.includes("next chapter") || text.includes("next episode") || text.includes("next >") || a.className.includes("next")) &&
          href &&
          !href.startsWith("#") &&
          !href.startsWith("javascript")
        ) {
          return a.href;
        }
      }
      const match = window.location.href.match(/(chapter|ep|episode)[-_/](\d+)/i);
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
          ${nextUrl ? `Auto-advancing to Next Chapter in <strong id="sk-countdown">6</strong>s...` : "You have reached the end of this chapter."}
        </span>
      </div>
      <div class="sonikoma-next-actions">
        ${nextUrl ? `<a href="${nextUrl}" id="sonikoma-btn-read-next" class="sonikoma-btn-next-act">Next Chapter ➔</a>` : ""}
        <button type="button" id="sonikoma-btn-cancel-next" class="sonikoma-btn-cancel-act">Stay Here</button>
      </div>
    `;

    (document.body || document.documentElement).appendChild(banner);
    this.nextChapterBanner = banner;

    banner.querySelector("#sonikoma-btn-cancel-next")?.addEventListener("click", () => {
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

  cancelNextChapterCountdown() {
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
      if (seriesElem) seriesElem.textContent = meta.seriesTitle || "Sonikoma Reader";
    }

    if (this.soundscape.currentMood === "off") {
      this.cycleSoundscape();
    }

    this.isPlaying = true;
    this.updateStatusBadge("Pause", "⏸");
    this.lastTimestamp = performance.now();
    this.subpixelAccumulator = 0;
    this.loop(this.lastTimestamp);
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
  }

  loop(timestamp) {
    if (!this.isPlaying) return;

    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    const deltaTimeSec = Math.min(0.1, (timestamp - this.lastTimestamp) / 1000);
    this.lastTimestamp = timestamp;

    if (!this.isTemporarilyPausedForUser) {
      let effectiveSpeed = this.scrollSpeed;

      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const maxScroll = Math.max(
        1,
        (document.documentElement.scrollHeight || document.body.scrollHeight) - window.innerHeight
      );

      if (this.isAdaptivePacing && this.detectedPanels.length > 0) {
        const nextPanelIdx = this.detectedPanels.findIndex(
          (p) => Math.abs(p.top - (scrollY + 100)) < 70
        );
        if (nextPanelIdx !== -1 && nextPanelIdx !== this.lastPausedPanelIdx) {
          if (this.panelPauseTimer < 1.2) {
            this.panelPauseTimer += deltaTimeSec;
            effectiveSpeed = this.scrollSpeed * 0.35;
          } else {
            this.lastPausedPanelIdx = nextPanelIdx;
            this.panelPauseTimer = 0;
            if (this.voiceNarrator.isActive && this.lastNarratedPanelIdx !== nextPanelIdx) {
              this.lastNarratedPanelIdx = nextPanelIdx;
              this.voiceNarrator.speak(`Scene ${nextPanelIdx + 1}`);
            }
          }
        } else {
          this.panelPauseTimer = 0;
        }
      }

      const scrollPixels = this.baseSpeedPxPerSec * effectiveSpeed * deltaTimeSec;
      this.subpixelAccumulator += scrollPixels;

      const wholePixels = Math.floor(this.subpixelAccumulator);
      if (wholePixels >= 1) {
        this.subpixelAccumulator -= wholePixels;
        window.scrollBy(0, wholePixels);
      }

      const progressPercent = Math.min(100, Math.max(0, Math.round((scrollY / maxScroll) * 100)));
      const fill = document.getElementById("sonikoma-hud-progress-fill");
      if (fill) fill.style.width = `${progressPercent}%`;

      const remainingPixels = Math.max(0, maxScroll - scrollY);
      const remainingSeconds = Math.round(
        remainingPixels / Math.max(1, this.baseSpeedPxPerSec * this.scrollSpeed)
      );
      const remainingMinutes = Math.ceil(remainingSeconds / 60);
      const etaElem = document.getElementById("sonikoma-flyout-eta");
      if (etaElem) {
        etaElem.textContent =
          remainingMinutes > 1 ? `~${remainingMinutes} min left (${progressPercent}%)` : `< 1 min left (${progressPercent}%)`;
      }

      if (this.detectedPanels.length > 0) {
        const activeIdx = this.detectedPanels.findIndex((p) => p.top > scrollY + 150);
        if (activeIdx !== -1 && activeIdx !== this.currentPanelIndex) {
          this.currentPanelIndex = Math.max(0, activeIdx - 1);
          this.updatePanelReadout();
        }
      }

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

// ─── 5. Drag-to-Select Snipper & Speech Inspector ────────────────────────────
class PageSnipper {
  constructor() {
    this.isSnipping = false;
    this.startX = 0;
    this.startY = 0;
    this.overlay = null;
    this.rect = null;
  }

  start() {
    if (this.isSnipping) return;
    this.isSnipping = true;

    const overlay = document.createElement("div");
    overlay.className = "sonikoma-snipper-overlay";
    overlay.innerHTML = `
      <div class="sonikoma-snipper-hint">Drag over manga panel or speech bubble to snip (Esc to Cancel)</div>
      <div class="sonikoma-selection-rect sonikoma-hidden" id="sonikoma-selection-rect"></div>
    `;
    (document.body || document.documentElement).appendChild(overlay);
    this.overlay = overlay;
    this.rect = overlay.querySelector("#sonikoma-selection-rect");

    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      this.startX = e.clientX;
      this.startY = e.clientY;
      if (this.rect) {
        this.rect.style.left = `${this.startX}px`;
        this.rect.style.top = `${this.startY}px`;
        this.rect.style.width = "0px";
        this.rect.style.height = "0px";
        this.rect.classList.remove("sonikoma-hidden");
      }

      const onMouseMove = (me) => {
        const x = Math.min(this.startX, me.clientX);
        const y = Math.min(this.startY, me.clientY);
        const w = Math.abs(me.clientX - this.startX);
        const h = Math.abs(me.clientY - this.startY);
        if (this.rect) {
          this.rect.style.left = `${x}px`;
          this.rect.style.top = `${y}px`;
          this.rect.style.width = `${w}px`;
          this.rect.style.height = `${h}px`;
        }
      };

      const onMouseUp = (ue) => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        const x = Math.min(this.startX, ue.clientX);
        const y = Math.min(this.startY, ue.clientY);
        const w = Math.abs(ue.clientX - this.startX);
        const h = Math.abs(ue.clientY - this.startY);

        if (w > 20 && h > 20) {
          this.finishSnip({ x, y, width: w, height: h });
        } else {
          this.cancel();
        }
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        this.cancel();
        window.removeEventListener("keydown", onKeyDown);
      }
    };

    overlay.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKeyDown);
  }

  finishSnip(box) {
    this.cancel();
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: "TRIGGER_ACTIVE_SCENE_SNIP",
        payload: {
          bounds: box,
          url: window.location.href,
          timestamp: Date.now()
        }
      });
    }
  }

  cancel() {
    this.isSnipping = false;
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }
}

// ─── 6. Global Instance & Communication Bus ──────────────────────────────────
let cinemaInstance = null;
let snipperInstance = null;

function getCinemaPlayer() {
  if (!cinemaInstance) {
    cinemaInstance = new CinemaPlayer(DomMangaScanner);
  }
  return cinemaInstance;
}

function getSnipper() {
  if (!snipperInstance) {
    snipperInstance = new PageSnipper();
  }
  return snipperInstance;
}

// Render floating quick-action badge
function renderFloatingBadge() {
  if (document.getElementById("sonikoma-floating-badge")) return;
  const badge = document.createElement("div");
  badge.id = "sonikoma-floating-badge";
  badge.className = "sonikoma-floating-badge";
  badge.innerHTML = `
    <div class="sonikoma-badge-logo">S</div>
    <span class="sonikoma-badge-text">Sonikoma Cinema</span>
  `;
  badge.addEventListener("click", () => {
    const player = getCinemaPlayer();
    player.start();
  });
  (document.body || document.documentElement).appendChild(badge);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => renderFloatingBadge());
} else {
  renderFloatingBadge();
}

// Listen for messages from background/popup
if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "PING") {
      sendResponse({ status: "PONG" });
    } else if (msg.type === "GET_CHAPTER_DATA") {
      const meta = DomMangaScanner.extractPageMetadata();
      const panels = DomMangaScanner.scanChapterImages();
      meta.totalPanels = panels.length;
      sendResponse({ meta, panels });
    } else if (msg.type === "TOGGLE_CINEMA" || msg.type === "START_CINEMA" || msg.type === "TRIGGER_CINEMA_MODE") {
      const player = getCinemaPlayer();
      player.start();
      sendResponse({ success: true, isPlaying: true });
    } else if (msg.type === "STOP_CINEMA") {
      if (cinemaInstance) {
        cinemaInstance.stop();
      }
      sendResponse({ success: true });
    } else if (msg.type === "START_SNIP" || msg.type === "TRIGGER_PANEL_SNIPPER") {
      const snipper = getSnipper();
      snipper.start();
      sendResponse({ success: true });
    }
    return true;
  });
}

if (typeof window !== "undefined") {
  window.DomMangaScanner = DomMangaScanner;
  window.CinemaPlayer = CinemaPlayer;
  window.PageSnipper = PageSnipper;
}
