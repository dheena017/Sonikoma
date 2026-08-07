import React, { useState } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import { RESOURCE_SUB_TABS, MOCK_RESOURCES } from "../../data/resourceData";
import { ResourcesWorkspaceHeader } from "./components/ResourcesWorkspaceHeader";
import { ResourceItemCard } from "./components/ResourceItemCard";

interface ResourcesWorkspaceProps {
  onTriggerFeedback: (msg: string) => void;
}

export const ResourcesWorkspace: React.FC<ResourcesWorkspaceProps> = ({ onTriggerFeedback }) => {
  const [activeTab, setActiveTab] = useState("Fonts");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = MOCK_RESOURCES.filter((r) => {
    const tabMatch = activeTab === "All" || r.category.toLowerCase() === activeTab.toLowerCase();
    const searchMatch = !searchQuery.trim() || r.title.toLowerCase().includes(searchQuery.toLowerCase());
    return tabMatch && searchMatch;
  });

  const handleCopyColor = (id: string, hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedId(id);
    onTriggerFeedback(`Copied color ${hex}`);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <WorkspaceLayout>
      {/* Dedicated Separated Header — contains Tabs + Search inside */}
      <ResourcesWorkspaceHeader
        tabs={RESOURCE_SUB_TABS}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <WorkspaceLayout.Content>
        <div className="space-y-2">
          {filtered.map((res) => (
            <ResourceItemCard
              key={res.id}
              resource={res}
              copiedId={copiedId}
              onCopyColor={handleCopyColor}
              onApply={(title) => onTriggerFeedback(`Applied resource: ${title}`)}
            />
          ))}
        </div>
      </WorkspaceLayout.Content>
      <WorkspaceLayout.Footer text="Sonikoma Creator Brand Kit Workspace" />
    </WorkspaceLayout>
  );
};
