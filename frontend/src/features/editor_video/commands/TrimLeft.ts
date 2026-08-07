import { EditorCommand } from "./index";

export class TrimLeft implements EditorCommand {
  name = "TrimLeft";
  constructor(
    private clipId: string,
    private prevStart: number,
    private newStart: number,
    private onTrim: (id: string, s: number) => void,
  ) {}
  execute() { this.onTrim(this.clipId, this.newStart); }
  undo()    { this.onTrim(this.clipId, this.prevStart); }
}
