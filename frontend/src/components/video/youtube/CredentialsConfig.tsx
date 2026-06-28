import React, { useState, useRef } from "react";
import { Key, ShieldAlert, CheckCircle2, Trash2, HelpCircle, Upload, FileJson } from "lucide-react";

interface CredentialsConfigProps {
  hasCustomCredentials: boolean;
  customClientId: string;
  customProjectId: string;
  showCredentialsConfig: boolean;
  setShowCredentialsConfig: (val: boolean) => void;
  onSaveCredentials: (clientId: string, clientSecret: string, projectId: string) => void;
  onDeleteCredentials: () => void;
}

export default function CredentialsConfig({
  hasCustomCredentials,
  customClientId,
  customProjectId,
  showCredentialsConfig,
  setShowCredentialsConfig,
  onSaveCredentials,
  onDeleteCredentials,
}: CredentialsConfigProps) {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [projectId, setProjectId] = useState("");
  const [showHelperText, setShowHelperText] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId.trim() || !clientSecret.trim() || !projectId.trim()) return;
    onSaveCredentials(clientId.trim(), clientSecret.trim(), projectId.trim());
    setClientId("");
    setClientSecret("");
    setProjectId("");
  };

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const core = parsed.installed || parsed.web;
        if (!core || !core.client_id || !core.client_secret || !core.project_id) {
          alert("Invalid Google client secrets JSON structure. Must contain 'installed' or 'web' object with 'client_id', 'client_secret', and 'project_id'.");
          return;
        }
        onSaveCredentials(core.client_id, core.client_secret, core.project_id);
      } catch (err: any) {
        alert(`Error parsing client secrets JSON: ${err.message}`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-neutral-950/60 p-4 border border-neutral-850 rounded-xl space-y-3.5 font-mono text-xs text-neutral-450 animate-fade-in">
      <div className="flex items-center justify-between border-b border-neutral-900 pb-1.5">
        <span className="text-neutral-300 font-bold flex items-center gap-1.5">
          <Key className="h-4 w-4 text-purple-400" />
          Custom API Keys & OAuth Integration
        </span>
        <button
          onClick={() => setShowCredentialsConfig(!showCredentialsConfig)}
          className={`px-2.5 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-colors border ${
            showCredentialsConfig
              ? "bg-purple-950 border-purple-800 text-purple-300"
              : "bg-neutral-900 border-neutral-855 hover:text-white"
          }`}
        >
          {showCredentialsConfig ? "Close Settings" : "Configure Custom OAuth"}
        </button>
      </div>

      {showCredentialsConfig && (
        <div className="space-y-4 animate-slide-down">
          {hasCustomCredentials ? (
            <div className="space-y-3">
              <div className="p-3 bg-purple-950/20 border border-purple-900/30 rounded-xl flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                <div className="space-y-1 min-w-0 flex-1">
                  <span className="text-white font-bold block text-[11px]">
                    User Credentials Active
                  </span>
                  <div className="text-[10px] text-neutral-500 leading-normal space-y-0.5 min-w-0">
                    <div className="truncate">
                      <span className="font-bold text-neutral-400">Client ID:</span> {customClientId}
                    </div>
                    <div>
                      <span className="font-bold text-neutral-400">Project ID:</span> {customProjectId}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={onDeleteCredentials}
                className="w-full py-2 bg-red-955/20 hover:bg-red-955/50 border border-red-900/35 text-red-400 font-bold rounded-lg text-[10.5px] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Disconnect Custom Integration
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-2 bg-amber-955/20 border border-amber-900/35 rounded-xl p-3">
                <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed text-amber-300 font-sans">
                  By default, Sonikoma uses shared system credentials. Upload your Google OAuth client secrets file to upload to your personal channel.
                </p>
              </div>

              {/* Dynamic JSON Uploader Zone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-800 hover:border-purple-500/60 bg-neutral-900/40 hover:bg-neutral-900/60 rounded-xl p-5 text-center cursor-pointer transition-all space-y-2 flex flex-col items-center justify-center group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleJsonUpload}
                  accept=".json"
                  className="hidden" 
                />
                <div className="p-2 bg-neutral-950 rounded-lg border border-neutral-850 group-hover:border-purple-500/30 group-hover:bg-purple-950/20 transition-all">
                  <Upload className="h-5 w-5 text-neutral-450 group-hover:text-purple-400 transition-all" />
                </div>
                <div>
                  <span className="text-[11px] text-neutral-300 font-bold block">
                    Upload client_secrets.json
                  </span>
                  <span className="text-[9.5px] text-neutral-500 font-sans block mt-0.5">
                    Click to browse your downloaded Google OAuth configuration file
                  </span>
                </div>
              </div>

              <div className="relative flex py-1.5 items-center">
                <div className="flex-grow border-t border-neutral-900"></div>
                <span className="flex-shrink mx-3 text-[9px] text-neutral-600 uppercase tracking-widest font-sans">Or Enter Manually</span>
                <div className="flex-grow border-t border-neutral-900"></div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-neutral-500">GCP PROJECT ID:</span>
                      <button
                        type="button"
                        onClick={() => setShowHelperText(!showHelperText)}
                        className="text-purple-400 hover:text-purple-300 flex items-center gap-0.5 cursor-pointer"
                      >
                        <HelpCircle className="h-3 w-3" />
                        Help Guide
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      placeholder="e.g. sonikoma-publisher-42861"
                      className="w-full bg-neutral-900 border border-neutral-850 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-purple-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-neutral-500">CLIENT ID:</span>
                    <input
                      type="text"
                      required
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder="e.g. 1042738914-xxxx.apps.googleusercontent.com"
                      className="w-full bg-neutral-900 border border-neutral-850 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-purple-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-neutral-500">CLIENT SECRET:</span>
                    <input
                      type="password"
                      required
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      placeholder="••••••••••••••••••••••••••••••••"
                      className="w-full bg-neutral-900 border border-neutral-850 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-purple-500/50"
                    />
                  </div>
                </div>

                {showHelperText && (
                  <div className="p-3 bg-neutral-900/60 rounded-lg border border-neutral-850/60 text-[9.5px] leading-relaxed text-neutral-500 font-sans space-y-1.5">
                    <div className="font-bold text-neutral-300 font-mono">Quick GCP OAuth Configuration:</div>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Go to GCP Console Credentials & enable YouTube Data API v3.</li>
                      <li>Configure OAuth Consent Screen as External and add scopes.</li>
                      <li>Create OAuth Client ID under Desktop Application.</li>
                      <li>Download credentials JSON or copy Client ID & Secret here.</li>
                    </ol>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!clientId.trim() || !clientSecret.trim() || !projectId.trim()}
                  className="w-full py-2 bg-purple-650 hover:bg-purple-550 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg text-[10.5px] transition-colors cursor-pointer"
                >
                  Save Custom OAuth Credentials
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
