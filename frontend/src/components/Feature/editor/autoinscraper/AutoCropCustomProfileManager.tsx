import React, { useState } from "react";
import { Settings, Save, RefreshCw } from "lucide-react";
import { SectionTitle } from "../crop";
import { CustomCropPreset } from "../../scraper/tabTypes";

interface Props {
  customPresets: Record<string, CustomCropPreset>;
  savePreset: (slot: string, name: string) => void;
  loadPreset: (slot: string) => void;
}

export function AutoCropCustomProfileManager({
  customPresets,
  savePreset,
  loadPreset,
}: Props) {
  const [slotNames, setSlotNames] = useState<Record<string, string>>({
    slot1: customPresets.slot1.name,
    slot2: customPresets.slot2.name,
    slot3: customPresets.slot3.name,
  });

  return (
    <div className="space-y-3 pt-2">
      <SectionTitle icon={<Settings className="h-3 w-3" />}>
        Custom Profile Slots
      </SectionTitle>
      <div className="space-y-2">
        {["slot1", "slot2", "slot3"].map((slot) => (
          <div
            key={slot}
            className="flex items-center gap-2 p-3 bg-neutral-900/30 border border-neutral-800 rounded-xl hover:bg-neutral-900/60 transition-colors"
          >
            <input
              type="text"
              value={slotNames[slot]}
              onChange={(e) =>
                setSlotNames({ ...slotNames, [slot]: e.target.value })
              }
              placeholder="Custom Slot name..."
              className="bg-neutral-950 border border-neutral-800 text-neutral-200 text-[10px] font-mono px-2.5 py-1.5 rounded-lg flex-1 focus:border-emerald-500/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => savePreset(slot, slotNames[slot])}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-950 bg-emerald-950/20 hover:bg-emerald-500/10 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-all active:scale-95 cursor-pointer"
            >
              <Save className="h-3 w-3" /> Save
            </button>
            <button
              type="button"
              onClick={() => loadPreset(slot)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-neutral-300 hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" /> Load
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
