import React, { useEffect, useState, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { SonikomaLogo } from "@/shared/ui/branding";

export interface AuthCallbackPageProps {
  navigateTo: (path: string) => void;
  checkAuth?: () => Promise<any>;
}

export default function AuthCallbackPage({ navigateTo, checkAuth }: AuthCallbackPageProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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
          setErrorMsg("No authentication token was received.");
        }
        return;
      }

      // Save token to localStorage for session persistence
      localStorage.setItem("sonikoma_token", token);

      // Clean query parameters from address bar
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Store explicit mutually exclusive flag for Welcome modal before navigating to Dashboard
      if (isNewParam) {
        sessionStorage.setItem("sonikoma_show_welcome_user", "true");
        sessionStorage.removeItem("sonikoma_show_welcome_back");
      } else {
        sessionStorage.setItem("sonikoma_show_welcome_back", "true");
        sessionStorage.removeItem("sonikoma_show_welcome_user");
      }

      // Trigger checkAuth in parallel to hydrate user state
      if (typeof checkAuth === "function") {
        checkAuth().catch(() => {});
      }

      // Transition timer: displays Callback page 1st, then redirects to Dashboard where Welcome modal opens
      const timer = setTimeout(() => {
        navigateTo("/dashboard");
      }, 1500);

      return () => clearTimeout(timer);
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed.");
    }
  }, [navigateTo, checkAuth]);

  // When user clicks the blue "Go to Dashboard" button:
  const handleGoToDashboardButtonClick = () => {
    if (isNewUserRef.current) {
      sessionStorage.setItem("sonikoma_show_welcome_user", "true");
    } else {
      sessionStorage.setItem("sonikoma_show_welcome_back", "true");
    }
    navigateTo("/dashboard");
  };

  return (
    <div className="min-h-screen w-full bg-[#181818] text-white flex flex-col items-center justify-between p-8 font-sans select-none">
      <div className="w-full h-8" />

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
                Setting up your secure studio session...
              </p>
              <p className="text-xs text-neutral-500 max-w-sm pt-1 leading-relaxed">
                Verifying credentials and preparing your AI comic &amp; video creation workspace.
              </p>
            </div>

            {/* Click button to enter Dashboard where WelcomeUser / WelcomeBack modal pops up */}
            <div className="pt-4 flex flex-col items-center space-y-3">
              <button
                onClick={handleGoToDashboardButtonClick}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-all cursor-pointer shadow-lg active:scale-95"
              >
                Go to Dashboard
              </button>
            </div>
          </>
        )}
      </div>

      <div className="pb-6" />
    </div>
  );
}
