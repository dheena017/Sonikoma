/**
 * HistoryStack — Undo/Redo command stack.
 * Used by UndoManager and RedoManager.
 */

import { EditorCommand } from "../commands";

export class HistoryStack {
  private past: EditorCommand[] = [];
  private future: EditorCommand[] = [];
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  push(command: EditorCommand): void {
    command.execute();
    this.past.push(command);
    if (this.past.length > this.maxSize) this.past.shift();
    this.future = [];
  }

  undo(): EditorCommand | null {
    const cmd = this.past.pop();
    if (!cmd) return null;
    cmd.undo();
    this.future.push(cmd);
    return cmd;
  }

  redo(): EditorCommand | null {
    const cmd = this.future.pop();
    if (!cmd) return null;
    cmd.execute();
    this.past.push(cmd);
    return cmd;
  }

  canUndo(): boolean { return this.past.length > 0; }
  canRedo(): boolean { return this.future.length > 0; }

  clear(): void {
    this.past = [];
    this.future = [];
  }

  get historyLength() { return this.past.length; }
  get futureLength()  { return this.future.length; }
}
