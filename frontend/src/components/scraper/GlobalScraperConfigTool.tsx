import React, { useState } from "react";
import { Download, Upload, Share2, Clipboard } from "lucide-react";

export function GlobalScraperConfigTool({ addNotification }: { addNotification?: (msg: string, type: any) => void }) {
  const [showTools, setShowTools] = useState(false);

  const exportGlobalConfig = () => {
    try {
      const crop = localStorage.getItem("crop_custom_presets");
      const bubble = localStorage.getItem("bubble_custom_presets");
      const globalConfig = {
        timestamp: new Date().toISOString(),
        presets: {
          crop: crop ? JSON.parse(crop) : null,
          bubble: bubble ? JSON.parse(bubble) : null,
        }
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(globalConfig, null, 2));
      const a = document.createElement("a");
      a.setAttribute("href", dataStr);
      a.setAttribute("download", `anivox_scraper_config_${new Date().getTime()}.json`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      addNotification?.("Global configuration exported successfully!", "success");
    } catch (err: any) {
      addNotification?.("Failed to export global config: " + err.message, "error");
    }
  };

  const copyToClipboard = () => {
    try {
      const cropRaw = localStorage.getItem("crop_custom_presets");
      const bubbleRaw = localStorage.getItem("bubble_custom_presets");
      const config = {
        crop: cropRaw ? JSON.parse(cropRaw) : null,
        bubble: bubbleRaw ? JSON.parse(bubbleRaw) : null,
      };
      navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      addNotification?.("Configuration copied to clipboard!", "info");
    } catch (err) {
      addNotification?.("Failed to copy configuration", "error");
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <div className={`absolute bottom-full right-0 mb-4 flex flex-col gap-2 transition-all duration-300 ${showTools ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
         <button onClick={exportGlobalConfig} className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-[10px] font-bold hover:bg-neutral-800 shadow-2xl">
            <Download className="h-3.5 w-3.5 text-indigo-400" />
            <span>Export Master Config</span>
         </button>
         <button onClick={copyToClipboard} className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-[10px] font-bold hover:bg-neutral-800 shadow-2xl">
            <Clipboard className="h-3.5 w-3.5 text-purple-400" />
            <span>Copy Settings JSON</span>
         </button>
      </div>

      <button
        onClick={() => setShowTools(!showTools)}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.3)] ${showTools ? 'bg-indigo-600 rotate-90' : 'bg-neutral-900 hover:bg-neutral-800'}`}>
        <Share2 className={`h-5 w-5 ${showTools ? 'text-white' : 'text-indigo-400'}`} />
      </button>
    </div>
  );
}
