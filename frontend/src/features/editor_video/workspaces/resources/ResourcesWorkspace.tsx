import React, { useState } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import {
  RESOURCE_SUB_TABS,
  REAL_RESOURCES,
  REAL_LUT_FILTERS,
} from "../../data/resourceData";
import { ResourcesWorkspaceHeader } from "./components/ResourcesWorkspaceHeader";
import { ResourceItemCard } from "./components/ResourceItemCard";
import { Sparkles, Sliders, Check } from "lucide-react";
import { editorEventBus } from "../../events/editorEventBus";

interface ResourcesWorkspaceProps {
  onTriggerFeedback?: (msg: string) => void;
  appLogic?: any;
}

export const ResourcesWorkspace: React.FC<ResourcesWorkspaceProps> = ({
  onTriggerFeedback = () => {},
  appLogic,
}) => {
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeLutId, setActiveLutId] = useState<string | null>(null);

  const filtered = REAL_RESOURCES.filter((r) => {
    const tabMatch =
      activeTab === "All" ||
      r.category.toLowerCase() === activeTab.toLowerCase();
    const searchMatch =
      !searchQuery.trim() ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.detail.toLowerCase().includes(searchQuery.toLowerCase());
    return tabMatch && searchMatch;
  });

  const handleCopyColor = (id: string, hex: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(hex);
    }
    setCopiedId(id);
    onTriggerFeedback(`Copied color ${hex} to clipboard!`);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleApplyLut = (lut: any) => {
    setActiveLutId(lut.id);
    editorEventBus.publish("INSPECTOR_REFRESH", {
      layerName: lut.name,
    });
    onTriggerFeedback(`Applied LUT Color Grade: "${lut.name}"`);
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
        {/* Real LUT Color Grading Shaders Section */}
        {(activeTab === "All" || activeTab === "LUTs") && (
          <div className="space-y-2 mb-4">
            <h4 className="text-xs font-bold text-white font-mono uppercase flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-[#3B82F6]" />
              Anime Color Grading LUTs
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {REAL_LUT_FILTERS.map((lut) => (
                <div
                  key={lut.id}
                  onClick={() => handleApplyLut(lut)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group shadow-sm ${
                    activeLutId === lut.id
                      ? "bg-[#2A2A2A] border-[#60A5FA] "
                      : "bg-neutral-900/80 border-neutral-800 hover:border-[#3B82F6]/60"
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-[#93C5FD] transition-colors">
                      {lut.name}
                    </p>
                    <p className="text-[9px] text-neutral-400 font-mono mt-0.5">{lut.desc}</p>
                  </div>

                  <span className={`px-2 py-1 rounded-lg text-[9px] font-mono font-bold shrink-0 flex items-center gap-1 ${
                    activeLutId === lut.id
                      ? "bg-[#2A2A2A] text-white"
                      : "bg-neutral-800 text-neutral-300 group-hover:bg-[#3B82F6] group-hover:text-white"
                  }`}>
                    {activeLutId === lut.id && <Check className="h-3 w-3" />}
                    {activeLutId === lut.id ? "Active" : "Apply LUT"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resources List (Colors, Textures, Overlays) */}
        <div className="space-y-2">
          {filtered.map((res) => (
            <ResourceItemCard
              key={res.id}
              resource={res}
              copiedId={copiedId}
              onCopyColor={handleCopyColor}
              onApply={(title) => {
                onTriggerFeedback(`Applied resource: ${title}`);
              }}
            />
          ))}
        </div>
      </WorkspaceLayout.Content>
      <WorkspaceLayout.Footer text="Sonikoma Creator Brand Kit • Real Color Grading Engine" />
    </WorkspaceLayout>
  );
};
