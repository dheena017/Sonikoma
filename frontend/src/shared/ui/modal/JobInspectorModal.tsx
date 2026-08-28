import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Copy,
  Check,
  Terminal,
  AlertTriangle,
  Image as ImageIcon,
  FileText,
  Trash2,
  StopCircle,
  Clock,
  Layers,
  Cpu,
  Folder,
} from "lucide-react";
import type { JobStatusResponse } from "@/api";

interface JobInspectorModalProps {
  job: JobStatusResponse | null;
  onClose: () => void;
  onCancelJob?: (jobId: string) => void;
  onDeleteJob?: (jobId: string) => void;
}

export default function JobInspectorModal({
  job,
  onClose,
  onCancelJob,
  onDeleteJob,
}: JobInspectorModalProps) {
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  if (!job) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const getStatusBadge = (status?: string) => {
    const s = (status || "queued").toLowerCase();
    switch (s) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Completed
          </span>
        );
      case "running":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            Running
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            Failed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-800 text-neutral-400 border border-neutral-700">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Queued
          </span>
        );
    }
  };

  const calculateDuration = (j: JobStatusResponse) => {
    if (!j.started_at) return "—";
    const start = new Date(j.started_at).getTime();
    const end = j.completed_at ? new Date(j.completed_at).getTime() : Date.now();
    const sec = Math.max(0, Math.floor((end - start) / 1000));
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    return `${min}m ${sec % 60}s`;
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      data-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-neutral-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Glow Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#3B82F6] via-[#60A5FA] to-[#3B82F6] blur-[1px]" />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-850 flex items-center justify-between shrink-0 bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-white text-base tracking-tight">
                  Job Inspector:{" "}
                  <span className="font-mono text-blue-400">{job.job_id}</span>
                </h3>
                {getStatusBadge(job.status)}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5 font-sans">
                Type:{" "}
                <span className="text-neutral-200 font-semibold">
                  {job.job_type}
                </span>
                {job.stage && ` • Stage: ${job.stage}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(JSON.stringify(job, null, 2))}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-850 hover:bg-neutral-800 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold transition-all border border-neutral-750/30 cursor-pointer active:scale-95"
            >
              {copiedJson ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copiedJson ? "Copied JSON" : "Copy JSON"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-white bg-neutral-950/40 hover:bg-neutral-900 p-2 rounded-full transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-neutral-300 custom-scrollbar">
          {/* Telemetry Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-neutral-900/80 p-3.5 rounded-2xl border border-neutral-800 flex flex-col justify-between">
              <span className="text-[11px] text-neutral-500 uppercase font-semibold flex items-center gap-1">
                <Layers className="w-3 h-3 text-blue-400" />
                Progress
              </span>
              <p className="text-lg font-bold text-white mt-1">
                {job.progress}%
              </p>
            </div>
            <div className="bg-neutral-900/80 p-3.5 rounded-2xl border border-neutral-800 flex flex-col justify-between">
              <span className="text-[11px] text-neutral-500 uppercase font-semibold flex items-center gap-1">
                <Cpu className="w-3 h-3 text-[#3B82F6]" />
                Execution Model
              </span>
              <p className="text-xs font-bold text-white mt-1 font-mono truncate">
                {job.execution?.model || "Standard Engine"}
              </p>
            </div>
            <div className="bg-neutral-900/80 p-3.5 rounded-2xl border border-neutral-800 flex flex-col justify-between">
              <span className="text-[11px] text-neutral-500 uppercase font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                Duration
              </span>
              <p className="text-base font-bold text-white mt-1 font-mono">
                {calculateDuration(job)}
              </p>
            </div>
            <div className="bg-neutral-900/80 p-3.5 rounded-2xl border border-neutral-800 flex flex-col justify-between">
              <span className="text-[11px] text-neutral-500 uppercase font-semibold flex items-center gap-1">
                <Folder className="w-3 h-3 text-emerald-400" />
                Project
              </span>
              <p className="text-xs font-bold text-white mt-1 font-mono truncate">
                {job.project_id || "None"}
              </p>
            </div>
          </div>

          {/* Error Box if Failed */}
          {job.error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-rose-200">
              <div className="flex items-center gap-2 font-semibold text-rose-400 mb-1">
                <AlertTriangle className="w-4 h-4" />
                Failure Details [{job.error.code}]
              </div>
              <p className="text-xs leading-relaxed font-mono">
                {job.error.message}
              </p>
              {job.error.stage && (
                <p className="text-[11px] text-rose-300/80 mt-2 font-mono">
                  Failed at Stage:{" "}
                  <span className="font-bold">{job.error.stage}</span>
                </p>
              )}
            </div>
          )}

          {/* Scrape Image Gallery Preview (if scraping job with images) */}
          {job.result &&
            job.result.images &&
            Array.isArray(job.result.images) &&
            job.result.images.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-white text-xs uppercase flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-blue-400" />
                    Extracted Comic Panels ({job.result.images.length})
                  </h4>
                  {job.result.series?.title && (
                    <span className="text-xs text-neutral-400 font-medium truncate max-w-md">
                      {job.result.series.title} •{" "}
                      {job.result.chapter?.title || job.chapter_id}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-52 overflow-y-auto p-3 bg-neutral-900/60 rounded-2xl border border-neutral-800 custom-scrollbar">
                  {job.result.images.slice(0, 36).map((img: any, idx: number) => (
                    <div
                      key={idx}
                      className="relative group rounded-xl overflow-hidden border border-neutral-800 aspect-[3/4] bg-neutral-950 hover:border-blue-500/50 transition-all"
                    >
                      <img
                        src={img.proxy_url || img.url}
                        alt={`Panel ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/80 text-[10px] font-mono text-neutral-300 backdrop-blur-xs">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Raw JSON Payload Viewer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400 uppercase flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-neutral-500" />
                Structured Payload
              </span>
              <span className="text-[11px] text-neutral-500 font-mono">
                Created: {job.created_at || "—"}
              </span>
            </div>
            <pre className="bg-[#0b0b0e] border border-neutral-800 p-4 rounded-2xl text-xs font-mono text-emerald-400 overflow-x-auto max-h-64 leading-relaxed custom-scrollbar">
              {JSON.stringify(job, null, 2)}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-neutral-950/40 border-t border-neutral-850 flex items-center justify-between shrink-0">
          <div className="text-xs text-neutral-500 font-mono">
            Initiated By User:{" "}
            <span className="text-neutral-300 font-medium">
              {job.user_id || "System"}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            {(job.status?.toLowerCase() === "running" ||
              job.status?.toLowerCase() === "queued") &&
              onCancelJob && (
                <button
                  type="button"
                  onClick={() => onCancelJob(job.job_id)}
                  className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <StopCircle className="w-3.5 h-3.5" />
                  Cancel Job
                </button>
              )}
            {onDeleteJob && (
              <button
                type="button"
                onClick={() => onDeleteJob(job.job_id)}
                className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Job
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold tracking-wide transition-all border border-neutral-750/30 cursor-pointer active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
