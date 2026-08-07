import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Layers,
  Move,
  Palette,
  Settings,
  Type,
  Gauge,
  ZoomIn,
  Lock,
  Eye,
  EyeOff,
  RotateCcw,
  Film,
} from "lucide-react";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────
interface InspectorSection {
  id: string;
  label: string;
  Icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

// ──────────────────────────────────────────────────────────────
// Accordion Section
// ──────────────────────────────────────────────────────────────
const Section: React.FC<{ section: InspectorSection }> = ({ section }) => {
  const [open, setOpen] = useState(section.defaultOpen ?? false);
  const { Icon } = section;

  return (
    <div className="border-b border-neutral-800/60">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-neutral-800/30 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-neutral-400" />
          <span className="text-[10px] font-mono font-bold text-neutral-300 uppercase tracking-wider">{section.label}</span>
        </div>
        {open ? <ChevronUp className="h-3 w-3 text-neutral-500" /> : <ChevronDown className="h-3 w-3 text-neutral-500" />}
      </button>
      {open && <div className="px-3 pb-3 space-y-2">{section.children}</div>}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────
// Reusable Field Controls
// ──────────────────────────────────────────────────────────────
const NumberField: React.FC<{ label: string; value: number; min?: number; max?: number; step?: number }> = ({
  label, value, min = 0, max = 100, step = 1,
}) => {
  const [val, setVal] = useState(value);
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] font-mono text-neutral-400">{label}</span>
      <input
        type="number"
        min={min} max={max} step={step}
        value={val}
        onChange={(e) => setVal(Number(e.target.value))}
        className="w-16 bg-neutral-900 border border-neutral-700 rounded-lg text-right text-[10px] text-white font-mono px-1.5 py-0.5 focus:outline-none focus:border-purple-500"
      />
    </div>
  );
};

const SliderField: React.FC<{ label: string; value: number; min?: number; max?: number }> = ({
  label, value, min = 0, max = 100,
}) => {
  const [val, setVal] = useState(value);
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="text-[9px] font-mono text-neutral-400">{label}</span>
        <span className="text-[9px] font-mono text-white font-bold">{val}%</span>
      </div>
      <input
        type="range" min={min} max={max} value={val}
        onChange={(e) => setVal(Number(e.target.value))}
        className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
      />
    </div>
  );
};

const ColorField: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const [val, setVal] = useState(value);
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] font-mono text-neutral-400">{label}</span>
      <div className="flex items-center gap-1.5">
        <input type="color" value={val} onChange={(e) => setVal(e.target.value)}
          className="h-5 w-5 rounded cursor-pointer border-0 bg-transparent p-0"
          style={{ WebkitAppearance: "none" }}
        />
        <span className="text-[9px] font-mono text-neutral-400">{val.toUpperCase()}</span>
      </div>
    </div>
  );
};

const SelectField: React.FC<{ label: string; options: string[]; value: string }> = ({ label, options, value }) => {
  const [val, setVal] = useState(value);
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[9px] font-mono text-neutral-400 shrink-0">{label}</span>
      <select
        value={val} onChange={(e) => setVal(e.target.value)}
        className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg text-[9px] font-mono text-white px-1.5 py-0.5 focus:outline-none focus:border-purple-500 cursor-pointer"
      >
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────
// Main Inspector Panel
// ──────────────────────────────────────────────────────────────
export const InspectorPanel: React.FC = () => {
  const [visible, setVisible] = useState(true);
  const [locked, setLocked] = useState(false);

  const sections: InspectorSection[] = [
    {
      id: "transform",
      label: "Transform",
      Icon: Move,
      defaultOpen: true,
      children: (
        <>
          <NumberField label="X Position" value={0} min={-4000} max={4000} />
          <NumberField label="Y Position" value={0} min={-4000} max={4000} />
          <NumberField label="Width" value={1920} min={1} max={7680} />
          <NumberField label="Height" value={1080} min={1} max={4320} />
          <NumberField label="Rotation" value={0} min={-360} max={360} />
          <NumberField label="Scale X" value={100} min={1} max={500} step={1} />
          <NumberField label="Scale Y" value={100} min={1} max={500} step={1} />
        </>
      ),
    },
    {
      id: "appearance",
      label: "Appearance",
      Icon: Palette,
      defaultOpen: true,
      children: (
        <>
          <SliderField label="Opacity" value={100} />
          <SelectField label="Blend Mode" options={["Normal", "Multiply", "Screen", "Overlay", "Soft Light", "Difference"]} value="Normal" />
          <ColorField label="Tint Color" value="#ffffff" />
          <SliderField label="Brightness" value={100} />
          <SliderField label="Contrast" value={100} />
          <SliderField label="Saturation" value={100} />
        </>
      ),
    },
    {
      id: "typography",
      label: "Typography",
      Icon: Type,
      defaultOpen: false,
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
      id: "clip",
      label: "Clip Settings",
      Icon: Film,
      defaultOpen: false,
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
      id: "filters",
      label: "Filters",
      Icon: Gauge,
      defaultOpen: false,
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
      id: "layers",
      label: "Layers",
      Icon: Layers,
      defaultOpen: false,
      children: (
        <>
          <div className="space-y-1">
            {["Background", "Panel 01", "Character A", "FX Overlay", "Dialogue"].map((layer, i) => (
              <div key={layer} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-neutral-800/50 cursor-pointer">
                <Eye className="h-3 w-3 text-neutral-400 hover:text-white" />
                <Lock className="h-3 w-3 text-neutral-600 hover:text-white" />
                <span className="text-[10px] text-white font-mono flex-1">{layer}</span>
                <span className="text-[8px] text-neutral-500 font-mono">L{i + 1}</span>
              </div>
            ))}
          </div>
        </>
      ),
    },
  ];

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ background: "rgba(10,8,20,0.97)", borderLeft: "1px solid rgba(139,92,246,0.1)" }}
    >
      {/* Inspector Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800/60 shrink-0">
        <span className="text-[10px] font-mono font-bold text-neutral-300 uppercase tracking-widest">Inspector</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setLocked((v) => !v)}
            title={locked ? "Unlock" : "Lock"}
            className="p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <Lock className={`h-3 w-3 ${locked ? "text-amber-400" : "text-neutral-500"}`} />
          </button>
          <button title="Reset All" className="p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer">
            <RotateCcw className="h-3 w-3 text-neutral-500" />
          </button>
          <button
            onClick={() => setVisible((v) => !v)}
            className="p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            {visible ? <Eye className="h-3 w-3 text-neutral-500" /> : <EyeOff className="h-3 w-3 text-neutral-500" />}
          </button>
        </div>
      </div>

      {/* No selection empty state */}
      {!visible && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center p-4">
          <ZoomIn className="h-6 w-6 text-neutral-600" />
          <p className="text-[10px] font-mono text-neutral-500">Select a layer<br />to inspect its properties</p>
        </div>
      )}

      {/* Sections */}
      {visible && (
        <div className="flex-1 overflow-y-auto">
          {sections.map((s) => (
            <Section key={s.id} section={s} />
          ))}
        </div>
      )}
    </div>
  );
};
