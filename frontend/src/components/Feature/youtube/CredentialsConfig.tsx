import React, { useState, useRef } from "react";
import {
  Key,
  ShieldAlert,
  CheckCircle2,
  Trash2,
  HelpCircle,
  Upload,
  FileJson,
} from "lucide-react";

interface CredentialsConfigProps {
  hasCustomCredentials: boolean;
  customClientId: string;
  customProjectId: string;
  showCredentialsConfig: boolean;
  setShowCredentialsConfig: (val: boolean) => void;
  onSaveCredentials: (
    clientId: string,
    clientSecret: string,
    projectId: string
  ) => void;
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
        if (
          !core ||
          !core.client_id ||
          !core.client_secret ||
          !core.project_id
        ) {
          alert(
            "Invalid Google client secrets JSON structure. Must contain 'installed' or 'web' object with 'client_id', 'client_secret', and 'project_id'."
          );
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
    <div className="bg-neutral-950/40 backdrop-blur-sm p-5 border border-neutral-900 rounded-2xl space-y-4 font-mono text-xs text-neutral-400 animate-fade-in transition-all duration-300 hover:border-neutral-800">
      <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
        <span className="text-neutral-200 font-bold flex items-center gap-2">
          <Key className="h-4 w-4 text-purple-400" />
          Custom API Keys & OAuth Integration
        </span>
        <button
          onClick={() => setShowCredentialsConfig(!showCredentialsConfig)}
          className={`px-3 py-1 rounded-xl text-[10px] font-bold cursor-pointer transition-all duration-200 border ${
            showCredentialsConfig
              ? "bg-purple-950/40 border-purple-800 text-purple-300 shadow-inner"
              : "bg-neutral-900/40 border-neutral-855 hover:text-white"
          }`}
        >
          {showCredentialsConfig ? "Close Settings" : "Configure Custom OAuth"}
        </button>
      </div>

      {showCredentialsConfig && (
        <div className="space-y-4 animate-slide-down">
          {hasCustomCredentials ? (
            <div className="space-y-3.5">
              <div className="p-4 bg-purple-950/10 border border-purple-900/30 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="h-4.5 w-4.5 text-purple-400 shrink-0 mt-0.5" />
                <div className="space-y-1 min-w-0 flex-1">
                  <span className="text-white font-bold block text-[11px] font-mono">
                    User Credentials Active
                  </span>
                  <div className="text-[10.5px] text-neutral-500 leading-normal space-y-1 min-w-0 font-mono">
                    <div className="truncate">
                      <span className="font-bold text-neutral-400">
                        Client ID:
                      </span>{" "}
                      {customClientId}
                    </div>
                    <div className="truncate">
                      <span className="font-bold text-neutral-400">
                        Project ID:
                      </span>{" "}
                      {customProjectId}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={onDeleteCredentials}
                className="w-full py-2.5 bg-red-950/10 hover:bg-red-950/30 border border-red-900/30 text-red-400 hover:text-red-300 font-bold rounded-xl text-[11px] transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
              >
                <Trash2 className="h-4 w-4" />
                Disconnect Custom Integration
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-amber-955/10 border border-amber-900/30 rounded-2xl p-4">
                <ShieldAlert className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10.5px] leading-relaxed text-amber-300 font-sans">
                  By default, Sonikoma uses shared system credentials. Upload
                  your Google OAuth client secrets file to upload to your
                  personal channel.
                </p>
              </div>

              {/* Dynamic JSON Uploader Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-900 hover:border-purple-500/50 bg-neutral-900/10 hover:bg-neutral-900/30 rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 space-y-2 flex flex-col items-center justify-center group shadow-inner"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleJsonUpload}
                  accept=".json"
                  className="hidden"
                />
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-850 group-hover:border-purple-500/30 group-hover:bg-purple-950/10 transition-all duration-200">
                  <Upload className="h-5 w-5 text-neutral-450 group-hover:text-purple-400 transition-all duration-200" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[11px] text-neutral-300 font-bold block font-mono">
                    Upload client_secrets.json
                  </span>
                  <span className="text-[10px] text-neutral-500 font-sans block">
                    Click to browse your downloaded Google OAuth configuration
                    file
                  </span>
                </div>
              </div>

              <div className="relative flex py-1.5 items-center">
                <div className="flex-grow border-t border-neutral-900/60"></div>
                <span className="flex-shrink mx-3 text-[9px] text-neutral-500 uppercase tracking-widest font-sans">
                  Or Enter Manually
                </span>
                <div className="flex-grow border-t border-neutral-900/60"></div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-neutral-500 font-bold">GCP PROJECT ID:</span>
                      <button
                        type="button"
                        onClick={() => setShowHelperText(!showHelperText)}
                        className="text-purple-400 hover:text-purple-305 flex items-center gap-1 cursor-pointer font-bold"
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                        Help Guide
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      placeholder="e.g. sonikoma-publisher-42861"
                      className="w-full bg-neutral-955/30 border border-neutral-900 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 rounded-xl px-3.5 py-2 text-xs text-white outline-none shadow-inner"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] text-neutral-500 font-bold block">
                      CLIENT ID:
                    </span>
                    <input
                      type="text"
                      required
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder="e.g. 1042738914-xxxx.apps.googleusercontent.com"
                      className="w-full bg-neutral-955/30 border border-neutral-900 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 rounded-xl px-3.5 py-2 text-xs text-white outline-none shadow-inner"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] text-neutral-500 font-bold block">
                      CLIENT SECRET:
                    </span>
                    <input
                      type="password"
                      required
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      placeholder="••••••••••••••••••••••••••••••••"
                      className="w-full bg-neutral-955/30 border border-neutral-900 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 rounded-xl px-3.5 py-2 text-xs text-white outline-none shadow-inner"
                    />
                  </div>
                </div>

                {showHelperText && (
                  <div className="p-4 bg-neutral-900/40 rounded-xl border border-neutral-900 text-[10px] leading-relaxed text-neutral-500 font-sans space-y-2 animate-slide-down">
                    <div className="font-bold text-neutral-300 font-mono">
                      Quick GCP OAuth Configuration:
                    </div>
                    <ol className="list-decimal pl-4 space-y-1.5">
                      <li>
                        Go to GCP Console Credentials & enable YouTube Data API
                        v3.
                      </li>
                      <li>
                        Configure OAuth Consent Screen as External and add
                        scopes.
                      </li>
                      <li>Create OAuth Client ID under Desktop Application.</li>
                      <li>
                        Download credentials JSON or copy Client ID & Secret
                        here.
                      </li>
                    </ol>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    !clientId.trim() ||
                    !clientSecret.trim() ||
                    !projectId.trim()
                  }
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-550 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-[11px] transition-all duration-200 cursor-pointer shadow-md active:scale-98"
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
