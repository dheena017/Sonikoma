import { LucideIcon } from "lucide-react";
import { FetchClient } from "@/shared/api/types";

export type AdminSectionId =
  | "overview"
  | "users"
  | "credits"
  | "announcements"
  | "content"
  | "jobs"
  | "scrapers"
  | "health"
  | "activity"
  | "analytics"
  | "finance"
  | "usage"
  | "settings"
  | "explorer"
  | "console"
  | "training";

// Backward-compatible alias
export type AdminTabId = AdminSectionId;

export interface AdminPageMetadata {
  title: string;
  desc: string;
  badge: string;
}

// Backward-compatible alias
export type AdminTabMetadata = AdminPageMetadata;

export interface AdminNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  badge?: string;
}

export interface AdminNavGroup {
  name: string;
  items: AdminNavItem[];
}

export interface AdminUser {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  role?: string;
  creator_role?: string;
  credits?: number;
  created_at?: string;
  last_login?: string;
  is_banned?: boolean;
}

export interface AdminAuditLog {
  id: number | string;
  action: string;
  user_id?: string;
  email?: string;
  ip_address?: string;
  status: "Success" | "Failed" | string;
  created_at: string;
  details?: any;
}

export interface AdminBackendStats {
  users: number;
  projects: number;
  scenes: number;
  memory: string;
  dbLatencyMs: number;
  gpuWorkers: {
    total: number;
    busy: number;
    idle: number;
  };
  uptime: string;
  cpuPct: number;
  activeJobs: number;
}

export interface AdminBasePageProps {
  fetchWithInterceptor: FetchClient;
  addNotification?: (message: string, type?: "success" | "error" | "info" | "warning") => void;
  audioFeedback?: any;
}

// Backward-compatible alias
export type AdminBaseTabProps = AdminBasePageProps;
