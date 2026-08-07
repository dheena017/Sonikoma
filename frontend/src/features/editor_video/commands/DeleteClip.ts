import { EditorCommand } from "./index";

interface DeleteClipPayload {
  clipId: string;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
}

export class DeleteClip implements EditorCommand {
  name = "DeleteClip";
  constructor(private payload: DeleteClipPayload) {}
  execute() { this.payload.onDelete(this.payload.clipId); }
  undo()    { this.payload.onRestore(this.payload.clipId); }
}
