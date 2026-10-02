import React from "react";
import EngineStatus from "./Sidebar/EngineStatus";

interface DashboardSidebarProps {
  onboardingTasks?: any[];
  latency: number | null;
  metrics?: any;
  analytics?: any;
  onNavigate?: (path: string) => void;
}

export default function DashboardSidebar({ latency }: DashboardSidebarProps) {
  return (
    <div className="space-y-6">
      <EngineStatus latency={latency} />
    </div>
  );
}
