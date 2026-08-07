import React, { useState } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import { ELEMENT_SUB_TABS, MOCK_ELEMENTS } from "../../data/elementData";
import { ElementsWorkspaceHeader } from "./components/ElementsWorkspaceHeader";
import { ElementGridCard } from "./components/ElementGridCard";

interface ElementsWorkspaceProps {
  onTriggerFeedback: (msg: string) => void;
}

export const ElementsWorkspace: React.FC<ElementsWorkspaceProps> = ({
  onTriggerFeedback,
}) => {
  const [activeTab, setActiveTab] = useState("Speech Bubbles");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = MOCK_ELEMENTS.filter((e) => {
    const matchSearch = !searchQuery.trim() || e.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  return (
    <WorkspaceLayout>
      {/* Dedicated Separated Header — contains Tabs + Search inside */}
      <ElementsWorkspaceHeader
        tabs={ELEMENT_SUB_TABS}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <WorkspaceLayout.Content>
        <div className="grid grid-cols-2 gap-2">
          {filtered.map((elem) => (
            <ElementGridCard
              key={elem.id}
              element={elem}
              onAdd={() => onTriggerFeedback(`Added ${elem.title} to scene`)}
            />
          ))}
        </div>
      </WorkspaceLayout.Content>
      <WorkspaceLayout.Footer text="Sonikoma Comic Asset Library" />
    </WorkspaceLayout>
  );
};
