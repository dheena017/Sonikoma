import React, { useState, useEffect } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminNavbar from "./AdminNavbar";
import * as api from "../../api/index.js";

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
  const [isCollapsed, setIsCollapsed] = useState(false);
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
    <div className="min-h-screen bg-[#070709] text-neutral-100 flex selection:bg-violet-600 selection:text-white">
      {/* Sidebar */}
      <AdminSidebar
        currentPath={currentPath}
        navigateTo={navigateTo}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          isCollapsed ? "pl-20" : "pl-72"
        }`}
      >
        <AdminNavbar currentPath={currentPath} navigateTo={navigateTo} stats={stats} />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto animate-[fadeIn_0.3s_ease-out]">
            {children}
          </div>
        </main>

        <footer className="py-6 px-8 border-t border-violet-900/10 text-center">
          <p className="text-[10px] text-neutral-600 font-mono uppercase tracking-widest">
            Sonikoma Command Center &bull; Privileged Access Only
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;
