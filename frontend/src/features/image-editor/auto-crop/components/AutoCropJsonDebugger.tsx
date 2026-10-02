import React, { useState } from "react";
import { FileJson, ChevronDown } from "lucide-react";

interface Props {
  payload: any;
}

export function AutoCropJsonDebugger({ payload }: Props) {
  const [show, setShow] = useState(false);
  const jsonString = JSON.stringify(payload, null, 2);

  return (
    <div className="border border-neutral-800/80 rounded-3xl overflow-hidden bg-neutral-900/60 shadow-xl backdrop-blur-xl transition-all">
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="w-full flex items-center justify-between px-5 py-4 bg-neutral-950/40 hover:bg-neutral-900/80 transition-colors border-b border-neutral-800/80 text-neutral-300 hover:text-white cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5 text-xs font-mono font-bold tracking-wider uppercase">
          <FileJson className="h-4 w-4 text-[#3B82F6]" />
          <span>API JSON Request Payload Debugger</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${
            show ? "rotate-180 text-[#3B82F6]" : "text-neutral-500"
          }`}
        />
      </button>
      {show && (
        <div className="p-4 bg-[#08080c] font-mono text-[9px] text-neutral-300 leading-relaxed overflow-x-auto select-all max-h-[160px] animate-fadeIn">
          <pre>{jsonString}</pre>
        </div>
      )}
    </div>
  );
}
