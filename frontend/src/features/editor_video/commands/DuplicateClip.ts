import { EditorCommand } from "./index";

interface DuplicateClipPayload {
  clipId: string;
  onDuplicate: (id: string) => string;
  onRemoveDuplicate: (dupId: string) => void;
}

export class DuplicateClip implements EditorCommand {
  name = "DuplicateClip";
  private dupId: string | null = null;
  constructor(private payload: DuplicateClipPayload) {}
  execute() { this.dupId = this.payload.onDuplicate(this.payload.clipId); }
  undo()    { if (this.dupId) this.payload.onRemoveDuplicate(this.dupId); }
}
