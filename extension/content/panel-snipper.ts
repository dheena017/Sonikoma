/**
 * extension/content/panel-snipper.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * TypeScript Panel Snipper.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export class PanelSnipper {
  constructor() {}
}

if (typeof window !== "undefined") {
  (window as any).PanelSnipper = PanelSnipper;
}
