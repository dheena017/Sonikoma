import React, { useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { getProxiedImageUrl } from "@/utils";

export interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export function SafeImage({
  src,
  alt,
  className,
  fallbackClassName,
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const proxied = getProxiedImageUrl(src);
  const finalSrc =
    retryKey > 0
      ? `${proxied}${proxied.includes("?") ? "&" : "?"}_retry=${retryKey}`
      : proxied;

  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-3 text-center bg-neutral-900 border border-neutral-800 rounded-xl select-none ${
          fallbackClassName || "w-full h-full min-h-[140px]"
        }`}
      >
        <AlertTriangle className="h-6 w-6 text-amber-400 mb-1.5 shrink-0" />
        <span className="text-[11px] text-neutral-300 font-semibold truncate max-w-full">
          Slice preview failed
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setHasError(false);
            setRetryKey((k) => k + 1);
          }}
          className="mt-2 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-emerald-400 hover:text-emerald-300 text-[10px] font-medium transition-colors flex items-center gap-1 border border-neutral-700 active:scale-95 !cursor-pointer"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Reload</span>
        </button>
      </div>
    );
  }

  return (
    <img
      src={finalSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (retryKey < 1) {
          setRetryKey(1);
        } else {
          setHasError(true);
        }
      }}
    />
  );
}
