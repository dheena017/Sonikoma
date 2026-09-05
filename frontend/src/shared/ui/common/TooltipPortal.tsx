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
  /** Custom max width (defaults to 320px for multiline, or auto) */
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
  dark: "bg-neutral-900/95 border-neutral-700/80 text-neutral-100 shadow-black/70 shadow-2xl",
  glass: "bg-neutral-900/85 backdrop-blur-xl border-white/15 text-neutral-100 shadow-[0_8px_32px_rgba(0,0,0,0.6)]",
  neon: "bg-[#0c1017]/95 border-blue-500/50 text-cyan-50 shadow-[0_0_20px_rgba(6,182,212,0.3)] shadow-cyan-950/50",
  cyber: "bg-[#110d1f]/95 border-[#3B82F6]/50 text-[#3B82F6]  shadow-black/50",
  gradient: "bg-gradient-to-r from-neutral-900/95 via-[#2A2A2A] to-neutral-900/95 border-[#3B82F6]/40 text-white shadow-2xl shadow-black/50",
  primary: "bg-blue-950/95 border-blue-500/50 text-blue-50 shadow-2xl shadow-blue-950/60",
  success: "bg-emerald-950/95 border-emerald-500/50 text-emerald-50 shadow-2xl shadow-emerald-950/60",
  warning: "bg-amber-950/95 border-amber-500/50 text-amber-50 shadow-2xl shadow-amber-950/60",
  danger: "bg-rose-950/95 border-rose-500/50 text-rose-50 shadow-2xl shadow-rose-950/60",
};

