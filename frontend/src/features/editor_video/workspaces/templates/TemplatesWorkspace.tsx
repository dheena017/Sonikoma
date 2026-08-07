import React, { useState } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import { TEMPLATE_SUB_TABS, MOCK_TEMPLATES } from "../../data/templateData";
import { TemplatesWorkspaceHeader } from "./components/TemplatesWorkspaceHeader";
import { TemplateProjectCard } from "./components/TemplateProjectCard";
import { TemplateInfoBanner } from "./components/TemplateInfoBanner";

interface TemplatesWorkspaceProps {
  onTriggerFeedback: (msg: string) => void;
}

export const TemplatesWorkspace: React.FC<TemplatesWorkspaceProps> = ({ onTriggerFeedback }) => {
  const [activeTab, setActiveTab] = useState("Manga");
  const [searchQuery, setSearchQuery] = useState("");

  const activeTabKey = activeTab.toLowerCase().replace(" ", "-");
  const filtered = MOCK_TEMPLATES.filter((t) => {
    const matchTab = t.category === activeTabKey || !MOCK_TEMPLATES.find((x) => x.category === activeTabKey);
    const matchSearch = !searchQuery.trim() || t.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <WorkspaceLayout>
      {/* Dedicated Separated Header — contains Tabs + Search inside */}
      <TemplatesWorkspaceHeader
        tabs={TEMPLATE_SUB_TABS}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <WorkspaceLayout.Content>
        {/* Info Banner Component */}
        <TemplateInfoBanner />

        {/* Template Cards Component */}
        <div className="space-y-3 pt-2">
          {filtered.map((tpl) => (
            <TemplateProjectCard
              key={tpl.id}
              template={tpl}
              onApply={() => onTriggerFeedback(`Applied template: "${tpl.title}"`)}
            />
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-8 text-neutral-500 text-xs">
              No templates for "{activeTab}" yet — check back soon!
            </div>
          )}
        </div>
      </WorkspaceLayout.Content>
      <WorkspaceLayout.Footer text="Sonikoma Template Studio" />
    </WorkspaceLayout>
  );
};
