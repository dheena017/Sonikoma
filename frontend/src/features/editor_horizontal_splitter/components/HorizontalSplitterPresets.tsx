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
    <div className="space-y-3 bg-[#1E1E1E] p-4 rounded-2xl border border-[#2F2F2F] shadow-md">
      <div className="text-[10px] uppercase font-mono font-bold text-white flex items-center gap-2">
        <FolderOpen className="h-3.5 w-3.5 text-[#3B82F6]" />
        <span>Layout Templates</span>
      </div>

      <div className="flex gap-2 items-center">
        <select
          value={selectedTemplate}
          onChange={(e) => handleLoadTemplate(e.target.value)}
          className="flex-1 text-xs font-bold font-mono bg-[#121212] border border-[#2F2F2F] rounded-xl py-2 px-3 text-white focus:outline-none focus:border-[#3B82F6] cursor-pointer"
        >
          <option value="">Select template...</option>
          {Object.keys(savedTemplates).map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        {selectedTemplate && (
          <button
            type="button"
            onClick={() => handleDeleteTemplate(selectedTemplate)}
            className="p-2 text-neutral-400 hover:text-rose-400 bg-[#2A2A2A] hover:bg-[#333333] border border-[#2F2F2F] hover:border-[#3B82F6] rounded-xl transition-colors cursor-pointer"
            title="Delete this template"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex gap-2 pt-2 border-t border-[#2F2F2F]">
        <input
          type="text"
          placeholder="Save current layout as..."
          value={newTemplateName}
          onChange={(e) => setNewTemplateName(e.target.value)}
          className="flex-1 text-xs font-mono bg-[#121212] border border-[#2F2F2F] rounded-xl py-2 px-3 text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#3B82F6]"
        />
        <button
          type="button"
          onClick={handleSaveTemplate}
          disabled={!newTemplateName.trim() || splitLines.length === 0}
          className="bg-[#2A2A2A] hover:bg-[#333333] disabled:opacity-40 disabled:cursor-not-allowed border border-[#2F2F2F] hover:border-[#3B82F6] text-neutral-200 hover:text-white text-xs font-bold py-2 px-4 rounded-xl font-mono transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          title="Save current split lines"
        >
          <Save className="h-3.5 w-3.5" />
          <span>Save</span>
        </button>
      </div>
    </div>
  );
}
