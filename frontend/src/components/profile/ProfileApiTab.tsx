import React from "react";
import { Key, Copy, Plus, Trash2 } from "lucide-react";

interface ProfileApiTabProps {
  apiTokens: {
    id: string;
    name: string;
    key: string;
    created: string;
  }[];
  newTokenName: string;
  setNewTokenName: React.Dispatch<React.SetStateAction<string>>;
  handleGenerateToken: (e: React.FormEvent) => void;
  tokenToast: string | null;
  handleCopyToastKey: (key: string) => void;
  handleDeleteToken: (id: string) => void;
}

export default function ProfileApiTab({
  apiTokens,
  newTokenName,
  setNewTokenName,
  handleGenerateToken,
  tokenToast,
  handleCopyToastKey,
  handleDeleteToken,
}: ProfileApiTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      {/* Generate token widget */}
      <div className="bg-[#0f0f13]/40 border border-white/5 rounded-3xl p-8 shadow-2xl relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

        <div className="space-y-1 mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-purple-400" />
            Studio API Tokens
          </h3>
          <p className="text-xs text-neutral-400">
            Generate developer keys to build automation tools and customize
            webtoon pipelines
          </p>
        </div>

        {tokenToast && (
          <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-xl mb-6 flex flex-col gap-2 animate-pulse">
            <div className="text-purple-400 text-xs font-bold">
              ⚠️ Copy this token key. It will not be shown again!
            </div>
            <div className="flex items-center gap-2">
              <code className="bg-black/60 p-2 rounded border border-white/10 text-[11px] text-white flex-1 select-all break-all font-mono">
                {tokenToast}
              </code>
              <button
                onClick={() => handleCopyToastKey(tokenToast)}
                className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-lg cursor-pointer transition-colors shrink-0"
                title="Copy full key"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <form
          onSubmit={handleGenerateToken}
          className="flex flex-col md:flex-row gap-3"
        >
          <input
            type="text"
            required
            value={newTokenName}
            onChange={(e) => setNewTokenName(e.target.value)}
            placeholder="e.g. Scrapy Webhook Server"
            className="bg-black/40 border border-white/5 focus:border-purple-500/50 rounded-xl py-3 px-4 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition-all flex-grow placeholder:text-neutral-700 font-sans"
          />
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md shadow-purple-900/30 text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 duration-300"
          >
            <Plus className="w-4 h-4" />
            Generate Token Key
          </button>
        </form>
      </div>

      {/* API Keys List */}
      <div className="bg-black/20 border border-white/5 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-500">
            Active API Keys
          </span>
          <span className="text-[10px] text-neutral-600 font-medium font-mono">
            Headers: Authorization Bearer [Token]
          </span>
        </div>

        {apiTokens.length === 0 ? (
          <div className="py-6 text-center text-xs text-neutral-500 font-semibold uppercase tracking-wider">
            No active API keys found
          </div>
        ) : (
          <div className="space-y-2.5">
            {apiTokens.map((tok) => (
              <div
                key={tok.id}
                className="bg-black/30 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="text-xs font-bold text-white">{tok.name}</div>
                  <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                    Key: {tok.key} • Created: {tok.created}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteToken(tok.id)}
                  className="text-neutral-500 hover:text-rose-400 p-2 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                  title="Revoke and delete token key"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
