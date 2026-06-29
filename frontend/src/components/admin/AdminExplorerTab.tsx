import React, { useState, useEffect } from "react";
import { Search, Database, Code, ChevronRight, FileJson, Table, Layers, ArrowLeft, ArrowRight } from "lucide-react";

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
      const res = await fetchWithInterceptor(`/api/auth/admin/db/query?table=${activeTable}&limit=${limit}&offset=${offset}`);
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

  const tables = ["users", "series", "chapters", "panels", "user_audit_logs", "platform_settings"];

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      <div className="flex items-center justify-between bg-[#111115] border border-neutral-800 rounded-xl p-2">
        <div className="flex bg-[#0b0b0e] rounded-lg p-1">
          <button
            onClick={() => setView("index")}
            className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              view === "index" ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Project Index
          </button>
          <button
            onClick={() => setView("table")}
            className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              view === "table" ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Table className="w-3.5 h-3.5" /> DB Browser
          </button>
        </div>

        {view === "table" && (
          <div className="flex items-center gap-2 mr-2">
            {tables.map(t => (
              <button
                key={t}
                onClick={() => { setActiveTable(t); setOffset(0); }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tighter transition-all border ${
                  activeTable === t ? "bg-purple-500/10 border-purple-500/50 text-purple-400" : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-400"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#111115] border border-neutral-800 rounded-xl p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder={view === "index" ? "Search projects..." : "Filter results..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#0b0b0e] border border-neutral-800 text-sm text-neutral-200 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>

          <div className="bg-[#111115] border border-neutral-800 rounded-xl overflow-hidden max-h-[600px] overflow-y-auto">
            <div className="p-3 border-b border-neutral-800 bg-[#0b0b0e] flex items-center justify-between">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <Database className="w-3 h-3" /> {view === "index" ? "Object Registry" : `${activeTable} Records`}
              </h3>
              <span className="text-[10px] text-neutral-500">
                {view === "index" ? filteredProjects.length : tableData.length} records
              </span>
            </div>
            <div className="divide-y divide-neutral-800/50">
              {loading ? (
                <div className="p-8 text-center text-neutral-500 text-sm">Loading...</div>
              ) : view === "index" ? (
                filteredProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedObject(p)}
                    className={`w-full p-4 text-left hover:bg-white/[0.02] transition-colors flex items-center justify-between group ${
                      selectedObject?.id === p.id ? "bg-purple-500/5" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${selectedObject?.id === p.id ? "text-purple-400" : "text-neutral-200"}`}>
                        {p.title || "Untitled"}
                      </p>
                      <p className="text-[10px] text-neutral-500 font-mono mt-0.5 truncate">{p.id}</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-neutral-600 transition-transform ${selectedObject?.id === p.id ? "translate-x-1 text-purple-500" : "group-hover:translate-x-1"}`} />
                  </button>
                ))
              ) : (
                tableData.map((row, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedObject(row)}
                    className={`w-full p-4 text-left hover:bg-white/[0.02] transition-colors flex items-center justify-between group ${
                      selectedObject === row ? "bg-purple-500/5" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p className={`text-sm font-mono truncate ${selectedObject === row ? "text-purple-400" : "text-neutral-300"}`}>
                        {row.id || row.email || row.user_id || i}
                      </p>
                      <p className="text-[10px] text-neutral-500 mt-0.5 truncate">
                        {Object.keys(row).slice(0, 3).map(k => `${k}: ${row[k]}`).join(" | ")}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-neutral-600 transition-transform ${selectedObject === row ? "translate-x-1 text-purple-500" : "group-hover:translate-x-1"}`} />
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
                <span className="text-[10px] text-neutral-600 font-bold uppercase">Offset: {offset}</span>
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
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                    <FileJson className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Record Inspector</h3>
                    <p className="text-xs text-neutral-500 font-mono">{selectedObject.id || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 bg-[#0b0b0e] font-mono text-[13px] leading-relaxed relative">
                <pre className="text-blue-400">{JSON.stringify(selectedObject, null, 2)}</pre>
              </div>

              <div className="p-4 border-t border-neutral-800 bg-[#111115] flex justify-between items-center text-xs">
                <span className="text-neutral-500 flex items-center gap-1">
                  <Code className="w-3 h-3" /> Size: {JSON.stringify(selectedObject).length.toLocaleString()} bytes
                </span>
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(selectedObject, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `record_${selectedObject.id || "export"}.json`;
                    a.click();
                  }}
                  className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
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
              <h3 className="text-lg font-bold text-neutral-300">No Record Selected</h3>
              <p className="text-neutral-500 max-w-xs mt-2 text-sm">
                Select a record from the {view === "index" ? "Project Index" : "DB Table"} to inspect its raw JSON structure.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
