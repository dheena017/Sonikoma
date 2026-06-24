import React, { useState, useEffect } from "react";
import { X, User, Image as ImageIcon } from "lucide-react";
import { CharacterBio } from "../../types";

interface CharacterEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (char: CharacterBio) => void;
  initialData?: CharacterBio;
}

export default function CharacterEditModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: CharacterEditModalProps) {
  const [formData, setFormData] = useState<CharacterBio>({
    name: "",
    estimated_age: "",
    power_description: "",
    clothing_color: "",
    active_role: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: "",
        estimated_age: "",
        power_description: "",
        clothing_color: "",
        active_role: "",
        avatar_url: "",
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/50">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-purple-400" />
            {initialData ? "Edit Character" : "Add Character"}
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Name
            </label>
            <input
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors"
              placeholder="e.g. Sung Jin-Woo"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Role
              </label>
              <input
                value={formData.active_role}
                onChange={(e) =>
                  setFormData({ ...formData, active_role: e.target.value })
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                placeholder="e.g. Protagonist"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Estimated Age
              </label>
              <input
                value={formData.estimated_age}
                onChange={(e) =>
                  setFormData({ ...formData, estimated_age: e.target.value })
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                placeholder="e.g. Late Teens"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Avatar Image URL
            </label>
            <div className="relative">
              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
              <input
                value={formData.avatar_url || ""}
                onChange={(e) =>
                  setFormData({ ...formData, avatar_url: e.target.value })
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Clothing / Colors
            </label>
            <input
              value={formData.clothing_color}
              onChange={(e) =>
                setFormData({ ...formData, clothing_color: e.target.value })
              }
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors"
              placeholder="e.g. Dark cloak"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Abilities & Powers
            </label>
            <textarea
              rows={3}
              value={formData.power_description}
              onChange={(e) =>
                setFormData({ ...formData, power_description: e.target.value })
              }
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
              placeholder="Describe their abilities..."
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors shadow-lg cursor-pointer"
            >
              Save Character
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
