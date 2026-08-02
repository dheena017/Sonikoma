import React, { useState } from "react";
import { Sparkles, Copy, Check, Layers3 } from "lucide-react";
import { GeneratedPanel } from "@/types";
import * as api from "@/api";
import { fetchWithAuth } from "@/utils";

interface PanelCreativeToolProps {
  panel: GeneratedPanel;
  panels?: GeneratedPanel[];
  addNotification?: (msg: string, type: any) => void;
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

export default function PanelCreativeTool({ panel, panels, addNotification }: PanelCreativeToolProps) {
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [batchPromptLoading, setBatchPromptLoading] = useState(false);
  const [loadingSubtitle, setLoadingSubtitle] = useState(false);
  const [batchSubtitleLoading, setBatchSubtitleLoading] = useState(false);
  const [promptData, setPromptData] = useState<PromptData | null>(null);
  const [subtitleData, setSubtitleData] = useState<SubtitleData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGeneratePrompt = async () => {
    setLoadingPrompt(true);
    try {
      const json = await api.runSceneCompositionSkill(fetchWithAuth, {
        visual_description:
          panel.visual_description || "Detailed drawing panel",
        speech_text: panel.speech_text || "",
        model: localStorage.getItem("ai_comic_model") || "gemini-2.5-flash",
      });
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
      const json = await api.runSubtitleStylerSkill(fetchWithAuth, {
        visual_description: panel.visual_description || "Action scene panel",
        speech_text: panel.speech_text || "Stop right there!",
        model: localStorage.getItem("ai_comic_model") || "gemini-2.5-flash",
      });
      if (json.success && json.result) {
        setSubtitleData(json.result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSubtitle(false);
    }
  };

  const handleBatchGeneratePrompt = async () => {
    if (!panels?.length) return;
    setBatchPromptLoading(true);
    try {
      await Promise.all(
        panels.map(async (panelItem) => {
          try {
            await api.runSceneCompositionSkill(fetchWithAuth, {
              visual_description:
                panelItem.visual_description || "Detailed drawing panel",
              speech_text: panelItem.speech_text || "",
              model: localStorage.getItem("ai_comic_model") || "gemini-2.5-flash",
            });
          } catch (error) {
            console.error(error);
          }
        })
      );
      if (addNotification) {
        addNotification(`Generated prompts for ${panels.length} panels`, "success");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setBatchPromptLoading(false);
    }
  };

  const handleBatchGenerateSubtitle = async () => {
    if (!panels?.length) return;
    setBatchSubtitleLoading(true);
    try {
      await Promise.all(
        panels.map(async (panelItem) => {
          try {
            await api.runSubtitleStylerSkill(fetchWithAuth, {
              visual_description: panelItem.visual_description || "Action scene panel",
              speech_text: panelItem.speech_text || "Stop right there!",
              model: localStorage.getItem("ai_comic_model") || "gemini-2.5-flash",
            });
          } catch (error) {
            console.error(error);
          }
        })
      );
      if (addNotification) {
        addNotification(`Generated subtitle styles for ${panels.length} panels`, "success");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setBatchSubtitleLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/70 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h5 className="text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-purple-300">
              Creative direction
            </h5>
            <p className="mt-1 text-sm text-neutral-400">
              Craft the visual mood and subtitle styling for this scene.
            </p>
          </div>
          <div className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-purple-300">
            Prompt ready
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-purple-500/10 bg-gradient-to-br from-neutral-950/95 via-neutral-900/80 to-purple-950/20 p-4 space-y-3 shadow-[0_20px_40px_rgba(0,0,0,0.28)]">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
            <h5 className="text-[11px] font-mono font-bold text-purple-300 uppercase tracking-wider">
              Image generation prompt
            </h5>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGeneratePrompt}
                disabled={loadingPrompt || !panel.visual_description}
                title="Draft prompt for this panel"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 disabled:opacity-40 cursor-pointer"
              >
                {loadingPrompt ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Sparkles className="h-4 w-4" />}
              </button>
              <button
                onClick={handleBatchGeneratePrompt}
                disabled={batchPromptLoading || !panels?.length}
                title="Draft prompts for all panels"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 disabled:opacity-40 cursor-pointer"
              >
                {batchPromptLoading ? <Layers3 className="h-4 w-4 animate-pulse" /> : <Layers3 className="h-4 w-4" />}
              </button>
            </div>
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
                <span className="text-neutral-300 font-semibold">
                  {promptData.camera_angle}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-neutral-900 pb-1">
                <span className="text-neutral-500 uppercase">
                  Lighting design
                </span>
                <span className="text-neutral-300 font-semibold">
                  {promptData.lighting}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-neutral-900 pb-1">
                <span className="text-neutral-500 uppercase">
                  Rendering style
                </span>
                <span className="text-neutral-300 font-semibold">
                  {promptData.style_description}
                </span>
              </div>
              <div className="pt-1 space-y-1">
                <span className="text-neutral-500 uppercase block">
                  Compiled Prompt:
                </span>
                <p className="text-[11px] font-sans text-neutral-300 leading-relaxed font-semibold">
                  "{promptData.visual_prompt}"
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-purple-500/10 bg-gradient-to-br from-neutral-950/95 via-neutral-900/80 to-purple-950/20 p-4 space-y-3 shadow-[0_20px_40px_rgba(0,0,0,0.28)]">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
            <h5 className="text-[11px] font-mono font-bold text-purple-300 uppercase tracking-wider">
              Subtitle styling
            </h5>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateSubtitle}
                disabled={loadingSubtitle || !panel.speech_text}
                title="Suggest subtitle style for this panel"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 disabled:opacity-40 cursor-pointer"
              >
                {loadingSubtitle ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Sparkles className="h-4 w-4" />}
              </button>
              <button
                onClick={handleBatchGenerateSubtitle}
                disabled={batchSubtitleLoading || !panels?.length}
                title="Suggest styles for all panels"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 disabled:opacity-40 cursor-pointer"
              >
                {batchSubtitleLoading ? <Layers3 className="h-4 w-4 animate-pulse" /> : <Layers3 className="h-4 w-4" />}
              </button>
            </div>
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
                  <span className="text-neutral-300 font-bold">
                    {subtitleData.font_name}
                  </span>
                </div>
                <div className="flex justify-between border-b border-neutral-900 pb-1">
                  <span className="text-neutral-500">Font size scale</span>
                  <span className="text-neutral-300 font-semibold">
                    {subtitleData.scale_size}x
                  </span>
                </div>
                <div className="flex justify-between border-b border-neutral-900 pb-1">
                  <span className="text-neutral-500">Primary fill color</span>
                  <span
                    className="font-semibold"
                    style={{ color: subtitleData.primary_fill_color }}
                  >
                    {subtitleData.primary_fill_color}
                  </span>
                </div>
                <div className="flex justify-between border-b border-neutral-900 pb-1">
                  <span className="text-neutral-500">Outline thickness</span>
                  <span className="text-neutral-300 font-semibold">
                    {subtitleData.outline_stroke_thickness}px
                  </span>
                </div>
                <div className="col-span-2 pt-1 border-t border-neutral-900 flex justify-between">
                  <span className="text-neutral-500">
                    Bounce animation style:
                  </span>
                  <span className="text-purple-350 font-bold uppercase">
                    {subtitleData.bounce_animation_style}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
