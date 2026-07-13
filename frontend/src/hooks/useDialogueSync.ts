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
    let isMounted = true;

    const handleTimeUpdate = (e: Event) => {
      if (!isMounted) return;
      const time = (e as CustomEvent).detail;
      const textObj = fabricTextObjectRef.current;
      const canvas = canvasRef.current;

      // Protect against disposed or nonexistent canvas context
      if (!textObj || !canvas) return;

      // If text layer visibility is globally disabled, hide it
      if (!textVisible) {
        if (textObj.opacity !== 0) {
          textObj.set({ opacity: 0 });
          try {
            canvas.renderAll();
          } catch (err) {
            console.debug("Canvas render bypassed:", err);
          }
        }
        return;
      }

      const dialogueMap = syncMap?.dialogue_map;
      if (!dialogueMap || dialogueMap.length === 0) {
        // If there is no sync map, keep the text layer fully visible
        if (textObj.opacity !== 1) {
          textObj.set({ opacity: 1 });
          try {
            canvas.renderAll();
          } catch (err) {
            console.debug("Canvas render bypassed:", err);
          }
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
        try {
          canvas.renderAll();
        } catch (err) {
          console.debug("Canvas render bypassed:", err);
        }
      }
    };

    window.addEventListener("storyboard-time-update", handleTimeUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("storyboard-time-update", handleTimeUpdate);
    };
  }, [syncMap, textVisible, fabricTextObjectRef, canvasRef]);
}
