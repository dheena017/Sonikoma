import React from "react";
import { QuickStartGuide, EngineStatus, SystemResources, GuidesReference } from "@/features/app_dashboard/components/Sidebar/index";
import { OnboardingTask } from "@/features/app_dashboard/components/Sidebar/QuickStartGuide";

interface DashboardSidebarProps {
  onboardingTasks: OnboardingTask[];
  latency: number | null;
  metrics: any;
  analytics: any;
  onNavigate: (path: string) => void;
}

export default function DashboardSidebar({
  onboardingTasks,
  latency,
  metrics,
  analytics,
  onNavigate,
}: DashboardSidebarProps) {
  return (
    <div className="space-y-6">
      <QuickStartGuide onboardingTasks={onboardingTasks} onNavigate={onNavigate} />
      <EngineStatus latency={latency} />
      <SystemResources metrics={metrics} analytics={analytics} />
      <GuidesReference onNavigate={onNavigate} />
    </div>
  );
}
