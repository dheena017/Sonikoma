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
    <div className="border border-neutral-850 rounded-xl overflow-hidden animate-fade-in">
      <button
        onClick={() => setShowSocialsConfig(!showSocialsConfig)}
        className="w-full bg-neutral-950/30 px-4 py-3 text-xs font-mono font-bold text-neutral-350 hover:text-white flex items-center justify-between cursor-pointer select-none transition-colors border-b border-neutral-900/40"
      >
        <span className="flex items-center gap-1.5">
          <Link className="h-3.5 w-3.5 text-purple-400" />
          Channel & Social Link Presets
        </span>
        <span className="text-[10px] text-neutral-500 font-normal">
          {showSocialsConfig ? "Hide" : "Configure"}
        </span>
      </button>

      {showSocialsConfig && (
        <div className="p-4 bg-neutral-950/60 space-y-3.5 text-xs font-sans text-neutral-400 animate-slide-down">
          <p className="text-[10px] text-neutral-500 leading-relaxed pb-2 border-b border-neutral-900">
            Set your links once. They will be automatically injected into
            presets, social credits, and recap template layouts:
          </p>

          <div className="space-y-3 font-mono">
            {/* Channel Link */}
            <div className="space-y-1">
              <label className="text-[10px] text-neutral-450 block uppercase font-bold flex items-center gap-1">
                <Globe className="h-3 w-3 text-purple-400" />
                YouTube Channel URL
              </label>
              <input
                type="text"
                value={channelLink}
                onChange={(e) => setChannelLink(e.target.value)}
                placeholder="https://youtube.com/@myrecapchannel"
                className="w-full bg-neutral-900 border border-neutral-850 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>

            {/* Discord Link */}
            <div className="space-y-1">
              <label className="text-[10px] text-neutral-450 block uppercase font-bold flex items-center gap-1">
                <MessageSquare className="h-3 w-3 text-purple-400" />
                Discord Server invite
              </label>
              <input
                type="text"
                value={discordLink}
                onChange={(e) => setDiscordLink(e.target.value)}
                placeholder="https://discord.gg/invitecode"
                className="w-full bg-neutral-900 border border-neutral-850 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>

            {/* Patreon Link */}
            <div className="space-y-1">
              <label className="text-[10px] text-neutral-450 block uppercase font-bold flex items-center gap-1">
                <Heart className="h-3 w-3 text-purple-400" />
                Patreon Support Page
              </label>
              <input
                type="text"
                value={patreonLink}
                onChange={(e) => setPatreonLink(e.target.value)}
                placeholder="https://patreon.com/supportcreator"
                className="w-full bg-neutral-900 border border-neutral-850 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
