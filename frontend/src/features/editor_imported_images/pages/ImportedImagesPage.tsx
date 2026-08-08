import React from "react";
import ChapterScraperDeck from "@/features/editor_imported_images/components/ImportedImagesDeck";
import { ChapterScraperDeckProps } from "@/features/editor_imported_images/components/types";

const ImportedImagesPage: React.FC<ChapterScraperDeckProps> = (props) => {
  return (
    <div className="w-full p-4 md:p-6 lg:p-8">
      <ChapterScraperDeck {...props} />
    </div>
  );
};

export default ImportedImagesPage;