const GLOW_COLORS: Record<TooltipVariant, string> = {
  dark: "shadow-[0_0_25px_rgba(0,0,0,0.8)]",
  glass: "shadow-[0_0_25px_rgba(255,255,255,0.12)]",
  neon: "shadow-[0_0_25px_rgba(6,182,212,0.4)]",
  cyber: "",
  gradient: "",
  primary: "",
  success: "shadow-[0_0_25px_rgba(16,185,129,0.4)]",
  warning: "shadow-[0_0_25px_rgba(245,158,11,0.4)]",
  danger: "shadow-[0_0_25px_rgba(244,63,94,0.4)]",
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
  purple: "bg-[#3B82F6]/20 text-[#60A5FA] border-[#3B82F6]/40",
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
  offset = 12,
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
  const [mounted, setMounted] = useState(() => typeof document !== "undefined");

  useEffect(() => {
    setMounted(true);
  }, []);

  const content = text ?? children;

  // Normalize shortcut into an array
  const shortcutKeys: string[] = useMemo(() => {
    if (!shortcut) return [];
    if (Array.isArray(shortcut)) return shortcut;
    if (shortcut.includes("+")) return shortcut.split("+");
    return [shortcut];
  }, [shortcut]);

  // Compute positioning CSS directly and reliably
  const { calculatedStyle, resolvedPlacement, arrowPlacement } = useMemo(() => {
    if (!anchorRect) {
      return { calculatedStyle: {}, resolvedPlacement: placement, arrowPlacement: "left" };
    }

    const { top, left, right, bottom, width, height } = anchorRect;
    const vpWidth = typeof window !== "undefined" ? window.innerWidth : 1920;
    const vpHeight = typeof window !== "undefined" ? window.innerHeight : 1080;

    let finalPlacement = placement;

    // Smart safe flipping only when necessary and when there is ample space on the other side
    if (finalPlacement.startsWith("right") && right + offset + 120 > vpWidth && left - offset > 120) {
      finalPlacement = finalPlacement.replace("right", "left") as TooltipPlacement;
    } else if (finalPlacement.startsWith("left") && left - offset - 120 < 0 && vpWidth - right > 120) {
      finalPlacement = finalPlacement.replace("left", "right") as TooltipPlacement;
    } else if (finalPlacement.startsWith("top") && top - offset - 36 < 0 && vpHeight - bottom > 60) {
      finalPlacement = finalPlacement.replace("top", "bottom") as TooltipPlacement;
    } else if (finalPlacement.startsWith("bottom") && bottom + offset + 36 > vpHeight && top - offset > 60) {
      finalPlacement = finalPlacement.replace("bottom", "top") as TooltipPlacement;
    }

    // Auto align start/end if centered tooltip would overflow viewport sides
    if (finalPlacement === "bottom" || finalPlacement === "top") {
      if (left + width / 2 - 110 < 12) {
        finalPlacement = (finalPlacement + "-start") as TooltipPlacement;
      } else if (left + width / 2 + 110 > vpWidth - 12) {
        finalPlacement = (finalPlacement + "-end") as TooltipPlacement;
      }
    }

    const posStyle: React.CSSProperties = {
      position: "fixed",
      zIndex: 9900,
      pointerEvents: "none",
    };

    let arrowPos = "left";

    switch (finalPlacement) {
      case "right":
        posStyle.left = right + offset;
        posStyle.top = top + height / 2 + crossOffset;
        posStyle.transform = "translateY(-50%)";
        arrowPos = "left";
        break;
      case "right-start":
        posStyle.left = right + offset;
        posStyle.top = top + crossOffset;
        arrowPos = "left-start";
        break;
      case "right-end":
        posStyle.left = right + offset;
        posStyle.top = bottom + crossOffset;
        posStyle.transform = "translateY(-100%)";
        arrowPos = "left-end";
        break;
      case "left":
        posStyle.left = left - offset;
        posStyle.top = top + height / 2 + crossOffset;
        posStyle.transform = "translate(-100%, -50%)";
        arrowPos = "right";
        break;
      case "left-start":
        posStyle.left = left - offset;
        posStyle.top = top + crossOffset;
        posStyle.transform = "translateX(-100%)";
        arrowPos = "right-start";
        break;
      case "left-end":
        posStyle.left = left - offset;
        posStyle.top = bottom + crossOffset;
        posStyle.transform = "translate(-100%, -100%)";
        arrowPos = "right-end";
        break;
      case "top":
        posStyle.left = Math.max(12, Math.min(vpWidth - 12, left + width / 2 + crossOffset));
        posStyle.top = top - offset;
        posStyle.transform = "translate(-50%, -100%)";
        arrowPos = "bottom";
        break;
      case "top-start":
        posStyle.left = Math.max(12, left + crossOffset);
        posStyle.top = top - offset;
        posStyle.transform = "translateY(-100%)";
        arrowPos = "bottom-start";
        break;
      case "top-end":
        posStyle.left = Math.min(vpWidth - 12, right + crossOffset);
        posStyle.top = top - offset;
        posStyle.transform = "translate(-100%, -100%)";
        arrowPos = "bottom-end";
        break;
      case "bottom":
        posStyle.left = Math.max(12, Math.min(vpWidth - 12, left + width / 2 + crossOffset));
        posStyle.top = bottom + offset;
        posStyle.transform = "translateX(-50%)";
        arrowPos = "top";
        break;
      case "bottom-start":
        posStyle.left = Math.max(12, left + crossOffset);
        posStyle.top = bottom + offset;
        arrowPos = "top-start";
        break;
      case "bottom-end":
        posStyle.left = Math.min(vpWidth - 12, right + crossOffset);
        posStyle.top = bottom + offset;
        posStyle.transform = "translateX(-100%)";
        arrowPos = "top-end";
        break;
    }

    return { calculatedStyle: posStyle, resolvedPlacement: finalPlacement, arrowPlacement: arrowPos };
  }, [anchorRect, placement, offset, crossOffset]);

  if (!mounted || !visible || !anchorRect || (!content && !description)) {
    return null;
  }

  const sizeConfig = SIZE_STYLES[size] || SIZE_STYLES.sm;
  const variantClass = VARIANT_STYLES[variant] || VARIANT_STYLES.dark;
  const glowClass = glow ? GLOW_COLORS[variant] || "" : "";

  // Animation origin class based on placement
  const getAnimationClass = (place: TooltipPlacement) => {
    if (place.startsWith("right")) return "animate-in fade-in-0 zoom-in-95 duration-150";
    if (place.startsWith("left")) return "animate-in fade-in-0 zoom-in-95 duration-150";
    if (place.startsWith("top")) return "animate-in fade-in-0 zoom-in-95 duration-150";
    return "animate-in fade-in-0 zoom-in-95 duration-150";
  };

  const getArrowStyle = (): { className: string; style: React.CSSProperties } => {
    const base = "absolute w-2 h-2 pointer-events-none bg-neutral-900 border border-neutral-700/80 rotate-45";
    switch (arrowPlacement) {
      case "left":
        return { className: `${base} -left-1 top-1/2 -translate-y-1/2 border-t-0 border-r-0`, style: {} };
      case "left-start":
        return { className: `${base} -left-1 top-2 border-t-0 border-r-0`, style: {} };
      case "left-end":
        return { className: `${base} -left-1 bottom-2 border-t-0 border-r-0`, style: {} };
      case "right":
        return { className: `${base} -right-1 top-1/2 -translate-y-1/2 border-b-0 border-l-0`, style: {} };
      case "right-start":
        return { className: `${base} -right-1 top-2 border-b-0 border-l-0`, style: {} };
      case "right-end":
        return { className: `${base} -right-1 bottom-2 border-b-0 border-l-0`, style: {} };
      case "top":
        return { className: `${base} -top-1 left-1/2 -translate-x-1/2 border-b-0 border-r-0`, style: {} };
      case "top-start":
        return { className: `${base} -top-1 left-5 border-b-0 border-r-0`, style: {} };
      case "top-end":
        return { className: `${base} -top-1 right-5 border-b-0 border-r-0`, style: {} };
      case "bottom":
        return { className: `${base} -bottom-1 left-1/2 -translate-x-1/2 border-t-0 border-l-0`, style: {} };
      case "bottom-start":
        return { className: `${base} -bottom-1 left-5 border-t-0 border-l-0`, style: {} };
      case "bottom-end":
        return { className: `${base} -bottom-1 right-5 border-t-0 border-l-0`, style: {} };
      default:
        return { className: `${base} -left-1 top-1/2 -translate-y-1/2 border-t-0 border-r-0`, style: {} };
    }
  };

  const arrow = showArrow ? getArrowStyle() : null;

  const node = (
    <div
      id={id}
      role="tooltip"
      aria-hidden={!visible}
      style={{
        ...calculatedStyle,
        maxWidth,
        ...userStyle,
      }}
      className={`
        pointer-events-none border backdrop-blur-md flex flex-col justify-center
        duration-150 ease-out select-none whitespace-nowrap z-[9900]
        ${sizeConfig.root}
        ${variantClass}
        ${glowClass}
        ${getAnimationClass(resolvedPlacement)}
        ${className}
      `}
    >
      {/* Arrow Indicator */}
      {showArrow && arrow && (
        <div style={arrow.style} className={arrow.className} />
      )}

      {/* Main Content Row */}
      <div className="flex items-center gap-2 w-full">
        {icon && <span className="shrink-0 flex items-center opacity-85">{icon}</span>}

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
        <div className={`mt-0.5 text-neutral-400 font-normal leading-relaxed break-words whitespace-normal ${sizeConfig.desc}`}>
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
  delay = 100,
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

  const isChildDisabled = isValidElement(children) && Boolean(
    (children.props as any)?.disabled ||
    (children.props as any)?.['aria-disabled'] ||
    (children.props as any)?.isLoading ||
    (children.props as any)?.loading ||
    (children.props as any)?.isScraping
  );

  const isDisabled = disabled || isChildDisabled;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const hideTooltip = useCallback(() => {
    clearTimer();
    setVisible(false);
    setAnchorRect(null);
  }, [clearTimer]);

  useEffect(() => {
    if (isDisabled) {
      hideTooltip();
    }
  }, [isDisabled, hideTooltip]);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (isDisabled) return;
      clearTimer();
      const rect = e.currentTarget.getBoundingClientRect();
      setAnchorRect(rect);
      if (delay > 0) {
        timerRef.current = window.setTimeout(() => {
          if (triggerRef.current && !document.body.contains(triggerRef.current)) {
            hideTooltip();
            return;
          }
          setVisible(true);
        }, delay);
      } else {
        setVisible(true);
      }
    },
    [isDisabled, delay, clearTimer, hideTooltip]
  );

  const handleMouseLeave = useCallback(() => {
    clearTimer();
    if (hideDelay > 0) {
      timerRef.current = window.setTimeout(() => {
        hideTooltip();
      }, hideDelay);
    } else {
      hideTooltip();
    }
  }, [hideDelay, clearTimer, hideTooltip]);

  const handleClick = useCallback(() => {
    hideTooltip();
  }, [hideTooltip]);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLElement>) => {
    if (isDisabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setAnchorRect(rect);
    setVisible(true);
  }, [isDisabled]);

  const handleBlur = useCallback(() => {
    hideTooltip();
  }, [hideTooltip]);

  useEffect(() => {
    const handleGlobalHide = () => {
      hideTooltip();
    };

    window.addEventListener("scroll", handleGlobalHide, { capture: true, passive: true });
    window.addEventListener("resize", handleGlobalHide, { capture: true, passive: true });
    window.addEventListener("pointerdown", handleGlobalHide, { capture: true, passive: true });
    window.addEventListener("popstate", handleGlobalHide);

    return () => {
      hideTooltip();
      window.removeEventListener("scroll", handleGlobalHide, { capture: true });
      window.removeEventListener("resize", handleGlobalHide, { capture: true });
      window.removeEventListener("pointerdown", handleGlobalHide, { capture: true });
      window.removeEventListener("popstate", handleGlobalHide);
    };
  }, [hideTooltip]);

  if (!isValidElement(children)) {
    return children;
  }

  const childProps = children.props as React.HTMLAttributes<HTMLElement>;

  const trigger = cloneElement(children as ReactElement<any>, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      const existingRef = (children as any).ref;
      if (typeof existingRef === "function") {
        existingRef(node);
      } else if (existingRef && typeof existingRef === "object") {
        existingRef.current = node;
      }
    },
    title: undefined,
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      childProps.onMouseEnter?.(e);
      handleMouseEnter(e);
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      childProps.onMouseLeave?.(e);
      handleMouseLeave();
    },
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      childProps.onClick?.(e);
      handleClick();
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
        visible={visible && !isDisabled}
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

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    clearTimer();
    setVisible(false);
    setAnchorRect(null);
  }, [clearTimer]);

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
    [disabled, delay, clearTimer]
  );

  const onMouseLeave = useCallback(() => {
    clearTimer();
    if (hideDelay > 0) {
      timerRef.current = window.setTimeout(() => hide(), hideDelay);
    } else {
      hide();
    }
  }, [hideDelay, clearTimer, hide]);

  useEffect(() => {
    return () => hide();
  }, [hide]);

  return {
    visible: visible && !disabled,
    anchorRect,
    triggerProps: {
      onMouseEnter,
      onMouseLeave,
      onClick: hide,
      onFocus: (e: React.FocusEvent<HTMLElement>) => {
        if (disabled) return;
        setAnchorRect(e.currentTarget.getBoundingClientRect());
        setVisible(true);
      },
      onBlur: hide,
    },
    show: (rect: DOMRect) => {
      setAnchorRect(rect);
      setVisible(true);
    },
    hide,
  };
}

export default TooltipPortal;
