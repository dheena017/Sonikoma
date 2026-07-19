import React, { useEffect } from 'react';
import { useAutoCrop } from './contexts/AutoCropContext';
import { EngineRegistry } from './services/EngineRegistry';
import { opencvEngine } from './engines/opencv';
import { aiSmartEngine } from './engines/ai-smart';

// Initialize the registry
if (!EngineRegistry.get('opencv')) {
  EngineRegistry.register(opencvEngine);
  EngineRegistry.register(aiSmartEngine);
}

export function AutoCropEngineSelectorV2({ legacyProps }: { legacyProps: any }) {
  const { activeEngine, setActiveEngine } = useAutoCrop();
  const engines = EngineRegistry.getAll();
  const currentEngineInfo = EngineRegistry.get(activeEngine);
  const ActiveSettingsComponent = currentEngineInfo?.settingsComponent;

  // Enforce opencv as default if activeEngine is somehow missing
  useEffect(() => {
      if (!activeEngine || !EngineRegistry.get(activeEngine)) {
          setActiveEngine('opencv');
      }
  }, [activeEngine, setActiveEngine]);

  return (
    <div className="space-y-6">
      {/* Engine Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {engines.map((engine) => {
          const isSelected = activeEngine === engine.id;
          const isAI = engine.id === 'aiSmart';

          return (
            <button
              key={engine.id}
              type="button"
              onClick={() => setActiveEngine(engine.id as "opencv" | "aiSmart")}
              className={`group flex flex-col gap-2 p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer select-none relative overflow-hidden ${
                isSelected
                  ? isAI
                    ? "bg-indigo-950/10 border-indigo-500/80 shadow-[0_0_20px_rgba(99,102,241,0.12)]"
                    : "bg-cyan-950/10 border-cyan-500/80 shadow-[0_0_20px_rgba(6,182,212,0.12)]"
                  : "bg-neutral-950/40 border-neutral-800 hover:border-neutral-700/80"
              }`}
            >
              {isSelected && (
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -mr-4 -mt-4 pointer-events-none ${isAI ? "bg-indigo-500/5 animate-pulse" : "bg-cyan-500/5"}`} />
              )}

              <div className="flex items-center justify-between w-full">
                <span className={`text-[11px] font-extrabold uppercase tracking-wider ${
                  isSelected
                    ? isAI ? "text-indigo-400" : "text-cyan-400"
                    : "text-neutral-400"
                }`}>
                  {engine.name} {engine.id === 'opencv' && "(Default)"}
                </span>

                <span className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center transition-all ${
                  isSelected
                    ? isAI
                      ? "border-indigo-400 bg-indigo-950 text-indigo-400"
                      : "border-cyan-400 bg-cyan-950 text-cyan-400"
                    : "border-neutral-800 bg-neutral-900"
                }`}>
                  {isSelected && (
                    <div className={`h-1.5 w-1.5 rounded-full ${isAI ? "bg-indigo-400" : "bg-cyan-400"}`} />
                  )}
                </span>
              </div>

              <p className="text-[10px] text-neutral-400 leading-relaxed font-sans font-medium min-h-[45px]">
                {engine.description}
              </p>

              <div className="flex flex-wrap gap-1 mt-2">
                {engine.capabilities.map(cap => (
                  <span key={cap} className={`text-[8px] px-1.5 py-0.5 rounded-sm ${isSelected ? (isAI ? "bg-indigo-900/40 text-indigo-300" : "bg-cyan-900/40 text-cyan-300") : "bg-neutral-900 text-neutral-500"}`}>
                    {cap}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Render Active Engine Settings Component */}
      {ActiveSettingsComponent && (
        <div className="mt-6">
          {/* We pass the FULL legacy props down to the engine module, so it has 100% of the functionality */}
          <ActiveSettingsComponent {...legacyProps} />
        </div>
      )}

    </div>
  );
}
