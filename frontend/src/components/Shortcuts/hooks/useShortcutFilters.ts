import { useMemo, useState } from "react";
import { getActionDetails } from "../shortcutUtils";
import { Category } from "../shortcutTypes";

export function useShortcutFilters(shortcuts: Record<string, string>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  const filteredShortcuts = useMemo(() => {
    return Object.entries(shortcuts).filter(([id, val]) => {
      const details = getActionDetails(id);
      const matchesSearch =
        details.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        val.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === "all" || details.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [shortcuts, searchQuery, activeCategory]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setActiveCategory("all");
  };

  return {
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    filteredShortcuts,
    handleClearFilters,
  };
}
