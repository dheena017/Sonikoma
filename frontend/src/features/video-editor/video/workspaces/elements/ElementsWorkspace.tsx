import React, { useState } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import { ELEMENT_SUB_TABS, REAL_ELEMENTS } from "../../data/elementData";
import { ElementsWorkspaceHeader } from "./components/ElementsWorkspaceHeader";
import { ElementGridCard } from "./components/ElementGridCard";
import { editorEventBus } from "../../events/editorEventBus";

interface ElementsWorkspaceProps {
  onTriggerFeedback?: (msg: string) => void;
  appLogic?: any;
}

export const ElementsWorkspace: React.FC<ElementsWorkspaceProps> = ({
  onTriggerFeedback = () => {},
  appLogic,
}) => {
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = REAL_ELEMENTS.filter((e) => {
    const tabMatch =
      activeTab === "All" ||
      e.category.toLowerCase().replace("-", " ") === activeTab.toLowerCase();
    const searchMatch =
      !searchQuery.trim() ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return tabMatch && searchMatch;
  });

  const handleAddElement = (elem: any) => {
    // Publish to event bus for overlay rendering
    editorEventBus.publish("MEDIA_ADDED", {
      assetId: elem.id,
      title: elem.title,
      type: "element",
    });

    onTriggerFeedback(`Applied ${elem.title} to active panel`);
  };

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
        <div className="grid grid-cols-2 gap-2.5">
          {filtered.map((elem) => (
            <ElementGridCard
              key={elem.id}
              element={elem}
              onAdd={() => handleAddElement(elem)}
            />
          ))}
        </div>
      </WorkspaceLayout.Content>
      <WorkspaceLayout.Footer text="Sonikoma Vector Comic Asset Engine" />
    </WorkspaceLayout>
  );
};
