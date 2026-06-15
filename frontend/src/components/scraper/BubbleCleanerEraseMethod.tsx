import React from "react";
import { Paintbrush } from "lucide-react";
import SectionTitle from "../crop/SectionTitle";
import { ERASE_OPTIONS } from "./bubbleCleanerConfig";
import { EraseMethod } from "./tabTypes";

interface Props {
  eraseMethod: EraseMethod;
  setEraseMethod: (v: EraseMethod) => void;
}

export function BubbleCleanerEraseMethod({
  eraseMethod,
  setEraseMethod,
}: Props) {
  return (
    <div className="space-y-3">
      <SectionTitle icon={<Paintbrush className="h-3 w-3 text-purple-400" />}>
        How to Erase
      </SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {ERASE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setEraseMethod(opt.value as EraseMethod)}
            className={`flex flex-col gap-1 px-4 py-3 rounded-2xl border text-left transition-all cursor-pointer ${
              eraseMethod === opt.value
                ? "bg-indigo-950/15 border-indigo-500 shadow-[0_0_14px_rgba(99,102,241,0.1)]"
                : "bg-neutral-950/30 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm leading-none">{opt.icon}</span>
              <span
                className={`text-[11px] font-bold font-mono ${
                  eraseMethod === opt.value ? "text-white" : "text-neutral-300"
                }`}
              >
                {opt.label}
              </span>
              {opt.badge && (
                <span className="ml-auto text-[7.5px] px-1.5 py-0.5 rounded border bg-indigo-950/30 text-indigo-400 border-indigo-800/40 font-mono font-bold uppercase tracking-wider">
                  {opt.badge}
                </span>
              )}
            </div>
            <p className="text-[9px] text-neutral-500 font-sans leading-normal">
              {opt.hint}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
