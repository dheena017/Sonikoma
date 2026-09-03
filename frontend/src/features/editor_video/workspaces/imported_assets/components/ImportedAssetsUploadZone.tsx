import React from "react";
import { UploadCloud } from "lucide-react";

export interface ImportedAssetsUploadZoneProps {
  onOpenBrowser?: () => void;
  isEmpty?: boolean;
}

export const ImportedAssetsUploadZone: React.FC<ImportedAssetsUploadZoneProps> = ({
  onOpenBrowser,
  isEmpty = false,
}) => {
  return (
    <div
      onClick={onOpenBrowser}
      className={`border-2 border-dashed border-[#3B82F6]/25 hover:border-[#3B82F6]/50 bg-purple-950/15 hover:bg-purple-950/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group ${
        isEmpty ? "my-6" : "mb-3"
      }`}
    >
      <div className="h-11 w-11 rounded-full bg-[#3B82F6]/15 border border-[#3B82F6]/30 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform ">
        <UploadCloud className="h-5 w-5 text-[#3B82F6]" />
      </div>
      <p className="text-xs font-bold text-white font-mono uppercase tracking-wider">
        Upload MP4 • PNG • JPG
      </p>
      <p className="text-[10px] text-neutral-400 font-mono mt-1">
        Drag & drop or click to browse files
      </p>
    </div>
  );
};

export default ImportedAssetsUploadZone;
