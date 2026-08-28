import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw, Home, ArrowLeft } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[CRITICAL] Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoBack = () => {
    this.setState({ hasError: false, error: null });
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070709] flex items-center justify-center p-6 text-neutral-100 font-sans">
          <div className="max-w-lg w-full bg-neutral-900 border border-rose-500/20 rounded-[32px] p-8 sm:p-10 text-center shadow-2xl shadow-rose-950/20 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <AlertTriangle className="w-10 h-10 text-rose-500" />
            </div>

            <h1 className="text-2xl font-black text-white mb-3">
              Application Fault Detected
            </h1>
            <p className="text-neutral-400 text-sm mb-8 leading-relaxed font-mono">
              A critical runtime error occurred in the UI layer. The workspace
              state has been preserved, but the view must be reset.
            </p>

            {this.state.error && (
              <div className="bg-black/40 border border-white/5 rounded-2xl p-4 mb-8 text-left overflow-x-auto">
                <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">
                  Error Trace
                </p>
                <code className="text-[11px] text-neutral-500 font-mono break-all">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-1.5 bg-neutral-800 hover:bg-neutral-750 text-white font-bold py-3 rounded-2xl text-xs transition-all cursor-pointer border border-neutral-700"
                title="Reload the current browser tab"
              >
                <RefreshCcw className="w-4 h-4 text-neutral-400" />
                <span>Reload App</span>
              </button>
              <button
                onClick={this.handleGoBack}
                className="flex items-center justify-center gap-1.5 bg-neutral-800 hover:bg-neutral-750 text-white font-bold py-3 rounded-2xl text-xs transition-all cursor-pointer border border-neutral-700"
                title="Return to the previous page"
              >
                <ArrowLeft className="w-4 h-4 text-[#3B82F6]" />
                <span>Go Back</span>
              </button>
              <button
                onClick={this.handleReset}
                className="btn-primary flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-[#3B82F6]/20"
                title="Return to Dashboard Home"
              >
                <Home className="w-4 h-4" />
                <span>Back Home</span>
              </button>
            </div>

            <p className="mt-8 text-[10px] text-neutral-600 font-mono uppercase tracking-tighter">
              Session ID:{" "}
              {Math.random().toString(36).substring(7).toUpperCase()} • Error
              Boundary v1.0
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
