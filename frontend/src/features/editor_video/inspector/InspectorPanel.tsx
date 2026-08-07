import React, { useState } from "react";
import {
  ChevronDown, ChevronUp, Layers, Move, Palette, Settings,
  Type, Gauge, ZoomIn, Lock, Eye, EyeOff, RotateCcw, Film, Sliders,
} from "lucide-react";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────
export interface InspectorSectionConfig {
  id: string;
  label: string;
  Icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

// ──────────────────────────────────────────────────────────────
// Accordion Section — exported so plugins can compose custom sections
// ──────────────────────────────────────────────────────────────
export const InspectorSection: React.FC<{ section: InspectorSectionConfig }> = ({ section }) => {
  const [open, setOpen] = useState(section.defaultOpen ?? false);
  const { Icon } = section;
  return (
    <div className="border-b border-purple-900/20">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-lg bg-purple-900/40 border border-purple-500/30 flex items-center justify-center">
            <Icon className="h-3 w-3 text-purple-400" />
          </div>
          <span className="text-[10px] font-mono font-bold text-neutral-200 uppercase tracking-widest">{section.label}</span>
        </div>
        {open ? <ChevronUp className="h-3 w-3 text-neutral-400" /> : <ChevronDown className="h-3 w-3 text-neutral-500" />}
      </button>
      {open && <div className="px-3 pb-3 pt-1 space-y-2.5">{section.children}</div>}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────
// Reusable field controls — also exported for plugin use
// ──────────────────────────────────────────────────────────────
export const NumberField: React.FC<{ label: string; value: number; min?: number; max?: number; step?: number }> = ({
  label, value, min = 0, max = 100, step = 1,
}) => {
  const [val, setVal] = useState(value);
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] font-mono text-neutral-400">{label}</span>
      <input type="number" min={min} max={max} step={step} value={val}
        onChange={(e) => setVal(Number(e.target.value))}
        className="w-16 bg-neutral-900/90 border border-neutral-800 focus:border-purple-500/80 rounded-lg text-right text-[10px] text-purple-300 font-mono px-2 py-0.5 outline-none transition-all shadow-inner"
      />
    </div>
  );
};

export const SliderField: React.FC<{ label: string; value: number; min?: number; max?: number }> = ({
  label, value, min = 0, max = 100,
}) => {
  const [val, setVal] = useState(value);
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[9px] font-mono text-neutral-400">{label}</span>
        <span className="text-[9px] font-mono text-purple-300 font-bold">{val}%</span>
      </div>
      <input type="range" min={min} max={max} value={val} onChange={(e) => setVal(Number(e.target.value))}
        className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
      />
    </div>
  );
};

export const ColorField: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const [val, setVal] = useState(value);
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] font-mono text-neutral-400">{label}</span>
      <div className="flex items-center gap-2">
        <input type="color" value={val} onChange={(e) => setVal(e.target.value)}
          className="h-5 w-5 rounded-md cursor-pointer border border-neutral-700 bg-transparent p-0 overflow-hidden"
          style={{ WebkitAppearance: "none" }}
        />
        <span className="text-[9px] font-mono text-neutral-300 font-bold uppercase">{val}</span>
      </div>
    </div>
  );
};

