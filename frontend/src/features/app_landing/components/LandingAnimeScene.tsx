import React, { useEffect, useRef } from "react";

export type AnimeSceneVariant =
  | "landing"
  | "app"
  | "workspace"
  | "dashboard"
  | "projects"
  | "creative"
  | "editor"
  | "profile"
  | "admin"
  | "auth";

interface LandingAnimeSceneProps {
  themeMode?: "dark" | "light";
  variant?: AnimeSceneVariant;
}

export function LandingAnimeScene({
  themeMode = "dark",
  variant = "landing",
}: LandingAnimeSceneProps) {
  const isLight = themeMode === "light";
  const sceneRef = useRef<HTMLDivElement>(null);

  // Subtle ambient mouse parallax tilt
  useEffect(() => {
    let animationFrameId: number;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      targetX = (e.clientX / innerWidth - 0.5) * 18; // Max 18px shift
      targetY = (e.clientY / innerHeight - 0.5) * 18;
    };

    const updateParallax = () => {
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;

      if (sceneRef.current) {
        sceneRef.current.style.setProperty("--mouse-x", `${currentX.toFixed(2)}px`);
        sceneRef.current.style.setProperty("--mouse-y", `${currentY.toFixed(2)}px`);
      }
      animationFrameId = requestAnimationFrame(updateParallax);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    animationFrameId = requestAnimationFrame(updateParallax);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      ref={sceneRef}
      className={`anime-hero-scene anime-hero-scene-${variant} fixed inset-0 z-0 pointer-events-none select-none overflow-hidden ${
        isLight ? "anime-hero-scene-light" : "anime-hero-scene-dark"
      }`}
      aria-hidden="true"
    >
      {/* 1. Background Character Art with 3D Parallax */}
      <img
        src="/landing-anime-hero.png"
        alt=""
        className="anime-hero-art"
        draggable={false}
      />

      {/* 2. Cosmic Aurora Light Beams */}
      <div className="anime-hero-aurora">
        <div className="anime-aurora-beam beam-1" />
        <div className="anime-aurora-beam beam-2" />
        <div className="anime-aurora-beam beam-3" />
      </div>

      {/* 3. Energy Ripple Rings */}
      <div className="anime-hero-energy-rings">
        <div className="anime-ring ring-1" />
        <div className="anime-ring ring-2" />
        <div className="anime-ring ring-3" />
      </div>

      {/* 4. Cinematic Vignette & Ambient Radial Glows */}
      <div className="anime-hero-vignette" />

      {/* 5. Cyber Manhwa Screentone Grid */}
      <div className="anime-hero-grid" />

      {/* 6. Readability Wash */}
      <div className="anime-hero-readability" />

      {/* 7. High-speed Action Streaks */}
      <div className="anime-hero-speed-lines">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      {/* 8. Floating Translucent Manga Filmstrip */}
      <div className="anime-hero-filmstrip">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      {/* 9. Floating Hologram Manga Storyboard Panels */}
      <div className="anime-hero-holograms">
        <div className="anime-holo-card holo-1" />
        <div className="anime-holo-card holo-2" />
        <div className="anime-holo-card holo-3" />
      </div>

      {/* 10. Prismatic Floating Crystals & Shards */}
      <div className="anime-hero-crystals">
        <span className="crystal crystal-1" />
        <span className="crystal crystal-2" />
        <span className="crystal crystal-3" />
        <span className="crystal crystal-4" />
      </div>

      {/* 11. Starlight Sparkles & Floating Bokeh Embers */}
      <div className="anime-hero-sparkles">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export default LandingAnimeScene;
