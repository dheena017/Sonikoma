import React, { useState } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import { TEMPLATE_SUB_TABS, PRESET_TEMPLATES } from "../../data/templateData";
import { TemplatesWorkspaceHeader } from "./components/TemplatesWorkspaceHeader";
import { TemplateProjectCard } from "./components/TemplateProjectCard";
import { TemplateInfoBanner } from "./components/TemplateInfoBanner";
import { editorEventBus } from "../../events/editorEventBus";

interface TemplatesWorkspaceProps {
  onTriggerFeedback?: (msg: string) => void;
  appLogic?: any;
}

export const TemplatesWorkspace: React.FC<TemplatesWorkspaceProps> = ({
  onTriggerFeedback = () => {},
  appLogic,
}) => {
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = PRESET_TEMPLATES.filter((t) => {
    const matchTab =
      activeTab === "All" ||
      t.category.toLowerCase().replace("-", " ") === activeTab.toLowerCase().replace("-", " ");
    const matchSearch =
      !searchQuery.trim() ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  const handleApplyTemplate = (tpl: any) => {
    // Dynamically adjust Aspect Ratio and Pacing in Studio
    if (tpl.category === "shorts" || tpl.badge.includes("9:16")) {
      if (appLogic?.setAspectRatio) {
        appLogic.setAspectRatio("9:16");
      }
    } else if (tpl.category === "webtoon" || tpl.badge.includes("16:9")) {
      if (appLogic?.setAspectRatio) {
        appLogic.setAspectRatio("16:9");
      }
    }

    editorEventBus.publish("TIMELINE_UPDATED", {
      trackId: "global",
      duration: tpl.badge,
    });

    onTriggerFeedback(`Applied template layout: "${tpl.title}"`);
  };

  return (
    <WorkspaceLayout>
      {/* Dedicated Separated Header — contains Tabs + Search inside */}
      <TemplatesWorkspaceHeader
        tabs={["All", ...TEMPLATE_SUB_TABS]}
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
              onApply={() => handleApplyTemplate(tpl)}
            />
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-8 text-neutral-500 text-xs font-mono">
              No templates found for "{activeTab}".
            </div>
          )}
        </div>
      </WorkspaceLayout.Content>
      <WorkspaceLayout.Footer text="Sonikoma Production Template Engine" />
    </WorkspaceLayout>
  );
};
