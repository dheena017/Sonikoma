import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Bell,
  BellOff,
  Clock,
  ExternalLink,
  Shield,
  Zap,
  Menu,
} from "lucide-react";
import * as api from "@/api";
import NotificationDropdown from "../notification/NotificationDropdown";

export interface AdminHeaderPageProps {
  currentPath: string;
  navigateTo: (path: string) => void;
  fetchWithInterceptor: any;
  onToggleSidebar?: () => void;
  notifications?: any[];
  markNotificationAsRead?: (id: number) => void;
  markAllNotificationsAsRead?: () => void;
  deleteNotification?: (id: number) => void;
  clearAllNotifications?: () => void;
  notificationsMuted?: boolean;
  setNotificationsMuted?: (muted: boolean) => void;
  // Add this prop
  isSidebarOpen?: boolean;
}

// ... Keep your AdminStats interface here ...

const AdminHeaderPage: React.FC<AdminHeaderPageProps> = ({
  currentPath,
  navigateTo,
  fetchWithInterceptor,
  onToggleSidebar,
  notifications = [],
  markNotificationAsRead = () => {},
  markAllNotificationsAsRead = () => {},
  deleteNotification = () => {},
  clearAllNotifications = () => {},
  notificationsMuted = false,
  setNotificationsMuted,
  isSidebarOpen = false, // Destructure it here
}) => {
  // ... Keep all your existing state, refs, and fetch functions here ...

  // (Assuming you have stats, searchQuery, showNotifications, etc. defined here)

  return (
    <header
      className={`h-16 bg-[#0a0a0e]/90 backdrop-blur-md border-b border-violet-900/20 fixed top-0 left-0 w-full z-40 flex items-center justify-between pr-6 md:pr-8 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isSidebarOpen
          ? "-translate-y-full opacity-0 pointer-events-none"
          : "translate-y-0 opacity-100"
      }`}
    >
      {/* Left side: Hamburger and Brand */}
      <div className="flex items-center shrink-0">
        <div className="w-auto lg:w-20 flex items-center justify-center shrink-0 pl-4 lg:pl-0">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-neutral-400 hover:text-white cursor-pointer transition-colors"
            title="Toggle Navigation Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigateTo("/admin")}
        >
          <div className="p-1.5 bg-violet-600 rounded-lg shadow-lg shadow-violet-600/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <span className="font-black text-white tracking-tight block leading-none text-sm">
              Command
            </span>
            <span className="text-[9px] text-violet-400 font-mono uppercase tracking-widest block mt-0.5 leading-none">
              Center
            </span>
          </div>
        </div>
      </div>

      {/* ... Keep the rest of your header content exactly the same ... */}
      {/* (Search bar, stats, and notification bell go here) */}
    </header>
  );
};

export default AdminHeaderPage;
