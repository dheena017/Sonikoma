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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 mb-1.5">
              <span
                className="hover:text-purple-400 cursor-pointer"
                onClick={onNavigateHome}
              >
                Dashboard
              </span>
              <span>&gt;</span>
              <span className="text-purple-400">Community Coach</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <div className="icon-pill icon-pill--purple">
                <MessageSquare className="h-5 w-5" />
              </div>
              AI Community Coach & Engagement
            </h2>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Optimize subscriber replies and community retention strategies
            </p>
          </div>
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono transition-all cursor-pointer font-bold shadow-lg shadow-purple-950/30"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
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
