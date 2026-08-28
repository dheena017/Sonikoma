import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
  cloneElement,
  isValidElement,
  ReactElement,
} from "react";
import ReactDOM from "react-dom";

export type TooltipPlacement =
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "left-start"
  | "left-end"
  | "right"
  | "right-start"
  | "right-end";

export type TooltipVariant =
  | "dark"
  | "glass"
  | "neon"
  | "cyber"
  | "gradient"
  | "primary"
  | "success"
  | "warning"
  | "danger";

export type TooltipSize = "xs" | "sm" | "md" | "lg";

export interface TooltipPortalProps {
  /** Text or React element to display in the tooltip */
  text?: React.ReactNode;
  /** Alias for text / custom rich children inside the tooltip */
  children?: React.ReactNode;
  /** Whether the tooltip is currently visible */
  visible: boolean;
  /** The anchor DOMRect around which to position the tooltip */
  anchorRect: DOMRect | null;
  /** Preferred placement relative to anchor */
  placement?: TooltipPlacement;
  /** Gap offset in pixels between anchor and tooltip */
  offset?: number;
  /** Cross-axis offset in pixels */
  crossOffset?: number;
  /** Visual theme variant */
  variant?: TooltipVariant;
  /** Size scale of the tooltip */
  size?: TooltipSize;
  /** Optional keyboard shortcut string or array (e.g. ['Ctrl', 'K'] or '⌘K') */
  shortcut?: string | string[];
  /** Optional secondary descriptive text */
  description?: React.ReactNode;
  /** Optional leading icon */
  icon?: React.ReactNode;
  /** Optional status / feature badge (e.g. 'PRO', 'BETA', 'NEW') */
  badge?: React.ReactNode;
  /** Badge color scheme */
  badgeVariant?: "default" | "primary" | "success" | "warning" | "danger" | "purple";
  /** Whether to render a pointer arrow pointing to the anchor */
  showArrow?: boolean;
  /** Add subtle atmospheric glow */
  glow?: boolean;
  /** Custom max width (defaults to 280px for multiline, or auto) */
  maxWidth?: number | string;
  /** Custom className for the tooltip container */
  className?: string;
  /** Custom inline style overrides */
  style?: React.CSSProperties;
  /** Custom container element for portal (defaults to document.body) */
  container?: HTMLElement | null;
  /** ID for accessibility */
  id?: string;
}

// --------------------------------------------------------------------------
// Variant & Style Helpers
// --------------------------------------------------------------------------
const VARIANT_STYLES: Record<TooltipVariant, string> = {
  dark: "bg-neutral-900/95 border-neutral-700/80 text-neutral-100 shadow-black/60 shadow-xl",
  glass: "bg-neutral-900/80 backdrop-blur-xl border-white/10 text-neutral-100 shadow-[0_8px_32px_rgba(0,0,0,0.45)]",
  neon: "bg-[#0c1017]/95 border-cyan-500/40 text-cyan-50 shadow-[0_0_20px_rgba(6,182,212,0.25)] shadow-cyan-950/50",
  cyber: "bg-[#110d1f]/95 border-purple-500/40 text-purple-100 shadow-[0_0_20px_rgba(168,85,247,0.25)] shadow-purple-950/50",
  gradient: "bg-gradient-to-r from-neutral-900/95 via-purple-950/90 to-neutral-900/95 border-purple-500/30 text-white shadow-xl shadow-purple-950/40",
  primary: "bg-blue-950/95 border-blue-500/40 text-blue-50 shadow-xl shadow-blue-950/50",
  success: "bg-emerald-950/95 border-emerald-500/40 text-emerald-50 shadow-xl shadow-emerald-950/50",
  warning: "bg-amber-950/95 border-amber-500/40 text-amber-50 shadow-xl shadow-amber-950/50",
  danger: "bg-rose-950/95 border-rose-500/40 text-rose-50 shadow-xl shadow-rose-950/50",
};

