import React, { useState } from "react";
import { 
  X, 
  AlertTriangle, 
  Terminal, 
  ChevronDown, 
  ChevronUp, 
  Wrench, 
  RefreshCw, 
  Copy, 
  Check, 
  Sliders, 
  Layers,
  HelpCircle
} from "lucide-react";

export interface ErrorPopupDetail {
  title: string;
  message: string;
  technicalDetails?: string;
  suggestion?: string;
  type?: "error" | "warning" | "info" | "success";
  parameters?: {
    method?: string;
    sensitivity?: number;
    dilation?: number;
    inpaint_radius?: number;
    detection_style?: string;
    url?: string;
  };
  onRetry?: (overrideParams: {
    method: string;
    sensitivity: number;
    dilation: number;
    inpaint_radius: number;
    detection_style: string;
  }) => void;
}

interface ErrorPopupModalProps {
  error: ErrorPopupDetail | null;
  onClose: () => void;
}

export default function ErrorPopupModal({ error, onClose }: ErrorPopupModalProps) {
  if (!error) return null;

  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Interactive parameters override state inside the error modal
  const [method, setMethod] = useState(error.parameters?.method || "inpaint");
  const [sensitivity, setSensitivity] = useState(error.parameters?.sensitivity !== undefined ? error.parameters?.sensitivity : 50);
  const [dilation, setDilation] = useState(error.parameters?.dilation !== undefined ? error.parameters?.dilation : -1);
  const [inpaintRadius, setInpaintRadius] = useState(error.parameters?.inpaint_radius !== undefined ? error.parameters?.inpaint_radius : 3);
  const [detectionStyle, setDetectionStyle] = useState(error.parameters?.detection_style || "all");

  const handleCopy = () => {
    const textToCopy = `[Error Diagnosis]\nTitle: ${error.title}\nMessage: ${error.message}\nTechnical logs:\n${error.technicalDetails || "None"}\nActive settings: Method=${method}, Sensitivity=${sensitivity}%, Dilation=${dilation}, InpaintRadius=${inpaintRadius}px, Style=${detectionStyle}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isWarning = error.type === "warning";
  const accentColor = isWarning ? "amber" : "red";
  
  const handleApplyRetry = () => {
    if (error.onRetry) {
      error.onRetry({
        method,
        sensitivity,
        dilation,
        inpaint_radius: inpaintRadius,
        detection_style: detectionStyle
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Container */}
      <div 
        className={`relative w-full max-w-2xl bg-neutral-900 border-2 ${
          isWarning ? "border-amber-500/50" : "border-red-500/50"
        } rounded-3xl shadow-2xl p-6 md:p-8 overflow-hidden z-10 animate-in zoom-in-95 duration-200`}
      >
        {/* Glow Element */}
        <div className={`absolute top-0 left-1/4 right-1/4 h-1.5 bg-gradient-to-r ${
          isWarning ? "from-transparent via-amber-500 to-transparent" : "from-transparent via-red-500 to-transparent"
        } blur-[1px]`} />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-white bg-neutral-950/40 hover:bg-neutral-950 p-2 rounded-full transition-all cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Content */}
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className={`p-3.5 rounded-2xl ${
              isWarning ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-500"
            } shrink-0`}>
              <AlertTriangle className="h-7 w-7 animate-pulse" />
            </div>
            <div className="space-y-1">
              <span className={`text-[9.5px] uppercase tracking-widest font-bold font-mono px-2.5 py-0.5 rounded-full ${
                isWarning ? "bg-amber-500/15 text-amber-400 border border-amber-500/35" : "bg-red-500/15 text-red-400 border border-red-500/35"
              }`}>
                {isWarning ? "Heuristics Warning" : "Engine Fault Dialog"}
              </span>
              <h2 className="text-xl font-bold font-sans text-white leading-snug">{error.title}</h2>
              <p className="text-neutral-400 text-sm leading-relaxed mt-1 pr-4">{error.message}</p>
            </div>
          </div>

          {/* Solution & Corrective Auto-Tuner Section */}
          <div className="bg-neutral-950/60 rounded-2xl border border-neutral-800/40 p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-neutral-300">
              <Wrench className="h-4 w-4 text-purple-400" />
              <span>Corrective Parameters Workshop</span>
            </div>
            
            {error.suggestion && (
              <p className="text-xs text-neutral-300 leading-relaxed font-sans bg-purple-950/10 border border-purple-900/15 p-3 rounded-xl">
                💡 <span className="font-semibold text-purple-300">Diagnostic Suggestion:</span> {error.suggestion}
              </p>
            )}

            {/* Quick adjust grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              
              <div className="space-y-1">
                <label className="block text-[10.5px] font-mono text-neutral-400">Restoration Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2 text-xs text-neutral-200 focus:border-purple-500 font-sans outline-none"
                >
                  <option value="inpaint">Telea Inpaint (Smart filling)</option>
                  <option value="inpaint_ns">Navier-Stokes (Fluid blur)</option>
                  <option value="blur">Heavy selective Smudge</option>
                  <option value="solid_white font-mono">Solid White Block</option>
                  <option value="solid_black font-mono">Solid Black Block</option>
                  <option value="transparent font-mono">Transparent Alpha Drop-out</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10.5px] font-mono text-neutral-400">Dialogue Selection Target</label>
                <select
                  value={detectionStyle}
                  onChange={(e) => setDetectionStyle(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2 text-xs text-neutral-200 focus:border-purple-500 font-sans outline-none"
                >
                  <option value="all">Automatic Hybrid (AI/Vision/Hues)</option>
                  <option value="white_only">White Speech Bubbles Only</option>
                  <option value="text_only">Floating Dialogue Letters Only</option>
                </select>
              </div>

              <div className="space-y-1 bg-neutral-900/45 p-3 rounded-xl border border-neutral-800/25">
                <div className="flex items-center justify-between text-[10.5px] font-mono">
                  <span className="text-neutral-400">Sensitivity:</span>
                  <span className="text-purple-400 font-bold">{sensitivity}%</span>
                </div>
                <input 
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={sensitivity}
                  onChange={(e) => setSensitivity(Number(e.target.value))}
                  className="w-full h-1 accent-purple-500 bg-neutral-950 rounded cursor-pointer mt-1"
                />
              </div>

              <div className="space-y-1 bg-neutral-900/45 p-3 rounded-xl border border-neutral-800/25">
                <div className="flex items-center justify-between text-[10.5px] font-mono">
                  <span className="text-neutral-400">Search Radius:</span>
                  <span className="text-purple-400 font-bold">{inpaintRadius}px</span>
                </div>
                <input 
                  type="range"
                  min={1}
                  max={20}
                  step={1}
                  value={inpaintRadius}
                  onChange={(e) => setInpaintRadius(Number(e.target.value))}
                  className="w-full h-1 accent-purple-500 bg-neutral-950 rounded cursor-pointer mt-1"
                />
              </div>

            </div>
          </div>

          {/* Technical Traceback Accordion */}
          {error.technicalDetails && (
            <div className="border border-neutral-800/80 rounded-2xl overflow-hidden bg-neutral-950/30">
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-4 py-3 bg-neutral-950/70 hover:bg-neutral-900/50 transition-all font-mono text-[11px] text-neutral-300 font-medium cursor-pointer border-b border-neutral-800/40"
              >
                <div className="flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Technical Diagnostics & Output Logs</span>
                </div>
                {expanded ? (
                  <ChevronUp className="h-3.5 w-3.5 text-neutral-500" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
                )}
              </button>
              
              {expanded && (
                <div className="relative p-4 font-mono text-[10px] text-neutral-400 bg-neutral-950 max-h-40 overflow-y-auto leading-relaxed whitespace-pre-wrap select-all">
                  <button
                    onClick={handleCopy}
                    className="absolute top-2.5 right-2.5 bg-neutral-900 border border-neutral-800 hover:border-purple-500 text-neutral-300 hover:text-white p-1.5 rounded-lg text-[9px] flex items-center gap-1 cursor-pointer transition-all hover:bg-neutral-950"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                  {error.technicalDetails}
                </div>
              )}
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border border-neutral-850"
            >
              Cancel & Dismiss
            </button>
            {error.onRetry && (
              <button
                onClick={handleApplyRetry}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs tracking-wide shadow-lg shadow-purple-950/55 hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" />
                <span>Auto-Apply & Re-clean Target</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
