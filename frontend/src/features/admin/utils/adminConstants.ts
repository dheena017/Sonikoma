import {
  LayoutGrid,
  Mail,
  Users,
  FolderGit2,
  Cpu,
  Globe,
  DollarSign,
  BarChart3,
  Database,
  Terminal,
  Settings,
  Server,
  ActivitySquare,
  Coins,
  Activity,
  Brain,
} from "lucide-react";
import { AdminNavGroup, AdminPageMetadata } from "../types";

export const ADMIN_PAGE_METADATA: Record<string, AdminPageMetadata> = {
  overview: {
    title: "Root Telemetry Dashboard",
    desc: "Real-time infrastructure, pipeline telemetry & active creator metrics",
    badge: "Live Pulse",
  },
  users: {
    title: "User Accounts & Role Management",
    desc: "Inspect user accounts, manage creator roles, permissions, and security status",
    badge: "Access Control",
  },
  credits: {
    title: "Credits & Economy Control",
    desc: "Manage studio generation credits, transaction ledger, and top-ups",
    badge: "Ledger",
  },
  announcements: {
    title: "System Broadcasts & Alerts",
    desc: "Publish platform-wide broadcast alerts and scheduled maintenance notices",
    badge: "Broadcast",
  },
  content: {
    title: "Content Moderation & Projects",
    desc: "Inspect public and private storyboards, project status, and storage quotas",
    badge: "Assets",
  },
  jobs: {
    title: "Background Jobs & Task Execution",
    desc: "Monitor live processing queues, cancel hung tasks, and audit completed workers",
    badge: "Workers",
  },
  scrapers: {
    title: "Webtoon Engine Configuration",
    desc: "Tune scraper workers, domain proxies, selectors, and rate limiting",
    badge: "Engine",
  },
  health: {
    title: "Infrastructure & Server Health",
    desc: "Host CPU, GPU worker nodes, memory pools, and database connection latency",
    badge: "Telemetry",
  },
  activity: {
    title: "System Audit & Security Logs",
    desc: "Real-time administrative actions, authentication attempts, and event trail",
    badge: "Security Audit",
  },
  analytics: {
    title: "Platform Growth Analytics",
    desc: "User acquisition funnels, retention cohorts, and project creation velocity",
    badge: "BI Insights",
  },
  finance: {
    title: "Revenue & Subscription Ledger",
    desc: "Track Monthly Recurring Revenue (MRR), subscription churn, and payouts",
    badge: "Financials",
  },
  usage: {
    title: "Resource Consumption & Quotas",
    desc: "AI generation tokens, image rendering compute, and bandwidth utilization",
    badge: "Quotas",
  },
  settings: {
    title: "Platform Global Settings",
    desc: "Tune AI model endpoints, webhook secrets, rate limits, and server environment",
    badge: "System Config",
  },
  explorer: {
    title: "Database Query Explorer",
    desc: "Direct read-only schema navigation and table query workbench",
    badge: "Database",
  },
  console: {
    title: "Superuser Interactive Terminal",
    desc: "Direct command execution and server process diagnostics console",
    badge: "CLI Terminal",
  },
  training: {
    title: "AI Training & Data Flywheel",
    desc: "Manage the YOLO fine-tuning pipeline, dataset gallery, and auto-trigger configuration for speech bubble detection",
    badge: "ML Engine",
  },
};

export const ADMIN_TAB_METADATA = ADMIN_PAGE_METADATA;

export const getAdminPageMetadata = (sectionId: string): AdminPageMetadata => {
  return (
    ADMIN_PAGE_METADATA[sectionId] || {
      title: sectionId.charAt(0).toUpperCase() + sectionId.slice(1),
      desc: "Administrative management module and system telemetry workbench",
      badge: "Admin",
    }
  );
};

export const getTabMetadata = getAdminPageMetadata;

export const ADMIN_SIDEBAR_GROUPS: AdminNavGroup[] = [
  {
    name: "Core Infrastructure",
    items: [
      {
        id: "dashboard",
        label: "Root Dashboard",
        icon: LayoutGrid,
        path: "/admin",
      },
      {
        id: "announcements",
        label: "Announcements & Alerts",
        icon: Mail,
        path: "/admin/announcements",
      },
      {
        id: "users",
        label: "User Accounts",
        icon: Users,
        path: "/admin/users",
      },
      {
        id: "content",
        label: "Content Moderation",
        icon: FolderGit2,
        path: "/admin/content",
      },
    ],
  },
  {
    name: "Workers & Telemetry",
    items: [
      {
        id: "jobs",
        label: "Background Jobs",
        icon: Cpu,
        path: "/admin/jobs",
      },
      {
        id: "scrapers",
        label: "Scraper Workers",
        icon: Globe,
        path: "/admin/scrapers",
      },
      {
        id: "health",
        label: "Node & Host Health",
        icon: Server,
        path: "/admin/health",
      },
      {
        id: "activity",
        label: "Audit Logs",
        icon: Activity,
        path: "/admin/activity",
      },
      {
        id: "training",
        label: "AI Training",
        icon: Brain,
        path: "/admin/training",
      },
    ],
  },
  {
    name: "Financials & Quotas",
    items: [
      {
        id: "credits",
        label: "Credits Ledger",
        icon: Coins,
        path: "/admin/credits",
      },
      {
        id: "finance",
        label: "Revenue & MRR",
        icon: DollarSign,
        path: "/admin/finance",
      },
      {
        id: "analytics",
        label: "Growth Analytics",
        icon: BarChart3,
        path: "/admin/analytics",
      },
      {
        id: "usage",
        label: "Quota Limits",
        icon: ActivitySquare,
        path: "/admin/usage",
      },
    ],
  },
  {
    name: "System Tools",
    items: [
      {
        id: "explorer",
        label: "Database Explorer",
        icon: Database,
        path: "/admin/explorer",
      },
      {
        id: "console",
        label: "Superuser Console",
        icon: Terminal,
        path: "/admin/console",
      },
      {
        id: "settings",
        label: "Global Settings",
        icon: Settings,
        path: "/admin/settings",
      },
    ],
  },
];
