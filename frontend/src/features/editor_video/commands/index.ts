/**
 * commands/index.ts
 *
 * Command pattern subsystem for undoable editor operations.
 *
 * Each command implements { execute(), undo() }.
 * Commands are pushed to the HistoryStack (history/HistoryStack.ts).
 *
 * Files in this directory:
 *   DeleteClip.ts       — Remove clip from timeline
 *   SplitClip.ts        — Split clip at playhead
 *   DuplicateClip.ts    — Copy clip to same track
 *   RippleDelete.ts     — Delete + shift subsequent clips
 *   TrimLeft.ts         — Trim clip in-point
 *   AddMarker.ts        — Add a timeline marker
 */

export interface EditorCommand {
  name: string;
  execute(): void;
  undo(): void;
}

/** No-op command — useful for testing and stubs. */
export class NoOpCommand implements EditorCommand {
  name = "NoOp";
  execute() {}
  undo() {}
}

export { DeleteClip } from "./DeleteClip";
export { DuplicateClip } from "./DuplicateClip";
export { SplitClip } from "./SplitClip";
export { RippleDelete } from "./RippleDelete";
export { TrimLeft } from "./TrimLeft";
export { AddMarker } from "./AddMarker";
