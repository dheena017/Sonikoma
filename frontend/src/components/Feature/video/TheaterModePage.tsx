import React, { useEffect, useState } from "react";
import CinemaPlayer from "./CinemaPlayer";
import { Loader2 } from "lucide-react";
import { getProject } from "../../../api";

interface TheaterModePageProps {
  seriesSlug: string;
  chapterSlug: string;
  navigateTo: (path: string) => void;
  appLogic: any;
}

export default function TheaterModePage({
  seriesSlug,
  chapterSlug,
  navigateTo,
  appLogic,
}: TheaterModePageProps) {
  const [panels, setPanels] = useState<any[]>(appLogic.panels || []);
  const [videoUrl, setVideoUrl] = useState<string | null>(appLogic.videoUrl || null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWithInterceptor = appLogic.fetchWithInterceptor;

  useEffect(() => {
    let active = true;
    const loadSequenceData = async () => {
      if (!fetchWithInterceptor || !chapterSlug) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await getProject(fetchWithInterceptor, chapterSlug);
        if (active && data.success && data.project) {
          setVideoUrl(data.project.video_url || null);
          if (data.panels && data.panels.length > 0) {
            setPanels(data.panels);
          }
        }
      } catch (err) {
        console.error("Failed to load theater mode project panels:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadSequenceData();
    return () => {
      active = false;
    };
  }, [chapterSlug, fetchWithInterceptor]);

  return (
    <div className="w-screen h-screen bg-black flex flex-col justify-between overflow-hidden relative">
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-10 w-10 text-purple-500 animate-spin" />
          <p className="text-xs text-neutral-400 font-mono">Loading cinematic sequence...</p>
        </div>
      ) : (
        <div className="flex-1 w-full h-full relative">
          <CinemaPlayer
            panels={panels}
            videoUrl={videoUrl}
            seriesSlug={seriesSlug}
            chapterSlug={chapterSlug}
            navigateTo={navigateTo}
            addNotification={appLogic.addNotification}
            variant="theater"
          />
        </div>
      )}
    </div>
  );
}
