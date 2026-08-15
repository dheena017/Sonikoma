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
      className={`anime-hero-scene anime-hero-scene-${variant} fixed inset-0 z-0 pointer-events-none ${
        isLight ? "anime-hero-scene-light" : "anime-hero-scene-dark"
      }`}
      aria-hidden="true"
    >
      {/* Background Character Art */}
      <img
        src="/landing-anime-hero.png"
        alt=""
        className="anime-hero-art"
        draggable={false}
      />

      {/* Cinematic Vignette */}
      <div className="anime-hero-vignette" />

      {/* Cyber Manhwa Screentone Grid */}
      <div className="anime-hero-grid" />

      {/* Readability Wash */}
      <div className="anime-hero-readability" />

      {/* High-speed Action Streaks */}
      <div className="anime-hero-speed-lines">
        <span />
        <span />
        <span />
        <span />
      </div>

      {/* Floating Translucent Manga Filmstrip */}
      <div className="anime-hero-filmstrip">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      {/* Sparkles & Floating Bokeh Embers */}
      <div className="anime-hero-sparkles">
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
