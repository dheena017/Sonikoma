import { EditorCommand } from "./index";

export class SplitClip implements EditorCommand {
  name = "SplitClip";
  constructor(private clipId: string, private splitTime: number, private onSplit: (id: string, t: number) => void, private onMerge: (id: string) => void) {}
  execute() { this.onSplit(this.clipId, this.splitTime); }
  undo()    { this.onMerge(this.clipId); }
}
