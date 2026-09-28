import React, { useEffect, useState } from "react";
import {
  Compass,
  ArrowLeft,
  Sparkles,
  BookOpen,
  MapPin,
  ShieldAlert,
  Plus,
  Save,
} from "lucide-react";
import { aiSeriesApi, AISeriesProject } from "@/api/endpoints/aiSeries";
import { useSeriesNavigation } from "../hooks/useSeriesNavigation";

export const WorldBuildingVaultPage: React.FC = () => {
  const { navigate, seriesId } = useSeriesNavigation();
  const [project, setProject] = useState<AISeriesProject | null>(null);
  const [worldBible, setWorldBible] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!seriesId) return;
    const load = async () => {
      try {
        setLoading(true);
        const p = await aiSeriesApi.getSeries(seriesId);
        setProject(p);
        const wb = await aiSeriesApi.getWorld(seriesId);
        setWorldBible(wb || p.world_bible || {});
      } catch (err) {
        console.error("Failed to load world bible:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [seriesId]);

  const handleSave = async () => {
    if (!seriesId) return;
    try {
      setSaving(true);
      await aiSeriesApi.updateWorld(seriesId, worldBible);
      alert("World-building lore rules updated and synchronized with Franchise Canon Memory!");
    } catch (err) {
      alert("Failed to save world bible.");
    } finally {
      setSaving(false);
    }
  };

  const getStudioLink = () => {
    if (!project) return `/ai-series`;
    const format = project.format_type;
    if (format === "anime") return `/studio/anime/${seriesId}`;
    if (format === "comic_manga") return `/studio/comic/${seriesId}`;
    return `/studio/manhwa/${seriesId}`;
  };

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-slate-100 p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(getStudioLink())}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5" /> World Building Vault
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">
                Universe Rules & Lore Bible
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-md"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Lore Bible"}
            </button>
            <button
              onClick={() => navigate(getStudioLink())}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-all"
            >
              Return to Studio
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-24 text-slate-400">Loading World Building Vault...</div>
        ) : (
          <div className="space-y-8">
            {/* Setting Name */}
            <div className="bg-[#121316] border border-slate-800 rounded-2xl p-6">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Primary Setting / Metropolis / Realm
              </label>
              <input
                type="text"
                value={worldBible.setting_name || "Neo-Veridia Spires"}
                onChange={(e) => setWorldBible({ ...worldBible, setting_name: e.target.value })}
                className="w-full bg-[#18191E] border border-slate-700 rounded-xl px-4 py-3 text-white text-base font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Core Immutable Rules of Magic / Technology */}
            <div className="bg-[#121316] border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-400" /> Immutable Laws of Physics & Power
                </h2>
                <button
                  onClick={() => {
                    const rules = [...(worldBible.lore_rules || []), "New canonical world rule."];
                    setWorldBible({ ...worldBible, lore_rules: rules });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-900/40"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Rule
                </button>
              </div>

              <div className="space-y-3">
                {(worldBible.lore_rules || []).map((rule: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-[#18191E] border border-slate-800 rounded-xl">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={rule}
                      onChange={(e) => {
                        const newRules = [...worldBible.lore_rules];
                        newRules[idx] = e.target.value;
                        setWorldBible({ ...worldBible, lore_rules: newRules });
                      }}
                      className="w-full bg-transparent text-sm text-slate-200 focus:outline-none focus:text-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Unresolved Mysteries Tracking */}
            <div className="bg-[#121316] border border-slate-800 rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-violet-400" /> Active Mysteries & Prophecies
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                These narrative threads are protected by the Series Memory Engine and are guaranteed to be resolved before the final chapter concludes.
              </p>

              <div className="space-y-2">
                {(worldBible.unresolved_mysteries || [
                  "The origin of Ren's runic scar",
                  "Why Vespera Vance secretly sabotaged the Central Spire gate",
                ]).map((mystery: string, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-violet-950/20 border border-violet-500/30 rounded-xl text-xs text-violet-300 flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                    {mystery}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorldBuildingVaultPage;
