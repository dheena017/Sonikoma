import React from "react";
import { useProjectStore } from "@/features/platform/projects/store/useProjectStore";
import { useThumbnailGenerator } from "../hooks/useThumbnailGenerator";
import { ThumbnailHeroBanner } from "../components/ThumbnailHeroBanner";
import { ThumbnailPromptCard } from "../components/ThumbnailPromptCard";
import { ThumbnailGallery } from "../components/ThumbnailGallery";
import { ThumbnailPreviewModal } from "../components/ThumbnailPreviewModal";
import { GeneratedThumbnailItem } from "../types";

interface CreativeThumbnailPageProps {
  fetchWithInterceptor?: any;
  panels?: any[];
  addNotification?: (msg: string, type: any) => void;
  navigateTo?: (path: string) => void;
}

export const CreativeThumbnailPage: React.FC<CreativeThumbnailPageProps> = ({
  fetchWithInterceptor,
  panels = [],
  addNotification,
  navigateTo,
}) => {
  const activeProjectData = useProjectStore((state) => state.activeProjectData);
  const activePanels = activeProjectData?.panels?.length
    ? activeProjectData.panels
    : panels;

  const seriesTitle =
    activeProjectData?.project?.title ||
    activeProjectData?.project?.series_title ||
    "Solo Leveling Episode Climax";

  const {
    prompt,
    setPrompt,
    seriesTitle: currentTitle,
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
  } = useThumbnailGenerator(
    fetchWithInterceptor,
    activePanels,
    seriesTitle,
    addNotification
  );

  const handleSelectForYouTube = (item: GeneratedThumbnailItem) => {
    addNotification?.(
      `Selected "${item.archetype_label}" for YouTube export! Redirecting to YouTube Publisher...`,
      "success"
    );
    if (navigateTo) {
      navigateTo(`/creative-suite/youtube?thumbnail_url=${encodeURIComponent(item.image_url)}`);
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto py-4 sm:py-6 animate-fade-in text-left text-[#E5E5E5]">
      {/* ── MAIN STUDIO WRAPPER FRAME ── */}
      <div className="rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-6 sm:p-8 lg:p-9 shadow-2xl space-y-8 relative overflow-hidden text-left">
        {/* ── Top Hero Header ── */}
        <ThumbnailHeroBanner />

        {/* ── Generation Input Form ── */}
        <ThumbnailPromptCard
          prompt={prompt}
          setPrompt={setPrompt}
          seriesTitle={currentTitle}
          setSeriesTitle={setSeriesTitle}
          genre={genre}
          setGenre={setGenre}
          style={style}
          setStyle={setStyle}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />

        {/* ── Generated 3 or 6 Thumbnails Gallery ── */}
        <ThumbnailGallery
          thumbnails={thumbnails}
          onPreview={setPreviewItem}
          onDownload={handleDownload}
          onSelectForYouTube={handleSelectForYouTube}
        />
      </div>

      {/* ── Lightbox Preview Modal ── */}
      <ThumbnailPreviewModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
        onDownload={handleDownload}
        onSelectForYouTube={handleSelectForYouTube}
      />
    </div>
  );
};

export default CreativeThumbnailPage;
