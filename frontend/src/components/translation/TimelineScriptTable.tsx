import React from "react";
import { GeneratedPanel } from "../../types";

interface TimelineScriptTableProps {
  panels: GeneratedPanel[];
  onUpdatePanelText: (id: number, val: string) => void;
}

export default function TimelineScriptTable({
  panels,
  onUpdatePanelText,
}: TimelineScriptTableProps) {
  return (
    <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-neutral-850 bg-neutral-950/60 font-mono text-neutral-450 text-[10px] uppercase">
              <th className="py-3 px-4 w-16 text-center">Panel</th>
              <th className="py-3 px-4 w-28">Preview</th>
              <th className="py-3 px-4">Active Narrative / Subtitle Script</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-850">
            {panels.map((panel, idx) => (
              <tr
                key={panel.id}
                className="hover:bg-neutral-900/30 transition-colors"
              >
                <td className="py-4 px-4 text-center font-mono font-bold text-purple-400">
                  #{panel.id}
                </td>
                <td className="py-4 px-4">
                  <div className="h-10 w-16 rounded border border-neutral-800 bg-neutral-950 overflow-hidden flex items-center justify-center">
                    <img
                      src={panel.image_url}
                      alt=""
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </td>
                <td className="py-4 px-4">
                  <textarea
                    rows={2}
                    value={panel.speech_text}
                    onChange={(e) =>
                      onUpdatePanelText(panel.id, e.target.value)
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200 outline-none focus:border-purple-600 transition-all font-sans leading-relaxed"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
