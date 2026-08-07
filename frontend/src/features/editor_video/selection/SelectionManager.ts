/**
 * SelectionManager — Tracks multi-element selection across the editor.
 * Works with panels, text layers, audio clips, FX elements.
 */

export type SelectableType = "panel" | "clip" | "text" | "effect" | "audio";

export interface SelectableItem {
  id: string;
  type: SelectableType;
}

export class SelectionManager {
  private selected: Map<string, SelectableItem> = new Map();
  private listeners: Array<(selection: SelectableItem[]) => void> = [];

  select(item: SelectableItem, multi = false): void {
    if (!multi) this.selected.clear();
    this.selected.set(item.id, item);
    this.notify();
  }

  deselect(id: string): void {
    this.selected.delete(id);
    this.notify();
  }

  toggle(item: SelectableItem): void {
    if (this.selected.has(item.id)) {
      this.deselect(item.id);
    } else {
      this.select(item, true);
    }
  }

  selectAll(items: SelectableItem[]): void {
    this.selected.clear();
    items.forEach((i) => this.selected.set(i.id, i));
    this.notify();
  }

  clearSelection(): void {
    this.selected.clear();
    this.notify();
  }

  getSelected(): SelectableItem[] {
    return Array.from(this.selected.values());
  }

  isSelected(id: string): boolean {
    return this.selected.has(id);
  }

  hasMultiple(): boolean {
    return this.selected.size > 1;
  }

  onSelectionChange(listener: (selection: SelectableItem[]) => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }

  private notify(): void {
    const current = this.getSelected();
    this.listeners.forEach((l) => l(current));
  }
}

/** Singleton instance for the editor session. */
export const selectionManager = new SelectionManager();
