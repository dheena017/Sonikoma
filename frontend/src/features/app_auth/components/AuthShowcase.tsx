import React from "react";
import {
  Sparkles,
  Film,
  Volume2,
  Cpu,
  LogIn,
  UserPlus,
  KeyRound,
  Play,
  Pause,
  VolumeX,
  Volume1,
  X,
  Maximize2,
} from "lucide-react";
import {
  ThemeKey,
  THEMES,
  SHOWCASE_SLIDES,
} from "@/features/app_auth/components/constants";

interface AuthShowcaseProps {
  activeTheme: ThemeKey;
  iconType: "login" | "register" | "forgot";
}

export default function AuthShowcase({
  activeTheme,
  iconType,
}: AuthShowcaseProps) {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const currentTheme = THEMES[activeTheme];

  // Particle Canvas Background Animation
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // Simulated Video Player Modal State
  const [isPlayerOpen, setIsPlayerOpen] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [playerProgress, setPlayerProgress] = React.useState(30);
  const [isMuted, setIsMuted] = React.useState(false);

  // Dynamic particle customizer states
  const [particleSpeed, setParticleSpeed] = React.useState(50); // 0 to 100
  const [starDensity, setStarDensity] = React.useState(45); // count: 10 to 100
  const [showGridLines, setShowGridLines] = React.useState(true);
  const [isParticleCustomizerOpen, setIsParticleCustomizerOpen] =
    React.useState(false);

  const speedRef = React.useRef(50);
  const densityRef = React.useRef(45);

  React.useEffect(() => {
    speedRef.current = particleSpeed;
  }, [particleSpeed]);

  React.useEffect(() => {
    densityRef.current = starDensity;
  }, [starDensity]);

  // Storyboard Sandbox timeline states
  const [isSandboxOpen, setIsSandboxOpen] = React.useState(false);
  const [sandboxSequence, setSandboxSequence] = React.useState([
    {
      id: "action",
      label: "Action Crop",
      desc: "Close-up action pan",
      img: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800",
      text: "Wait, this cv slice is clean!",
    },
    {
      id: "dialogue",
      label: "Dialogue Bubble",
      desc: "OCR Speech translation",
      img: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800",
      text: "Translating bubble scripts...",
    },
    {
      id: "sound",
      label: "SFX Splash",
      desc: "Audio synthesizer trigger",
      img: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800",
      text: "*WHOOSH* Soundscape mixed!",
    },
  ]);
  const [sandboxActiveIdx, setSandboxActiveIdx] = React.useState(0);
  const [isSandboxPlaying, setIsSandboxPlaying] = React.useState(false);

  React.useEffect(() => {
    if (!isSandboxPlaying) return;
    const interval = setInterval(() => {
      setSandboxActiveIdx((prev) => (prev + 1) % sandboxSequence.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isSandboxPlaying, sandboxSequence]);

  const moveItem = (index: number, direction: "left" | "right") => {
    const nextSeq = [...sandboxSequence];
    const targetIdx = direction === "left" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= nextSeq.length) return;
    const temp = nextSeq[index];
    nextSeq[index] = nextSeq[targetIdx];
    nextSeq[targetIdx] = temp;
    setSandboxSequence(nextSeq);
    setSandboxActiveIdx(0);
  };

  // Auto-play product carousel (pauses when mockup player is active)
  React.useEffect(() => {
    if (isPlayerOpen || isSandboxOpen) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SHOWCASE_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPlayerOpen, isSandboxOpen]);

  // Canvas animation logic
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    // Create particles
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }[] = [];

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Adjust particle count dynamically inside loop
      const targetCount = densityRef.current;
      if (particles.length < targetCount) {
        while (particles.length < targetCount) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            radius: Math.random() * 1.5 + 1,
          });
        }
      } else if (particles.length > targetCount) {
        particles.length = targetCount;
      }

      // Determine line color based on active theme
      let lineColor = "rgba(168, 85, 247, 0.05)"; // default purple
      if (activeTheme === "blue") lineColor = "rgba(59, 130, 246, 0.05)";
      if (activeTheme === "emerald") lineColor = "rgba(16, 185, 129, 0.05)";
      if (activeTheme === "amber") lineColor = "rgba(245, 158, 11, 0.05)";

      // Draw lines
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 110) {
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      particles.forEach((p) => {
        ctx.fillStyle =
          activeTheme === "purple"
            ? "rgba(139, 92, 246, 0.15)"
            : activeTheme === "blue"
            ? "rgba(59, 130, 246, 0.15)"
            : activeTheme === "emerald"
            ? "rgba(16, 185, 129, 0.15)"
            : "rgba(245, 158, 11, 0.15)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Update positions using velocity * speed multiplier
        const speedMult = speedRef.current / 50;
        p.x += p.vx * speedMult;
        p.y += p.vy * speedMult;

        // Bounce boundaries
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [activeTheme]);

  // Video progress bar interval simulation
  React.useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setPlayerProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + 1;
      });
    }, 120);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const BrandIcon = () => {
    switch (iconType) {
      case "login":
        return <LogIn className={`w-5 h-5 ${currentTheme.accentText}`} />;
      case "register":
        return <UserPlus className={`w-5 h-5 ${currentTheme.accentText}`} />;
      case "forgot":
        return <KeyRound className={`w-5 h-5 ${currentTheme.accentText}`} />;
    }
  };

  return (
    <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 xl:p-16 bg-neutral-950/40 backdrop-blur-md border-r border-white/10 overflow-hidden text-left select-none">
      {/* Canvas for animated star nodes */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
      />

      {/* Layered ambient glows */}
      <div
        className={`absolute top-[-15%] left-[-15%] w-[65%] h-[65%] rounded-full ${currentTheme.glowPrimary} blur-[140px] pointer-events-none transition-all duration-1000 opacity-70`}
      />
      <div
        className={`absolute bottom-[-15%] right-[-15%] w-[65%] h-[65%] rounded-full ${currentTheme.glowSecondary} blur-[140px] pointer-events-none transition-all duration-1000 opacity-60`}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] rounded-full bg-violet-500/8 blur-[80px] pointer-events-none" />

      {/* Fine grid overlay with inner fade */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#14141e_1px,transparent_1px),linear-gradient(to_bottom,#14141e_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,#000_60%,transparent_100%)] opacity-25 pointer-events-none" />

      {/* Right-edge shimmer border */}
      <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-transparent via-purple-500/20 to-transparent pointer-events-none" />

      {/* Top Header Branding */}
      <div className="relative z-10 flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-xl ${currentTheme.accentBg} border ${currentTheme.accentBorder} transition-all duration-500 overflow-hidden shadow-lg`}
          >
            <img
              src="/logo-dark.png"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo-dark.png";
              }}
              alt="Sonikoma Logo"
              className="w-7 h-7 object-contain drop-shadow-md"
            />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">
              Sonikoma
            </span>
            <span
              className={`ml-1.5 text-[9px] font-semibold tracking-wider ${currentTheme.accentText} uppercase ${currentTheme.accentBg} px-1.5 py-0.5 rounded-full border ${currentTheme.accentBorder} transition-all duration-500`}
            >
              Studio
            </span>
          </div>
        </div>

        {/* Live indicator badge */}
        <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/8 rounded-full px-3 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-bold tracking-wider text-neutral-400 uppercase">
            Live Studio
          </span>
        </div>
      </div>

      {/* Carousel Slide Area */}
      <div className="relative z-10 my-auto w-full max-w-xl min-h-[440px] flex flex-col justify-center">
        {SHOWCASE_SLIDES.map((slide, idx) => {
          const IconComponent = slide.icon;
          const isActive = idx === currentSlide;

          return (
            <div
              key={idx}
              className={`absolute inset-0 flex flex-col justify-between transition-all duration-700 ease-out transform ${
                isActive
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-95 translate-y-8 pointer-events-none"
              }`}
            >
              {/* Header Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-bold tracking-wider uppercase bg-gradient-to-r ${slide.color} text-transparent bg-clip-text px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-md shadow-sm`}
                  >
                    {slide.badge}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500 font-semibold">
                    0{idx + 1} / 0{SHOWCASE_SLIDES.length}
                  </span>
                </div>

                <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-tight">
                  {slide.title}
                </h1>
                <p className="text-neutral-400 text-sm leading-relaxed font-sans max-w-lg">
                  {slide.description}
                </p>
              </div>

              {/* DYNAMIC INTERACTIVE VISUAL MOCKUP CARD FOR EACH SLIDE */}
              <div className="my-5 w-full bg-[#0c0d16]/80 backdrop-blur-2xl rounded-2xl border border-white/10 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.5)] relative overflow-hidden">
                {/* Subtle top laser glow */}
                <div
                  className={`absolute top-0 inset-x-0 h-px bg-gradient-to-r ${slide.color} opacity-60`}
                />

                {idx === 0 && (
                  /* Slide 0: AI Webtoon Slicer Mockup with Real Panel Artwork */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 border-b border-white/5 pb-2">
                      <span className="flex items-center gap-1.5 text-purple-300 font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        CV Strip Segmentation Engine
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                        ✓ 99.8% Precision
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="bg-neutral-900/90 border border-purple-500/50 rounded-xl overflow-hidden flex flex-col relative group shadow-md">
                        <div className="relative aspect-[3/4] w-full overflow-hidden">
                          <img
                            src="https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80"
                            alt="Panel 1"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                          <div className="absolute top-1 right-1 text-[8px] font-mono bg-purple-600 text-white font-bold px-1.5 py-0.5 rounded shadow">
                            P1
                          </div>
                        </div>
                        <div className="p-1.5 text-center bg-[#0d0f1a]">
                          <span className="text-[10px] font-bold text-neutral-200 block truncate">
                            Hero Entry
                          </span>
                          <span className="text-[8px] font-mono text-purple-400">
                            1080×1920
                          </span>
                        </div>
                      </div>
                      <div className="bg-neutral-900/90 border border-indigo-500/50 rounded-xl overflow-hidden flex flex-col relative group shadow-md">
                        <div className="relative aspect-[3/4] w-full overflow-hidden">
                          <img
                            src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&auto=format&fit=crop&q=80"
                            alt="Panel 2"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                          <div className="absolute top-1 right-1 text-[8px] font-mono bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded shadow">
                            P2
                          </div>
                        </div>
                        <div className="p-1.5 text-center bg-[#0d0f1a]">
                          <span className="text-[10px] font-bold text-neutral-200 block truncate">
                            Dialogue Close
                          </span>
                          <span className="text-[8px] font-mono text-indigo-400">
                            OCR Detected
                          </span>
                        </div>
                      </div>
                      <div className="bg-neutral-900/90 border border-cyan-500/50 rounded-xl overflow-hidden flex flex-col relative group shadow-md">
                        <div className="relative aspect-[3/4] w-full overflow-hidden">
                          <img
                            src="https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80"
                            alt="Panel 3"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                          <div className="absolute top-1 right-1 text-[8px] font-mono bg-cyan-600 text-white font-bold px-1.5 py-0.5 rounded shadow">
                            P3
                          </div>
                        </div>
                        <div className="p-1.5 text-center bg-[#0d0f1a]">
                          <span className="text-[10px] font-bold text-neutral-200 block truncate">
                            Action Climax
                          </span>
                          <span className="text-[8px] font-mono text-cyan-400">
                            Auto Gutter
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {idx === 1 && (
                  /* Slide 1: Cinematic Motion Dynamics Mockup with Real Artwork */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 border-b border-white/5 pb-2">
                      <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                        <Film className="w-3.5 h-3.5 text-cyan-400" />
                        Camera Pan & Zoom Director
                      </span>
                      <span className="text-[10px] text-cyan-400 font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">
                        60 FPS Live
                      </span>
                    </div>
                    <div className="relative aspect-[16/7] bg-neutral-950/80 rounded-xl border border-white/10 overflow-hidden group shadow-lg">
                      <img
                        src="https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80"
                        alt="Cinematic Camera Preview"
                        className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-1000"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-black/80" />
                      <div className="absolute inset-3 border border-cyan-400/50 rounded-lg flex items-center justify-between px-3 pointer-events-none">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-cyan-500/30 border border-cyan-400 flex items-center justify-center text-cyan-200 animate-pulse">
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-white drop-shadow">
                              Ken-Burns Pan Sequence
                            </p>
                            <p className="text-[9px] font-mono text-cyan-300">
                              Duration: 4.5s • Smooth Cubic
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[9px]">
                          <span className="px-2 py-1 rounded bg-black/60 backdrop-blur-md text-neutral-200 border border-white/20">
                            ✦ Zoom In
                          </span>
                          <span className="px-2 py-1 rounded bg-cyan-600/80 text-white font-bold border border-cyan-400/50 shadow">
                            ✦ 4K 60FPS
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {idx === 2 && (
                  /* Slide 2: AI Narrative Audio Mixer Mockup */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 border-b border-white/5 pb-2">
                      <span className="flex items-center gap-1.5 text-pink-300 font-bold">
                        <Volume2 className="w-3.5 h-3.5 text-pink-400" />
                        Multi-Track Neural Speech Synthesis
                      </span>
                      <span className="text-[10px] text-pink-400 font-bold px-2 py-0.5 rounded-md bg-pink-500/10 border border-pink-500/20">
                        Stereo 48kHz
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-neutral-950/70 border border-white/5 rounded-xl p-2.5 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-white">
                            Akira (Narrator)
                          </p>
                          <p className="text-[8px] font-mono text-neutral-400">
                            Japanese • Dramatic
                          </p>
                        </div>
                        <div className="flex items-end gap-0.5 h-5">
                          <span className="w-1 bg-pink-500 h-3 rounded-full animate-pulse" />
                          <span className="w-1 bg-purple-500 h-5 rounded-full animate-pulse" />
                          <span className="w-1 bg-indigo-500 h-2 rounded-full animate-pulse" />
                          <span className="w-1 bg-pink-400 h-4 rounded-full animate-pulse" />
                        </div>
                      </div>
                      <div className="bg-neutral-950/70 border border-white/5 rounded-xl p-2.5 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-white">
                            Ambient SFX Track
                          </p>
                          <p className="text-[8px] font-mono text-neutral-400">
                            ⚡ Thunder Rumble
                          </p>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          Synced
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {idx === 3 && (
                  /* Slide 3: One-Click Video Compiler Mockup */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 border-b border-white/5 pb-2">
                      <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                        <Cpu className="w-3.5 h-3.5 text-amber-400" />
                        Hardware Accelerated Video Compiler
                      </span>
                      <span className="text-[10px] text-amber-400 font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                        ProRes / MP4
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-neutral-300">
                          Compiling 4K UHD Storyboard...
                        </span>
                        <span className="text-amber-400 font-bold">
                          96% Complete
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 w-[96%] rounded-full shadow-sm" />
                      </div>
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[9px] font-mono text-neutral-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                          4K 60FPS
                        </span>
                        <span className="text-[9px] font-mono text-neutral-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                          H.265 / HEVC
                        </span>
                        <span className="text-[9px] font-mono text-neutral-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                          14+ Languages
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Feature Metrics Chips Row */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] font-mono font-bold text-neutral-300 bg-white/[0.03] border border-white/8 px-2.5 py-1 rounded-lg">
                  ⚡ 0.4s Fast Inference
                </span>
                <span className="text-[10px] font-mono font-bold text-neutral-300 bg-white/[0.03] border border-white/8 px-2.5 py-1 rounded-lg">
                  🎬 4K 60FPS Engine
                </span>
                <span className="text-[10px] font-mono font-bold text-neutral-300 bg-white/[0.03] border border-white/8 px-2.5 py-1 rounded-lg">
                  🎯 99.8% OCR Precision
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Navigation Dots & Slide Switcher */}
      <div className="relative z-10 flex items-center justify-between border-t border-white/5 pt-5 mt-4">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {SHOWCASE_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentSlide
                    ? `w-8 ${currentTheme.dot}`
                    : "w-2 bg-neutral-700 hover:bg-neutral-500"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1 ml-2">
            <button
              type="button"
              onClick={() =>
                setCurrentSlide((prev) =>
                  prev === 0 ? SHOWCASE_SLIDES.length - 1 : prev - 1
                )
              }
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer text-xs font-mono font-bold px-2"
              title="Previous slide"
            >
              &larr;
            </button>
            <button
              type="button"
              onClick={() =>
                setCurrentSlide((prev) => (prev + 1) % SHOWCASE_SLIDES.length)
              }
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer text-xs font-mono font-bold px-2"
              title="Next slide"
            >
              &rarr;
            </button>
          </div>
        </div>

        <p className="text-[11px] text-neutral-500 font-medium font-mono">
          © {new Date().getFullYear()} Sonikoma AI Corp.
        </p>
      </div>

      {/* SIMULATED VIDEO STORYBOARD PREVIEW OVERLAY */}
      {isPlayerOpen && (
        <div className="absolute inset-0 bg-[#040406]/95 backdrop-blur-md flex flex-col justify-between p-12 z-40 animate-in fade-in duration-300">
          {/* Header controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-400">
                Cinematic Motion Preview
              </span>
            </div>

            <button
              onClick={() => {
                setIsPlayerOpen(false);
                setIsPlaying(false);
              }}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Mock Video Screen Canvas animation */}
          <div className="my-auto w-full max-w-lg mx-auto aspect-video rounded-2xl bg-[#09090d] border border-white/5 relative flex items-center justify-center overflow-hidden">
            {/* Visual representation of animating webtoon frame */}
            <div
              className="absolute inset-4 rounded-xl transition-all duration-[2000ms] ease-in-out bg-cover bg-center flex flex-col justify-end p-4"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800')",
                transform: isPlaying
                  ? `scale(${
                      1.08 + Math.sin(playerProgress * 0.1) * 0.04
                    }) translate(${Math.cos(playerProgress * 0.1) * 6}px, ${
                      Math.sin(playerProgress * 0.1) * 4
                    }px)`
                  : "scale(1.0) translate(0,0)",
              }}
            >
              {/* Shading overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none rounded-xl" />

              {/* Dynamic dialog balloon translation */}
              <div className="relative z-10 bg-white text-black text-[10px] font-extrabold px-3 py-1.5 rounded-2xl self-start max-w-[80%] border-2 border-black shadow-md shadow-black/20 animate-bounce">
                "Wait, this computer vision slice is perfectly clean!"
              </div>
            </div>

            {/* Play overlay controls */}
            {!isPlaying && (
              <button
                onClick={() => setIsPlaying(true)}
                className="absolute w-14 h-14 rounded-full bg-purple-600/90 hover:bg-purple-500 flex items-center justify-center text-white cursor-pointer shadow-lg animate-pulse"
              >
                <Play className="w-6 h-6 fill-current ml-1" />
              </button>
            )}

            {/* Glowing watermark */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/5 py-1 px-2.5 rounded-lg text-[9px] font-bold text-white flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Camera Path: Ken-Burns Pan & Zoom</span>
            </div>
          </div>

          {/* Player controls toolbar panel */}
          <div className="space-y-4">
            {/* Progress line slider */}
            <div className="space-y-1.5">
              <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner cursor-pointer">
                <div
                  className="absolute top-0 left-0 h-full bg-purple-500 transition-all"
                  style={{ width: `${playerProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[9px] font-bold text-neutral-500 font-mono">
                <span>0:0{Math.floor(playerProgress / 10)} / 0:10</span>
                <span>Sonikoma Showcase Renderer v1.0</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume1 className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="text-[9px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Demo Compiled Successfully
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STORYBOARD SANDBOX TIMELINE DRAWER */}
      {isSandboxOpen && (
        <div className="absolute inset-0 bg-[#040406]/95 backdrop-blur-md flex flex-col justify-between p-12 z-40 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
              <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-400">
                Interactive Storyboard Sandbox
              </span>
            </div>

            <button
              onClick={() => {
                setIsSandboxOpen(false);
                setIsSandboxPlaying(false);
              }}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Canvas frame mockup showing active step */}
          <div className="my-auto w-full max-w-lg mx-auto aspect-video rounded-2xl bg-[#09090d] border border-white/5 relative flex items-center justify-center overflow-hidden">
            <div
              className="absolute inset-4 rounded-xl transition-all duration-[800ms] ease-in-out bg-cover bg-center flex flex-col justify-end p-4"
              style={{
                backgroundImage: `url('${sandboxSequence[sandboxActiveIdx].img}')`,
                transform: isSandboxPlaying ? "scale(1.06)" : "scale(1.0)",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent rounded-xl pointer-events-none" />

              <div className="relative z-10 bg-white text-black text-[10px] font-extrabold px-3 py-1.5 rounded-2xl self-start max-w-[85%] border-2 border-black shadow-md shadow-black/20 animate-bounce">
                {sandboxSequence[sandboxActiveIdx].text}
              </div>
            </div>

            <div className="absolute top-4 left-4 bg-black/60 border border-white/5 py-1 px-2.5 rounded-lg text-[9px] font-bold text-white uppercase tracking-wider">
              Sequence Frame: {sandboxSequence[sandboxActiveIdx].label}
            </div>
          </div>

          {/* Timeline ordering tracks */}
          <div className="space-y-4 text-left">
            <div className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider">
              Arrange Timeline Panels (Click to Reorder)
            </div>

            <div className="grid grid-cols-3 gap-3">
              {sandboxSequence.map((item, idx) => {
                const isActive = idx === sandboxActiveIdx;
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border transition-all text-[10px] ${
                      isActive
                        ? "bg-purple-600/10 border-purple-500 text-white"
                        : "bg-white/5 border-white/5 text-neutral-400"
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>{item.label}</span>
                      <span className="text-[8px] bg-black/40 px-1.5 rounded border border-white/5 font-mono">
                        #{idx + 1}
                      </span>
                    </div>
                    <p className="text-[8px] text-neutral-500 mt-1 leading-normal">
                      {item.desc}
                    </p>

                    <div className="flex gap-1.5 mt-2.5 pt-2.5 border-t border-white/5">
                      <button
                        onClick={() => moveItem(idx, "left")}
                        disabled={idx === 0}
                        className="flex-grow bg-white/5 hover:bg-white/10 text-[9px] font-black py-0.5 rounded cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-center"
                      >
                        &larr;
                      </button>
                      <button
                        onClick={() => moveItem(idx, "right")}
                        disabled={idx === sandboxSequence.length - 1}
                        className="flex-grow bg-white/5 hover:bg-white/10 text-[9px] font-black py-0.5 rounded cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-center"
                      >
                        &rarr;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Timeline controls */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setIsSandboxPlaying(!isSandboxPlaying)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-5 rounded-xl text-[10px] transition-all cursor-pointer flex items-center gap-1.5"
              >
                {isSandboxPlaying ? (
                  <Pause className="w-3.5 h-3.5" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                {isSandboxPlaying
                  ? "Pause Sandbox render"
                  : "Render Sandbox timeline"}
              </button>

              <div className="text-[9px] font-mono text-neutral-500">
                Arranged Frame delay: 2.0s interval
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
