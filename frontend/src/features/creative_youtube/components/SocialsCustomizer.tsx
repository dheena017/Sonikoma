import React from "react";
import { Link, Globe, MessageSquare, Heart } from "lucide-react";

interface SocialsCustomizerProps {
  channelLink: string;
  setChannelLink: (val: string) => void;
  discordLink: string;
  setDiscordLink: (val: string) => void;
  patreonLink: string;
  setPatreonLink: (val: string) => void;
  showSocialsConfig: boolean;
  setShowSocialsConfig: (val: boolean) => void;
}

export default function SocialsCustomizer({
  channelLink,
  setChannelLink,
  discordLink,
  setDiscordLink,
  patreonLink,
  setPatreonLink,
  showSocialsConfig,
  setShowSocialsConfig,
}: SocialsCustomizerProps) {
  return (
    <div className="border border-neutral-900 rounded-2xl overflow-hidden animate-fade-in transition-all duration-300 hover:border-neutral-800">
      <button
        onClick={() => setShowSocialsConfig(!showSocialsConfig)}
        className="w-full bg-neutral-950/40 backdrop-blur-sm px-4 py-3.5 text-xs font-mono font-bold text-neutral-305 hover:text-white flex items-center justify-between cursor-pointer select-none transition-colors border-b border-neutral-900/60"
      >
        <span className="flex items-center gap-2">
          <Link className="h-4 w-4 text-purple-400" />
          Channel & Social Link Presets
        </span>
        <span className="text-[10px] text-neutral-500 font-normal">
          {showSocialsConfig ? "Hide" : "Configure"}
        </span>
      </button>

      {showSocialsConfig && (
        <div className="p-5 bg-neutral-950/20 backdrop-blur-sm space-y-4 text-xs font-sans text-neutral-400 animate-slide-down">
          <p className="text-[10.5px] text-neutral-500 leading-relaxed pb-3 border-b border-neutral-900">
            Set your links once. They will be automatically injected into
            presets, social credits, and recap template layouts:
          </p>

          <div className="space-y-4 font-mono">
            {/* Channel Link */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-neutral-400 block uppercase font-bold flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-purple-405" />
                YouTube Channel URL
              </label>
              <input
                type="text"
                value={channelLink}
                onChange={(e) => setChannelLink(e.target.value)}
                placeholder="https://youtube.com/@myrecapchannel"
                className="w-full bg-neutral-955/30 border border-neutral-900 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition-all duration-200 shadow-inner"
              />
            </div>

            {/* Discord Link */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-neutral-400 block uppercase font-bold flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-purple-405" />
                Discord Server invite
              </label>
              <input
                type="text"
                value={discordLink}
                onChange={(e) => setDiscordLink(e.target.value)}
                placeholder="https://discord.gg/invitecode"
                className="w-full bg-neutral-955/30 border border-neutral-900 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition-all duration-200 shadow-inner"
              />
            </div>

            {/* Patreon Link */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-neutral-400 block uppercase font-bold flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-purple-405" />
                Patreon Support Page
              </label>
              <input
                type="text"
                value={patreonLink}
                onChange={(e) => setPatreonLink(e.target.value)}
                placeholder="https://patreon.com/supportcreator"
                className="w-full bg-neutral-955/30 border border-neutral-900 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition-all duration-200 shadow-inner"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
