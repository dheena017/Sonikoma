import React, { useState } from "react";
import { Sparkles, Copy, Check } from "lucide-react";
import { GeneratedPanel } from "../../types";

interface PanelCreativeToolProps {
  panel: GeneratedPanel;
}

interface PromptData {
  visual_prompt: string;
  camera_angle: string;
  lighting: string;
  style_description: string;
}

interface SubtitleData {
  font_name: string;
  scale_size: number;
  primary_fill_color: string;
  outline_stroke_thickness: number;
  bounce_animation_style: string;
}

export default function PanelCreativeTool({ panel }: PanelCreativeToolProps) {
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [loadingSubtitle, setLoadingSubtitle] = useState(false);
  const [promptData, setPromptData] = useState<PromptData | null>(null);
  const [subtitleData, setSubtitleData] = useState<SubtitleData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGeneratePrompt = async () => {
    setLoadingPrompt(true);
    try {
      const res = await fetch("/api/skills/scene-composition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visual_description: panel.visual_description || "Detailed drawing panel",
          speech_text: panel.speech_text || "",
          model: "gemini-2.5-flash"
        })
      });
      const json = await res.json();
      if (json.success && json.result) {
        setPromptData(json.result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPrompt(false);
    }
  };

  const handleGenerateSubtitle = async () => {
    setLoadingSubtitle(true);
    try {
      const res = await fetch("/api/skills/subtitle-styler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visual_description: panel.visual_description || "Action scene panel",
          speech_text: panel.speech_text || "Stop right there!",
          model: "gemini-2.5-flash"
        })
      });
      const json = await res.json();
      if (json.success && json.result) {
        setSubtitleData(json.result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSubtitle(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* SDXL Image Generation Prompt */}
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
          <h5 className="text-[11px] font-mono font-bold text-purple-450 uppercase tracking-wider">AI SDXL Image Gen Prompt Creator</h5>
          <button
            onClick={handleGeneratePrompt}
            disabled={loadingPrompt || !panel.visual_description}
            className="text-[10px] font-mono font-bold text-purple-400 hover:text-purple-300 disabled:opacity-40 cursor-pointer"
          >
            {loadingPrompt ? "Writing..." : "✦ Draft Prompt"}
          </button>
        </div>

        {loadingPrompt && (
          <div className="text-center py-6 animate-pulse text-[10px] font-mono text-purple-450">
            Compiling composition & particle prompts...
          </div>
        )}

        {promptData && !loadingPrompt && (
          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-850 space-y-2 text-[10px] font-mono animate-fade-in">
            <div className="flex justify-between items-center border-b border-neutral-900 pb-1">
              <span className="text-neutral-500 uppercase">Camera angle</span>
              <span className="text-neutral-300 font-semibold">{promptData.camera_angle}</span>
            </div>
            <div className="flex justify-between items-center border-b border-neutral-900 pb-1">
              <span className="text-neutral-500 uppercase">Lighting design</span>
              <span className="text-neutral-300 font-semibold">{promptData.lighting}</span>
            </div>
            <div className="flex justify-between items-center border-b border-neutral-900 pb-1">
              <span className="text-neutral-500 uppercase">Rendering style</span>
              <span className="text-neutral-300 font-semibold">{promptData.style_description}</span>
            </div>
            <div className="pt-1 space-y-1">
              <span className="text-neutral-500 uppercase block">Compiled Prompt:</span>
              <p className="text-[11px] font-sans text-neutral-300 leading-relaxed font-semibold">"{promptData.visual_prompt}"</p>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Subtitle Stylers */}
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
          <h5 className="text-[11px] font-mono font-bold text-purple-450 uppercase tracking-wider">AI Subtitle Visual Typography Styler</h5>
          <button
            onClick={handleGenerateSubtitle}
            disabled={loadingSubtitle || !panel.speech_text}
            className="text-[10px] font-mono font-bold text-purple-400 hover:text-purple-300 disabled:opacity-40 cursor-pointer"
          >
            {loadingSubtitle ? "Styling..." : "✦ Suggest style"}
          </button>
        </div>

        {loadingSubtitle && (
          <div className="text-center py-6 animate-pulse text-[10px] font-mono text-purple-450">
            Mapping font parameters...
          </div>
        )}

        {subtitleData && !loadingSubtitle && (
          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-850 space-y-2 text-[10px] font-mono animate-fade-in">
            <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
              <div className="flex justify-between border-b border-neutral-900 pb-1">
                <span className="text-neutral-500">Recommended font</span>
                <span className="text-neutral-300 font-bold">{subtitleData.font_name}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-900 pb-1">
                <span className="text-neutral-500">Font size scale</span>
                <span className="text-neutral-300 font-semibold">{subtitleData.scale_size}x</span>
              </div>
              <div className="flex justify-between border-b border-neutral-900 pb-1">
                <span className="text-neutral-500">Primary fill color</span>
                <span className="font-semibold" style={{ color: subtitleData.primary_fill_color }}>
                  {subtitleData.primary_fill_color}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-900 pb-1">
                <span className="text-neutral-500">Outline thickness</span>
                <span className="text-neutral-300 font-semibold">{subtitleData.outline_stroke_thickness}px</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-neutral-900 flex justify-between">
                <span className="text-neutral-500">Bounce animation style:</span>
                <span className="text-purple-350 font-bold uppercase">{subtitleData.bounce_animation_style}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
