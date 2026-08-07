import React, { useState } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import { APP_SUB_TABS, MOCK_APP_EXTENSIONS } from "../../data/appData";
import { Check, Plus, Unplug } from "lucide-react";

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
      <WorkspaceLayout.Header title="Apps" />
      <WorkspaceLayout.Tabs tabs={APP_SUB_TABS} activeTab={activeTab} onSelectTab={setActiveTab} />
      <WorkspaceLayout.Search value={searchQuery} onChange={setSearchQuery} placeholder="Search apps, integrations, automations..." />
      <WorkspaceLayout.Content>
        <div className="space-y-2">
          {visibleApps.length === 0 && (
            <div className="text-center py-8 text-neutral-500 text-xs">
              No apps available for "{activeTab}" yet.
            </div>
          )}
          {visibleApps.map((app) => (
            <div
              key={app.id}
              className={`rounded-xl bg-gradient-to-br ${app.color} border overflow-hidden transition-all`}
            >
              <div className="p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                  <img src={app.icon} alt={app.name} className="h-6 w-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-white">{app.name}</p>
                    {app.badge && (
                      <span className="text-[8px] font-mono text-neutral-300 bg-white/10 px-1.5 py-0.5 rounded">{app.badge}</span>
                    )}
                  </div>
                  <p className="text-[9px] text-neutral-300 leading-snug truncate">{app.desc}</p>
                </div>
                <button
                  onClick={() => toggleInstall(app.id, app.name)}
                  className={`px-2.5 py-1.5 rounded-lg text-[9px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0 ${
                    installed[app.id]
                      ? "bg-green-600/80 hover:bg-red-600/80 text-white"
                      : "bg-white/15 hover:bg-purple-600 text-white"
                  }`}
                >
                  {installed[app.id] ? (
                    <><Check className="h-3 w-3" /> Connected</>
                  ) : (
                    <><Plus className="h-3 w-3" /> Connect</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </WorkspaceLayout.Content>
      <WorkspaceLayout.Footer text="Sonikoma Apps Ecosystem" />
    </WorkspaceLayout>
  );
};
