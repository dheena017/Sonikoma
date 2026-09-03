import React from "react";

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

  return (
    <div
      className={`anime-hero-scene anime-hero-scene-${variant} absolute inset-0 z-0 pointer-events-none select-none overflow-hidden ${
        isLight ? "anime-hero-scene-light" : "anime-hero-scene-dark"
      }`}
      aria-hidden="true"
    >
      {/* 1. Background Anime Hero Artwork */}
      <img
        src="/landing-anime-hero.png"
        alt=""
        className="anime-hero-art"
        draggable={false}
      />

      {/* 2. Soft Ambient Aurora Beams */}
      <div className="anime-hero-aurora">
        <div className="anime-aurora-beam beam-1" />
        <div className="anime-aurora-beam beam-2" />
      </div>

      {/* 3. Subtle Ambient Vignette & Readability Gradient */}
      <div className="anime-hero-vignette" />
      <div className="anime-hero-readability" />

      {/* 4. Smooth Bottom Fade into Page Base */}
      <div
        className={`absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent ${
          isLight ? "to-[#f8fafc]" : "to-[#0a0b0e]"
        }`}
      />
    </div>
  );
}

export default LandingAnimeScene;
