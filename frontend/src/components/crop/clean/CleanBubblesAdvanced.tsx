import React from "react";
import { ChevronRight } from "lucide-react";

interface CleanBubblesAdvancedProps {
  showColorFilter: boolean;
  setShowColorFilter: (val: boolean) => void;
  useCustomColorTarget: boolean;
  setUseCustomColorTarget: (val: boolean) => void;
  customColorTarget: string;
  setCustomColorTarget: (val: string) => void;
  customColorTolerance: number;
  setCustomColorTolerance: (val: number) => void;

  eraseMethod: string;
  showOcrConfig: boolean;
  setShowOcrConfig: (val: boolean) => void;
  ocrLang: string;
  setOcrLang: (val: string) => void;
  gpu: boolean;
  setGpu: (val: boolean) => void;

  showAdvanced: boolean;
  setShowAdvanced: (val: boolean) => void;
  morphShape: string;
  setMorphShape: (val: string) => void;
  dilation: number;
  setDilation: (val: number) => void;
  dilationPct: number;
  morphKernelSize: number;
  setMorphKernelSize: (val: number) => void;
  inpaintRadius: number;
  setInpaintRadius: (val: number) => void;
  inpaintRadiusPct: number;
  setActivePreset: (preset: string) => void;
}

export default function CleanBubblesAdvanced({
  showColorFilter,
  setShowColorFilter,
  useCustomColorTarget,
  setUseCustomColorTarget,
  customColorTarget,
  setCustomColorTarget,
  customColorTolerance,
  setCustomColorTolerance,

  eraseMethod,
  showOcrConfig,
  setShowOcrConfig,
  ocrLang,
  setOcrLang,
  gpu,
  setGpu,

  showAdvanced,
  setShowAdvanced,
  morphShape,
  setMorphShape,
  dilation,
  setDilation,
  dilationPct,
  morphKernelSize,
  setMorphKernelSize,
  inpaintRadius,
  setInpaintRadius,
  inpaintRadiusPct,
  setActivePreset,
}: CleanBubblesAdvancedProps) {
  return (
    <div className="space-y-2.5">
      {/* Collapsible Custom Color Filter Range */}
      <div className="border-t border-white/5 pt-2">
        <button
          type="button"
          onClick={() => setShowColorFilter(!showColorFilter)}
          className="flex items-center gap-1.5 text-[9px] font-bold text-neutral-500 hover:text-neutral-400 uppercase font-mono tracking-widest transition-colors cursor-pointer"
        >
          <ChevronRight
            className={`h-3 w-3 transition-transform duration-200 ${
              showColorFilter ? "rotate-90 text-purple-400" : ""
            }`}
          />
          <span>Chroma-Filter Bubble Color</span>
        </button>

        {showColorFilter && (
          <div className="space-y-3 pt-2.5 animate-fadeIn">
            <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/40 border border-neutral-800">
              <span className="text-[8px] font-mono text-neutral-400 uppercase">
                Enable Color Chroma-Filter
              </span>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useCustomColorTarget}
                  onChange={(e) => setUseCustomColorTarget(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-7 h-4 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-500 after:border-neutral-400 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-650 peer-checked:after:bg-white border border-neutral-700"></div>
              </label>
            </div>

            {useCustomColorTarget && (
              <>
                <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/40 border border-neutral-800 animate-fadeIn">
                  <span className="text-[8px] font-mono text-neutral-400 uppercase">
                    Target Bubble Color
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={customColorTarget}
                      onChange={(e) => setCustomColorTarget(e.target.value)}
                      className="w-16 bg-neutral-950 border border-neutral-855 text-[10px] font-mono text-center rounded py-0.5"
                    />
                    <input
                      type="color"
                      value={customColorTarget}
                      onChange={(e) => setCustomColorTarget(e.target.value)}
                      className="w-5 h-5 bg-transparent border-0 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-1 animate-fadeIn">
                  <div className="flex justify-between text-[8px] font-mono">
                    <span className="text-neutral-500">
                      Color Distance Tolerance
                    </span>
                    <span className="text-purple-400 font-bold">
                      {customColorTolerance}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={customColorTolerance}
                    onChange={(e) =>
                      setCustomColorTolerance(Number(e.target.value))
                    }
                    className="w-full h-1 bg-neutral-900 rounded appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* OCR Config Options */}
      {eraseMethod === "ocr" && (
        <div className="border-t border-white/5 pt-2">
          <button
            type="button"
            onClick={() => setShowOcrConfig(!showOcrConfig)}
            className="flex items-center gap-1.5 text-[9px] font-bold text-neutral-500 hover:text-neutral-400 uppercase font-mono tracking-widest transition-colors cursor-pointer"
          >
            <ChevronRight
              className={`h-3 w-3 transition-transform duration-200 ${
                showOcrConfig ? "rotate-90 text-cyan-400" : ""
              }`}
            />
            <span>EasyOCR Engine Settings</span>
          </button>

          {showOcrConfig && (
            <div className="space-y-3 pt-2.5 animate-fadeIn">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[8px] font-mono text-neutral-500 uppercase">
                    OCR Language
                  </span>
                  <select
                    value={ocrLang}
                    onChange={(e) => setOcrLang(e.target.value)}
                    className="w-full bg-neutral-905 border border-neutral-800 text-[10px] text-neutral-300 rounded p-1 font-mono"
                  >
                    <option value="en">English (en)</option>
                    <option value="ko">Korean (ko)</option>
                    <option value="ja">Japanese (ja)</option>
                    <option value="ch_sim">Chinese Sim (ch_sim)</option>
                    <option value="fr">French (fr)</option>
                    <option value="es">Spanish (es)</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end pb-1.5 pl-2">
                  <span className="text-[8px] font-mono text-neutral-500 uppercase mb-1">
                    GPU Acceleration
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={gpu}
                      onChange={(e) => setGpu(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-7 h-4 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-500 after:border-neutral-400 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyan-600 peer-checked:after:bg-white border border-neutral-700"></div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Advanced toggle */}
      <div className="border-t border-white/5 pt-2">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-[9px] font-bold text-neutral-500 hover:text-neutral-400 uppercase font-mono tracking-widest transition-colors cursor-pointer"
        >
          <ChevronRight
            className={`h-3 w-3 transition-transform duration-200 ${
              showAdvanced ? "rotate-90 text-purple-400" : ""
            }`}
          />
          <span>Dilation & Morph Tuning</span>
        </button>

        {showAdvanced && (
          <div className="space-y-3.5 pt-2.5 animate-fadeIn">
            {/* Morph shape selector */}
            <div className="space-y-1">
              <span className="text-[8px] font-mono text-neutral-500 uppercase">
                Dilation Kernel Shape
              </span>
              <select
                value={morphShape}
                onChange={(e) => setMorphShape(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-305 rounded p-1 font-mono"
              >
                <option value="ellipse">Elliptical (Smooth)</option>
                <option value="rect">Rectangular (Angular)</option>
                <option value="cross">Cross-shaped (Spiky)</option>
              </select>
            </div>

            {/* Dilation Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span
                  className="text-[9px] font-bold text-neutral-400 uppercase font-mono tracking-wider"
                  title="Custom padding margin pixel count. Auto dynamically calculates based on image size."
                >
                  Mask Expansion Dilation
                </span>
                <span className="text-[10px] font-mono font-bold text-purple-400">
                  {dilation === -1 ? "Auto (Adaptive)" : `${dilation}px`}
                </span>
              </div>
              <div className="relative h-1.5 rounded-full bg-neutral-900 border border-white/5 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-100"
                  style={{
                    width: `${dilationPct}%`,
                    background: "linear-gradient(to right, #7c3aed, #c084fc)",
                  }}
                />
                <input
                  type="range"
                  min="-1"
                  max="20"
                  value={dilation}
                  onChange={(e) => {
                    setDilation(Number(e.target.value));
                    setActivePreset("Custom");
                  }}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                />
              </div>
            </div>

            {/* Text stroke Morph Kernel Size */}
            <div className="space-y-1">
              <div className="flex justify-between text-[8px] font-mono">
                <span className="text-neutral-500">
                  Text Stroke Closing Kernel
                </span>
                <span className="text-purple-400 font-bold">
                  {morphKernelSize}px
                </span>
              </div>
              <input
                type="range"
                min="3"
                max="51"
                step="2"
                value={morphKernelSize}
                onChange={(e) => setMorphKernelSize(Number(e.target.value))}
                className="w-full h-1 bg-neutral-900 rounded appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Inpaint Radius Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span
                  className="text-[9px] font-bold text-neutral-400 uppercase font-mono tracking-wider"
                  title="Pixel radius neighborhood for image inpainting."
                >
                  Inpainting Neighborhood Radius
                </span>
                <span className="text-[10px] font-mono font-bold text-purple-400">
                  {inpaintRadius}px
                </span>
              </div>
              <div className="relative h-1.5 rounded-full bg-neutral-900 border border-white/5 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-100"
                  style={{
                    width: `${inpaintRadiusPct}%`,
                    background: "linear-gradient(to right, #7c3aed, #c084fc)",
                  }}
                />
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={inpaintRadius}
                  onChange={(e) => {
                    setInpaintRadius(Number(e.target.value));
                    setActivePreset("Custom");
                  }}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
