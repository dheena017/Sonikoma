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
    <div className="space-y-2.5 bg-[#1E1E1E] p-3 rounded-xl border border-[#2F2F2F]">
      <div className="text-[10px] uppercase font-mono font-bold text-[#9CA3AF] flex items-center gap-1.5">
        <FolderOpen className="h-3.5 w-3.5 text-[#3B82F6]" />
        <span>Layout Templates</span>
      </div>

      <div className="flex gap-2 items-center">
        <select
          value={selectedTemplate}
          onChange={(e) => handleLoadTemplate(e.target.value)}
          className="flex-1 text-[10px] font-bold font-mono bg-[#121212] border border-[#2F2F2F] rounded-lg py-1 px-2 text-[#E5E5E5] focus:outline-none focus:border-[#3B82F6] cursor-pointer"
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
            className="p-1.5 text-[#9CA3AF] hover:text-[#EF4444] bg-[#121212] border border-[#2F2F2F] rounded-lg transition-colors cursor-pointer"
            title="Delete this template"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="flex gap-2 pt-1 border-t border-[#2F2F2F]">
        <input
          type="text"
          placeholder="Save current layout as..."
          value={newTemplateName}
          onChange={(e) => setNewTemplateName(e.target.value)}
          className="flex-1 text-[10px] bg-[#121212] border border-[#2F2F2F] rounded-lg py-1 px-2 text-[#E5E5E5] focus:outline-none focus:border-[#3B82F6] placeholder-[#6B7280]"
        />
        <button
          type="button"
          onClick={handleSaveTemplate}
          disabled={!newTemplateName.trim() || splitLines.length === 0}
          className="btn-secondary text-[#10B981] border-[#10B981]/30 hover:bg-[#10B981]/10 disabled:opacity-20 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 font-mono"
        >
          <Save className="h-3 w-3" />
          <span>Save</span>
        </button>
      </div>
    </div>
  );
}
