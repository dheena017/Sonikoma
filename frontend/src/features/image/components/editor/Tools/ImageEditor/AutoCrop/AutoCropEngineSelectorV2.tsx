import React from "react";
import { AutoCropEngineSelector } from "@/features/image/components/editor/Tools/ImageEditor/AutoCrop/AutoCropEngineSelector";

export function AutoCropEngineSelectorV2({ legacyProps }: { legacyProps: any }) {
  return (
    <div className="space-y-6">
      <AutoCropEngineSelector {...legacyProps} />
    </div>
  );
}
