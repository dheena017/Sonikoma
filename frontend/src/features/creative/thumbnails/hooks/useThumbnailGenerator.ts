import { useState, useCallback } from "react";
import {
  ThumbnailCount,
  GeneratedThumbnailItem,
  ThumbnailGenerateRequest,
  ThumbnailPanelInput,
} from "../types";
import { generateThumbnails } from "../services/thumbnailApi";

export function useThumbnailGenerator(
  fetchWithInterceptor: any,
  activePanels: any[] = [],
  initialTitle: string = "Solo Leveling Episode Climax",
  addNotification?: any
) {
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState<ThumbnailCount>(3);
  const [seriesTitle, setSeriesTitle] = useState(initialTitle);
  const [genre, setGenre] = useState("Action Fantasy");
  const [style, setStyle] = useState<string>("anime_manhwa");
  const [engine, setEngine] = useState<string>("flux_schnell");

  const [thumbnails, setThumbnails] = useState<GeneratedThumbnailItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewItem, setPreviewItem] = useState<GeneratedThumbnailItem | null>(null);

  const handleGenerate = useCallback(async () => {
    try {
      setIsGenerating(true);

      // Map active project panels if available
      const mappedPanels: ThumbnailPanelInput[] = (activePanels || []).map(
        (p: any, idx: number) => ({
          id: String(p.id || idx),
          image_url: p.image_url || p.url || "",
          speech_text: p.speech_text || "",
          role: idx === 0 ? "hero" : idx === 1 ? "villain" : "climax",
        })
      );

      const request: ThumbnailGenerateRequest = {
        prompt: prompt.trim() || undefined,
        count,
        series_title: seriesTitle.trim() || "Webtoon Climax",
        genre,
        panels: mappedPanels,
        style,
        engine,
      };

      const res = await generateThumbnails(fetchWithInterceptor, request);
      setThumbnails(res.thumbnails || []);
      addNotification?.(
        `Successfully generated ${res.thumbnails.length} high-CTR thumbnails!`,
        "success"
      );
    } catch (err: any) {
      addNotification?.(err.message || "Failed to generate thumbnails.", "error");
    } finally {
      setIsGenerating(false);
    }
  }, [
    prompt,
    count,
    seriesTitle,
    genre,
    style,
    engine,
    activePanels,
    fetchWithInterceptor,
    addNotification,
  ]);

  const handleDownload = useCallback((item: GeneratedThumbnailItem) => {
    const a = document.createElement("a");
    a.href = item.image_url;
    a.download = `${item.id}_${item.archetype}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addNotification?.("Downloaded thumbnail in HD 1280x720!", "success");
  }, [addNotification]);

  return {
    prompt,
    setPrompt,
    count,
    setCount,
    seriesTitle,
    setSeriesTitle,
    genre,
    setGenre,
    style,
    setStyle,
    engine,
    setEngine,
    thumbnails,
    isGenerating,
    previewItem,
    setPreviewItem,
    handleGenerate,
    handleDownload,
  };
}
