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

export type ThemeKey = "purple" | "blue" | "emerald" | "amber";

export const THEMES: Record<
  ThemeKey,
  {
    glowPrimary: string;
    glowSecondary: string;
    accentText: string;
    accentBg: string;
    accentBorder: string;
    button: string;
    focus: string;
    dot: string;
  }
> = {
  purple: {
    glowPrimary: "bg-purple-600/10",
    glowSecondary: "bg-indigo-600/10",
    accentText: "text-purple-400",
    accentBg: "bg-purple-500/10",
    accentBorder: "border-purple-500/20",
    button: "bg-purple-600 hover:bg-purple-500 shadow-purple-900/30",
    focus: "focus:border-purple-500/50 focus:ring-purple-600/20",
    dot: "bg-purple-500",
  },
  blue: {
    glowPrimary: "bg-blue-600/10",
    glowSecondary: "bg-cyan-600/10",
    accentText: "text-blue-400",
    accentBg: "bg-blue-500/10",
    accentBorder: "border-blue-500/20",
    button: "bg-blue-600 hover:bg-blue-500 shadow-blue-900/30",
    focus: "focus:border-blue-500/50 focus:ring-blue-600/20",
    dot: "bg-blue-500",
  },
  emerald: {
    glowPrimary: "bg-emerald-600/10",
    glowSecondary: "bg-teal-600/10",
    accentText: "text-emerald-400",
    accentBg: "bg-emerald-500/10",
    accentBorder: "border-emerald-500/20",
    button: "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30",
    focus: "focus:border-emerald-500/50 focus:ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  amber: {
    glowPrimary: "bg-amber-600/10",
    glowSecondary: "bg-orange-600/10",
    accentText: "text-amber-400",
    accentBg: "bg-amber-500/10",
    accentBorder: "border-amber-500/20",
    button: "bg-amber-600 hover:bg-amber-500 shadow-amber-900/30",
    focus: "focus:border-amber-500/50 focus:ring-amber-600/20",
    dot: "bg-amber-500",
  },
};

const SHOWCASE_SLIDES = [
  {
    icon: Sparkles,
    title: "AI Webtoon Parser",
    description:
      "Instantly segment vertical webtoon strips into independent, perfectly cropped storyboard panels using our custom CV engine.",
    badge: "Smart Detection",
    color: "from-purple-500 to-indigo-500",
  },
  {
    icon: Film,
    title: "Cinematic Motion Dynamics",
    description:
      "Bring static frames to life with keyframe camera animations, auto zooms, responsive pans, and cinematic camera shakes.",
    badge: "Motion Director",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Volume2,
    title: "AI Narrative Audio Mixer",
    description:
      "Generate natural voice narration, synchronize multi-character dialogue, and mix contextual sound effects automatically.",
    badge: "Voice & SFX",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Cpu,
    title: "One-Click Video Compiler",
    description:
      "Review auto-generated scripts, translate text into target languages, and export high-definition video files ready for publishing.",
    badge: "Instant Render",
    color: "from-amber-500 to-orange-500",
  },
];

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
    <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-16 bg-gradient-to-br from-[#0a0a10] to-[#040406] border-r border-white/5 overflow-hidden text-left select-none">
      {/* Canvas for animated star nodes */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
      />

      {/* Ambient background glows */}
      <div
        className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full ${currentTheme.glowPrimary} blur-[130px] pointer-events-none transition-all duration-1000 animate-pulse`}
      />
      <div
        className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full ${currentTheme.glowSecondary} blur-[130px] pointer-events-none transition-all duration-1000 animate-pulse`}
      />

      {/* Fine grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#14141e_1px,transparent_1px),linear-gradient(to_bottom,#14141e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Top Header Branding */}
      <div className="relative z-10 flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-xl ${currentTheme.accentBg} border ${currentTheme.accentBorder} transition-all duration-500`}
          >
            <BrandIcon />
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

        <div className="flex items-center gap-2">
          {/* Dynamic button to trigger simulated video player demo */}
          <button
            onClick={() => {
              setIsPlayerOpen(true);
              setIsPlaying(true);
            }}
            className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase bg-white/5 border border-white/5 hover:border-white/10 px-3 py-1.5 rounded-full cursor-pointer hover:bg-white/10 transition-all text-neutral-300"
          >
            <Play className="w-3.5 h-3.5 fill-current text-purple-400" />
            Play Showcase Demo
          </button>

          <button
            onClick={() => setIsSandboxOpen(true)}
            className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase bg-white/5 border border-white/5 hover:border-white/10 px-3 py-1.5 rounded-full cursor-pointer hover:bg-white/10 transition-all text-neutral-300"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Storyboard Sandbox
          </button>
        </div>
      </div>

      {/* Carousel Slide Area */}
      <div className="relative z-10 my-auto max-w-lg min-h-[260px] flex flex-col justify-center">
        {SHOWCASE_SLIDES.map((slide, idx) => {
          const IconComponent = slide.icon;
          const isActive = idx === currentSlide;

          return (
            <div
              key={idx}
              className={`absolute inset-0 flex flex-col justify-center transition-all duration-700 ease-out transform ${
                isActive
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-95 translate-y-8 pointer-events-none"
              }`}
            >
              <div className="flex">
                <span
                  className={`text-[10px] font-bold tracking-wider uppercase bg-gradient-to-r ${slide.color} text-transparent bg-clip-text px-3 py-1 rounded-full border border-white/5 backdrop-blur-md`}
                >
                  {slide.badge}
                </span>
              </div>
              <h1 className="text-4xl font-extrabold text-white mt-4 tracking-tight leading-tight">
                {slide.title}
              </h1>
              <p className="mt-4 text-neutral-400 text-base leading-relaxed font-sans">
                {slide.description}
              </p>
              <div className="flex items-center gap-3 mt-6">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${slide.color} shadow-lg shadow-purple-500/10`}
                >
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Navigation Dots & Copyright */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {SHOWCASE_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentSlide
                    ? `w-8 ${currentTheme.dot}`
                    : "w-2 bg-neutral-700 hover:bg-neutral-600"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="relative">
            <button
              onClick={() =>
                setIsParticleCustomizerOpen(!isParticleCustomizerOpen)
              }
              className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/5 text-[9px] font-bold text-neutral-400 hover:text-white cursor-pointer transition-colors"
              title="Customize Star Particles"
            >
              Star Config
            </button>

            {isParticleCustomizerOpen && (
              <div className="absolute bottom-7 left-0 bg-black/90 border border-white/10 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md space-y-2.5 min-w-[160px] z-50 text-left animate-in slide-in-from-bottom-2 duration-250">
                <div className="text-[8px] font-black text-purple-400 uppercase tracking-widest">
                  Star Settings
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] text-neutral-400 font-mono">
                    <span>Speed</span>
                    <span>{particleSpeed}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="150"
                    value={particleSpeed}
                    onChange={(e) => setParticleSpeed(parseInt(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded cursor-pointer accent-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] text-neutral-400 font-mono">
                    <span>Stars</span>
                    <span>{starDensity} stars</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={starDensity}
                    onChange={(e) => setStarDensity(parseInt(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded cursor-pointer accent-purple-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-neutral-600 font-medium font-mono">
          © {new Date().getFullYear()} Sonikoma AI Corp. All rights reserved.
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
