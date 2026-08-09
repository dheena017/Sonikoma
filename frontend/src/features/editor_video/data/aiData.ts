import { AiEngineTool } from "../types/workspace.types";

export const AI_ENGINE_SUB_TABS = [
  "Generate",
  "Analyze",
  "Enhance",
  "Voice",
  "Motion",
  "Translation",
  "Automation",
];

export const MOCK_AI_TOOLS: AiEngineTool[] = [
  // Engine 1: Generate
  {
    id: "ai-story-gen",
    engine: "generate",
    title: "AI Story Scriptwriter",
    badge: "GPT Generator",
    desc: "Generate plot breakdowns, dialogue scripts, and episode teasers.",
    iconName: "BookOpen",
  },
  {
    id: "ai-thumb-gen",
    engine: "generate",
    title: "Thumbnail Generator",
    badge: "High CTR",
    desc: "Generate eye-catching YouTube & Webtoon thumbnails with title text.",
    iconName: "Grid",
  },
  {
    id: "ai-trailer-gen",
    engine: "generate",
    title: "15s Teaser Generator",
    badge: "Auto Teaser",
    desc: "Auto-edit a high-energy 15-second trailer from panel cuts.",
    iconName: "Film",
  },

  // Engine 2: Analyze
  {
    id: "ai-ocr",
    engine: "analyze",
    title: "OCR Dialogue Reader",
    badge: "Text Extractor",
    desc: "Auto-detect and extract speech text from comic panel images.",
    iconName: "FileSearch",
  },
  {
    id: "ai-bubble-detect",
    engine: "analyze",
    title: "Speech Bubble Detector",
    badge: "AI Vision",
    desc: "Detect location & boundaries of dialogue bubbles on comic pages.",
    iconName: "Scan",
  },

  // Engine 3: Enhance
  {
    id: "ai-colorize",
    engine: "enhance",
    title: "B&W Auto Colorize",
    badge: "Auto Color",
    desc: "Transform black & white manga pages into vibrant colored panels.",
    iconName: "Paintbrush",
  },
  {
    id: "ai-upscale",
    engine: "enhance",
    title: "4K Super-Res Upscale",
    badge: "4K AI Scale",
    desc: "Upscale low-res comic panels to crystal clear 4K resolution.",
    iconName: "Maximize",
  },

  // Engine 4: Voice
  {
    id: "ai-tts",
    engine: "voice",
    title: "Neural Voice Synthesizer",
    badge: "Multi-Voice",
    desc: "Synthesize multi-character voiceovers with emotion controls.",
    iconName: "Mic",
  },

  // Engine 5: Motion
  {
    id: "ai-motion-parallax",
    engine: "motion",
    title: "2.5D Parallax Camera",
    badge: "Depth Motion",
    desc: "Animate static comic panels with subtle camera pan, tilt, & depth.",
    iconName: "Move",
  },

  // Engine 6: Translation
  {
    id: "ai-translate",
    engine: "translation",
    title: "Multi-Lang Translator",
    badge: "KO/JP -> EN",
    desc: "Translate manga dialogue into English, Spanish, French, German.",
    iconName: "Languages",
  },

  // Engine 7: Automation
  {
    id: "ai-panel-sep",
    engine: "automation",
    title: "Webtoon Panel Separator",
    badge: "Manga Cutter",
    desc: "Automatically split webtoon comic pages into individual panel cuts.",
    iconName: "Crop",
  },
  {
    id: "ai-bubble-clean",
    engine: "automation",
    title: "Bubble Text Cleaner",
    badge: "Text Eraser",
    desc: "Remove speech text while preserving comic background art.",
    iconName: "Eraser",
  },
  {
    id: "ai-crop-smart",
    engine: "automation",
    title: "Auto Crop 9:16",
    badge: "Smart Framing",
    desc: "Auto-detect subject focus and smart crop for 9:16 vertical shorts.",
    iconName: "Sliders",
  },
];
