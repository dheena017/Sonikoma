import React, { useEffect, useState } from "react";

interface YouTubeTopProgressBarProps {
  isLoading: boolean;
}

export default function YouTubeTopProgressBar({
  isLoading,
}: YouTubeTopProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let t1: any;
    let t2: any;
    let t3: any;
    let t4: any;

    if (isLoading) {
      setVisible(true);
      setProgress(25);

      t1 = setTimeout(() => setProgress(65), 100);
      t2 = setTimeout(() => setProgress(85), 250);
    } else {
      // Complete and fade out
      setProgress(100);
      t3 = setTimeout(() => {
        setVisible(false);
        t4 = setTimeout(() => setProgress(0), 200);
      }, 300);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isLoading]);

  if (!visible && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none h-[2.5px] bg-transparent">
      <div
        className={`h-full bg-gradient-to-r from-red-600 via-red-500 to-red-400 shadow-[0_0_10px_rgba(255,0,0,0.9)] transition-all ease-out ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? "150ms" : "300ms",
        }}
      />
    </div>
  );
}
