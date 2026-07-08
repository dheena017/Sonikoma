import React from "react";
import { MessageSquare, ArrowLeft } from "lucide-react";
import CommentReplier from "./CommentReplier.js";

interface EngagementPageProps {
  onNavigateHome: () => void;
  scrapedTitle?: string;
}

const EngagementPage = React.memo(
  ({ onNavigateHome, scrapedTitle }: EngagementPageProps) => {
    return (
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6 animate-fade-in">

        <div className="bg-neutral-900/10 border border-neutral-800/80 rounded-2xl p-6 space-y-6">

          <div className="max-w-2xl mx-auto text-center space-y-2">
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              Interact with your channel subscribers by generating context-aware
              replies that drive engagement metrics and video comments.
            </p>
          </div>

          <CommentReplier title={scrapedTitle || "Overpowered S-Rank Recap"} />
        </div>
      </div>
    );
  }
);

export default EngagementPage;
