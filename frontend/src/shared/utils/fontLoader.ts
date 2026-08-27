// ─── fontLoader ──────────────────────────────────────────────────────────────
// Canonical location: shared/utils/fontLoader.ts
// Dynamic Google Fonts injector for real manga/anime typography in the browser

const loadedFonts = new Set<string>();

export const GOOGLE_FONTS = [
  { name: "Bangers", category: "display", weights: ["400"] },
  { name: "Cinzel", category: "serif", weights: ["700", "900"] },
  { name: "Permanent Marker", category: "handwriting", weights: ["400"] },
  { name: "Orbitron", category: "sans-serif", weights: ["600", "800"] },
  { name: "Montserrat", category: "sans-serif", weights: ["600", "800"] },
  { name: "Noto Sans JP", category: "sans-serif", weights: ["700", "900"] },
  { name: "Press Start 2P", category: "display", weights: ["400"] },
  { name: "Creepster", category: "display", weights: ["400"] },
];

/**
 * Dynamically loads a Google Font into document head if not already loaded.
 */
export function loadGoogleFont(fontName: string) {
  if (typeof document === "undefined" || loadedFonts.has(fontName)) return;

  const font = GOOGLE_FONTS.find((f) => f.name.toLowerCase() === fontName.toLowerCase());
  const weights = font ? font.weights.join(";") : "400;700";
  const formattedName = fontName.replace(/\s+/g, "+");
  const linkId = `google-font-${fontName.toLowerCase().replace(/\s+/g, "-")}`;

  if (document.getElementById(linkId)) {
    loadedFonts.add(fontName);
    return;
  }

  const link = document.createElement("link");
  link.id = linkId;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${formattedName}:wght@${weights}&display=swap`;
  document.head.appendChild(link);
  loadedFonts.add(fontName);
}

/**
 * Preload top anime & manga fonts automatically.
 */
export function preloadCommonFonts() {
  GOOGLE_FONTS.forEach((f) => loadGoogleFont(f.name));
}
