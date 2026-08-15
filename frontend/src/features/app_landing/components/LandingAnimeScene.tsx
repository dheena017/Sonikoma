interface LandingAnimeSceneProps {
  themeMode?: "dark" | "light";
}

export function LandingAnimeScene({ themeMode = "dark" }: LandingAnimeSceneProps) {
  const isLight = themeMode === "light";

  return (
    <div
      className={`anime-hero-scene fixed inset-0 z-0 pointer-events-none ${
        isLight ? "anime-hero-scene-light" : "anime-hero-scene-dark"
      }`}
      aria-hidden="true"
    >
      <img
        src="/landing-anime-hero.png"
        alt=""
        className="anime-hero-art"
        draggable={false}
      />
      <div className="anime-hero-vignette" />
      <div className="anime-hero-readability" />
      <div className="anime-hero-speed-lines">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="anime-hero-filmstrip">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="anime-hero-sparkles">
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
