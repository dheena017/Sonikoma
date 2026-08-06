import { AutoCropEngineSelector } from "./AutoCropEngineSelector";

export function AutoCropEngineSelectorV2({ legacyProps }: { legacyProps: any }) {
  return (
    <div className="space-y-6">
      <AutoCropEngineSelector {...legacyProps} />
    </div>
  );
}
