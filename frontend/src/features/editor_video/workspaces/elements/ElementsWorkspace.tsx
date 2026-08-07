import React, { useState } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import { ELEMENT_SUB_TABS, MOCK_ELEMENTS } from "../../data/elementData";
import { Box, Sparkles } from "lucide-react";

interface ElementsWorkspaceProps {
  onTriggerFeedback: (msg: string) => void;
}

export const ElementsWorkspace: React.FC<ElementsWorkspaceProps> = ({
  onTriggerFeedback,
}) => {
  const [activeTab, setActiveTab] = useState("Speech Bubbles");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <WorkspaceLayout>
      <WorkspaceLayout.Header title="Elements Workspace" />
      <WorkspaceLayout.Tabs tabs={ELEMENT_SUB_TABS} activeTab={activeTab} onSelectTab={setActiveTab} />
      <WorkspaceLayout.Search value={searchQuery} onChange={setSearchQuery} placeholder="Search speedlines, speech bubbles, manga FX..." />
      <WorkspaceLayout.Content>
        <div className="grid grid-cols-2 gap-2">
          {MOCK_ELEMENTS.map((elem) => (
            <div
              key={elem.id}
              onClick={() => onTriggerFeedback(`Added ${elem.title} to scene`)}
              className="relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 h-32 cursor-pointer group hover:border-purple-500/60 transition-all flex flex-col justify-between p-2"
            >
              {elem.img && (
                <img src={elem.img} alt={elem.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80" />
              )}
              {elem.emoji && (
                <div className="absolute inset-0 flex items-center justify-center text-4xl select-none group-hover:scale-110 transition-transform">
                  {elem.emoji}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
              <div className="relative z-10 flex justify-between items-center">
                {elem.badge && (
                  <span className="text-[8px] font-mono font-bold bg-black/80 text-white px-1.5 py-0.5 rounded border border-white/10">
                    {elem.badge}
                  </span>
                )}
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-bold text-white truncate drop-shadow">{elem.title}</p>
                {elem.desc && <p className="text-[8px] text-neutral-300 truncate">{elem.desc}</p>}
              </div>
            </div>
          ))}
        </div>
      </WorkspaceLayout.Content>
      <WorkspaceLayout.Footer text="Sonikoma Comic Asset Library" />
    </WorkspaceLayout>
  );
};
