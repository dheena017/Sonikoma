import React from "react";
import { RefreshCw, Layers } from "lucide-react";

interface Props {
  handleExecuteSave: () => void;
  isSavingEdit: boolean;
  selectedSliceId: string | null;
  slicesCount: number;
}

export const ImageEditorSidebarFooter: React.FC<Props> = ({
  handleExecuteSave,
  isSavingEdit,
  selectedSliceId,
  slicesCount,
}) => {
  return (
    <div className="p-4 border-t border-neutral-800/80 bg-neutral-950/90 shrink-0">
      <button
        type="button"
        onClick={handleExecuteSave}
        disabled={isSavingEdit}
        className={`w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl text-xs font-black tracking-widest uppercase transition-all shadow-[0_4px_14px_rgba(139,92,246,0.3)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.5)] active:scale-95 border cursor-pointer ${
          selectedSliceId
            ? "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white border-emerald-400/30"
            : "bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white border-purple-400/30"
        } disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {isSavingEdit ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Processing Cuts...</span>
          </>
        ) : (
          <>
            {selectedSliceId ? (
              <>
                <Layers className="h-4 w-4 text-emerald-200" />
                <span>Execute Selected Crop</span>
              </>
            ) : (
              <>
                <Layers className="h-4 w-4 text-purple-200" />
                <span>
                  {slicesCount > 0
                    ? `Execute ${slicesCount} Crops`
                    : "Save & Apply Changes"}
                </span>
              </>
            )}
          </>
        )}
      </button>
    </div>
  );
};

export default ImageEditorSidebarFooter;
