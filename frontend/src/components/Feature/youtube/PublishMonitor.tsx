import React, { useState, useEffect, useRef } from "react";
import {
  Video,
  X,
  Upload,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  Youtube,
  CheckCircle2,
  ExternalLink,
  Calendar,
  Sparkles,
  Navigation,
} from "lucide-react";

interface PublishMonitorProps {
  activeVideoUrl: string | null;
  videoUrl: string | null;
  selectedFile: File | null;
  selectedThumbnail: File | null;
  thumbnailPreviewUrl: string | null;
  videoDuration: number | null;
  videoAspectRatio: string | null;
  isShort: boolean;
  privacy: string;
  publishLogs: string[];
  isPublishing: boolean;
  youtubeUrl: string | null;
  title: string;

  onClearSelectedFile: () => void;
  onClearThumbnail: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onThumbnailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onThumbnailSelect?: (url: string) => void;
  onPublish: () => void;

  isScheduled: boolean;
  setIsScheduled: (val: boolean) => void;
  scheduleDate: string;
  setScheduleDate: (val: string) => void;
  scheduleTime: string;
  setScheduleTime: (val: string) => void;
}

export default function PublishMonitor({
  activeVideoUrl,
  videoUrl,
  selectedFile,
  selectedThumbnail,
  thumbnailPreviewUrl,
  videoDuration,
  videoAspectRatio,
  isShort,
  privacy,
  publishLogs,
  isPublishing,
  youtubeUrl,
  title,
  onClearSelectedFile,
  onClearThumbnail,
  onFileChange,
  onThumbnailChange,
  onThumbnailSelect,
  onPublish,
  isScheduled,
  setIsScheduled,
  scheduleDate,
  setScheduleDate,
  scheduleTime,
  setScheduleTime,
}: PublishMonitorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // Clickbait thumbnail text overlay state
  const [clickbaitText, setClickbaitText] = useState("");
  const [suggestedSlogans, setSuggestedSlogans] = useState<string[]>([]);

  // Custom Slogan style customization states
  const [fontSize, setFontSize] = useState(24);
  const [textColor, setTextColor] = useState("#FFFF00");
  const [textPosition, setTextPosition] = useState(75);
  const [textAngle, setTextAngle] = useState(-5);
  const [outlineSize, setOutlineSize] = useState(2);
  const [fontFamily, setFontFamily] = useState(
    "Impact, Arial Black, sans-serif"
  );
  const [useBackgroundBox, setUseBackgroundBox] = useState(false);
  const [backgroundBoxColor, setBackgroundBoxColor] =
    useState("rgba(0,0,0,0.85)");
  const [showStyleControls, setShowStyleControls] = useState(false);

  // Thumbnail frame/filter/arrow customization states
  const [frameColor, setFrameColor] = useState("none");
  const [frameWidth, setFrameWidth] = useState(4);
  const [saturationFilter, setSaturationFilter] = useState(100); // 100% to 180%
  const [brightnessFilter, setBrightnessFilter] = useState(100); // 100% to 130%
  const [showArrow, setShowArrow] = useState(false);
  const [arrowAngle, setArrowAngle] = useState(45);
  const [arrowLeft, setArrowLeft] = useState(30);
  const [arrowTop, setArrowTop] = useState(30);
  const [arrowSize, setArrowSize] = useState(50);
  const [showFilterControls, setShowFilterControls] = useState(false);

  // Fetch project thumbnails from localStorage
  const [projectThumbnails, setProjectThumbnails] = useState<string[]>([]);
  useEffect(() => {
    if (title) {
      const saved = JSON.parse(
        localStorage.getItem(`project_thumbnails_${title}`) || "[]"
      );
      setProjectThumbnails(saved);
    }
  }, [title]);

  // Generate clickbait slogans based on title
  const handleGenerateSlogans = () => {
    const defaultSlogans = [
      "OVERPOWERED!",
      "LEVEL UP!",
      "SECRET S-RANK!",
      "REBORN!",
      "S-RANK RECAP!",
    ];
    if (!title.trim()) {
      setSuggestedSlogans(defaultSlogans.slice(0, 3));
      return;
    }
    const words = title
      .split(" ")
      .map((w) => w.toUpperCase().replace(/[^A-Z]/g, ""));
    const keywords = words.filter(
      (w) =>
        w.length > 3 &&
        !["WITH", "THAT", "THIS", "SOME", "RECAP", "CHAPTER"].includes(w)
    );

    const suggested = [
      keywords.length > 0 ? `${keywords[0]}!` : "OVERPOWERED!",
      keywords.length > 1 ? `${keywords[0]} ${keywords[1]}!` : "LEVEL UP!",
      keywords.length > 0 ? `SECRET ${keywords[0]}!` : "SECRET S-RANK!",
    ];
    setSuggestedSlogans(suggested);
  };

  useEffect(() => {
    if (title) {
      handleGenerateSlogans();
    }
  }, [title]);

  const isTooLongForShort = isShort && videoDuration && videoDuration > 60;
  const isWrongRatioForShort =
    isShort && videoAspectRatio && videoAspectRatio !== "9:16";

  return (
    <div className="bg-neutral-950/40 backdrop-blur-md border border-neutral-900 rounded-3xl p-6 space-y-5 animate-fade-in transition-all duration-300 hover:border-neutral-800/80">
      <h3 className="text-xs font-bold text-neutral-300 tracking-wider uppercase font-mono flex items-center gap-1.5 justify-between border-b border-neutral-900 pb-3">
        <span className="flex items-center gap-2">
          <Video className="h-4.5 w-4.5 text-purple-400" />
          Active Media Monitor
        </span>
        {selectedFile && (
          <button
            onClick={onClearSelectedFile}
            className="text-[10px] font-mono font-bold text-rose-400 hover:text-rose-300 flex items-center gap-0.5 cursor-pointer bg-rose-950/20 px-2.5 py-1 rounded-lg border border-red-900/30 transition-all duration-200"
          >
            <X className="h-3 w-3" />
            Clear File
          </button>
        )}
      </h3>

      {/* Video Player or Drag & Drop Uploader */}
      {activeVideoUrl ? (
        <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-neutral-900 group">
          <video
            src={activeVideoUrl}
            controls
            className="w-full h-full object-contain"
            key={activeVideoUrl}
          />
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="aspect-video bg-neutral-955/20 hover:bg-neutral-955/40 border-2 border-dashed border-neutral-850 hover:border-purple-500/50 rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-300 space-y-2 group shadow-inner"
        >
          <div className="p-3.5 bg-neutral-950 rounded-2xl border border-neutral-900 text-neutral-500 group-hover:text-purple-400 group-hover:border-purple-500/30 transition-all duration-300">
            <Upload className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <div className="text-[11px] font-bold text-white font-mono">
              Upload a Video
            </div>
            <div className="text-[10px] text-neutral-500 font-mono">
              Drag & drop or click to select file
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        accept="video/*"
        className="hidden"
      />

      {/* Custom Thumbnail Picker & Preview with Custom Overlay Frame, Filters, Slogan, and Pointer Arrow */}
      <div className="border-t border-neutral-905 pt-4.5 space-y-4">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-neutral-300 font-bold flex items-center gap-2">
            <ImageIcon className="h-4.5 w-4.5 text-purple-400" />
            Custom Video Thumbnail
          </span>
          {selectedThumbnail && (
            <button
              onClick={onClearThumbnail}
              className="text-[10px] text-red-400 hover:text-red-300 font-mono font-bold flex items-center gap-0.5 cursor-pointer"
            >
              Clear Image
            </button>
          )}
        </div>

        {thumbnailPreviewUrl ? (
          <div
            className="relative aspect-video rounded-2xl bg-black overflow-hidden border border-neutral-900 group transition-all duration-300 shadow-md"
            style={{
              border:
                frameColor !== "none"
                  ? `${frameWidth}px solid ${frameColor}`
                  : undefined,
            }}
          >
            {/* Thumbnail Image with filters */}
            <img
              src={thumbnailPreviewUrl}
              alt="Custom Thumbnail"
              className="w-full h-full object-cover"
              style={{
                filter: `saturate(${saturationFilter}%) brightness(${brightnessFilter}%)`,
              }}
            />

            {/* Clickbait Slogan text overlay */}
            {clickbaitText && (
              <div
                className="absolute inset-x-4 pointer-events-none select-none text-center font-black uppercase italic tracking-wider transition-all duration-150 z-20"
                style={{
                  top: `${textPosition}%`,
                  transform: `translateY(-50%) rotate(${textAngle}deg)`,
                  color: textColor,
                  fontSize: `${fontSize}px`,
                  fontFamily: fontFamily,
                  lineHeight: "1.1",
                  textShadow: `-${outlineSize}px -${outlineSize}px 0 #000, ${outlineSize}px -${outlineSize}px 0 #000, -${outlineSize}px ${outlineSize}px 0 #000, ${outlineSize}px ${outlineSize}px 0 #000, 0 4px 10px rgba(0,0,0,0.95)`,
                  ...(useBackgroundBox
                    ? {
                        backgroundColor: backgroundBoxColor,
                        padding: "6px 12px",
                        borderRadius: "6px",
                        display: "inline-block",
                        boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
                        left: "50%",
                        transform: `translate(-50%, -50%) rotate(${textAngle}deg)`,
                        width: "auto",
                        maxWidth: "90%",
                      }
                    : {}),
                }}
              >
                {clickbaitText}
              </div>
            )}

            {/* Clickbait Pointer Red Arrow Overlay */}
            {showArrow && (
              <div
                className="absolute pointer-events-none select-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] z-10"
                style={{
                  left: `${arrowLeft}%`,
                  top: `${arrowTop}%`,
                  width: `${arrowSize}px`,
                  height: `${arrowSize}px`,
                  transform: `translate(-50%, -50%) rotate(${arrowAngle}deg)`,
                }}
              >
                {/* Custom Curved Clickbait Red Arrow SVG */}
                <svg
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full"
                >
                  <path
                    d="M10 90C30 70 45 40 80 35M80 35L60 25M80 35L75 55"
                    stroke="#FF0000"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 90C30 70 45 40 80 35M80 35L60 25M80 35L75 55"
                    stroke="#FFFFFF"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}

            <div
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200 cursor-pointer z-30"
              onClick={() => thumbnailInputRef.current?.click()}
            >
              <Upload className="h-6 w-6 text-white animate-bounce" />
            </div>
          </div>
        ) : (
          <div
            onClick={() => thumbnailInputRef.current?.click()}
            className="py-8 rounded-2xl bg-neutral-955/20 hover:bg-neutral-955/40 border border-neutral-900 hover:border-purple-500/40 cursor-pointer flex flex-col items-center justify-center space-y-1.5 transition-all duration-300 text-center group shadow-inner"
          >
            <Upload className="h-4.5 w-4.5 text-neutral-500 group-hover:text-purple-400 transition-colors duration-300" />
            <span className="text-[10px] font-mono text-neutral-450">
              Click to upload custom Thumbnail (.jpg, .png)
            </span>
          </div>
        )}

        {/* Project AI Thumbnails Carousel */}
        {projectThumbnails.length > 0 && !selectedThumbnail && (
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-mono text-neutral-500 uppercase flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              Generated AI Thumbnails
            </span>
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin pr-1">
              {projectThumbnails.map((url, idx) => (
                <div
                  key={idx}
                  onClick={() => onThumbnailSelect?.(url)}
                  className={`relative min-w-[120px] aspect-video bg-neutral-950 rounded-xl border overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-95 ${
                    thumbnailPreviewUrl === url
                      ? "border-purple-500 ring-1 ring-purple-500/30"
                      : "border-neutral-900 hover:border-neutral-700"
                  }`}
                >
                  <img
                    src={url}
                    alt={`AI Thumbnail ${idx}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <input
          type="file"
          ref={thumbnailInputRef}
          onChange={onThumbnailChange}
          accept="image/*"
          className="hidden"
        />

        {/* Thumbnail Clickbait Overlay Editor tools */}
        {thumbnailPreviewUrl && (
          <div className="p-4 bg-neutral-950/40 backdrop-blur-sm rounded-2xl border border-neutral-900 space-y-4 font-mono text-[11px] text-neutral-450 animate-slide-down">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-2.5">
              <span className="text-neutral-200 font-bold flex items-center gap-1.5">
                🎨 CTR Customizer Suite
              </span>
              <button
                onClick={handleGenerateSlogans}
                className="text-[9.5px] text-purple-400 hover:text-purple-300 flex items-center gap-0.5 cursor-pointer bg-purple-950/20 px-2.5 py-1 rounded-lg border border-purple-900/30 transition-all hover:bg-purple-900/10"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Suggestions
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-neutral-500 font-bold">QUICK SLOGANS:</span>
              <div className="flex flex-wrap gap-1.5">
                {suggestedSlogans.map((s) => (
                  <button
                    key={s}
                    onClick={() => setClickbaitText(s)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition-all duration-200 ${
                      clickbaitText === s
                        ? "bg-purple-950/40 border-purple-500 text-purple-300"
                        : "bg-neutral-900 border-neutral-850 text-neutral-400 hover:text-white hover:bg-neutral-800"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={clickbaitText}
                onChange={(e) => setClickbaitText(e.target.value)}
                placeholder="Or type custom slogan..."
                className="flex-1 bg-neutral-955/30 border border-neutral-900 focus:border-purple-500/50 rounded-xl px-3.5 py-2 text-[11px] text-white outline-none shadow-inner"
              />
              {clickbaitText && (
                <button
                  onClick={() => setClickbaitText("")}
                  className="px-3 bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 text-neutral-400 rounded-xl cursor-pointer transition-colors duration-200"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Visual Customization Toggles */}
            <div className="flex gap-2.5 border-t border-neutral-900 pt-3">
              <button
                onClick={() => {
                  setShowStyleControls(!showStyleControls);
                  setShowFilterControls(false);
                }}
                className={`flex-1 py-1.5 rounded-xl border text-center transition-colors duration-250 cursor-pointer ${
                  showStyleControls
                    ? "bg-purple-950/40 border-purple-800 text-purple-300"
                    : "bg-neutral-900/40 border-neutral-855"
                }`}
              >
                Text Slogan Styles
              </button>
              <button
                onClick={() => {
                  setShowFilterControls(!showFilterControls);
                  setShowStyleControls(false);
                }}
                className={`flex-1 py-1.5 rounded-xl border text-center transition-colors duration-250 cursor-pointer ${
                  showFilterControls
                    ? "bg-purple-950/40 border-purple-800 text-purple-300"
                    : "bg-neutral-900/40 border-neutral-855"
                }`}
              >
                Filters & Arrow
              </button>
            </div>

            {/* Tab 1: Slogan Text Customization Controls */}
            {showStyleControls && clickbaitText && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10.5px] animate-slide-down">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-neutral-550">
                    <span>FONT SIZE:</span>
                    <span className="text-white font-bold">{fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="48"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-full accent-purple-500 bg-neutral-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-neutral-555">
                    <span>TILT TENSION:</span>
                    <span className="text-white font-bold">{textAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min="-30"
                    max="30"
                    value={textAngle}
                    onChange={(e) => setTextAngle(parseInt(e.target.value))}
                    className="w-full accent-purple-500 bg-neutral-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-neutral-555">
                    <span>HEIGHT POS:</span>
                    <span className="text-white font-bold">
                      {textPosition}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={textPosition}
                    onChange={(e) => setTextPosition(parseInt(e.target.value))}
                    className="w-full accent-purple-500 bg-neutral-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-neutral-555">
                    <span>OUTLINE STROKE:</span>
                    <span className="text-white font-bold">
                      {outlineSize}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={outlineSize}
                    onChange={(e) => setOutlineSize(parseInt(e.target.value))}
                    className="w-full accent-purple-500 bg-neutral-900"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <span className="text-neutral-500 block font-bold">FONT STYLE:</span>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full bg-neutral-955/40 border border-neutral-900 rounded-xl px-3 py-2 text-[10.5px] text-neutral-300 focus:outline-none cursor-pointer"
                  >
                    <option value="Impact, Arial Black, sans-serif" className="bg-neutral-950">
                      Impact (YouTube Classic)
                    </option>
                    <option value="'Montserrat', sans-serif font-black" className="bg-neutral-950">
                      Montserrat Black
                    </option>
                    <option value="'Bungee', sans-serif" className="bg-neutral-950">Bungee Bold</option>
                    <option value="'Comic Sans MS', cursive" className="bg-neutral-950">
                      Comic Meme Style
                    </option>
                  </select>
                </div>

                <div className="md:col-span-2 border-t border-neutral-900 pt-3 flex justify-between items-center flex-wrap gap-2">
                  <div className="flex gap-2.5 items-center">
                    <span className="text-neutral-500 font-bold">
                      TEXT COLOR:
                    </span>
                    <div className="flex gap-1.5">
                      {[
                        "#FFFF00",
                        "#FFFFFF",
                        "#FF0000",
                        "#00FF00",
                        "#00FFFF",
                        "#FF00FF",
                      ].map((c) => (
                        <button
                          key={c}
                          onClick={() => setTextColor(c)}
                          className={`h-4 w-4 rounded-full border cursor-pointer transition-transform hover:scale-110 ${
                            textColor === c
                              ? "border-white ring-1 ring-purple-500"
                              : "border-neutral-900"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500 font-bold">BG BOX:</span>
                    <button
                      onClick={() => setUseBackgroundBox(!useBackgroundBox)}
                      className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold border cursor-pointer transition-colors ${
                        useBackgroundBox
                          ? "bg-purple-950/40 border-purple-850 text-purple-300"
                          : "bg-neutral-900 border-neutral-850"
                      }`}
                    >
                      {useBackgroundBox ? "ACTIVE" : "INACTIVE"}
                    </button>

                    {useBackgroundBox && (
                      <div className="flex gap-1.5 pl-2 border-l border-neutral-900">
                        {[
                          "rgba(0,0,0,0.85)",
                          "rgba(255,0,0,0.85)",
                          "rgba(0,0,0,0.4)",
                        ].map((c) => (
                          <button
                            key={c}
                            onClick={() => setBackgroundBoxColor(c)}
                            className={`h-3.5 w-3.5 rounded border cursor-pointer ${
                              backgroundBoxColor === c
                                ? "border-white ring-1 ring-purple-500"
                                : "border-neutral-900"
                            }`}
                            style={{
                              backgroundColor: c.includes("255")
                                ? "red"
                                : "black",
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Visual Frame Border / Color Filters / Red Pointer Arrow Controls */}
            {showFilterControls && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10.5px] animate-slide-down border-t border-neutral-900 pt-3">
                {/* Visual Filters */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-neutral-550">
                    <span>SATURATION POP:</span>
                    <span className="text-white font-bold">
                      {saturationFilter - 100}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="180"
                    value={saturationFilter}
                    onChange={(e) =>
                      setSaturationFilter(parseInt(e.target.value))
                    }
                    className="w-full accent-purple-500 bg-neutral-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-neutral-555">
                    <span>BRIGHTNESS:</span>
                    <span className="text-white font-bold">
                      {brightnessFilter}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="90"
                    max="135"
                    value={brightnessFilter}
                    onChange={(e) =>
                      setBrightnessFilter(parseInt(e.target.value))
                    }
                    className="w-full accent-purple-500 bg-neutral-900"
                  />
                </div>

                {/* Custom Border Frame */}
                <div className="space-y-1.5 md:col-span-2 flex justify-between items-center border-b border-neutral-900 pb-3">
                  <div className="flex gap-2.5 items-center">
                    <span className="text-neutral-500 font-bold">
                      BORDER FRAME:
                    </span>
                    <div className="flex gap-1.5">
                      {["none", "#FF0000", "#FFFF00", "#FF00FF", "#00FF00"].map(
                        (c) => (
                          <button
                            key={c}
                            onClick={() => setFrameColor(c)}
                            className={`h-4 w-4 rounded-xl border cursor-pointer ${
                              frameColor === c
                                ? "border-white ring-1 ring-purple-500"
                                : "border-neutral-900"
                            } ${
                              c === "none"
                                ? "bg-neutral-950 text-[9px] flex items-center justify-center font-bold text-neutral-500"
                                : ""
                            }`}
                            style={{
                              backgroundColor: c !== "none" ? c : undefined,
                            }}
                          >
                            {c === "none" ? "X" : ""}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {frameColor !== "none" && (
                    <div className="flex gap-2 items-center font-mono">
                      <span className="text-neutral-500 font-bold">WIDTH:</span>
                      <select
                        value={frameWidth}
                        onChange={(e) =>
                          setFrameWidth(parseInt(e.target.value))
                        }
                        className="bg-neutral-900 border border-neutral-850 rounded-lg px-2 py-1 text-[10px] text-white cursor-pointer"
                      >
                        <option value="2">2px</option>
                        <option value="4">4px</option>
                        <option value="6">6px</option>
                        <option value="8">8px</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Clickbait Pointer Red Arrow Toggles */}
                <div className="space-y-2.5 md:col-span-2">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-205 font-bold flex items-center gap-1.5">
                      <Navigation className="h-4 w-4 text-purple-405 rotate-45" />
                      Clickbait Red Pointer Arrow
                    </span>
                    <button
                      onClick={() => setShowArrow(!showArrow)}
                      className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold border cursor-pointer transition-colors ${
                        showArrow
                          ? "bg-purple-950/40 border-purple-850 text-purple-300"
                          : "bg-neutral-900 border-neutral-850"
                      }`}
                    >
                      {showArrow ? "VISIBLE" : "HIDDEN"}
                    </button>
                  </div>

                  {showArrow && (
                    <div className="grid grid-cols-2 gap-4 pt-1.5 animate-slide-down">
                      {/* Arrow Pos X */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-neutral-555">
                          <span>HORIZONTAL (X):</span>
                          <span className="text-white font-bold">
                            {arrowLeft}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="90"
                          value={arrowLeft}
                          onChange={(e) =>
                            setArrowLeft(parseInt(e.target.value))
                          }
                          className="w-full accent-purple-500 bg-neutral-900"
                        />
                      </div>

                      {/* Arrow Pos Y */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-neutral-555">
                          <span>VERTICAL (Y):</span>
                          <span className="text-white font-bold">
                            {arrowTop}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="90"
                          value={arrowTop}
                          onChange={(e) =>
                            setArrowTop(parseInt(e.target.value))
                          }
                          className="w-full accent-purple-500 bg-neutral-900"
                        />
                      </div>

                      {/* Arrow size */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-neutral-555">
                          <span>ARROW SIZE:</span>
                          <span className="text-white font-bold">
                            {arrowSize}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="30"
                          max="90"
                          value={arrowSize}
                          onChange={(e) =>
                            setArrowSize(parseInt(e.target.value))
                          }
                          className="w-full accent-purple-500 bg-neutral-900"
                        />
                      </div>

                      {/* Arrow angle */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-neutral-555">
                          <span>ROTATION ANGLE:</span>
                          <span className="text-white font-bold">
                            {arrowAngle}°
                          </span>
                        </div>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          value={arrowAngle}
                          onChange={(e) =>
                            setArrowAngle(parseInt(e.target.value))
                          }
                          className="w-full accent-purple-500 bg-neutral-900"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scheduling publishing inputs (visible if Unlisted or Private) */}
      {(privacy === "unlisted" || privacy === "private") && (
        <div className="p-4 bg-neutral-950/20 backdrop-blur-sm border border-neutral-900 rounded-2xl space-y-3.5 animate-slide-down">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-neutral-200 font-bold font-mono text-[11px]">
              <Calendar className="h-4.5 w-4.5 text-purple-400" />
              Schedule Publishing Date
            </span>
            <button
              onClick={() => setIsScheduled(!isScheduled)}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-all duration-300 shrink-0 ${
                isScheduled ? "bg-purple-650" : "bg-neutral-800"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform duration-300 ${
                  isScheduled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {isScheduled && (
            <div className="grid grid-cols-2 gap-3.5 pt-1.5 animate-slide-down">
              <div className="space-y-1.5">
                <span className="text-[10px] text-neutral-500 font-bold block uppercase">
                  DATE
                </span>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full bg-neutral-955/40 border border-neutral-900 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none shadow-inner"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] text-neutral-500 font-bold block uppercase">
                  TIME
                </span>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full bg-neutral-955/40 border border-neutral-900 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none shadow-inner"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Video properties diagnostics */}
      {activeVideoUrl && (
        <div className="bg-neutral-950/20 backdrop-blur-sm p-4 rounded-2xl border border-neutral-900 text-[11px] font-mono space-y-2.5 text-neutral-400 animate-fade-in shadow-inner">
          <div className="flex items-center justify-between border-b border-neutral-900/60 pb-2">
            <span className="text-neutral-500 font-bold">Source Mode:</span>
            <span className="font-bold text-neutral-300">
              {selectedFile ? "Local File Upload" : "Workspace Compiled Video"}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-neutral-900/60 pb-2">
            <span className="text-neutral-500 font-bold">Estimated Duration:</span>
            <span className="font-bold text-neutral-300">
              {videoDuration
                ? `${videoDuration.toFixed(1)}s`
                : "Calculating..."}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-neutral-900/60 pb-2">
            <span className="text-neutral-500 font-bold">Layout Aspect Ratio:</span>
            <span className="font-bold text-neutral-300">
              {videoAspectRatio || "Detecting..."}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500 font-bold">Output Mode:</span>
            <span
              className={`font-bold px-2.5 py-0.5 rounded-lg text-[10px] ${
                isShort
                  ? "bg-red-950/25 text-red-400 border border-red-900/30"
                  : "bg-purple-950/20 text-purple-400 border border-purple-900/30"
              }`}
            >
              {isShort ? "SHORTS" : "REGULAR VIDEO"}
            </span>
          </div>
        </div>
      )}

      {/* Shorts validation alerts */}
      {isShort &&
        activeVideoUrl &&
        (isTooLongForShort || isWrongRatioForShort) && (
          <div className="p-3.5 bg-amber-955/10 border border-amber-900/30 rounded-2xl flex items-start gap-2.5 animate-pulse">
            <AlertCircle className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-amber-300 font-mono">
                Shorts Compliance Warning
              </div>
              <ul className="list-disc pl-4 text-[10px] text-neutral-450 leading-relaxed space-y-0.5 font-mono">
                {isTooLongForShort && (
                  <li>
                    YouTube Shorts must be under 60 seconds (Current:{" "}
                    {videoDuration?.toFixed(1)}s).
                  </li>
                )}
                {isWrongRatioForShort && (
                  <li>
                    YouTube Shorts require a vertical aspect ratio (9:16)
                    (Current: {videoAspectRatio}).
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

      {/* Log Output Window */}
      {publishLogs.length > 0 && (
        <div className="bg-neutral-950/60 backdrop-blur-sm rounded-2xl p-4 border border-neutral-900 font-mono text-[10px] space-y-2 max-h-[160px] overflow-y-auto scrollbar-thin shadow-inner pr-1">
          <div className="text-neutral-500 border-b border-neutral-900/60 pb-1.5 flex justify-between">
            <span>Publish Process Monitor</span>
            {isPublishing && (
              <span className="animate-pulse text-purple-400 font-bold">ACTIVE</span>
            )}
          </div>
          {publishLogs.map((log, idx) => {
            let logColor = "text-neutral-400";
            if (log.startsWith("❌")) logColor = "text-red-400 font-bold";
            else if (log.startsWith("🎉") || log.startsWith("[4/4]"))
              logColor = "text-emerald-400 font-semibold";
            else if (log.startsWith("[AI]")) logColor = "text-purple-400";
            else if (log.startsWith("[File]")) logColor = "text-blue-400";
            else if (log.startsWith("[Thumbnail]"))
              logColor = "text-teal-400 font-medium";
            else if (log.startsWith("[Chapters]")) logColor = "text-orange-400";
            return (
              <div key={idx} className={`${logColor} leading-relaxed`}>
                {log}
              </div>
            );
          })}
        </div>
      )}

      {/* Final Publish Button */}
      {!youtubeUrl ? (
        <button
          onClick={onPublish}
          disabled={
            isPublishing ||
            !activeVideoUrl ||
            !title.trim() ||
            isTooLongForShort === true
          }
          className={`w-full text-white font-bold text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all select-none border font-mono ${
            isPublishing ||
            !activeVideoUrl ||
            !title.trim() ||
            isTooLongForShort === true
              ? "bg-neutral-900 border-neutral-850 text-neutral-500 cursor-not-allowed opacity-60"
              : "bg-[#FF0000] hover:bg-[#E60000] border-[#FF0000]/50 shadow-lg shadow-red-950/20 cursor-pointer active:scale-98"
          }`}
        >
          {isPublishing ? (
            <>
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
              <span>Transmitting to YouTube API...</span>
            </>
          ) : (
            <>
              <Youtube className="h-5 w-5" />
              <span>Publish Video to Channel</span>
            </>
          )}
        </button>
      ) : (
        <div className="space-y-4 pt-1">
          <div className="p-4 bg-emerald-950/10 border border-emerald-900/30 rounded-2xl flex items-center gap-2.5">
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
            <span className="text-[11px] font-mono font-bold text-emerald-300">
              Video Upload Successfully Initiated!
            </span>
          </div>
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer select-none border border-emerald-500/50 shadow-lg shadow-emerald-950/20 font-mono active:scale-98"
          >
            <ExternalLink className="h-5 w-5" />
            <span>View Video on YouTube</span>
          </a>
        </div>
      )}
    </div>
  );
}
