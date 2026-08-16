import React from "react";
import { useAIModels } from "@/features/ai_core/hooks/useAIModels";
import { Cpu } from "lucide-react";

interface ModelSelectProps {
  value: string;
  onChange: (modelId: string) => void;
  className?: string;
  selectClassName?: string;
  showIcon?: boolean;
  filterProvider?: string;
  disabled?: boolean;
}

export const ModelSelect: React.FC<ModelSelectProps> = ({
  value,
  onChange,
  className = "flex items-center gap-2 bg-neutral-950 border border-neutral-850 rounded-xl px-3 py-1.5",
  selectClassName = "bg-transparent text-xs font-mono text-white outline-none cursor-pointer",
  showIcon = true,
  filterProvider,
  disabled = false,
}) => {
  const { models, loading } = useAIModels();

  const filteredModels = filterProvider
    ? models.filter(
        (m) => m.provider.toLowerCase() === filterProvider.toLowerCase()
      )
    : models;

  return (
    <div className={className}>
      {showIcon && <Cpu className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        className={selectClassName}
      >
        {loading && filteredModels.length === 0 && (
          <option value={value} className="bg-[#09080e] text-white">
            {value || "Loading models..."}
          </option>
        )}
        {!loading && filteredModels.length === 0 && (
          <option value={value} className="bg-[#09080e] text-white">
            {value || "Default Model"}
          </option>
        )}
        {filteredModels.map((m) => (
          <option key={m.id} value={m.id} className="bg-[#09080e] text-white">
            {m.name || m.id} ({m.provider})
          </option>
        ))}
      </select>
    </div>
  );
};

export default ModelSelect;
