import React, { useEffect } from "react";

export interface AIModelArenaPageProps {
  addNotification?: (msg: string, type?: string) => void;
  navigateTo?: (path: string) => void;
}

/**
 * @deprecated AIModelArenaPage has been consolidated into the AI Smart Model Routing page (/ai-core/routing).
 */
export default function AIModelArenaPage({ navigateTo }: AIModelArenaPageProps) {
  useEffect(() => {
    if (navigateTo) {
      navigateTo("/ai-core/routing");
    } else if (typeof window !== "undefined") {
      window.location.replace("/ai-core/routing");
    }
  }, [navigateTo]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-center space-y-3">
      <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      <p className="text-xs text-neutral-400 font-mono">
        Redirecting to Smart Model Routing…
      </p>
    </div>
  );
}
