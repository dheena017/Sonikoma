import React from "react";
import { EngineStatus } from "@/features/app_dashboard/components/Sidebar/index";

interface DashboardSidebarProps {
  onboardingTasks?: any[];
  latency: number | null;
  metrics?: any;
  analytics?: any;
  onNavigate?: (path: string) => void;
}

export default function DashboardSidebar({
  latency,
}: DashboardSidebarProps) {
  return (
    <div className="space-y-6">
      <EngineStatus latency={latency} />
    </div>
  );
}
