import { useEffect } from "react";

export type EditorEventType =
  | "MEDIA_ADDED"
  | "TIMELINE_UPDATED"
  | "INSPECTOR_REFRESH"
  | "HISTORY_SAVED"
  | "PREVIEW_REFRESH"
  | "SCENE_CHANGED"
  | "AI_TASK_TRIGGERED"
  | "FAVORITE_TOGGLED";

export interface EditorEventPayloads {
  MEDIA_ADDED: { assetId: string; title: string; type: string; url?: string };
  TIMELINE_UPDATED: { trackId?: string; clipsCount?: number; duration?: string };
  INSPECTOR_REFRESH: { elementId?: string; layerName?: string };
  HISTORY_SAVED: { actionName: string; timestamp: number };
  PREVIEW_REFRESH: { currentTime?: number; frameIndex?: number };
  SCENE_CHANGED: { sceneId: string; sceneNumber: number; title: string };
  AI_TASK_TRIGGERED: { toolId: string; toolName: string };
  FAVORITE_TOGGLED: { itemId: string; title: string; starred: boolean };
}

type EventHandler<K extends EditorEventType> = (payload: EditorEventPayloads[K]) => void;

class UnifiedEditorEventBus {
  private listeners: { [K in EditorEventType]?: EventHandler<K>[] } = {};

  /**
   * Subscribe to an event topic. Returns an unsubscribe function.
   */
  public subscribe<K extends EditorEventType>(event: K, handler: EventHandler<K>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    (this.listeners[event] as EventHandler<K>[]).push(handler);

    return () => {
      this.listeners[event] = (this.listeners[event] as EventHandler<K>[] | undefined)?.filter(
        (h) => h !== handler
      ) as any;
    };
  }

  /**
   * Publish an event to all subscribers.
   */
  public publish<K extends EditorEventType>(event: K, payload: EditorEventPayloads[K]): void {
    const handlers = this.listeners[event];
    if (handlers) {
      handlers.forEach((handler) => handler(payload));
    }
  }
}

export const editorEventBus = new UnifiedEditorEventBus();

/**
   React Hook for listening to editor event bus events with automatic cleanup.
 */
export function useEditorEvent<K extends EditorEventType>(
  event: K,
  handler: EventHandler<K>
) {
  useEffect(() => {
    const unsubscribe = editorEventBus.subscribe(event, handler);
    return () => unsubscribe();
  }, [event, handler]);
}
