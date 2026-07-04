import React, { useState } from "react";
import { saveAs } from "file-saver";
import { buildZipBlobFromUrls } from "./useLiveScraperZip.js";

interface UseLiveScraperActionsProps {
  scrapedImages: string[];
  selectedScraped: string[];
  setSelectedScraped: React.Dispatch<React.SetStateAction<string[]>>;
  setScrapedImages: React.Dispatch<React.SetStateAction<string[]>>;
  setConsoleLogs: React.Dispatch<React.SetStateAction<any[]>>;
  addPanelsToStoryboard: (
    urls: string[],
    currentScrapedList?: string[],
    shouldScroll?: boolean
  ) => void;
  fetchWithInterceptor?: typeof fetch;
  addNotification?: (message: string, type: any) => void;
  audioFeedback?: any;
}

export function useLiveScraperActions({
  scrapedImages,
  selectedScraped,
  setSelectedScraped,
  setScrapedImages,
  setConsoleLogs,
  addPanelsToStoryboard,
  fetchWithInterceptor,
  addNotification,
  audioFeedback,
}: UseLiveScraperActionsProps) {
  const [isZipping, setIsZipping] = useState(false);
  const activeFetch = fetchWithInterceptor || fetch;

  const handleDownloadZip = async () => {
    const toDownload =
      selectedScraped.length > 0 ? selectedScraped : scrapedImages;

    if (toDownload.length === 0) {
      addNotification?.("No images to download.", "warning");
      return;
    }

    console.log(`[GUI] Starting ZIP download for ${toDownload.length} images`);
    addNotification?.(
      `Generating ZIP for ${toDownload.length} images...`,
      "info"
    );
    setIsZipping(true);

    try {
      const blobContent = await buildZipBlobFromUrls(toDownload, activeFetch);
      saveAs(blobContent, "webtoon_frames.zip");
      setConsoleLogs((prev) => [
        `[GUI] Successfully generated zip for ${toDownload.length} images`,
        ...prev,
      ]);
      addNotification?.("ZIP archive downloaded successfully!", "success");
    } catch (err: any) {
      console.error("Zip generation failed:", err);
      addNotification?.(
        `Failed to generate ZIP: ${err.message || err}`,
        "error"
      );
    } finally {
      setIsZipping(false);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedScraped.length === 0) {
      addNotification?.("No images selected to delete.", "warning");
      return;
    }

    setScrapedImages((prev) =>
      prev.filter((img) => !selectedScraped.includes(img))
    );
    setConsoleLogs((prev) => [
      `[GUI] Removed ${selectedScraped.length} images`,
      ...prev,
    ]);
    console.log(
      `[GUI] Removed ${selectedScraped.length} image(s) from scraped deck`
    );
    addNotification?.(
      `Removed ${selectedScraped.length} images from deck.`,
      "info"
    );
    setSelectedScraped([]);
  };

  const handleAddToStoryboard = () => {
    if (selectedScraped.length === 0) {
      addNotification?.("No images selected to add to timeline.", "warning");
      return;
    }

    console.log(`[GUI] Adding ${selectedScraped.length} image(s) to timeline`);
    addPanelsToStoryboard(selectedScraped);
    setSelectedScraped([]);
    audioFeedback?.playTick();
  };

  return {
    isZipping,
    handleDownloadZip,
    handleDeleteSelected,
    handleAddToStoryboard,
  };
}
