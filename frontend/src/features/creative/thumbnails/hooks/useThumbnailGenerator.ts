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
  const [count, setCount] = useState<ThumbnailCount>(1);
  const [seriesTitle, setSeriesTitle] = useState(initialTitle);
  const [genre, setGenre] = useState("Action Fantasy");
  const [style, setStyle] = useState<string>("anime_manhwa");

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
        count: 1,
        series_title: seriesTitle.trim() || "Webtoon Climax",
        genre,
        panels: mappedPanels,
        style,
      };

      const res = await generateThumbnails(fetchWithInterceptor, request);
      setThumbnails(res.thumbnails || []);
      const topItem = res.thumbnails?.[0];
      const tierUsed = res.tier_used || topItem?.tier_used || "Tier 1: Primary";
      const modelUsed = res.model_used || topItem?.model_used || "flux-anime";
      const providerUsed = res.provider_used || topItem?.provider_used || "Pollinations AI (100% Free)";
      const seconds = res.execution_time_ms ? ` in ${(res.execution_time_ms / 1000).toFixed(1)}s` : "";

      const detailedMsg =
        res.routing_message ||
        topItem?.routing_message ||
        `✨ Generated 16:9 thumbnail via ${tierUsed}: ${modelUsed} (${providerUsed})${seconds}`;

      addNotification?.(detailedMsg, "success");
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
    thumbnails,
    isGenerating,
    previewItem,
    setPreviewItem,
    handleGenerate,
    handleDownload,
  };
}
