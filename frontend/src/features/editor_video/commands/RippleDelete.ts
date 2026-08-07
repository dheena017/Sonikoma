import { EditorCommand } from "./index";

export class RippleDelete implements EditorCommand {
  name = "RippleDelete";
  constructor(private clipId: string, private onRipple: (id: string) => void, private onUndo: (id: string) => void) {}
  execute() { this.onRipple(this.clipId); }
  undo()    { this.onUndo(this.clipId); }
}
