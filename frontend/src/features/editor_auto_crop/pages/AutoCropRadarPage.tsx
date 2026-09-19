import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Compass,
  Layers,
  Sparkles,
  Sliders,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RefreshCw,
  Eye,
  Activity,
  BarChart3,
  Scissors,
  CheckCircle2,
  Download,
  Upload,
  Info,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { AutoCropMinimapRadar } from "../components/AutoCropMinimapRadar";
import { getProxiedImageUrl } from "@/shared/utils/imageProxy";

interface AutoCropRadarPageProps {
  onBack?: () => void;
  initialImageUrl?: string;
  initialPanels?: any[];
}

// Sample fallback comic strip data for live demonstration
const SAMPLE_IMAGE_URL =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop";

export const AutoCropRadarPage: React.FC<AutoCropRadarPageProps> = ({
  onBack,
  initialImageUrl,
  initialPanels,
}) => {
  const [imageUrl, setImageUrl] = useState<string>(
    initialImageUrl || SAMPLE_IMAGE_URL
  );
  const [totalWidth, setTotalWidth] = useState<number>(1200);
  const [totalHeight, setTotalHeight] = useState<number>(18000);
  const [selectedPanelIndex, setSelectedPanelIndex] = useState<number | null>(0);
  const [isRadarExpanded, setIsRadarExpanded] = useState<boolean>(true);
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [activeThemeName, setActiveThemeName] = useState<string>("emerald");

  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState<{
    scrollRatio: number;
    topPct: number;
    heightPct?: number;
  }>({
    scrollRatio: 0,
    topPct: 0,
    heightPct: 15,
  });

  // Generate 40 simulated panels if not provided
  const [panels, setPanels] = useState<any[]>(() => {
    if (initialPanels && initialPanels.length > 0) return initialPanels;
    const dummy: any[] = [];
    const panelCount = 40;
    const avgHeight = 18000 / panelCount;
    for (let i = 0; i < panelCount; i++) {
      dummy.push({
        id: `panel-${i + 1}`,
        x: 0,
        y: Math.round(i * avgHeight),
        width: 1200,
        height: Math.round(avgHeight - 15),
        confidence: +(0.85 + Math.random() * 0.14).toFixed(2),
      });
    }
    return dummy;
  });

  // Load natural image dimensions if real image
  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setTotalWidth(img.naturalWidth);
        setTotalHeight(Math.max(4000, img.naturalHeight));
      }
    };
    img.src = getProxiedImageUrl(imageUrl);
  }, [imageUrl]);

  // Handle scroll tracking
  const handleScroll = () => {
    if (!scrollViewportRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollViewportRef.current;
    const maxScroll = Math.max(1, scrollHeight - clientHeight);
    const scrollRatio = Math.max(0, Math.min(1, scrollTop / maxScroll));
    const topPct = (scrollTop / (scrollHeight || 1)) * 100;
    setScrollProgress({ scrollRatio, topPct });
  };

  const themePalettes: Record<string, any> = {
    emerald: {
      name: "Emerald Studio",
      hex: "#10b981",
      borderActive: "border-emerald-400",
      borderInactive: "border-emerald-500/40",
      badgeBg: "bg-emerald-500/30",
      ring: "ring-emerald-400",
      text: "text-emerald-400",
    },
    cyan: {
      name: "Cyber Cyan",
      hex: "#06b6d4",
      borderActive: "border-cyan-400",
      borderInactive: "border-cyan-500/40",
      badgeBg: "bg-cyan-500/30",
      ring: "ring-cyan-400",
      text: "text-cyan-400",
    },
    violet: {
      name: "Neon Violet",
      hex: "#8b5cf6",
      borderActive: "border-violet-400",
      borderInactive: "border-violet-500/40",
      badgeBg: "bg-violet-500/30",
      ring: "ring-violet-400",
      text: "text-violet-400",
    },
  };

  const activeTheme = themePalettes[activeThemeName] || themePalettes.emerald;

  // Jump to panel
  const scrollToPanel = (index: number) => {
    if (index < 0 || index >= panels.length || !scrollViewportRef.current) return;
    setSelectedPanelIndex(index);
    const panel = panels[index];
    const targetY = (panel.y / totalHeight) * scrollViewportRef.current.scrollHeight;
    scrollViewportRef.current.scrollTo({
      top: Math.max(0, targetY - 100),
      behavior: "smooth",
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-neutral-100 select-none overflow-hidden">
      {/* ── TOP NAV HEADER ── */}
      <header className="h-14 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-xl px-4 flex items-center justify-between shrink-0 z-40">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors !cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Compass className="h-4 w-4 animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                Auto-Crop Radar Studio
                <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-[10px] font-mono text-emerald-400 border border-neutral-700">
                  v2.5
                </span>
              </h1>
              <p className="text-[10px] text-neutral-400">
                Full-height comic navigator, slice telemetry & bird's-eye tracker
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Theme Selector */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-xl p-1 text-xs font-mono">
            {Object.keys(themePalettes).map((key) => (
              <button
                key={key}
                onClick={() => setActiveThemeName(key)}
                className={`px-2 py-0.5 rounded-lg capitalize transition-all !cursor-pointer ${
                  activeThemeName === key
                    ? "bg-neutral-800 text-white font-bold shadow-sm"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {key}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsRadarExpanded(!isRadarExpanded)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all !cursor-pointer ${
              isRadarExpanded
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            {isRadarExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span>{isRadarExpanded ? "Collapse Radar" : "Expand Radar"}</span>
          </button>
        </div>
      </header>

      {/* ── WORKSPACE BODY ── */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left Side: Main Comic Canvas Viewport */}
        <div
          ref={scrollViewportRef}
          onScroll={handleScroll}
          className="flex-1 h-full overflow-y-auto overflow-x-hidden relative bg-neutral-950/80 flex justify-center scroll-auto scrollbar-thin scrollbar-thumb-neutral-800"
        >
          <div
            style={{
              width: "100%",
              maxWidth: "850px",
              minHeight: `${totalHeight}px`,
              transform: `scale(${zoomScale})`,
              transformOrigin: "top center",
            }}
            className="relative transition-transform duration-100 my-6 shadow-2xl rounded-2xl overflow-hidden border border-neutral-800/80 bg-neutral-900"
          >
            {/* Comic Strip Image */}
            <img
              src={getProxiedImageUrl(imageUrl)}
              alt="Comic Canvas"
              className="w-full h-auto block select-none"
            />

            {/* Panel Overlays */}
            {panels.map((panel, idx) => {
              const topPct = ((panel.y ?? 0) / totalHeight) * 100;
              const heightPct = Math.max(0.5, ((panel.height ?? 200) / totalHeight) * 100);
              const isSelected = selectedPanelIndex === idx;

              return (
                <div
                  key={panel.id ?? idx}
                  style={{
                    top: `${topPct}%`,
                    height: `${heightPct}%`,
                  }}
                  onClick={() => scrollToPanel(idx)}
                  className={`absolute inset-x-0 border-y-2 cursor-pointer transition-all ${
                    isSelected
                      ? `${activeTheme.borderActive} ${activeTheme.badgeBg} ring-2 ${activeTheme.ring}/60 z-30 shadow-2xl`
                      : "border-white/20 hover:bg-emerald-500/10 hover:border-emerald-400/60 z-10"
                  }`}
                >
                  <span
                    className={`absolute left-2 top-2 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shadow-md ${
                      isSelected
                        ? "bg-emerald-400 text-black shadow-emerald-500/50"
                        : "bg-black/80 text-white border border-neutral-700"
                    }`}
                  >
                    #{idx + 1}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Floating Canvas Zoom Controls */}
          <div className="fixed bottom-6 left-6 z-40 bg-neutral-950/90 border border-neutral-800 rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl flex items-center gap-1 text-xs font-mono">
            <button
              onClick={() => setZoomScale((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 !cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="px-2 font-bold text-emerald-400">{Math.round(zoomScale * 100)}%</span>
            <button
              onClick={() => setZoomScale((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 !cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── EMBEDDED AUTOCROP MINIMAP RADAR ── */}
        <AutoCropMinimapRadar
          imageUrl={imageUrl}
          boxes={panels}
          totalWidth={totalWidth}
          totalHeight={totalHeight}
          selectedPanelIndex={selectedPanelIndex}
          onSelectPanel={scrollToPanel}
          scrollProgress={scrollProgress}
          scrollViewportRef={scrollViewportRef}
          activeTheme={activeTheme}
          isExpanded={isRadarExpanded}
          onToggleExpanded={() => setIsRadarExpanded(!isRadarExpanded)}
          className="absolute right-0 top-0 bottom-0 h-full z-30"
        />
      </div>
    </div>
  );
};

export default AutoCropRadarPage;
