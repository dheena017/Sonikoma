import React, { useState } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import { TEMPLATE_SUB_TABS, MOCK_TEMPLATES } from "../../data/templateData";
import { LayoutTemplate, Star, Play } from "lucide-react";

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
      <WorkspaceLayout.Header title="Templates" />
      <WorkspaceLayout.Tabs tabs={TEMPLATE_SUB_TABS} activeTab={activeTab} onSelectTab={setActiveTab} />
      <WorkspaceLayout.Search value={searchQuery} onChange={setSearchQuery} placeholder="Search manga, webtoon, anime templates..." />
      <WorkspaceLayout.Content>
        {/* Modular info banner */}
        <div className="rounded-xl bg-amber-950/30 border border-amber-900/40 p-2.5 flex items-start gap-2">
          <LayoutTemplate className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-200/80 leading-snug">
            Templates are <span className="font-bold text-amber-300">fully modular</span>. Every element can be individually customized on your timeline after applying.
          </p>
        </div>

        {/* Template Cards */}
        <div className="space-y-3 pt-1">
          {MOCK_TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              className={`relative rounded-2xl overflow-hidden border cursor-pointer group transition-all ${tpl.accent}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${tpl.gradient} opacity-90`} />
              <div className="relative z-10 p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="text-sm font-black text-white leading-tight">{tpl.title}</h4>
                  <Star className="h-3.5 w-3.5 text-neutral-400 hover:text-amber-400 shrink-0 cursor-pointer" />
                </div>
                <p className="text-[10px] text-neutral-300 leading-snug">{tpl.desc}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${tpl.accent}`}>
                    {tpl.badge}
                  </span>
                  <button
                    onClick={() => onTriggerFeedback(`Applied template: "${tpl.title}"`)}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Play className="h-3 w-3" /> Use Template
                  </button>
                </div>
              </div>
            </div>
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
