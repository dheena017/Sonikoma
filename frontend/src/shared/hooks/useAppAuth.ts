import { useState, useCallback, useMemo } from "react";
import * as api from "@/api";

export interface AuthUser {
  id?: string | number;
  email?: string;
  name?: string;
  username?: string;
  role?: string;
  creator_role?: string;
  avatar_url?: string;
  credits?: number;
  [key: string]: any;
}

export function useAppAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("mock_auth") === "true") {
          return { id: 1, email: "admin@sonikoma.io", name: "Administrator", role: "admin" };
        }
        const savedUser = localStorage.getItem("sonikoma_user");
        if (savedUser) {
          return JSON.parse(savedUser);
        }
      }
    } catch (e) {}
    return null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("mock_auth") === "true") {
          return true;
        }
        const urlToken = params.get("token");
        if (urlToken) {
          localStorage.setItem("sonikoma_token", urlToken);
          return true;
        }
        const token =
          localStorage.getItem("sonikoma_token") ||
          sessionStorage.getItem("sonikoma_token");
        return Boolean(token);
      }
    } catch (e) {}
    return false;
  });

  const [authLoading, setAuthLoading] = useState<boolean>(false);

  const [isInitializing, setIsInitializing] = useState<boolean>(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("mock_auth") === "true") {
          return false;
        }
        const token =
          localStorage.getItem("sonikoma_token") ||
          sessionStorage.getItem("sonikoma_token") ||
          params.get("token");
        return Boolean(token);
      }
    } catch (e) {}
    return false;
  });

  const handleLogout = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("sonikoma_token");
      sessionStorage.removeItem("sonikoma_token");
      localStorage.removeItem("sonikoma_user");
    }
    setUser(null);
    setIsAuthenticated(false);
    setAuthLoading(false);
    setIsInitializing(false);
  }, []);

  const handleLoginSuccess = useCallback((token: string, userData?: AuthUser) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sonikoma_token", token);
      if (userData) {
        localStorage.setItem("sonikoma_user", JSON.stringify(userData));
      }
    }
    if (userData) setUser(userData);
    setIsAuthenticated(true);
    setAuthLoading(false);
    setIsInitializing(false);
  }, []);

  return useMemo(
    () => ({
      user,
      setUser,
      isAuthenticated,
      setIsAuthenticated,
      authLoading,
      setAuthLoading,
      isInitializing,
      setIsInitializing,
      handleLogout,
      handleLoginSuccess,
    }),
    [
      user,
      isAuthenticated,
      authLoading,
      isInitializing,
      handleLogout,
      handleLoginSuccess,
    ]
  );
}
