import React from 'react';
import { AutoCropEngineSelector } from "../../AutoCropEngineSelector";

export function OpenCVSettingsPanel(props: any) {
  return (
     <div className="space-y-4">
        {/* We reuse the existing massive component but force it into OpenCV mode */}
        <AutoCropEngineSelector
           {...props}
           useLocalCV={true}
           setUseLocalCV={() => {}}
        />
     </div>
  );
}
