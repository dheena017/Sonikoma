import React, { useState } from "react";
import { Settings, Download, Upload, Save, RefreshCw } from "lucide-react";
import { SectionTitle } from "../crop";
import { CustomBubblePreset } from "../../scraper/tabTypes";

interface Props {
  customPresets: Record<string, CustomBubblePreset>;
  savePreset: (slot: string, name: string) => void;
  loadPreset: (slot: string) => void;
  exportPresets: () => void;
  importPresets: (json: string) => void;
}

export function BubbleCleanerCustomSlots({
  customPresets,
  savePreset,
  loadPreset,
  exportPresets,
  importPresets,
}: Props) {
  const [slotNames, setSlotNames] = useState({
    slot1: customPresets.slot1.name,
    slot2: customPresets.slot2.name,
    slot3: customPresets.slot3.name,
  });

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      importPresets(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <SectionTitle icon={<Settings className="h-3 w-3 text-purple-400" />}>
          Custom Profile Slots
        </SectionTitle>
        <div className="flex items-center gap-2">
          <button
            onClick={exportPresets}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all text-[8px] font-bold font-mono active:scale-95 cursor-pointer"
          >
            <Download className="h-3 w-3" /> Export JSON
          </button>
          <label className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all text-[8px] font-bold font-mono active:scale-95 cursor-pointer">
            <Upload className="h-3 w-3" /> Import JSON
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>
        </div>
      </div>
      <div className="space-y-2">
        {["slot1", "slot2", "slot3"].map((slot) => (
          <div
            key={slot}
            className="flex items-center gap-2 p-2.5 bg-neutral-900/20 border border-neutral-800 rounded-2xl hover:bg-neutral-900/40 transition-colors"
          >
            <input
              type="text"
              value={slotNames[slot as keyof typeof slotNames]}
              onChange={(e) =>
                setSlotNames({ ...slotNames, [slot]: e.target.value })
              }
              placeholder="Custom Profile name..."
              className="bg-neutral-950 border border-neutral-800 text-neutral-200 text-[10px] font-mono px-3 py-1.5 rounded-xl flex-1 focus:border-purple-500/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={() =>
                savePreset(slot, slotNames[slot as keyof typeof slotNames])
              }
              className="inline-flex items-center gap-1 rounded-xl border border-purple-950 bg-purple-950/20 hover:bg-purple-500/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-purple-400 hover:text-purple-300 transition-all active:scale-95 cursor-pointer"
            >
              <Save className="h-3 w-3" /> Save
            </button>
            <button
              type="button"
              onClick={() => loadPreset(slot)}
              className="inline-flex items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-neutral-300 hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" /> Load
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
