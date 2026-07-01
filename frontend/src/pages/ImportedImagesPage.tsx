import React from "react";
import LiveScraperDeck from "../components/scraper/LiveScraperDeck";
import { LiveScraperDeckProps } from "../components/scraper/types";

const ImportedImagesPage: React.FC<LiveScraperDeckProps> = (props) => {
  return (
    <div className="w-full p-4 md:p-6 lg:p-8">
      <div className="max-w-[1200px] mx-auto">
        <LiveScraperDeck {...props} />
      </div>
    </div>
  );
};

export default ImportedImagesPage;
