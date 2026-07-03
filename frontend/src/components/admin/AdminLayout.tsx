import React, { useState, useEffect } from "react";
import AdminNavbar from "./AdminNavbar";
import * as api from "@/api";

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPath: string;
  navigateTo: (path: string) => void;
  fetchWithInterceptor: any;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  currentPath,
  navigateTo,
  fetchWithInterceptor,
}) => {
  const [stats, setStats] = useState<any>({});

  const fetchStats = async () => {
    try {
      const data = await api.getMetrics(fetchWithInterceptor);
      setStats({
        users: data.database?.users || 0,
        projects: data.database?.projects || 0,
        scenes: data.database?.scenes || 0,
        memory: `${data.memory?.rssMB || 0}MB`,
        dbLatencyMs: data.database?.dbLatencyMs || 0,
        gpuWorkers: data.database?.gpuWorkers || {
          total: 0,
          busy: 0,
          idle: 0,
        },
        uptime: data.server?.uptime || "",
        cpuPct: data.memory?.cpuPct || 0,
        queueDepth: data.database?.activeJobs || 0,
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-full">
      {/*
        The AdminNavbar is now positioned below the global Header.
        Since the global Header is fixed/sticky, the Navbar will naturally flow below it
        within the scroll container.
      */}
      <AdminNavbar currentPath={currentPath} navigateTo={navigateTo} stats={stats} />

      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-7xl mx-auto animate-[fadeIn_0.3s_ease-out]">
          {children}
        </div>
      </main>

      <footer className="py-8 px-8 border-t border-violet-900/10 text-center bg-black/20">
        <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.3em] font-mono">
          Sonikoma Command Center &bull; Privileged Access Only
        </p>
      </footer>
    </div>
  );
};

export default AdminLayout;
