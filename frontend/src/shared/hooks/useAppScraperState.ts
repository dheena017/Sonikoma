import { useState } from "react";

export function useAppScraperState() {
  const [scrapedImages, setScrapedImages] = useState<string[]>([]);

  const [selectedScraped, setSelectedScraped] = useState<string[]>([]);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [showScrapeConfirmModal, setShowScrapeConfirmModal] =
    useState<boolean>(false);
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
