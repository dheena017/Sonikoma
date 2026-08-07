import React, { useState } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import { AI_ENGINE_SUB_TABS, MOCK_AI_TOOLS } from "../../data/aiData";
import {
  BookOpen, Grid, Film, FileSearch, Scan, Paintbrush, Maximize, Mic,
  Move, Languages, Crop, Eraser, Sliders, Wand2
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen, Grid, Film, FileSearch, Scan, Paintbrush, Maximize, Mic,
  Move, Languages, Crop, Eraser, Sliders, Wand2
};

interface AiWorkspaceProps {
  onTriggerFeedback: (msg: string) => void;
}

export const AiWorkspace: React.FC<AiWorkspaceProps> = ({ onTriggerFeedback }) => {
  const [activeTab, setActiveTab] = useState("Generate");
  const [prompt, setPrompt] = useState("");

  const activeTools = MOCK_AI_TOOLS.filter(
    (t) => t.engine === activeTab.toLowerCase()
  );

  return (
    <WorkspaceLayout>
      <WorkspaceLayout.Header title="AI Studio" />
      <WorkspaceLayout.Tabs tabs={AI_ENGINE_SUB_TABS} activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Prompt box visible only for Generate */}
      {activeTab === "Generate" && (
        <WorkspaceLayout.PromptBox
          value={prompt}
          onChange={setPrompt}
          onSubmit={() => {
            onTriggerFeedback(`AI generating from: "${prompt.slice(0, 40)}..."`);
            setPrompt("");
          }}
          placeholder='Describe your scene, e.g. "Shadow Monarch reveals his army to the shocked A-rank hunters..."'
        />
      )}

      <WorkspaceLayout.Content>
        {/* AI Engine Description Banner */}
        <div className="rounded-xl bg-purple-950/30 border border-purple-900/40 p-3 text-center mb-1">
          <p className="text-[10px] text-purple-300 font-mono">
            {activeTab === "Generate" && "Create scripts, prompts, thumbnails & teaser trailers"}
            {activeTab === "Analyze" && "OCR text extraction, bubble detection & scene sentiment"}
            {activeTab === "Enhance" && "Auto colorize, 4K upscale, and line art restoration"}
            {activeTab === "Voice" && "Neural TTS multi-character voice synthesis & emotion control"}
            {activeTab === "Motion" && "2.5D parallax depth, camera pans, tilts & speedline FX"}
            {activeTab === "Translation" && "Translate KO/JP manga dialogue to EN, ES, FR, DE"}
            {activeTab === "Automation" && "One-click panel cutter, bubble cleaner & smart crop 9:16"}
          </p>
        </div>

        {/* Tools Grid */}
        <div className="space-y-2">
          {activeTools.length === 0 && (
            <div className="text-center py-8 text-neutral-500 text-xs">No tools for this engine yet.</div>
          )}
          {activeTools.map((tool) => {
            const Icon = ICON_MAP[tool.iconName] || Wand2;
            return (
              <div
                key={tool.id}
                className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-purple-500/60 cursor-pointer transition-all group flex items-start gap-3"
              >
                <div className="h-8 w-8 rounded-lg bg-purple-900/40 border border-purple-500/30 flex items-center justify-center shrink-0 group-hover:bg-purple-600/40 transition-colors">
                  <Icon className="h-4 w-4 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-xs font-bold text-white group-hover:text-purple-300 truncate">{tool.title}</p>
                    <span className="text-[8px] font-mono font-bold bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30 shrink-0">
                      {tool.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-tight">{tool.desc}</p>
                </div>
                <button
                  onClick={() => onTriggerFeedback(`Running: ${tool.title}`)}
                  className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-mono font-bold transition-colors shrink-0 cursor-pointer"
                >
                  Run
                </button>
              </div>
            );
          })}
        </div>
      </WorkspaceLayout.Content>
      <WorkspaceLayout.Footer text="Powered by Sonikoma AI Engine" />
    </WorkspaceLayout>
  );
};
