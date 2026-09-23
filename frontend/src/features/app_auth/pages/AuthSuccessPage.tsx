import React, { useEffect, useState, useRef } from "react";
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Loader2,
  RefreshCw,
  Home,
} from "lucide-react";
import { SonikomaLogo } from "@/shared/ui/branding";

export interface AuthSuccessPageProps {
  navigateTo: (path: string) => void;
  checkAuth?: () => Promise<any>;
}

export default function AuthSuccessPage({
  navigateTo,
  checkAuth,
}: AuthSuccessPageProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const [progress, setProgress] = useState<number>(15);
  const [countdown, setCountdown] = useState<number>(2);

  const isNewUserRef = useRef(false);
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    try {
      // Extract query parameters (e.g. ?token=xyz&is_new=1)
      const queryParams = window.location.search;
      const params = new URLSearchParams(queryParams);

      let token = params.get("token") || params.get("code");
      const isNewParam =
        params.get("is_new") === "1" ||
        params.get("is_new") === "true" ||
        params.get("is_new_user") === "true" ||
        params.get("is_new_user") === "1";
      isNewUserRef.current = isNewParam;

      if (!token && typeof window !== "undefined") {
        token = localStorage.getItem("sonikoma_token");
      }

      if (!token) {
        const errParam = params.get("error") || params.get("error_description");
        if (errParam) {
          setErrorMsg(decodeURIComponent(errParam));
        } else {
          setErrorMsg("No authorization token was received from the server.");
        }
        setStatus("error");
        return;
      }

      // Save token to localStorage for authenticated session
      localStorage.setItem("sonikoma_token", token);

      // Clean query parameters from address bar to leave clean /auth-success
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Store explicit mutually exclusive flag for Welcome modal in Dashboard
      if (isNewParam) {
        sessionStorage.setItem("sonikoma_show_welcome_user", "true");
        sessionStorage.removeItem("sonikoma_show_welcome_back");
      } else {
        sessionStorage.setItem("sonikoma_show_welcome_back", "true");
        sessionStorage.removeItem("sonikoma_show_welcome_user");
      }

      // Trigger checkAuth in parallel to hydrate user profile in store
      if (typeof checkAuth === "function") {
        checkAuth().catch(() => {});
      }

      // Progress animation
      setStatus("success");
      setProgress(50);

      const pTimer = setTimeout(() => {
        setProgress(100);
      }, 500);

      const countInterval = setInterval(() => {
        setCountdown((prev) => (prev > 1 ? prev - 1 : 1));
      }, 700);

      // Transition timer: smoothly directs to Dashboard
      const redirectTimer = setTimeout(() => {
        clearInterval(countInterval);
        navigateTo("/dashboard");
      }, 1800);

      return () => {
        clearTimeout(pTimer);
        clearTimeout(redirectTimer);
        clearInterval(countInterval);
      };
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication process failed.");
      setStatus("error");
    }
  }, [navigateTo, checkAuth]);

  const handleEnterDashboard = () => {
    if (isNewUserRef.current) {
      sessionStorage.setItem("sonikoma_show_welcome_user", "true");
    } else {
      sessionStorage.setItem("sonikoma_show_welcome_back", "true");
    }
    navigateTo("/dashboard");
  };

  return (
    <div className="relative min-h-screen w-full bg-[#08090D] text-white flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden select-none font-sans">
      {/* ── Ambient Background Lighting Effects ── */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-purple-600/15 via-indigo-600/15 to-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-purple-900/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-cyan-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* ── Central Glassmorphic Card ── */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-neutral-800/80 bg-[#10121a]/85 backdrop-blur-2xl p-7 sm:p-9 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] text-center animate-in fade-in zoom-in-95 duration-300">
        {status === "error" ? (
          /* ── ERROR VIEW ── */
          <div className="flex flex-col items-center space-y-5 animate-in fade-in">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 shadow-inner">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-100 tracking-tight">
                Authentication Failed
              </h2>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
                We couldn&apos;t complete your authentication session.
              </p>
            </div>

            <div className="w-full bg-red-950/20 border border-red-900/30 rounded-xl p-3.5 text-left text-xs text-red-300/90 leading-relaxed max-h-36 overflow-y-auto">
              <span className="font-semibold block mb-0.5 text-red-200">
                Reason:
              </span>
              {errorMsg}
            </div>

            <div className="pt-2 w-full flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => navigateTo("/login")}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Return to Login
              </button>
              <button
                onClick={() => navigateTo("/")}
                className="py-2.5 px-4 rounded-xl bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700/60 text-neutral-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                Home
              </button>
            </div>
          </div>
        ) : (
          /* ── SUCCESS / VERIFYING VIEW ── */
          <div className="flex flex-col items-center space-y-6">
            {/* Glowing Icon Container */}
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-purple-600/30 via-indigo-500/30 to-cyan-400/30 rounded-full blur-md animate-pulse pointer-events-none" />
              <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-[#161924] border border-neutral-700/60 shadow-xl">
                {status === "verifying" ? (
                  <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                ) : (
                  <div className="relative flex items-center justify-center">
                    <SonikomaLogo size="lg" iconOnly />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#161924] flex items-center justify-center text-white shadow-md">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Title & Status Badges */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Authentication Successful</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-neutral-400 tracking-tight">
                Welcome to Sonikoma
              </h1>

              <p className="text-xs sm:text-sm text-neutral-400 max-w-xs mx-auto leading-relaxed">
                Your AI Comic &amp; Video Production workspace is ready.
              </p>
            </div>

            {/* Smooth Progress Bar */}
            <div className="w-full space-y-2 pt-1">
              <div className="w-full h-2 bg-neutral-800/80 rounded-full overflow-hidden p-0.5 border border-neutral-700/40">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 transition-all duration-700 ease-out shadow-[0_0_12px_rgba(168,85,247,0.5)]"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  Synchronizing studio data...
                </span>
                <span className="text-neutral-500">{progress}%</span>
              </div>
            </div>

            {/* Action CTA */}
            <div className="w-full pt-1">
              <button
                onClick={handleEnterDashboard}
                className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-purple-900/30 hover:shadow-purple-700/40 active:scale-[0.98] cursor-pointer"
              >
                <span>Enter Studio Dashboard</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <p className="text-[11px] text-neutral-500 mt-2">
                Redirecting automatically in {countdown}s...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Subtitle / Security Stamp Footer ── */}
      <div className="relative z-10 mt-6 flex items-center gap-2 text-neutral-500 text-[11px]">
        <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
        <span>256-Bit Encrypted OAuth Session • Sonikoma Cloud</span>
      </div>
    </div>
  );
}

