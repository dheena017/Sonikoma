import React from "react";
import { History, ExternalLink, Calendar, Video } from "lucide-react";

interface UploadHistoryProps {
  history: Array<{
    id: number;
    title: string;
    youtube_url: string;
    privacy_status: string;
    published_at: string;
  }>;
}

export default function UploadHistory({ history }: UploadHistoryProps) {
  if (!history || history.length === 0) {
    return null;
  }

  return (
    <div className="bg-neutral-900/20 border border-neutral-855 rounded-2xl p-5 space-y-3.5 mt-5 animate-fade-in">
      <h3 className="text-xs font-bold text-neutral-400 tracking-wider uppercase font-mono flex items-center gap-1.5">
        <History className="h-4 w-4 text-purple-400" />
        Upload & Export History
      </h3>

      <div className="space-y-2.5 max-h-[220px] overflow-y-auto scrollbar-thin pr-1">
        {history.map((pub) => {
          const dateStr = pub.published_at
            ? new Date(pub.published_at.replace(" ", "T")).toLocaleDateString(
                undefined,
                {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )
            : "Recently Published";

          return (
            <div
              key={pub.id}
              className="p-3 bg-neutral-950/40 border border-neutral-900/60 rounded-xl flex items-center justify-between gap-3 text-xs font-mono group hover:bg-neutral-950 transition-all duration-200"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <span
                  className="text-white font-bold block truncate"
                  title={pub.title}
                >
                  {pub.title}
                </span>

                <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {dateStr}
                  </span>
                  <span>•</span>
                  <span className="uppercase text-[9px] px-1.5 py-0.25 bg-neutral-900 text-neutral-400 rounded border border-neutral-805">
                    {pub.privacy_status}
                  </span>
                </div>
              </div>

              <a
                href={pub.youtube_url}
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-neutral-900 hover:bg-purple-950/20 border border-neutral-805 text-neutral-400 hover:text-purple-300 rounded-lg transition-all shrink-0 cursor-pointer"
                title="View on YouTube"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
