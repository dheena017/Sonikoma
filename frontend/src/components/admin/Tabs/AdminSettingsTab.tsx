import React, { useState, useEffect } from "react";
import {
  Save,
  Shield,
  Mail,
  Server,
  Globe,
  Bell,
  Trash2,
  RotateCcw,
  AlertCircle,
} from "lucide-react";

export function AdminSettingsTab({
  fetchWithInterceptor,
  addNotification,
}: any) {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetchWithInterceptor("/api/auth/admin/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSettings(data.settings);
        }
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetchWithInterceptor("/api/auth/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      if (res.ok) {
        addNotification("Settings updated successfully", "success");
      } else {
        addNotification("Failed to update settings", "error");
      }
    } catch (err) {
      addNotification("Error saving settings", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <p className="text-neutral-400 font-medium">
          Failed to load platform settings
        </p>
        <button
          onClick={fetchSettings}
          className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const sections = [
    {
      id: "general",
      title: "General Platform",
      icon: Globe,
      fields: [
        { key: "platform_name", label: "Platform Name", type: "text" },
        { key: "support_email", label: "Support Email", type: "email" },
        {
          key: "maintenance_mode",
          label: "Maintenance Mode",
          type: "checkbox",
        },
      ],
    },
    {
      id: "security",
      title: "Security & Auth",
      icon: Shield,
      fields: [
        {
          key: "registration_enabled",
          label: "Allow New Registrations",
          type: "checkbox",
        },
        {
          key: "max_login_attempts",
          label: "Max Login Attempts",
          type: "number",
        },
        {
          key: "jwt_expiry_hours",
          label: "JWT Expiry (Hours)",
          type: "number",
        },
      ],
    },
    {
      id: "notifications",
      title: "Email & SMTP",
      icon: Mail,
      fields: [
        { key: "smtp_host", label: "SMTP Host", type: "text" },
        { key: "smtp_port", label: "SMTP Port", type: "number" },
        { key: "smtp_user", label: "SMTP Username", type: "text" },
        { key: "smtp_pass", label: "SMTP Password", type: "password" },
      ],
    },
    {
      id: "system",
      title: "System Limits",
      icon: Server,
      fields: [
        {
          key: "max_upload_size_mb",
          label: "Max Upload Size (MB)",
          type: "number",
        },
        {
          key: "concurrent_scrapes_per_user",
          label: "Concurrent Scrapes Limit",
          type: "number",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Platform Settings</h2>
          <p className="text-sm text-neutral-500">
            Configure global application behavior and integrations
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/20"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <div
            key={section.id}
            className="bg-[#111115] border border-neutral-800 rounded-xl overflow-hidden"
          >
            <div className="p-4 border-b border-neutral-800 bg-[#0b0b0e] flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                <section.icon className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white">{section.title}</h3>
            </div>
            <div className="p-6 space-y-4">
              {section.fields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-neutral-400">
                      {field.label}
                    </label>
                  </div>
                  {field.type === "checkbox" ? (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          settings[field.key] === "true" ||
                          settings[field.key] === true
                        }
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            [field.key]: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-white"></div>
                    </label>
                  ) : (
                    <input
                      type={field.type}
                      value={settings[field.key] || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          [field.key]: e.target.value,
                        })
                      }
                      className="w-full bg-[#0b0b0e] border border-neutral-800 text-sm text-neutral-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
            <Trash2 className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">Danger Zone</h3>
            <p className="text-sm text-neutral-400 mt-1">
              Actions here are permanent and affect the entire platform.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium border border-red-500/20 transition-colors flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> Reset All Settings
              </button>
              <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium border border-red-500/20 transition-colors flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Purge Global Cache
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