export const SelectField: React.FC<{ label: string; options: string[]; value: string }> = ({ label, options, value }) => {
  const [val, setVal] = useState(value);
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[9px] font-mono text-neutral-400 shrink-0">{label}</span>
      <select value={val} onChange={(e) => setVal(e.target.value)}
        className="flex-1 bg-neutral-900/90 border border-neutral-800 rounded-lg text-[9px] font-mono text-purple-200 px-2 py-1 outline-none focus:border-purple-500 cursor-pointer"
      >
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────
// InspectorPanel — modular, plugin-registerable sections
// ──────────────────────────────────────────────────────────────
export const InspectorPanel: React.FC<{
  /** Additional plugin sections injected at runtime */
  extraSections?: InspectorSectionConfig[];
}> = ({ extraSections = [] }) => {
  const [visible, setVisible] = useState(true);
  const [locked, setLocked] = useState(false);

  const builtinSections: InspectorSectionConfig[] = [
    {
      id: "transform", label: "Transform", Icon: Move, defaultOpen: true,
      children: (
        <>
          <NumberField label="X Position" value={0} min={-4000} max={4000} />
          <NumberField label="Y Position" value={0} min={-4000} max={4000} />
          <NumberField label="Width" value={1920} min={1} max={7680} />
          <NumberField label="Height" value={1080} min={1} max={4320} />
          <NumberField label="Rotation" value={0} min={-360} max={360} />
          <NumberField label="Scale X" value={100} min={1} max={500} />
          <NumberField label="Scale Y" value={100} min={1} max={500} />
        </>
      ),
    },
    {
      id: "appearance", label: "Appearance", Icon: Palette, defaultOpen: true,
      children: (
        <>
          <SliderField label="Opacity" value={100} />
          <SelectField label="Blend Mode" options={["Normal", "Multiply", "Screen", "Overlay", "Soft Light", "Difference"]} value="Normal" />
          <ColorField label="Tint Color" value="#a855f7" />
          <SliderField label="Brightness" value={100} />
          <SliderField label="Contrast" value={100} />
          <SliderField label="Saturation" value={100} />
        </>
      ),
    },
    {
      id: "typography", label: "Typography", Icon: Type, defaultOpen: false,
      children: (
        <>
          <SelectField label="Font" options={["Bangers", "ComicSans MS", "Manga Temple", "Inter", "Anton"]} value="Bangers" />
          <NumberField label="Font Size" value={32} min={6} max={300} />
          <SelectField label="Weight" options={["Regular", "Medium", "Bold", "Black"]} value="Bold" />
          <SelectField label="Align" options={["Left", "Center", "Right", "Justify"]} value="Center" />
          <ColorField label="Text Color" value="#ffffff" />
          <SliderField label="Letter Spacing" value={0} min={-20} max={40} />
          <SliderField label="Line Height" value={120} min={60} max={300} />
        </>
      ),
    },
    {
      id: "clip", label: "Clip Settings", Icon: Film, defaultOpen: false,
      children: (
        <>
          <NumberField label="Start (s)" value={0} min={0} max={3600} step={0.1} />
          <NumberField label="End (s)" value={5} min={0} max={3600} step={0.1} />
          <NumberField label="Speed %" value={100} min={10} max={1000} />
          <SelectField label="Easing" options={["Linear", "Ease In", "Ease Out", "Ease In Out"]} value="Ease In Out" />
        </>
      ),
    },
    {
      id: "filters", label: "Filters", Icon: Gauge, defaultOpen: false,
      children: (
        <>
          <SelectField label="Preset" options={["None", "Manga B&W", "Anime Vivid", "Cyberpunk", "Vintage", "Night"]} value="None" />
          <SliderField label="Blur" value={0} />
          <SliderField label="Sharpen" value={0} />
          <SliderField label="Vignette" value={0} />
        </>
      ),
    },
    {
      id: "layers", label: "Layers", Icon: Layers, defaultOpen: false,
      children: (
        <div className="space-y-1">
          {["Background", "Panel 01", "Character A", "FX Overlay", "Dialogue"].map((layer, i) => (
            <div key={layer} className="flex items-center gap-2 p-1.5 rounded-lg bg-neutral-900/60 border border-neutral-800/80 hover:border-purple-500/50 cursor-pointer transition-all">
              <Eye className="h-3 w-3 text-purple-400 hover:text-white" />
              <Lock className="h-3 w-3 text-neutral-600 hover:text-white" />
              <span className="text-[10px] text-white font-mono flex-1">{layer}</span>
              <span className="text-[8px] text-purple-300 font-mono bg-purple-500/20 px-1 rounded">L{i + 1}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  const allSections = [...builtinSections, ...extraSections];

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-b from-[#0c0a1a] via-[#090714] to-[#05040a] text-white select-none backdrop-blur-2xl border-l border-purple-900/20">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-purple-900/20 bg-neutral-950/70 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2">
          <Sliders className="h-3.5 w-3.5 text-purple-400" />
          <span className="text-xs font-mono font-bold text-white uppercase tracking-widest">Inspector</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setLocked((v) => !v)} title={locked ? "Unlock" : "Lock"}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
            <Lock className={`h-3.5 w-3.5 ${locked ? "text-amber-400" : "text-neutral-500"}`} />
          </button>
          <button title="Reset All" className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
            <RotateCcw className="h-3.5 w-3.5 text-neutral-500 hover:text-white" />
          </button>
          <button onClick={() => setVisible((v) => !v)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
            {visible ? <Eye className="h-3.5 w-3.5 text-purple-400" /> : <EyeOff className="h-3.5 w-3.5 text-neutral-500" />}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {!visible && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center p-4">
          <ZoomIn className="h-6 w-6 text-purple-400/50 animate-pulse" />
          <p className="text-[10px] font-mono text-neutral-400">Select a layer on timeline<br />to inspect properties</p>
        </div>
      )}

      {/* Sections */}
      {visible && (
        <div className="flex-1 overflow-y-auto [scrollbar-width:none]">
          {allSections.map((s) => (
            <InspectorSection key={s.id} section={s} />
          ))}
        </div>
      )}
    </div>
  );
};

export default InspectorPanel;
