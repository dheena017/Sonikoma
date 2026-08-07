import { EditorCommand } from "./index";

export class AddMarker implements EditorCommand {
  name = "AddMarker";
  private markerId: string | null = null;
  constructor(
    private time: number,
    private label: string,
    private onAdd: (t: number, l: string) => string,
    private onRemove: (id: string) => void,
  ) {}
  execute() { this.markerId = this.onAdd(this.time, this.label); }
  undo()    { if (this.markerId) this.onRemove(this.markerId); }
}
