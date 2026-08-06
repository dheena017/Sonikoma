import React, { useState } from "react";
import { saveAs } from "file-saver";
import { buildZipBlobFromUrls } from "@/features/workspace_scraper/hooks/useLiveScraperZip";

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
  seriesTitle?: string;
  chapterNumber?: string;
  targetUrl?: string;
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
  seriesTitle,
  chapterNumber,
  targetUrl,
}: UseLiveScraperActionsProps) {
  const [isZipping, setIsZipping] = useState(false);
  const activeFetch = fetchWithInterceptor || fetch;

  const handleDownloadZip = async () => {
    const rawToDownload =
      selectedScraped.length > 0 ? selectedScraped : scrapedImages;

    if (rawToDownload.length === 0) {
      addNotification?.("No images to download.", "warning");
      return;
    }

    const toDownload = [...rawToDownload].sort(
      (a, b) => scrapedImages.indexOf(a) - scrapedImages.indexOf(b)
    );

    console.log(`[GUI] Starting ZIP download for ${toDownload.length} images`);
    addNotification?.(
      `Generating ZIP for ${toDownload.length} images...`,
      "info"
    );
    setIsZipping(true);

    try {
      const { blob, zipFilename } = await buildZipBlobFromUrls(
        toDownload,
        activeFetch,
        { seriesTitle, chapterNumber, targetUrl }
      );
      saveAs(blob, zipFilename);
      setConsoleLogs((prev) => [
        `[GUI] Successfully generated zip for ${toDownload.length} images (${zipFilename})`,
        ...prev,
      ]);
      addNotification?.(`ZIP archive (${zipFilename}) downloaded successfully!`, "success");
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
