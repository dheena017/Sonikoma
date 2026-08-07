import React, { useState, useRef } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import { RESOURCE_SUB_TABS, MOCK_RESOURCES } from "../../data/resourceData";
import { useFontUploader } from "../../hooks/useFontUploader";
import { Upload, Copy, Check, Type, Image, Palette } from "lucide-react";

interface ResourcesWorkspaceProps {
  onTriggerFeedback: (msg: string) => void;
}

export const ResourcesWorkspace: React.FC<ResourcesWorkspaceProps> = ({ onTriggerFeedback }) => {
  const [activeTab, setActiveTab] = useState("Fonts");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);
  const { uploadedFonts, handleFontUpload } = useFontUploader();

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const resourcesForTab = MOCK_RESOURCES.filter(
    (r) => r.category === activeTab.toLowerCase().replace(" ", "-")
  );

  return (
    <WorkspaceLayout>
      <WorkspaceLayout.Header title="Resources" />
      <WorkspaceLayout.Tabs tabs={RESOURCE_SUB_TABS} activeTab={activeTab} onSelectTab={setActiveTab} />
      <WorkspaceLayout.Content>
        {/* Fonts View */}
        {activeTab === "Fonts" && (
          <div className="space-y-3">
            <input
              type="file"
              ref={fontInputRef}
              accept=".ttf,.otf,.woff,.woff2"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { handleFontUpload(f); onTriggerFeedback(`Font "${f.name}" uploaded & injected!`); }
              }}
            />
            <button
              onClick={() => fontInputRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-neutral-700 hover:border-purple-500 bg-neutral-900/40 p-4 flex flex-col items-center gap-2 cursor-pointer transition-all"
            >
              <Upload className="h-5 w-5 text-purple-400" />
              <span className="text-xs font-bold text-white">Upload Custom Font</span>
              <span className="text-[9px] text-neutral-400 font-mono">.ttf · .otf · .woff · .woff2</span>
            </button>
            {uploadedFonts.map((f, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-center gap-2">
                <Type className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-bold text-white flex-1">{f}</span>
                <span className="text-[8px] font-mono text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded">Active</span>
              </div>
            ))}
          </div>
        )}

        {/* Colors View */}
        {activeTab === "Colors" && (
          <div className="space-y-2">
            {MOCK_RESOURCES.filter((r) => r.category === "colors").map((r) => (
              <div key={r.id} className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg border border-neutral-700 shrink-0" style={{ background: r.hex }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white">{r.title}</p>
                  <p className="text-[9px] font-mono text-neutral-400 truncate">{r.detail}</p>
                </div>
                <button
                  onClick={() => handleCopy(r.id, r.hex || "")}
                  className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white cursor-pointer"
                >
                  {copiedId === r.id ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Other Resource Tabs (Logos, Watermarks, Intro, Outro) */}
        {!["Fonts", "Colors"].includes(activeTab) && (
          <div className="space-y-2">
            {resourcesForTab.map((r) => (
              <div key={r.id} className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-purple-500/60 cursor-pointer flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">{r.title}</p>
                  <p className="text-[9px] text-neutral-400 font-mono">{r.detail}</p>
                </div>
                {r.badge && (
                  <span className="text-[8px] font-mono font-bold bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded border border-neutral-700">
                    {r.badge}
                  </span>
                )}
              </div>
            ))}
            {resourcesForTab.length === 0 && (
              <button
                onClick={() => onTriggerFeedback(`Upload ${activeTab} file...`)}
                className="w-full rounded-xl border-2 border-dashed border-neutral-700 hover:border-purple-500 bg-neutral-900/40 p-4 flex flex-col items-center gap-2 cursor-pointer"
              >
                <Upload className="h-5 w-5 text-purple-400" />
                <span className="text-xs font-bold text-white">Upload {activeTab}</span>
              </button>
            )}
          </div>
        )}
      </WorkspaceLayout.Content>
      <WorkspaceLayout.Footer text="Your Personal Creator Resource Vault" />
    </WorkspaceLayout>
  );
};
