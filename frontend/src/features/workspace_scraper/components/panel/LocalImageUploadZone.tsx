import React from "react";
import { UploadCloud, Trash2, Plus } from "lucide-react";

export interface LocalImageUploadZoneProps {
  selectedFiles: File[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  onUploadImages?: (files: FileList | File[]) => void;
  addNotification: (
    message: string,
    type: "error" | "info" | "success" | "warning"
  ) => void;
}

export const LocalImageUploadZone: React.FC<LocalImageUploadZoneProps> = ({
  selectedFiles,
  setSelectedFiles,
  onUploadImages,
  addNotification,
}) => {
  const [isDraggingOver, setIsDraggingOver] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files).filter((f) =>
        f.type.startsWith("image/")
      );
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const handleDropFiles = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (filesArray.length > 0) {
        setSelectedFiles((prev) => [...prev, ...filesArray]);
      }
    }
  };

  const handleExecuteUpload = () => {
    if (selectedFiles.length === 0) {
      addNotification("Please select or drop image files first.", "error");
      return;
    }
    if (onUploadImages) {
      onUploadImages(selectedFiles);
      setSelectedFiles([]);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDropFiles}
        className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
          isDraggingOver
            ? "border-purple-500 bg-purple-950/30 scale-[1.01]"
            : "border-neutral-800 hover:border-purple-500/50 bg-neutral-950/60 hover:bg-neutral-950"
        }`}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        />
        <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mb-3 text-purple-400">
          <UploadCloud className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-white mb-1 font-sans">
          Drag & drop your images here, or{" "}
          <span className="text-purple-400 underline">click to browse</span>
        </h3>
        <p className="text-xs text-neutral-400 max-w-md font-sans">
          Supports PNG, JPG, JPEG, WEBP, GIF, and SVG files. Multiple files
          allowed.
        </p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-3 bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-300">
              Selected Images ({selectedFiles.length})
            </span>
            <button
              type="button"
              onClick={() => setSelectedFiles([])}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-80 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-purple-600/50 scrollbar-track-neutral-900 rounded-xl">
            {selectedFiles.map((file, idx) => {
              const objectUrl = URL.createObjectURL(file);
              return (
                <div
                  key={idx}
                  className="relative group rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 aspect-square"
                >
                  <img
                    src={objectUrl}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFiles((prev) =>
                        prev.filter((_, i) => i !== idx)
                      );
                    }}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                  >
                    ✕
                  </button>
                  <div className="absolute bottom-0 inset-x-0 bg-black/80 px-1.5 py-0.5 text-[9px] text-neutral-300 truncate font-mono">
                    {file.name}
                  </div>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={handleExecuteUpload}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-98 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Import {selectedFiles.length} Image(s)
            into Imported Assets
          </button>
        </div>
      )}
    </div>
  );
};
