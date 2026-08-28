import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search } from "lucide-react";

export interface CyberSelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface CyberSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (CyberSelectOption | { value: string; label: string; description?: string; disabled?: boolean })[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  dropdownClassName?: string;
  size?: "sm" | "md" | "lg";
  searchable?: boolean;
  ariaLabel?: string;
}

export const CyberSelect: React.FC<CyberSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select an option...",
  label,
  disabled = false,
  className = "",
  dropdownClassName = "",
  size = "md",
  searchable = false,
  ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find active option
  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search on open
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, searchable]);

  // Filter options if searchable
  const filteredOptions = searchQuery
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opt.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs rounded-xl min-h-[34px]",
    md: "px-3.5 py-2.5 text-xs rounded-xl min-h-[42px]",
    lg: "px-4 py-3 text-sm rounded-2xl min-h-[48px]",
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="text-xs font-bold text-neutral-300 font-mono uppercase tracking-wider block mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel || label || placeholder}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setSearchQuery("");
          }
        }}
        className={`w-full flex items-center justify-between gap-3 text-left transition-all duration-200 cursor-pointer select-none font-mono ${
          sizeClasses[size]
        } ${
          disabled
            ? "bg-neutral-900/50 border border-neutral-800 text-neutral-600 cursor-not-allowed opacity-60"
            : isOpen
            ? "bg-[#161622] border-red-500/80 text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] ring-1 ring-red-500/30"
            : "bg-[#0E0E15]/90 hover:bg-[#151520] border border-white/[0.10] hover:border-white/[0.20] text-neutral-200 hover:text-white shadow-inner"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {"icon" in (selectedOption || {}) && (selectedOption as CyberSelectOption)?.icon && (
            <span className="shrink-0 text-red-400">
              {(selectedOption as CyberSelectOption).icon}
            </span>
          )}
          <span className={`truncate ${!selectedOption ? "text-neutral-500" : "text-white font-medium"}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-neutral-400 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-red-400" : ""
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 top-full mt-1.5 z-[120] bg-[#0E0E17]/98 backdrop-blur-2xl border border-white/[0.12] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.85)] p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150 font-mono ${dropdownClassName}`}
        >
          {/* Optional Search inside popup */}
          {(searchable || options.length > 7) && (
            <div className="p-1.5 pb-2 border-b border-white/[0.06]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search options..."
                  className="w-full bg-[#161622] border border-white/[0.08] focus:border-red-500/60 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden space-y-0.5 py-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-4 px-3 text-center text-xs text-neutral-500">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => {
                      if (!opt.disabled) {
                        onChange(opt.value);
                        setIsOpen(false);
                        setSearchQuery("");
                      }
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs transition-all text-left cursor-pointer ${
                      opt.disabled
                        ? "opacity-40 cursor-not-allowed text-neutral-600"
                        : isSelected
                        ? "bg-red-500/15 border border-red-500/30 text-white font-bold shadow-sm"
                        : "hover:bg-white/[0.06] text-neutral-300 hover:text-white border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {"icon" in opt && (opt as CyberSelectOption).icon && (
                        <span className="shrink-0 text-red-400">
                          {(opt as CyberSelectOption).icon}
                        </span>
                      )}
                      <div className="min-w-0">
                        <span className="truncate block font-sans text-xs">
                          {opt.label}
                        </span>
                        {opt.description && (
                          <span className="text-[10px] text-neutral-400 font-mono truncate block mt-0.5">
                            {opt.description}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-red-400 shrink-0 stroke-[2.5]" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CyberSelect;
