import React, { useState } from "react";
import { FileJson, ChevronDown } from "lucide-react";

interface Props {
  payload: any;
}

export function AutoCropJsonDebugger({ payload }: Props) {
  const [show, setShow] = useState(false);
  const jsonString = JSON.stringify(payload, null, 2);

  return (
    <div className="border border-neutral-800 rounded-2xl overflow-hidden bg-neutral-950/50">
      <button type="button" onClick={() => setShow(!show)}
        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900/40 hover:bg-neutral-900/80 transition-colors border-b border-neutral-800 text-neutral-400 hover:text-white cursor-pointer select-none">
        <div className="flex items-center gap-2 text-[9px] font-mono font-bold tracking-wider uppercase">
          <FileJson className="h-3.5 w-3.5 text-indigo-400" />
          <span>API JSON Request Payload Debugger</span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${show ? "rotate-180 text-indigo-400" : ""}`} />
      </button>
      {show && (
        <div className="p-4 bg-[#08080c] font-mono text-[9px] text-neutral-300 leading-relaxed overflow-x-auto select-all max-h-[160px] animate-fadeIn">
          <pre>{jsonString}</pre>
        </div>
      )}
    </div>
  );
}
