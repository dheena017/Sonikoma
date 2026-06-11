import React, { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface UseLiveScraperActionsProps {
  scrapedImages: string[];
  selectedScraped: string[];
  setSelectedScraped: React.Dispatch<React.SetStateAction<string[]>>;
  setScrapedImages: React.Dispatch<React.SetStateAction<string[]>>;
  setConsoleLogs: React.Dispatch<React.SetStateAction<string[]>>;
  addPanelsWithAutoAnalysis: (urls: string[], currentScrapedList?: string[], shouldScroll?: boolean) => void;
  fetchWithInterceptor?: typeof fetch;
  addNotification?: (message: string, type: any) => void;
}

export function useLiveScraperActions({
  scrapedImages,
  selectedScraped,
  setSelectedScraped,
  setScrapedImages,
  setConsoleLogs,
  addPanelsWithAutoAnalysis,
  fetchWithInterceptor,
  addNotification,
}: UseLiveScraperActionsProps) {
  const [isZipping, setIsZipping] = useState(false);
  const activeFetch = fetchWithInterceptor || fetch;

  const handleDownloadZip = async () => {
    const toDownload = selectedScraped.length > 0 ? selectedScraped : scrapedImages;
    if (toDownload.length === 0) {
      addNotification?.("No images to download.", "warning");
      return;
    }

    console.log(`[GUI] Starting ZIP download for ${toDownload.length} images`);
    addNotification?.(`Generating ZIP for ${toDownload.length} images...`, "info");
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("webtoon_frames");
      if (!folder) {
        setIsZipping(false);
        return;
      }

      for (let i = 0; i < toDownload.length; i++) {
        try {
          const url = toDownload[i];
          const res = await activeFetch(url);
          const blob = await res.blob();
          const filename = `webtoon_frame_${String(i + 1).padStart(3, "0")}.png`;
          folder.file(filename, blob);
        } catch (err) {
          console.error("Download failed for:", toDownload[i], err);
        }
      }

      const blobContent = await zip.generateAsync({ type: "blob" });
      saveAs(blobContent, "webtoon_frames.zip");
      setConsoleLogs((prev) => [
        `[GUI] Successfully generated zip for ${toDownload.length} images`,
        ...prev,
      ]);
      addNotification?.("ZIP archive downloaded successfully!", "success");
    } catch (err: any) {
      console.error("Zip generation failed:", err);
      addNotification?.(`Failed to generate ZIP: ${err.message || err}`, "error");
    } finally {
      setIsZipping(false);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedScraped.length === 0) {
      addNotification?.("No images selected to delete.", "warning");
      return;
    }
    setScrapedImages((prev) => prev.filter((img) => !selectedScraped.includes(img)));
    setConsoleLogs((prev) => [
      `[GUI] Removed ${selectedScraped.length} images`,
      ...prev,
    ]);
    console.log(`[GUI] Removed ${selectedScraped.length} image(s) from scraped deck`);
    addNotification?.(`Removed ${selectedScraped.length} images from deck.`, "info");
    setSelectedScraped([]);
  };

  const handleAddToCanvas = () => {
    if (selectedScraped.length === 0) {
      addNotification?.("No images selected to add to storyboard.", "warning");
      return;
    }
    console.log(`[GUI] Adding ${selectedScraped.length} image(s) to storyboard`);
    addPanelsWithAutoAnalysis(selectedScraped);
    setSelectedScraped([]);
  };

  return {
    isZipping,
    handleDownloadZip,
    handleDeleteSelected,
    handleAddToCanvas,
  };
}
