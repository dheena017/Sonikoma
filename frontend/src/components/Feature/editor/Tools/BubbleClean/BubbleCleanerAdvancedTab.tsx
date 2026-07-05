import React, { useState } from "react";
import { BubbleCleanerSharedProps } from "../../scraper/tabTypes";
import { BubbleCleanerSensitivityControl } from "./BubbleCleanerSensitivityControl";
import { BubbleCleanerColorMode } from "./BubbleCleanerColorMode";
import { BubbleCleanerMaskControls } from "./BubbleCleanerMaskControls";
import { AutoCropJsonDebugger } from "../AutoCrop";

export function BubbleCleanerAdvancedTab(props: BubbleCleanerSharedProps) {
  const [sfxProtection, setSfxProtection] = useState(true);
  const [maskColor, setMaskColor] = useState("rgba(168, 85, 247, 0.45)");
  const [tolerance, setTolerance] = useState(15);

  const firstImageUrl =
    props.selectedScraped.length > 0
      ? props.selectedScraped[0]
      : props.scrapedImages.length > 0
      ? props.scrapedImages[0]
      : null;

  const jsonPayload = {
    method: props.eraseMethod,
    sensitivity: props.sensitivity,
    detection_style: props.detectionStyle,
    dilation: props.bubbleDilation,
    inpaint_radius: props.bubbleInpaintRadius,
    sfx_protection: sfxProtection,
    color_tolerance: tolerance,
  };

  return (
    <div className="space-y-5 animate-[fadeIn_0.2s_ease-out]">
      <div className="grid grid-cols-2 gap-4">
        <BubbleCleanerSensitivityControl
          sensitivity={props.sensitivity}
          setSensitivity={props.setSensitivity}
        />

        <label className="flex items-center gap-3.5 bg-neutral-950/40 border border-neutral-800 rounded-2xl px-5 py-4 cursor-pointer hover:bg-neutral-900 transition-all select-none">
          <input
            type="checkbox"
            checked={sfxProtection}
            onChange={(e) => setSfxProtection(e.target.checked)}
            className="accent-purple-500 h-4.5 w-4.5 rounded cursor-pointer"
          />
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-white">
              SFX & Face Detail Protection
            </span>
            <span className="text-[8.5px] text-neutral-500 leading-normal mt-0.5">
              Filters text stroke groupings intersecting complex illustration
              contours (eyes, screen tones) to protect character faces from
              distortions.
            </span>
          </div>
        </label>
      </div>

      <BubbleCleanerColorMode
        maskColor={maskColor}
        setMaskColor={setMaskColor}
        firstImageUrl={firstImageUrl}
        tolerance={tolerance}
        setTolerance={setTolerance}
      />

      <BubbleCleanerMaskControls
        bubbleDilation={props.bubbleDilation}
        setBubbleDilation={props.setBubbleDilation}
        bubbleInpaintRadius={props.bubbleInpaintRadius}
        setBubbleInpaintRadius={props.setBubbleInpaintRadius}
      />

      <AutoCropJsonDebugger payload={jsonPayload} />
    </div>
  );
}
