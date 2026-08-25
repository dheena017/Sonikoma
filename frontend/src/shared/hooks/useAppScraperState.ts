import { useState } from "react";

export function useAppScraperState() {
  const [scrapedImages, setScrapedImages] = useState<string[]>(() => {
    try {
      if (typeof window !== "undefined") {
        const raw =
          localStorage.getItem("sonikoma-active-project-store") ||
          sessionStorage.getItem("sonikoma-active-project-store");
        if (raw) {
          const parsed = JSON.parse(raw);
          const imgs = parsed?.state?.activeProjectData?.scrapedImages;
          if (Array.isArray(imgs) && imgs.length > 0) {
            return imgs;
          }
        }
      }
    } catch (e) {}
    return [];
  });

  const [selectedScraped, setSelectedScraped] = useState<string[]>([]);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [showScrapeConfirmModal, setShowScrapeConfirmModal] = useState<boolean>(false);
  const [accumulatedTokens, setAccumulatedTokens] = useState<number>(0);

  return {
    scrapedImages,
    setScrapedImages,
    selectedScraped,
    setSelectedScraped,
    isScraping,
    setIsScraping,
    showScrapeConfirmModal,
    setShowScrapeConfirmModal,
    accumulatedTokens,
    setAccumulatedTokens,
  };
}
