import React, { useState, useEffect } from "react";
import {
  Search,
  Database,
  Code,
  ChevronRight,
  FileJson,
  Table,
  Layers,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

export function AdminExplorerTab({
  fetchWithInterceptor,
}: {
  fetchWithInterceptor: any;
}) {
  const [view, setView] = useState<"index" | "table">("index");
  const [activeTable, setActiveTable] = useState("series");
  const [tableData, setTableData] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedObject, setSelectedObject] = useState<any | null>(null);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (view === "index") {
      fetchProjects();
    } else {
      fetchTableData();
    }
  }, [view, activeTable, offset]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetchWithInterceptor("/api/auth/admin/projects");
      if (res.ok) {
        const data = await res.json();
        if (data.success) setProjects(data.projects);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async () => {
    setLoading(true);
    try {
      const res = await fetchWithInterceptor(
        `/api/auth/admin/db/query?table=${activeTable}&limit=${limit}&offset=${offset}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success) setTableData(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch table data:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(
    (p) =>
      (p.title || "").toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase())
  );

  const tables = [
    "users",
    "series",
    "chapters",
    "panels",
    "user_audit_logs",
    "platform_settings",
  ];

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      <div className="flex items-center justify-between bg-[#111115] border border-neutral-800 rounded-xl p-2">
        <div className="flex bg-[#0b0b0e] rounded-lg p-1">
          <button
            onClick={() => setView("index")}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 font-mono ${
              view === "index"
                ? "bg-[#3B82F6] text-white shadow-sm"
                : "text-[#9CA3AF] hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Project Index
          </button>
          <button
            onClick={() => setView("table")}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 font-mono ${
              view === "table"
                ? "bg-[#3B82F6] text-white shadow-sm"
                : "text-[#9CA3AF] hover:text-white"
            }`}
          >
            <Table className="w-3.5 h-3.5" /> DB Browser
          </button>
        </div>

        {view === "table" && (
          <div className="flex items-center gap-2 mr-2">
            {tables.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setActiveTable(t);
                  setOffset(0);
                }}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-tighter transition-all border font-mono ${
                  activeTable === t
                    ? "bg-[#3B82F6]/15 border-[#3B82F6]/50 text-[#3B82F6]"
                    : "bg-[#141414] border-[#2F2F2F] text-[#9CA3AF] hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
              <input
                type="text"
                placeholder={
                  view === "index" ? "Search projects..." : "Filter results..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#121212] border border-[#2F2F2F] text-sm text-[#E5E5E5] rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-[#3B82F6] font-sans"
              />
            </div>
          </div>

          <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl overflow-hidden max-h-[600px] overflow-y-auto shadow-sm">
            <div className="p-3 border-b border-[#2F2F2F] bg-[#181818] flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#E5E5E5] uppercase tracking-wider flex items-center gap-2 font-mono">
                <Database className="w-3.5 h-3.5 text-[#3B82F6]" />{" "}
                {view === "index"
                  ? "Object Registry"
                  : `${activeTable} Records`}
              </h3>
              <span className="text-[10px] text-[#9CA3AF] font-mono">
                {view === "index" ? filteredProjects.length : tableData.length}{" "}
                records
              </span>
            </div>
            <div className="divide-y divide-[#2F2F2F]">
              {loading ? (
                <div className="p-8 text-center text-[#9CA3AF] text-sm">
                  Loading...
                </div>
              ) : view === "index" ? (
                filteredProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedObject(p)}
                    className={`w-full p-4 text-left hover:bg-[#181818] transition-colors flex items-center justify-between group ${
                      selectedObject?.id === p.id ? "bg-[#3B82F6]/10" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          selectedObject?.id === p.id
                            ? "text-[#3B82F6]"
                            : "text-[#E5E5E5]"
                        }`}
                      >
                        {p.title || "Untitled"}
                      </p>
                      <p className="text-[10px] text-[#9CA3AF] font-mono mt-0.5 truncate">
                        {p.id}
                      </p>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-[#6B7280] transition-transform ${
                        selectedObject?.id === p.id
                          ? "translate-x-1 text-[#3B82F6]"
                          : "group-hover:translate-x-1"
                      }`}
                    />
                  </button>
                ))
              ) : (
                tableData.map((row, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedObject(row)}
                    className={`w-full p-4 text-left hover:bg-[#181818] transition-colors flex items-center justify-between group ${
                      selectedObject === row ? "bg-[#3B82F6]/10" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-mono truncate ${
                          selectedObject === row
                            ? "text-[#3B82F6]"
                            : "text-[#E5E5E5]"
                        }`}
                      >
                        {row.id || row.email || row.user_id || i}
                      </p>
                      <p className="text-[10px] text-[#9CA3AF] mt-0.5 truncate">
                        {Object.keys(row)
                          .slice(0, 3)
                          .map((k) => `${k}: ${row[k]}`)
                          .join(" | ")}
                      </p>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-[#6B7280] transition-transform ${
                        selectedObject === row
                          ? "translate-x-1 text-[#3B82F6]"
                          : "group-hover:translate-x-1"
                      }`}
                    />
                  </button>
                ))
              )}
            </div>

            {view === "table" && (
              <div className="p-2 bg-[#0b0b0e] border-t border-neutral-800 flex items-center justify-between">
                <button
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  className="p-1.5 hover:bg-neutral-800 rounded text-neutral-500 disabled:opacity-20"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-[10px] text-neutral-600 font-bold uppercase">
                  Offset: {offset}
                </span>
                <button
                  disabled={tableData.length < limit}
                  onClick={() => setOffset(offset + limit)}
                  className="p-1.5 hover:bg-neutral-800 rounded text-neutral-500 disabled:opacity-20"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedObject ? (
            <div className="bg-[#111115] border border-neutral-800 rounded-xl overflow-hidden h-full flex flex-col">
              <div className="p-4 border-b border-neutral-800 bg-[#0b0b0e] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#3B82F6]/10 rounded-lg text-[#3B82F6]">
                    <FileJson className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Record Inspector</h3>
                    <p className="text-xs text-neutral-500 font-mono">
                      {selectedObject.id || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 bg-[#0b0b0e] font-mono text-[13px] leading-relaxed relative">
                <pre className="text-blue-400">
                  {JSON.stringify(selectedObject, null, 2)}
                </pre>
              </div>

              <div className="p-4 border-t border-neutral-800 bg-[#111115] flex justify-between items-center text-xs">
                <span className="text-neutral-500 flex items-center gap-1">
                  <Code className="w-3 h-3" /> Size:{" "}
                  {JSON.stringify(selectedObject).length.toLocaleString()} bytes
                </span>
                <button
                  onClick={() => {
                    const blob = new Blob(
                      [JSON.stringify(selectedObject, null, 2)],
                      { type: "application/json" }
                    );
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `Sonikoma_Record_${
                      selectedObject.id || "export"
                    }_${new Date().toISOString().split("T")[0]}.json`;
                    a.click();
                  }}
                  className="text-[#3B82F6] hover:text-[#60A5FA] font-medium transition-colors"
                >
                  Export JSON
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#111115] border border-neutral-800 border-dashed rounded-xl h-full flex flex-col items-center justify-center p-12 text-center">
              <div className="p-4 bg-neutral-900 rounded-full mb-4 text-neutral-500">
                <Database className="w-12 h-12" />
              </div>
              <h3 className="text-lg font-bold text-neutral-300">
                No Record Selected
              </h3>
              <p className="text-neutral-500 max-w-xs mt-2 text-sm">
                Select a record from the{" "}
                {view === "index" ? "Project Index" : "DB Table"} to inspect its
                raw JSON structure.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
