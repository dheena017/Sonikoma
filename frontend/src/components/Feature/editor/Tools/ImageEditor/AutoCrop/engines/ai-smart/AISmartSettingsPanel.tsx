import React from 'react';
import { AutoCropEngineSelector } from "../../AutoCropEngineSelector";

export function AISmartSettingsPanel(props: any) {
  return (
     <div className="space-y-4">
        {/* We reuse the existing massive component but force it into AI mode */}
        <AutoCropEngineSelector
           {...props}
           useLocalCV={false}
           setUseLocalCV={() => {}}
        />
     </div>
  );
}
