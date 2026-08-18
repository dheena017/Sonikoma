import React, { useMemo } from "react";
import { useAIModels } from "@/features/ai_core/hooks/useAIModels";
import { Cpu, Loader2 } from "lucide-react";
import { AIModel } from "@/types/models";

export interface ModelSelectProps {
  value: string;
  onChange: (modelId: string) => void;
  className?: string;
  selectClassName?: string;
  showIcon?: boolean;
  filterProvider?: string;
  visionOnly?: boolean;
  textOnly?: boolean;
  disabled?: boolean;
  title?: string;
}

export const ModelSelect: React.FC<ModelSelectProps> = ({
  value,
  onChange,
  className = "flex items-center gap-2 bg-neutral-950 border border-neutral-850 rounded-xl px-3 py-1.5",
  selectClassName = "bg-transparent text-xs font-mono text-white outline-none cursor-pointer w-full",
  showIcon = true,
  filterProvider,
  visionOnly = false,
  textOnly = false,
  disabled = false,
  title = "Select AI Model",
}) => {
  const { models, loading, visionModels, textModels, modelsByProvider } = useAIModels();

  const baseModels = useMemo(() => {
    let list: AIModel[] = models;
    if (visionOnly) list = visionModels;
    else if (textOnly) list = textModels;

    if (filterProvider) {
      list = list.filter(
        (m) => m.provider.toLowerCase() === filterProvider.toLowerCase()
      );
    }
    return list;
  }, [models, visionModels, textModels, visionOnly, textOnly, filterProvider]);

  const grouped = useMemo(() => {
    const map: Record<string, AIModel[]> = {};
    for (const m of baseModels) {
      const p = m.provider || "Other";
      if (!map[p]) map[p] = [];
      map[p].push(m);
    }
    return map;
  }, [baseModels]);

  return (
    <div className={className}>
      {showIcon && (
        loading ? (
          <Loader2 className="w-3.5 h-3.5 text-purple-400 shrink-0 animate-spin" />
        ) : (
          <Cpu className="w-3.5 h-3.5 text-purple-400 shrink-0" />
        )
      )}
      <select
        value={value || "gemini-2.5-flash"}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        title={title}
        className={selectClassName}
      >
        {loading && baseModels.length === 0 && (
          <option value={value} className="bg-neutral-900 text-white">
            {value || "Loading dynamic models..."}
          </option>
        )}
        {!loading && baseModels.length === 0 && (
          <option value="gemini-2.5-flash" className="bg-neutral-900 text-white">
            Google Gemini 2.5 Flash (System)
          </option>
        )}
        {Object.entries(grouped).map(([providerName, pModels]) => (
          <optgroup key={providerName} label={providerName} className="bg-neutral-900 text-purple-300 font-bold">
            {pModels.map((m) => (
              <option key={m.id} value={m.id} className="bg-neutral-900 text-white font-normal">
                {m.name || m.id} {m.speed_rating ? `(${m.speed_rating})` : ""}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
};

export default ModelSelect;
