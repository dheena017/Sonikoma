import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Check, Search } from "lucide-react";

export interface CyberSelectOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  group?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export type CyberSelectVariant =
  | "red"
  | "purple"
  | "cyan"
  | "amber"
  | "emerald"
  | "blue"
  | "default";

export interface CyberSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (
    | CyberSelectOption
    | {
        value: string;
        label: string;
        description?: string;
        badge?: string;
        group?: string;
        disabled?: boolean;
      }
  )[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  dropdownClassName?: string;
  size?: "sm" | "md" | "lg";
  variant?: CyberSelectVariant;
  searchable?: boolean;
  ariaLabel?: string;
  placement?: "bottom" | "top" | "auto";
}

const VARIANT_STYLES: Record<
  CyberSelectVariant,
  {
    openBorder: string;
    focusBorder: string;
    text: string;
    activeText: string;
    icon: string;
    itemActive: string;
    check: string;
  }
> = {
  red: {
    openBorder: "border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.25)] ring-1 ring-red-500/30",
    focusBorder: "focus:border-red-500/60",
    text: "text-red-200",
    activeText: "text-white font-bold",
    icon: "text-red-400",
    itemActive: "bg-red-500/15 border border-red-500/30 text-white font-bold shadow-sm",
    check: "text-red-400",
  },
  purple: {
    openBorder: "border-purple-500/80 shadow-[0_0_20px_rgba(168,85,247,0.25)] ring-1 ring-purple-500/30",
    focusBorder: "focus:border-purple-500/60",
    text: "text-purple-200",
    activeText: "text-purple-200 font-bold",
    icon: "text-purple-400",
    itemActive: "bg-purple-500/20 border border-purple-500/35 text-purple-200 font-bold shadow-sm",
    check: "text-purple-400",
  },
  cyan: {
    openBorder: "border-cyan-500/80 shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/30",
    focusBorder: "focus:border-cyan-500/60",
    text: "text-cyan-200",
    activeText: "text-cyan-200 font-bold",
    icon: "text-cyan-400",
    itemActive: "bg-cyan-500/20 border border-cyan-400/35 text-cyan-200 font-bold shadow-sm",
    check: "text-cyan-400",
  },
  amber: {
    openBorder: "border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/30",
    focusBorder: "focus:border-amber-500/60",
    text: "text-amber-200",
    activeText: "text-amber-200 font-bold",
    icon: "text-amber-400",
    itemActive: "bg-amber-500/20 border border-amber-500/35 text-amber-200 font-bold shadow-sm",
    check: "text-amber-400",
  },
  emerald: {
    openBorder: "border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/30",
    focusBorder: "focus:border-emerald-500/60",
    text: "text-emerald-200",
    activeText: "text-emerald-200 font-bold",
    icon: "text-emerald-400",
    itemActive: "bg-emerald-500/20 border border-emerald-500/35 text-emerald-200 font-bold shadow-sm",
    check: "text-emerald-400",
  },
  blue: {
    openBorder: "border-[#3B82F6] ring-1 ring-[#3B82F6]/30",
    focusBorder: "focus:border-[#3B82F6]",
    text: "text-[#E5E5E5]",
    activeText: "text-white font-bold",
    icon: "text-[#3B82F6]",
    itemActive: "bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-white font-bold shadow-sm",
    check: "text-[#3B82F6]",
  },
  default: {
    openBorder: "border-neutral-600 ring-1 ring-neutral-500/20",
    focusBorder: "focus:border-neutral-500",
    text: "text-[#E5E5E5]",
    activeText: "text-white font-bold",
    icon: "text-neutral-400",
    itemActive: "bg-[#252525] border border-[#2F2F2F] text-white font-bold shadow-sm",
    check: "text-[#3B82F6]",
  },
};

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
  variant = "red",
  searchable = false,
  ariaLabel,
  placement = "auto",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openUpward, setOpenUpward] = useState(placement === "top");
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-detect optimal placement (upward vs downward) based on available viewport space
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    if (placement === "top") {
      setOpenUpward(true);
      return;
    }
    if (placement === "bottom") {
      setOpenUpward(false);
      return;
    }
    // placement === "auto"
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    if (spaceBelow < 260 && spaceAbove > spaceBelow) {
      setOpenUpward(true);
    } else {
      setOpenUpward(false);
    }
  }, [isOpen, placement]);

  const currentTheme = VARIANT_STYLES[variant] || VARIANT_STYLES.red;

  // Find active option
  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Dismiss on clicking outside
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

  // Dismiss on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Auto-close when scrolled away from viewpoint
  const checkViewpointAndDismiss = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Window viewport check: if scrolled outside screen bounds
    if (
      rect.bottom < 50 ||
      rect.top > viewportHeight - 50 ||
      rect.right < 20 ||
      rect.left > viewportWidth - 20
    ) {
      setIsOpen(false);
      setSearchQuery("");
      return;
    }

    // Parent container viewpoint check: if scrolled outside its visible container
    let parent = containerRef.current.parentElement;
    while (parent && parent !== document.body) {
      const style = window.getComputedStyle(parent);
      if (
        style.overflowY === "auto" ||
        style.overflowY === "scroll" ||
        style.overflow === "auto" ||
        style.overflow === "scroll" ||
        style.overflow === "hidden"
      ) {
        const pRect = parent.getBoundingClientRect();
        if (rect.bottom < pRect.top + 8 || rect.top > pRect.bottom - 8) {
          setIsOpen(false);
          setSearchQuery("");
          return;
        }
      }
      parent = parent.parentElement;
    }
  }, []);

  // Viewpoint Observer (Native IntersectionObserver)
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && (!entry.isIntersecting || entry.intersectionRatio < 0.25)) {
          setIsOpen(false);
          setSearchQuery("");
        }
      },
      {
        threshold: [0, 0.25, 0.5, 1.0],
      }
    );

    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
    };
  }, [isOpen]);

  // Track outer scroll and resize: auto-close immediately if trigger moved away from viewpoint
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = (e: Event) => {
      // Don't close if user is scrolling inside the options list itself
      if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) {
        return;
      }
      checkViewpointAndDismiss();
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, checkViewpointAndDismiss]);

  // Focus search on open
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, searchable]);

  // Filter options if searchable
  const filteredOptions = searchQuery
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opt.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const sizeClasses = {
    sm: "px-2.5 py-1.5 text-xs rounded-lg min-h-[32px]",
    md: "px-3 py-2 text-xs rounded-xl min-h-[38px]",
    lg: "px-3.5 py-2.5 text-sm rounded-xl min-h-[44px]",
  };

  return (
    <div className={`relative ${isOpen ? "z-50" : "z-10"} ${className}`} ref={containerRef}>
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
            ? `bg-[#1E1E1E] ${currentTheme.openBorder} text-white`
            : "bg-[#161616] hover:bg-[#1E1E1E] border border-[#2F2F2F] hover:border-neutral-600 text-[#E5E5E5] hover:text-white shadow-inner"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {"icon" in (selectedOption || {}) &&
            (selectedOption as CyberSelectOption)?.icon && (
              <span className={`shrink-0 ${currentTheme.icon}`}>
                {(selectedOption as CyberSelectOption).icon}
              </span>
            )}
          <span
            title={selectedOption ? selectedOption.label : placeholder}
            className={`truncate ${
              !selectedOption ? "text-neutral-500" : currentTheme.activeText
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/10 text-neutral-300 border border-white/10 shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-neutral-400 transition-transform duration-200 shrink-0 ${
            isOpen ? `rotate-180 ${currentTheme.icon}` : ""
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={`absolute left-0 right-0 ${
            openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
          } z-[200] bg-[#181818] border border-[#2F2F2F] rounded-xl shadow-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150 font-mono ${dropdownClassName}`}
        >
          {/* Optional Search inside popup */}
          {(searchable || options.length > 7) && (
            <div className="p-1.5 pb-2 border-b border-[#2F2F2F]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search options..."
                  className={`w-full bg-[#141414] border border-[#2F2F2F] ${currentTheme.focusBorder} rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#E5E5E5] placeholder:text-[#6B7280] focus:outline-none`}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-0.5 py-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-3 px-3 text-center text-xs text-neutral-500">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                const prevOpt = idx > 0 ? filteredOptions[idx - 1] : null;
                const showGroupHeader =
                  opt.group && (!prevOpt || prevOpt.group !== opt.group);

                return (
                  <React.Fragment key={`${opt.value}-${idx}`}>
                    {showGroupHeader && (
                      <div className="px-2 pt-1.5 pb-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#9CA3AF] border-b border-[#2F2F2F] mt-1 first:mt-0">
                        {opt.group}
                      </div>
                    )}
                    <button
                      type="button"
                      disabled={opt.disabled}
                      onClick={() => {
                        if (!opt.disabled) {
                          onChange(String(opt.value));
                          setIsOpen(false);
                          setSearchQuery("");
                        }
                      }}
                      className={`w-full flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-all text-left cursor-pointer ${
                        opt.disabled
                          ? "opacity-40 cursor-not-allowed text-neutral-600"
                          : isSelected
                          ? currentTheme.itemActive
                          : "hover:bg-[#252525] text-neutral-300 hover:text-white border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {"icon" in opt && (opt as CyberSelectOption).icon && (
                          <span className={`shrink-0 ${currentTheme.icon}`}>
                            {(opt as CyberSelectOption).icon}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="leading-snug break-words block font-medium">
                            {opt.label}
                          </span>
                          {opt.description && (
                            <span className="text-[10px] text-neutral-400 font-mono block mt-0.5 leading-tight">
                              {opt.description}
                            </span>
                          )}
                          {opt.badge && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-white/10 text-neutral-300 border border-white/10">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <Check
                          className={`w-3.5 h-3.5 shrink-0 stroke-[2.5] ${currentTheme.check}`}
                        />
                      )}
                    </button>
                  </React.Fragment>
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
