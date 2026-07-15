import React from "react";
import { QuickStartGuide, EngineStatus, SystemResources, GuidesReference } from "./Sidebar/index.js";
import { OnboardingTask } from "./Sidebar/QuickStartGuide.js";

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
      <QuickStartGuide onboardingTasks={onboardingTasks} />
      <EngineStatus latency={latency} />
      <SystemResources metrics={metrics} analytics={analytics} />
      <GuidesReference onNavigate={onNavigate} />
    </div>
  );
}
