import React from "react";

export const SafeAreaOverlay: React.FC<{ visible?: boolean }> = ({ visible = true }) => {
  if (!visible) return null;
  return (
    <div className="absolute inset-4 border border-dashed border-cyan-400/40 pointer-events-none z-20 rounded-lg">
      <div className="absolute top-1 left-2 text-[9px] font-mono text-cyan-400/70 uppercase">
        Action Safe 90%
      </div>
    </div>
  );
};

export default React.memo(SafeAreaOverlay);
