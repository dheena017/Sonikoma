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
        <div className="flex items-center justify-between border-b border-neutral-850 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-400" />
              AI Community Coach & Engagement
            </h2>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Optimize subscriber replies and community retention strategies
            </p>
          </div>
          <button
            onClick={onNavigateHome}
            className="px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono transition-all hover:bg-neutral-850 cursor-pointer"
          >
            ← Dashboard
          </button>
        </div>

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
