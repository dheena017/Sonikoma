export const DETECTION_OPTIONS = [
  { value: "all", label: "All Bubbles", description: "Detect speech & thought boxes" },
  { value: "white_only", label: "White Only", description: "Only light-colored shapes" },
  { value: "text_only", label: "Text Only", description: "Filter on text outlines directly" },
] as const;

export const ERASE_OPTIONS = [
  { value: "auto", label: "Auto (AI)", description: "Smart AI classifier inpainting" },
  { value: "inpaint", label: "Inpaint (Telea)", description: "Telea fast border blend" },
  { value: "inpaint_ns", label: "Inpaint (NS)", description: "Navier-Stokes micro-inpaint" },
  { value: "blur", label: "Blur Text", description: "Gaussian blur masking" },
  { value: "solid_white", label: "Fill White", description: "White fill over shapes" },
  { value: "solid_black", label: "Fill Black", description: "Black fill over shapes" },
  { value: "solid_color", label: "Fill Custom Color", description: "Fill custom color over shapes" },
  { value: "transparent", label: "Transparent", description: "Cutout transparency hole" },
  { value: "ocr", label: "OCR Erase", description: "EasyOCR direct text removal" },
] as const;

export const PRESETS = [
  {
    name: "AI Fast Clean",
    icon: "⚡",
    description: "AI-based automatic selection & cleaning",
    detectionStyle: "all",
    eraseMethod: "auto",
    sensitivity: 50,
    dilation: -1,
    inpaintRadius: 3,
  },
  {
    name: "Manga Inpaint",
    icon: "📖",
    description: "Classic Telea blending with medium padding",
    detectionStyle: "white_only",
    eraseMethod: "inpaint",
    sensitivity: 65,
    dilation: 8,
    inpaintRadius: 4,
  },
  {
    name: "Soft Text Blur",
    icon: "💧",
    description: "Gaussian blur text while preserving backgrounds",
    detectionStyle: "text_only",
    eraseMethod: "blur",
    sensitivity: 45,
    dilation: 2,
    inpaintRadius: 1,
  },
  {
    name: "Custom Color fill",
    icon: "🎨",
    description: "Fill bubbles with specific custom solid color",
    detectionStyle: "all",
    eraseMethod: "solid_color",
    sensitivity: 50,
    dilation: 4,
    inpaintRadius: 1,
  },
] as const;