const GLOW_COLORS: Record<TooltipVariant, string> = {
  dark: "shadow-[0_0_25px_rgba(0,0,0,0.8)]",
  glass: "shadow-[0_0_25px_rgba(255,255,255,0.08)]",
  neon: "shadow-[0_0_25px_rgba(6,182,212,0.35)]",
  cyber: "shadow-[0_0_25px_rgba(168,85,247,0.35)]",
  gradient: "shadow-[0_0_25px_rgba(168,85,247,0.3)]",
  primary: "shadow-[0_0_25px_rgba(59,130,246,0.35)]",
  success: "shadow-[0_0_25px_rgba(16,185,129,0.35)]",
  warning: "shadow-[0_0_25px_rgba(245,158,11,0.35)]",
  danger: "shadow-[0_0_25px_rgba(244,63,94,0.35)]",
};

const SIZE_STYLES: Record<TooltipSize, { root: string; text: string; shortcut: string; desc: string }> = {
  xs: { root: "px-2 py-0.5 gap-1.5 text-[11px] rounded-md", text: "text-[11px] font-medium", shortcut: "text-[9px] px-1 py-0.5", desc: "text-[10px]" },
  sm: { root: "px-2.5 py-1 gap-2 text-xs rounded-lg", text: "text-xs font-medium", shortcut: "text-[10px] px-1.5 py-0.5", desc: "text-[11px]" },
  md: { root: "px-3 py-1.5 gap-2.5 text-xs rounded-lg", text: "text-xs font-semibold", shortcut: "text-[11px] px-1.5 py-0.5", desc: "text-xs" },
  lg: { root: "px-3.5 py-2 gap-3 text-sm rounded-xl", text: "text-sm font-semibold", shortcut: "text-xs px-2 py-0.5", desc: "text-xs" },
};

const BADGE_STYLES: Record<string, string> = {
  default: "bg-neutral-800 text-neutral-300 border-neutral-700",
  primary: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  success: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  warning: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  danger: "bg-rose-500/20 text-rose-300 border-rose-500/40",
  purple: "bg-purple-500/20 text-purple-300 border-purple-500/40",
};

