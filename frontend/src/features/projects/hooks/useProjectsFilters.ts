import { useState } from "react";

export interface UseProjectsFiltersState {
  searchQuery: string;
  statusFilter: string;
  genreFilter: string;
  sortBy: string;
  viewMode: "grid" | "list";
  setSearchQuery: (value: string) => void;
  setStatusFilter: (value: string) => void;
  setGenreFilter: (value: string) => void;
  setSortBy: (value: string) => void;
  setViewMode: (mode: "grid" | "list") => void;
}

export function useProjectsFilters(): UseProjectsFiltersState {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [genreFilter, setGenreFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return {
    searchQuery,
    statusFilter,
    genreFilter,
    sortBy,
    viewMode,
    setSearchQuery,
    setStatusFilter,
    setGenreFilter,
    setSortBy,
    setViewMode,
  };
}
