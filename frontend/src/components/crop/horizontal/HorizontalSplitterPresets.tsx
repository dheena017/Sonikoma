import React from "react";
import { FolderOpen, Trash2, Save } from "lucide-react";

interface HorizontalSplitterPresetsProps {
  savedTemplates: Record<string, number[]>;
  selectedTemplate: string;
  handleLoadTemplate: (name: string) => void;
  handleDeleteTemplate: (name: string) => void;
  newTemplateName: string;
  setNewTemplateName: (name: string) => void;
  handleSaveTemplate: () => void;
  splitLines: number[];
}

export default function HorizontalSplitterPresets({
  savedTemplates,
  selectedTemplate,
  handleLoadTemplate,
  handleDeleteTemplate,
  newTemplateName,
  setNewTemplateName,
  handleSaveTemplate,
  splitLines,
}: HorizontalSplitterPresetsProps) {
  return (
    <div className="space-y-2 bg-black/30 p-3 rounded-xl border border-white/5">
      <div className="text-[10px] uppercase font-mono font-bold text-neutral-400 flex items-center gap-1.5">
        <FolderOpen className="h-3 w-3 text-emerald-400" />
        <span>Layout Templates</span>
      </div>

      <div className="flex gap-2 items-center">
        <select
          value={selectedTemplate}
          onChange={(e) => handleLoadTemplate(e.target.value)}
          className="flex-1 text-[10px] font-bold font-mono bg-neutral-900 border border-white/10 rounded-lg py-1 px-2 text-white focus:outline-none cursor-pointer"
        >
          <option value="">Select template...</option>
          {Object.keys(savedTemplates).map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        {selectedTemplate && (
          <button
            type="button"
            onClick={() => handleDeleteTemplate(selectedTemplate)}
            className="p-1.5 text-neutral-500 hover:text-red-400 bg-neutral-900 border border-white/10 rounded-lg transition-colors cursor-pointer"
            title="Delete this template"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="flex gap-2 pt-1 border-t border-white/5">
        <input
          type="text"
          placeholder="Save current layout as..."
          value={newTemplateName}
          onChange={(e) => setNewTemplateName(e.target.value)}
          className="flex-1 text-[10px] bg-neutral-900 border border-white/10 rounded-lg py-1 px-2 text-white focus:outline-none placeholder-neutral-600"
        />
        <button
          type="button"
          onClick={handleSaveTemplate}
          disabled={!newTemplateName.trim() || splitLines.length === 0}
          className="bg-emerald-600/10 hover:bg-emerald-600/20 disabled:opacity-20 disabled:hover:bg-transparent border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-lg cursor-pointer transition-all flex items-center gap-1"
        >
          <Save className="h-3 w-3" />
          <span>Save</span>
        </button>
      </div>
    </div>
  );
}
