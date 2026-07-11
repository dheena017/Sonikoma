import { useEffect } from "react";
import { PanelSyncMap } from "../types";
import * as fabric from "fabric";

interface UseDialogueSyncProps {
  fabricTextObjectRef: React.RefObject<fabric.Object | null>;
  canvasRef: React.RefObject<fabric.Canvas | null>;
  syncMap?: PanelSyncMap;
  textVisible?: boolean;
}

export function useDialogueSync({
  fabricTextObjectRef,
  canvasRef,
  syncMap,
  textVisible = true,
}: UseDialogueSyncProps) {
  useEffect(() => {
    const handleTimeUpdate = (e: Event) => {
      const time = (e as CustomEvent).detail;
      const textObj = fabricTextObjectRef.current;
      const canvas = canvasRef.current;

      if (!textObj || !canvas) return;

      // If text layer visibility is globally disabled, hide it
      if (!textVisible) {
        if (textObj.opacity !== 0) {
          textObj.set({ opacity: 0 });
          canvas.renderAll();
        }
        return;
      }

      const dialogueMap = syncMap?.dialogue_map;
      if (!dialogueMap || dialogueMap.length === 0) {
        // If there is no sync map, keep the text layer fully visible
        if (textObj.opacity !== 1) {
          textObj.set({ opacity: 1 });
          canvas.renderAll();
        }
        return;
      }

      // Check if current playback time is within any bubble timing range
      const isAnyBubbleActive = dialogueMap.some(
        (seg) => time >= seg.start_time && time <= seg.end_time
      );

      const targetOpacity = isAnyBubbleActive ? 1 : 0;

      if (textObj.opacity !== targetOpacity) {
        textObj.set({ opacity: targetOpacity });
        canvas.renderAll();
      }
    };

    window.addEventListener("storyboard-time-update", handleTimeUpdate);
    return () => {
      window.removeEventListener("storyboard-time-update", handleTimeUpdate);
    };
  }, [syncMap, textVisible, fabricTextObjectRef, canvasRef]);
}
