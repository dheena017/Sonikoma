import React, { useState, useEffect } from "react";
import {
  Film,
  Activity,
  Terminal,
  Sliders,
  Scissors,
  Brain,
  Keyboard,
  Sparkles,
  X,
  LayoutDashboard,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { GeneratedPanel } from "../types";

interface SidebarProps {
  isProcessing: boolean;
  panels: GeneratedPanel[];
  scrapedImages: string[];
  totalCalculatedDuration: number;
  currentPath: string;
  editingImageIdx: number | null;
  lastEditorPath: string;
  isBatchCropping: boolean;
  isCleaningBubbles: boolean;
  isOpen: boolean;
  onClose: () => void;
  projectId?: string | null;
}

export default function Sidebar({
  isProcessing,
  panels,
  scrapedImages,
  totalCalculatedDuration,
  currentPath,
  editingImageIdx,
  lastEditorPath,
  isBatchCropping,
  isCleaningBubbles,
  isOpen,
  onClose,
  projectId = null,
}: SidebarProps) {
  const isDashboard = currentPath === "/dashboard";
  const isSettings = currentPath === "/settings";
  const isAutoCrop = currentPath === "/auto-crop";
  const isBubbleCleaner = currentPath === "/bubble-cleaner";
  const isEditor = currentPath.startsWith("/editor");
  const isLogs = currentPath === "/logs";
  const isStatus = currentPath === "/status";
  const isShortcuts = currentPath === "/shortcuts";
  const isProjectDetails = currentPath === "/project-details";

  const params = new URLSearchParams(window.location.search);
  const activeProjectId = params.get("id") || projectId;

  const isAiSuiteActive =
    currentPath.startsWith("/ai-") || currentPath === "/panel-assistant";
  const [aiSuiteExpanded, setAiSuiteExpanded] = useState(isAiSuiteActive);

  // Automatically expand AI Suite if active route is an AI page
  useEffect(() => {
    if (isAiSuiteActive) {
      setAiSuiteExpanded(true);
    }
  }, [isAiSuiteActive]);

  const navigateTo = (path: string) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new Event("popstate"));
    onClose(); // Close mobile drawer when navigating
  };

  const menuItems = [
    {
      group: "Main Workspace",
      items: [
        {
          label: "Dashboard",
          icon: LayoutDashboard,
          active: isDashboard,
          onClick: () => navigateTo("/dashboard"),
          enabled: true,
        },
        ...(activeProjectId
          ? [
              {
                label: "Project Details",
                icon: FileText,
                active: isProjectDetails,
                onClick: () => navigateTo(`/project-details?id=${activeProjectId}`),
                enabled: true,
              },
            ]
          : []),
        {
          label: "Auto-Crop",
          icon: Scissors,
          active: isAutoCrop,
          onClick: () => navigateTo("/auto-crop"),
          enabled: true,
          badge:
            scrapedImages.length > 0
              ? scrapedImages.length
              : panels.length > 0
              ? panels.length
              : undefined,
          isProcessing: isBatchCropping,
        },
        {
          label: "Clean-Bubbles",
          icon: Brain,
          active: isBubbleCleaner,
          onClick: () => navigateTo("/bubble-cleaner"),
          enabled: true,
          isProcessing: isCleaningBubbles,
        },
        {
          label: "Editor",
          icon: Film,
          active: isEditor,
          onClick: () => {
            if (lastEditorPath) navigateTo(lastEditorPath);
          },
          enabled: scrapedImages.length > 0 || panels.length > 0,
          badge:
            editingImageIdx !== null
              ? `#${editingImageIdx + 1}`
              : panels.length > 0
              ? `Total: ${panels.length}`
              : undefined,
          disabledTip: "Requires scraped images or storyboard panels",
        },
      ],
    },
    {
      group: "Diagnostics & Controls",
      items: [
        {
          label: "Logs",
          icon: Terminal,
          active: isLogs,
          onClick: () => navigateTo("/logs"),
          enabled: true,
        },
        {
          label: "Status",
          icon: Activity,
          active: isStatus,
          onClick: () => navigateTo("/status"),
          enabled: true,
        },
        {
          label: "Keys",
          icon: Keyboard,
          active: isShortcuts,
          onClick: () => navigateTo("/shortcuts"),
          enabled: true,
        },
        {
          label: "Settings",
          icon: Sliders,
          active: isSettings,
          onClick: () => navigateTo("/settings"),
          enabled: true,
        },
      ],
    },
    {
      group: "Account",
      items: [
        {
          label: "Profile",
          icon: Sparkles,
          active: currentPath === "/profile",
          onClick: () => navigateTo("/profile"),
          enabled: true,
        },
      ],
    },
  ];

  const aiSuiteItems = [
    { label: "Video Optimizer", path: "/ai-optimizer" },
    { label: "Panel Assistant", path: "/panel-assistant" },
    { label: "Character DB", path: "/ai-characters" },
    { label: "Translation Studio", path: "/ai-translation" },
    { label: "Sound Design Lab", path: "/ai-audio-lab" },
    { label: "Thumbnail Studio", path: "/ai-thumbnails" },
    { label: "Community Coach", path: "/ai-engagement" },
    { label: "Voice Studio", path: "/ai-voice" },
    { label: "CTR Predictor", path: "/ai-analytics" },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-5 space-y-6">
      {/* BRANDING LOGO */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer select-none hover:opacity-90 transition-opacity"
            onClick={() => navigateTo("/dashboard")}
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/40 shrink-0">
              <Film className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white font-sans">
                  Webtoon<span className="text-purple-400">To</span>Video
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono">
                Vision Pipeline Suite
              </p>
            </div>
          </div>

          {/* Close button for Mobile drawer */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* NAVIGATION MENUS */}
        <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-none pr-1">
          {menuItems.map((group) => (
            <div key={group.group} className="space-y-2">
              <h4 className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest font-mono pl-2">
                {group.group}
              </h4>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.label}>
                      <button
                        onClick={item.onClick}
                        disabled={!item.enabled}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold font-mono transition-all duration-200 cursor-pointer text-left relative group disabled:opacity-35 disabled:cursor-not-allowed ${
                          item.active
                            ? "text-white bg-purple-950/20 border border-purple-900/60 shadow-inner"
                            : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent"
                        } ${
                          item.isProcessing
                            ? "ring-1 ring-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.2)]"
                            : ""
                        }`}
                        title={!item.enabled ? item.disabledTip : item.label}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`h-4 w-4 ${
                              item.active
                                ? "text-purple-400"
                                : "text-neutral-500 group-hover:text-neutral-300"
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                              item.active
                                ? "bg-purple-900 text-purple-200"
                                : "bg-black/55 text-neutral-400"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {item.isProcessing && (
                          <span className="absolute right-3 top-3.5 h-1.5 w-1.5 rounded-full bg-purple-400 animate-ping" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* AI Creative Suite Dropdown/Accordion */}
          <div className="space-y-2">
            <h4 className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest font-mono pl-2">
              Creative Tools
            </h4>
            <div className="space-y-1">
              <button
                onClick={() => setAiSuiteExpanded(!aiSuiteExpanded)}
                disabled={panels.length === 0}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold font-mono transition-all duration-200 cursor-pointer text-left border disabled:opacity-35 disabled:cursor-not-allowed ${
                  isAiSuiteActive
                    ? "text-purple-300 bg-purple-950/10 border-purple-900/40"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border-transparent"
                }`}
                title={
                  panels.length === 0
                    ? "Requires active storyboard panels"
                    : "AI Creative Suite"
                }
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles
                    className={`h-4 w-4 ${
                      isAiSuiteActive
                        ? "text-purple-400 animate-pulse"
                        : "text-neutral-500"
                    }`}
                  />
                  <span>AI Suite</span>
                </div>
                {aiSuiteExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5 text-neutral-500" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
                )}
              </button>

              {aiSuiteExpanded && panels.length > 0 && (
                <div className="pl-4 pr-1 py-1.5 space-y-1 bg-neutral-950/40 rounded-xl border border-neutral-900/40 mt-1">
                  {aiSuiteItems.map((subItem) => {
                    const isSubActive = currentPath === subItem.path;
                    return (
                      <button
                        key={subItem.label}
                        onClick={() => navigateTo(subItem.path)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-[11px] font-mono hover:bg-neutral-900 hover:text-white transition-all cursor-pointer ${
                          isSubActive
                            ? "text-purple-300 font-bold bg-neutral-900/60"
                            : "text-neutral-400"
                        }`}
                      >
                        ✦ {subItem.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM STATUS CARD */}
      <div className="space-y-4 pt-4 border-t border-neutral-900">
        {/* Status Indicator */}
        <div className="px-3 py-2.5 rounded-xl border flex items-center justify-between font-mono border-neutral-900 bg-neutral-950/80">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isProcessing ? "bg-purple-500 animate-ping" : "bg-emerald-500"
              }`}
            />
            <span className="text-[10px] text-neutral-300 font-bold">
              {isProcessing ? "PROCESSING" : "ENGINE READY"}
            </span>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded tracking-wider bg-purple-950 text-purple-400 border border-purple-900/60">
            v1.0
          </span>
        </div>

        {/* Total calculated output metadata */}
        {panels.length > 0 && (
          <div className="px-3 py-2 rounded-xl bg-neutral-900/30 text-neutral-400 text-[10px] font-mono flex items-center justify-between border border-neutral-900/40">
            <span>Video Duration:</span>
            <span className="font-bold text-neutral-200">
              {totalCalculatedDuration.toFixed(1)}s
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:block bg-neutral-950/80 border-r border-neutral-900 h-screen sticky top-0 flex-shrink-0 z-30 shadow-xl shadow-black/40 transition-all duration-300 ease-in-out ${
          isOpen ? "w-64 xl:w-72" : "w-0 border-r-0 overflow-hidden"
        }`}
      >
        <div className="w-64 xl:w-72 h-full">{sidebarContent}</div>
      </aside>

      {/* Mobile drawer backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Mobile drawer container */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-72 bg-neutral-950/95 border-r border-neutral-900 h-full z-50 transition-transform duration-300 ease-out transform ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
