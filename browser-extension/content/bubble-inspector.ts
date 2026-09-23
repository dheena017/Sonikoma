/**
 * extension/content/bubble-inspector.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * TypeScript Bubble Inspector & Voice Dubber Overlay.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export class BubbleInspector {
  constructor() {}
}

if (typeof window !== "undefined") {
  (window as any).BubbleInspector = BubbleInspector;
}
