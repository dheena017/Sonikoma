import React, { useEffect, useState, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { SonikomaLogo } from "@/shared/ui/branding";

export interface AuthCallbackPageProps {
  navigateTo: (path: string) => void;
  checkAuth?: () => Promise<any>;
}

export default function AuthCallbackPage({ navigateTo, checkAuth }: AuthCallbackPageProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    try {
      // Extract current query parameters from URL (e.g. ?token=xyz or ?code=xyz)
      const queryParams = window.location.search;
      const params = new URLSearchParams(queryParams);
      
      let token = params.get("token") || params.get("code");
      
      if (!token && typeof window !== "undefined") {
        token = localStorage.getItem("sonikoma_token");
      }

      if (!token) {
        const errParam = params.get("error") || params.get("error_description");
        if (errParam) {
          setErrorMsg(decodeURIComponent(errParam));
        } else {
          setErrorMsg("No authentication token was received.");
        }
        return;
      }

      // Save token to localStorage for web session persistence
      localStorage.setItem("sonikoma_token", token);

      // Hydrate user auth session
      if (typeof checkAuth === "function") {
        checkAuth().catch(() => {});
      }

      // Clean sensitive query parameters from the address bar
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Smooth web redirect to your app dashboard
      const timer = setTimeout(() => {
        navigateTo("/dashboard");
      }, 1500);

      return () => clearTimeout(timer);
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed.");
    }
  }, [navigateTo, checkAuth]);

  return (
    <div className="min-h-screen w-full bg-[#181818] text-white flex flex-col items-center justify-between p-8 font-sans select-none">
      {/* Top Spacer */}
      <div className="w-full h-8" />

      {/* Center Brand Logo, Descriptive Words & Status */}
      <div className="flex flex-col items-center text-center space-y-6 my-auto max-w-md">
        {errorMsg ? (
          <div className="flex flex-col items-center text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-sm text-neutral-300">{errorMsg}</p>
            <button
              onClick={() => navigateTo("/login")}
              className="mt-2 text-xs font-semibold text-blue-400 hover:underline cursor-pointer"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <>
            <div className="pb-2">
              <SonikomaLogo size="xl" iconOnly />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-normal text-neutral-200 tracking-tight">
                Authenticating Sonikoma
              </h1>
              <p className="text-sm text-neutral-400 font-normal">
                Setting up your secure workspace session...
              </p>
              <p className="text-xs text-neutral-500 max-w-sm pt-1 leading-relaxed">
                We&apos;re verifying your Google credentials and preparing your AI comic &amp; video creation studio.
              </p>
            </div>

            {/* Action Button and helper note */}
            <div className="pt-4 flex flex-col items-center space-y-3">
              <button
                onClick={() => navigateTo("/dashboard")}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors cursor-pointer shadow-lg active:scale-95"
              >
                Go to Dashboard
              </button>
              <p className="text-[11px] text-neutral-500">
                If you are not redirected automatically in a moment, click above to enter your studio.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Bottom Spacer */}
      <div className="pb-6" />
    </div>
  );
}