// --------------------------------------------------------------------------
// TooltipPortal Component
// --------------------------------------------------------------------------
export const TooltipPortal: React.FC<TooltipPortalProps> = ({
  text,
  children,
  visible,
  anchorRect,
  placement = "right",
  offset = 10,
  crossOffset = 0,
  variant = "dark",
  size = "sm",
  shortcut,
  description,
  icon,
  badge,
  badgeVariant = "default",
  showArrow = true,
  glow = false,
  maxWidth = 320,
  className = "",
  style: userStyle,
  container,
  id,
}) => {
  const [mounted, setMounted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [tooltipSize, setTooltipSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Measure tooltip dimensions
  useEffect(() => {
    if (visible && tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      if (rect.width !== tooltipSize.width || rect.height !== tooltipSize.height) {
        setTooltipSize({ width: rect.width, height: rect.height });
      }
    }
  }, [visible, text, children, description, shortcut, size]);

  const content = text ?? children;

  // Calculate coordinates and resolved placement with viewport boundary checking
  const { coords, resolvedPlacement, arrowCoords } = useMemo(() => {
    if (!anchorRect) {
      return { coords: { top: 0, left: 0 }, resolvedPlacement: placement, arrowCoords: null };
    }

    const { top, left, right, bottom, width: aWidth, height: aHeight } = anchorRect;
    const tWidth = tooltipSize.width || 120;
    const tHeight = tooltipSize.height || 32;
    const vpWidth = typeof window !== "undefined" ? window.innerWidth : 1920;
    const vpHeight = typeof window !== "undefined" ? window.innerHeight : 1080;
    const pad = 8; // Margin from viewport edges

    let basePlacement = placement;

    // Automatic flip check if overflowing viewport
    if (basePlacement.startsWith("right") && right + offset + tWidth > vpWidth - pad) {
      basePlacement = basePlacement.replace("right", "left") as TooltipPlacement;
    } else if (basePlacement.startsWith("left") && left - offset - tWidth < pad) {
      basePlacement = basePlacement.replace("left", "right") as TooltipPlacement;
    } else if (basePlacement.startsWith("top") && top - offset - tHeight < pad) {
      basePlacement = basePlacement.replace("top", "bottom") as TooltipPlacement;
    } else if (basePlacement.startsWith("bottom") && bottom + offset + tHeight > vpHeight - pad) {
      basePlacement = basePlacement.replace("bottom", "top") as TooltipPlacement;
    }

    let calculatedTop = 0;
    let calculatedLeft = 0;

    switch (basePlacement) {
      case "right":
        calculatedLeft = right + offset;
        calculatedTop = top + aHeight / 2 - tHeight / 2 + crossOffset;
        break;
      case "right-start":
        calculatedLeft = right + offset;
        calculatedTop = top + crossOffset;
        break;
      case "right-end":
        calculatedLeft = right + offset;
        calculatedTop = bottom - tHeight + crossOffset;
        break;
      case "left":
        calculatedLeft = left - offset - tWidth;
        calculatedTop = top + aHeight / 2 - tHeight / 2 + crossOffset;
        break;
      case "left-start":
        calculatedLeft = left - offset - tWidth;
        calculatedTop = top + crossOffset;
        break;
      case "left-end":
        calculatedLeft = left - offset - tWidth;
        calculatedTop = bottom - tHeight + crossOffset;
        break;
      case "top":
        calculatedLeft = left + aWidth / 2 - tWidth / 2 + crossOffset;
        calculatedTop = top - offset - tHeight;
        break;
      case "top-start":
        calculatedLeft = left + crossOffset;
        calculatedTop = top - offset - tHeight;
        break;
      case "top-end":
        calculatedLeft = right - tWidth + crossOffset;
        calculatedTop = top - offset - tHeight;
        break;
      case "bottom":
        calculatedLeft = left + aWidth / 2 - tWidth / 2 + crossOffset;
        calculatedTop = bottom + offset;
        break;
      case "bottom-start":
        calculatedLeft = left + crossOffset;
        calculatedTop = bottom + offset;
        break;
      case "bottom-end":
        calculatedLeft = right - tWidth + crossOffset;
        calculatedTop = bottom + offset;
        break;
    }

    // Viewport clamping
    const clampedLeft = Math.max(pad, Math.min(calculatedLeft, vpWidth - tWidth - pad));
    const clampedTop = Math.max(pad, Math.min(calculatedTop, vpHeight - tHeight - pad));

    // Arrow positioning calculations
    let arrowStyle: React.CSSProperties = {};
    if (showArrow) {
      if (basePlacement.startsWith("right")) {
        arrowStyle = {
          left: -4,
          top: Math.max(8, Math.min(top + aHeight / 2 - clampedTop, tHeight - 8)),
          transform: "translateY(-50%) rotate(45deg)",
        };
      } else if (basePlacement.startsWith("left")) {
        arrowStyle = {
          right: -4,
          top: Math.max(8, Math.min(top + aHeight / 2 - clampedTop, tHeight - 8)),
          transform: "translateY(-50%) rotate(45deg)",
        };
      } else if (basePlacement.startsWith("top")) {
        arrowStyle = {
          bottom: -4,
          left: Math.max(8, Math.min(left + aWidth / 2 - clampedLeft, tWidth - 8)),
          transform: "translateX(-50%) rotate(45deg)",
        };
      } else if (basePlacement.startsWith("bottom")) {
        arrowStyle = {
          top: -4,
          left: Math.max(8, Math.min(left + aWidth / 2 - clampedLeft, tWidth - 8)),
          transform: "translateX(-50%) rotate(45deg)",
        };
      }
    }

    return {
      coords: { top: clampedTop, left: clampedLeft },
      resolvedPlacement: basePlacement,
      arrowCoords: arrowStyle,
    };
  }, [anchorRect, placement, offset, crossOffset, tooltipSize, showArrow]);

  // Normalize shortcut into an array
  const shortcutKeys: string[] = useMemo(() => {
    if (!shortcut) return [];
    if (Array.isArray(shortcut)) return shortcut;
    // If it contains '+' like 'Ctrl+Shift+P' or 'Cmd+K'
    if (shortcut.includes("+")) return shortcut.split("+");
    return [shortcut];
  }, [shortcut]);

  if (!mounted || !visible || !anchorRect || (!content && !description)) {
    return null;
  }

  // Animation origin class based on placement
  const getAnimationClass = (place: TooltipPlacement) => {
    if (place.startsWith("right")) return "animate-in fade-in zoom-in-95 slide-in-from-left-1";
    if (place.startsWith("left")) return "animate-in fade-in zoom-in-95 slide-in-from-right-1";
    if (place.startsWith("top")) return "animate-in fade-in zoom-in-95 slide-in-from-bottom-1";
    return "animate-in fade-in zoom-in-95 slide-in-from-top-1";
  };

  const sizeConfig = SIZE_STYLES[size];
  const variantClass = VARIANT_STYLES[variant];
  const glowClass = glow ? GLOW_COLORS[variant] : "";

  const node = (
    <div
      ref={tooltipRef}
      id={id}
      role="tooltip"
      aria-hidden={!visible}
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
        maxWidth,
        pointerEvents: "none",
        zIndex: 99999,
        ...userStyle,
      }}
      className={`
        pointer-events-none border backdrop-blur-md flex flex-col justify-center
        duration-150 ease-out select-none cursor-default
        ${sizeConfig.root}
        ${variantClass}
        ${glowClass}
        ${getAnimationClass(resolvedPlacement)}
        ${className}
      `}
    >
      {/* Arrow Indicator */}
      {showArrow && arrowCoords && (
        <div
          style={arrowCoords}
          className={`
            absolute w-2 h-2 pointer-events-none z-[-1]
            border-inherit bg-inherit
            ${resolvedPlacement.startsWith("right") ? "border-b border-l" : ""}
            ${resolvedPlacement.startsWith("left") ? "border-t border-r" : ""}
            ${resolvedPlacement.startsWith("top") ? "border-b border-r" : ""}
            ${resolvedPlacement.startsWith("bottom") ? "border-t border-l" : ""}
          `}
        />
      )}

      {/* Main Content Row */}
      <div className="flex items-center gap-2 w-full">
        {icon && <span className="shrink-0 flex items-center opacity-80">{icon}</span>}

        {content && (
          <span className={`font-medium tracking-tight whitespace-nowrap ${sizeConfig.text}`}>
            {content}
          </span>
        )}

        {/* Optional Badge */}
        {badge && (
          <span
            className={`
              inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase tracking-wider border
              ${BADGE_STYLES[badgeVariant] || BADGE_STYLES.default}
            `}
          >
            {badge}
          </span>
        )}

        {/* Keyboard Shortcut Indicator */}
        {shortcutKeys.length > 0 && (
          <div className="ml-auto flex items-center gap-0.5 shrink-0 pl-1">
            {shortcutKeys.map((key, idx) => (
              <kbd
                key={idx}
                className={`
                  inline-flex items-center justify-center font-mono font-semibold rounded bg-white/10 text-white/90 border border-white/15 shadow-[0_1px_0_rgba(0,0,0,0.5)]
                  ${sizeConfig.shortcut}
                `}
              >
                {key}
              </kbd>
            ))}
          </div>
        )}
      </div>

      {/* Optional Description */}
      {description && (
        <div className={`mt-0.5 text-neutral-400 font-normal leading-relaxed break-words ${sizeConfig.desc}`}>
          {description}
        </div>
      )}
    </div>
  );

  const mountContainer = container || (typeof document !== "undefined" ? document.body : null);
  if (!mountContainer) return null;

  return ReactDOM.createPortal(node, mountContainer);
};

