import React, { useEffect } from "react";

export interface AIPlaygroundPageProps {
  addNotification?: (msg: string, type?: string) => void;
  navigateTo?: (path: string) => void;
}

/**
 * @deprecated AIPlaygroundPage has been consolidated into the AI Model Arena (/ai-core/arena) and Cascade Simulator (/ai-core/routing).
 */
export default function AIPlaygroundPage({ navigateTo }: AIPlaygroundPageProps) {
  useEffect(() => {
    if (navigateTo) {
      navigateTo("/ai-core/arena");
    } else if (typeof window !== "undefined") {
      window.location.replace("/ai-core/arena");
    }
  }, [navigateTo]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-center space-y-3">
      <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      <p className="text-xs text-neutral-400 font-mono">
        Redirecting to Model Arena…
      </p>
    </div>
  );
}
