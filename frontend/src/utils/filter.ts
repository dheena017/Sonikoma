import { GeneratedPanel } from "../types";

// Compile custom image filters dynamically for instant in-browser live rendering
export function getPanelFilterStyle(panel: GeneratedPanel) {
  if (!panel) return "none";
  let b = panel.brightness !== undefined ? panel.brightness : 100;
  let c = panel.contrast !== undefined ? panel.contrast : 100;
  let s = panel.saturation !== undefined ? panel.saturation : 100;
  let gr = panel.grayscale ? "grayscale(100%)" : "";

  let presetFilter = "";
  if (panel.filter_preset === "anime_vibrant") {
    // Punchy vibrance, glowing highlights
    presetFilter = "saturate(135%) contrast(115%) brightness(105%)";
  } else if (panel.filter_preset === "cinematic_drama") {
    // Deep dynamic range, vintage grading shadow play
    presetFilter = "contrast(130%) brightness(90%) saturate(90%)";
  } else if (panel.filter_preset === "hdr_clear") {
    // Sharp contrasts, vivid illumination
    presetFilter = "contrast(120%) brightness(105%) saturate(115%)";
  } else if (panel.filter_preset === "vintage_warm") {
    // Golden warm skin sepia tones and sunlit nostalgia
    presetFilter = "sepia(22%) saturate(112%) contrast(105%) brightness(102%)";
  } else if (panel.filter_preset === "neon_cyber") {
    // Intense magenta shift, saturated cyberpunk glow
    presetFilter = "hue-rotate(15deg) saturate(155%) contrast(112%)";
  }

  return `brightness(${b}%) contrast(${c}%) saturate(${s}%) ${gr} ${presetFilter}`.trim();
}