// --------------------------------------------------------------------------
// Tooltip Wrapper Component (Declarative Usage)
// --------------------------------------------------------------------------
export interface TooltipProps extends Omit<TooltipPortalProps, "visible" | "anchorRect"> {
  /** The interactive trigger element (e.g. <button>, <a>, <div>) */
  children: ReactElement;
  /** Delay in milliseconds before showing tooltip */
  delay?: number;
  /** Delay in milliseconds before hiding tooltip */
  hideDelay?: number;
  /** Whether the tooltip is disabled */
  disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  delay = 120,
  hideDelay = 0,
  disabled = false,
  text,
  placement = "top",
  offset = 8,
  crossOffset,
  variant = "dark",
  size = "sm",
  shortcut,
  description,
  icon,
  badge,
  badgeVariant,
  showArrow = true,
  glow = false,
  maxWidth,
  className,
  style,
  container,
  id,
}) => {
  const [visible, setVisible] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (disabled) return;
      clearTimer();
      const rect = e.currentTarget.getBoundingClientRect();
      setAnchorRect(rect);
      if (delay > 0) {
        timerRef.current = window.setTimeout(() => {
          setVisible(true);
        }, delay);
      } else {
        setVisible(true);
      }
    },
    [disabled, delay]
  );

  const handleMouseLeave = useCallback(() => {
    clearTimer();
    if (hideDelay > 0) {
      timerRef.current = window.setTimeout(() => {
        setVisible(false);
      }, hideDelay);
    } else {
      setVisible(false);
    }
  }, [hideDelay]);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLElement>) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setAnchorRect(rect);
    setVisible(true);
  }, [disabled]);

  const handleBlur = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    return () => clearTimer();
  }, []);

  if (!isValidElement(children)) {
    return children;
  }

  const childProps = children.props as React.HTMLAttributes<HTMLElement>;

  const trigger = cloneElement(children as ReactElement<any>, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      // Preserve child's existing ref if any
      const existingRef = (children as any).ref;
      if (typeof existingRef === "function") {
        existingRef(node);
      } else if (existingRef && typeof existingRef === "object") {
        existingRef.current = node;
      }
    },
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      childProps.onMouseEnter?.(e);
      handleMouseEnter(e);
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      childProps.onMouseLeave?.(e);
      handleMouseLeave();
    },
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      childProps.onFocus?.(e);
      handleFocus(e);
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      childProps.onBlur?.(e);
      handleBlur();
    },
  });

  return (
    <>
      {trigger}
      <TooltipPortal
        text={text}
        visible={visible && !disabled}
        anchorRect={anchorRect}
        placement={placement}
        offset={offset}
        crossOffset={crossOffset}
        variant={variant}
        size={size}
        shortcut={shortcut}
        description={description}
        icon={icon}
        badge={badge}
        badgeVariant={badgeVariant}
        showArrow={showArrow}
        glow={glow}
        maxWidth={maxWidth}
        className={className}
        style={style}
        container={container}
        id={id}
      />
    </>
  );
};

