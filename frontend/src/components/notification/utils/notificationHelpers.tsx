import {
  CircleAlert,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";

export const getNotificationIcon = (type: string) => {
  switch (type) {
    case "error":
      return <CircleAlert className="h-5 w-5 text-rose-500 shrink-0" />;
    case "warning":
      return <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />;
    case "success":
      return <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />;
    default:
      return <Info className="h-5 w-5 text-blue-500 shrink-0" />;
  }
};

export const getNotificationIconBox = (type: string) => {
  switch (type) {
    case "error":
      return (
        <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <CircleAlert className="h-5 w-5 text-rose-500" />
        </div>
      );
    case "warning":
      return (
        <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <AlertCircle className="h-5 w-5 text-amber-500" />
        </div>
      );
    case "success":
      return (
        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <CheckCircle className="h-5 w-5 text-emerald-500" />
        </div>
      );
    default:
      return (
        <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <Info className="h-5 w-5 text-blue-500" />
        </div>
      );
  }
};

export const getTypeStyles = (type: string) => {
  switch (type) {
    case "error":
      return "text-rose-500 bg-rose-500/5 border-rose-500/20";
    case "warning":
      return "text-amber-500 bg-amber-500/5 border-amber-500/20";
    case "success":
      return "text-emerald-500 bg-emerald-500/5 border-emerald-500/20";
    default:
      return "text-blue-500 bg-blue-500/5 border-blue-500/20";
  }
};

export const getToastStyles = (errorCode?: number, type?: string) => {
  if (errorCode === 429) {
    return "bg-amber-950/95 border-amber-500/85 text-amber-100 shadow-amber-950/40 shadow-xl border-2";
  } else if (errorCode === 500) {
    return "bg-red-950/95 border-red-500 text-red-100 shadow-red-950/50 shadow-xl border-2";
  } else if (type === "error") {
    return "bg-rose-950/90 border-rose-800 text-rose-100";
  } else if (type === "warning") {
    return "bg-amber-950/90 border-amber-800 text-amber-100";
  } else if (type === "success") {
    return "bg-emerald-950/90 border-emerald-800 text-emerald-100";
  } else {
    return "bg-blue-950/90 border-blue-800 text-blue-100";
  }
};

export const getToastIcon = (errorCode?: number, type?: string) => {
  if (errorCode === 429) {
    return (
      <svg
        className="h-5 w-5 text-amber-400 shrink-0 animate-spin"
        style={{ animationDuration: "3s" }}
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );
  } else if (errorCode === 500) {
    return <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />;
  } else if (type === "error") {
    return <CircleAlert className="h-5 w-5 text-rose-400 shrink-0" />;
  } else if (type === "warning") {
    return <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />;
  } else if (type === "success") {
    return <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />;
  } else {
    return <Info className="h-5 w-5 text-blue-400 shrink-0" />;
  }
};

export const getToastTitle = (errorCode?: number, type?: string) => {
  if (errorCode === 429) {
    return "Quota Exhausted (429)";
  } else if (errorCode === 500) {
    return "Pipeline Failure (500)";
  } else if (type === "error") {
    return "Operation Error";
  } else if (type === "warning") {
    return "Warning";
  } else if (type === "success") {
    return "Success";
  } else {
    return "Information";
  }
};
