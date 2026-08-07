import React, { useState } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import { APP_SUB_TABS, MOCK_APP_EXTENSIONS } from "../../data/appData";
import { AppsWorkspaceHeader } from "./components/AppsWorkspaceHeader";
import { AppExtensionCard } from "./components/AppExtensionCard";

interface AppsWorkspaceProps {
  onTriggerFeedback: (msg: string) => void;
}

export const AppsWorkspace: React.FC<AppsWorkspaceProps> = ({ onTriggerFeedback }) => {
  const [activeTab, setActiveTab] = useState("Cloud");
  const [searchQuery, setSearchQuery] = useState("");
  const [installed, setInstalled] = useState<Record<string, boolean>>(
    Object.fromEntries(MOCK_APP_EXTENSIONS.map((a) => [a.id, a.installed]))
  );

  const tabKey = activeTab.toLowerCase();
  const visibleApps = MOCK_APP_EXTENSIONS.filter((app) => {
    const matchTab = app.category === tabKey;
    const matchSearch = !searchQuery.trim() || app.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  const toggleInstall = (id: string, name: string) => {
    setInstalled((prev) => {
      const next = !prev[id];
      onTriggerFeedback(next ? `Connected: ${name}` : `Disconnected: ${name}`);
      return { ...prev, [id]: next };
    });
  };

  return (
    <WorkspaceLayout>
      {/* Dedicated Separated Header — contains Tabs + Search inside */}
      <AppsWorkspaceHeader
        tabs={APP_SUB_TABS}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <WorkspaceLayout.Content>
        <div className="space-y-2">
          {visibleApps.length === 0 && (
            <div className="text-center py-8 text-neutral-500 text-xs">
              No apps available for "{activeTab}" yet.
            </div>
          )}
          {visibleApps.map((app) => (
            <AppExtensionCard
              key={app.id}
              app={app}
              isInstalled={installed[app.id] ?? false}
              onToggle={() => toggleInstall(app.id, app.name)}
            />
          ))}
        </div>
      </WorkspaceLayout.Content>
      <WorkspaceLayout.Footer text="Sonikoma Apps Ecosystem" />
    </WorkspaceLayout>
  );
};