// --------------------------------------------------------------------------
// useTooltip Hook
// --------------------------------------------------------------------------
export interface UseTooltipOptions {
  delay?: number;
  hideDelay?: number;
  disabled?: boolean;
}

export function useTooltip(options: UseTooltipOptions = {}) {
  const { delay = 100, hideDelay = 0, disabled = false } = options;
  const [visible, setVisible] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const timerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const onMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (disabled) return;
      clearTimer();
      const rect = e.currentTarget.getBoundingClientRect();
      setAnchorRect(rect);
      if (delay > 0) {
        timerRef.current = window.setTimeout(() => setVisible(true), delay);
      } else {
        setVisible(true);
      }
    },
    [disabled, delay]
  );

  const onMouseLeave = useCallback(() => {
    clearTimer();
    if (hideDelay > 0) {
      timerRef.current = window.setTimeout(() => setVisible(false), hideDelay);
    } else {
      setVisible(false);
    }
  }, [hideDelay]);

  useEffect(() => {
    return () => clearTimer();
  }, []);

  return {
    visible: visible && !disabled,
    anchorRect,
    triggerProps: {
      onMouseEnter,
      onMouseLeave,
      onFocus: (e: React.FocusEvent<HTMLElement>) => {
        if (disabled) return;
        setAnchorRect(e.currentTarget.getBoundingClientRect());
        setVisible(true);
      },
      onBlur: () => setVisible(false),
    },
    show: (rect: DOMRect) => {
      setAnchorRect(rect);
      setVisible(true);
    },
    hide: () => setVisible(false),
  };
}

export default TooltipPortal;
