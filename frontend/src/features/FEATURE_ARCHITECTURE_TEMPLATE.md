# Sonikoma Frontend Feature Architecture Template

This document provides the standard, reusable boilerplate template for all features under `frontend/src/features/`.
It is modeled directly after the gold-standard architecture established in [`features/platform/dashboard`](file:///c:/Users/dheen/project/Sonikoma/frontend/src/features/platform/dashboard).

---

## 📁 1. Standard Feature Directory Layout

Every feature follows this clean, 4-tier modular domain layout:

```
frontend/src/features/<domain>/<feature_name>/
├── components/                 # Presentation & UI widgets
│   ├── <Feature>Header.tsx     # Specialized UI section
│   ├── <Feature>Stats.tsx      # Specialized UI section
│   ├── <Feature>List.tsx       # Specialized UI section
│   └── index.ts                # Public export barrel for components
├── hooks/                      # Reactive logic, caching, API calls
│   ├── use<Feature>Page.ts     # Main controller hook for the page
│   └── index.ts                # Public export barrel for hooks & types
├── pages/                      # Page-level route views
│   ├── <Feature>Page.tsx       # Route entry view (assembles hook & components)
│   └── index.ts                # Public export barrel for pages
├── utils/                      # Pure helper functions, parsers, calculators
│   ├── <feature>Helpers.ts     # Domain math, formatting, parsing
│   └── index.ts                # Public export barrel for helpers
├── index.ts                    # Root public API of the feature
└── README.md                   # Feature documentation & scope inventory
```

---

## 📄 2. Page Code Template (`pages/<Feature>Page.tsx`)

The **Page** is a layout assembler. It connects the controller hook with focused components. It contains **no raw API calls or heavy business logic**.

```tsx
// file: frontend/src/features/<domain>/<feature>/pages/<Feature>Page.tsx

import React from "react";

// 1. Feature Components
import FeatureHeader from "../components/FeatureHeader";
import FeatureStats from "../components/FeatureStats";
import FeatureList from "../components/FeatureList";

// 2. Controller Hook
import useFeaturePage from "../hooks/useFeaturePage";

export default function FeaturePage() {
  // Destructure state and handlers from controller hook
  const {
    items,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    totalCount,
    handleRetry,
    handleCreateItem,
    handleDeleteItem,
  } = useFeaturePage();

  return (
    <div className="w-full flex-1 flex flex-col text-[#E5E5E5] animate-fade-in relative z-10 py-4 sm:py-6 max-w-7xl mx-auto">
      {/* Main Container Card */}
      <div className="rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-4 sm:p-8 lg:p-9 shadow-2xl space-y-8 relative overflow-hidden text-left">
        
        {/* Section 1: Header */}
        <div className="relative z-10">
          <FeatureHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onCreate={handleCreateItem}
          />
        </div>

        {/* Section 2: Metric Stats */}
        <div className="relative z-10">
          <FeatureStats
            totalCount={totalCount}
            loading={loading}
          />
        </div>

        {/* Section 3: Data Workspace */}
        <div className="relative z-10">
          <FeatureList
            items={items}
            loading={loading}
            error={error}
            onRetry={handleRetry}
            onDelete={handleDeleteItem}
          />
        </div>
      </div>
    </div>
  );
}
```

### `pages/index.ts`
```tsx
// file: frontend/src/features/<domain>/<feature>/pages/index.ts

export { default as FeaturePage } from "./FeaturePage";
```

---

## 🪝 3. Hook Code Template (`hooks/use<Feature>Page.ts`)

The **Hook** is the single source of truth for the feature. It manages network state, caching, search filtering, and user interaction callbacks.

```tsx
// file: frontend/src/features/<domain>/<feature>/hooks/use<Feature>Page.ts

import { useCallback, useEffect, useMemo, useState } from "react";
import { useThemeMode } from "@/shared/hooks/useThemeMode";
import {
  getAuthHeaders,
  filterItemsByQuery,
  calculateItemTotals,
} from "../utils/featureHelpers";

// 1. Interfaces & Types
export interface FeatureItem {
  id: string;
  title: string;
  status: "idle" | "processing" | "completed" | "failed";
  created_at: string;
  count: number;
}

// In-memory module cache for instant tab transitions
let cachedItems: FeatureItem[] = [];

export default function useFeaturePage() {
  const { themeMode } = useThemeMode();
  
  // 2. State Declarations
  const [items, setItems] = useState<FeatureItem[]>(() => cachedItems);
  const [loading, setLoading] = useState<boolean>(() => cachedItems.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // 3. API Data Fetching
  const fetchItems = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/v1/feature-endpoint", {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error(`Failed to load data (HTTP ${res.status})`);
      }
      const data = await res.json();
      const list = data.items || [];
      cachedItems = list;
      setItems(list);
    } catch (err: any) {
      console.error("Failed to load feature items:", err);
      if (cachedItems.length === 0) {
        setError(err.message || "Failed to load data.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // 4. Derived & Memoized State
  const filteredItems = useMemo(
    () => filterItemsByQuery(items, searchQuery),
    [items, searchQuery]
  );

  const totalCount = useMemo(
    () => calculateItemTotals(items),
    [items]
  );

  // 5. User Interaction Handlers
  const handleRetry = useCallback(() => {
    setLoading(true);
    fetchItems();
  }, [fetchItems]);

  const handleCreateItem = useCallback(() => {
    // Navigate or trigger modal
    console.log("Create triggered");
  }, []);

  const handleDeleteItem = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/v1/feature-endpoint/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }, []);

  // 6. Return Public Hook Contract
  return {
    themeMode,
    items: filteredItems,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    totalCount,
    handleRetry,
    handleCreateItem,
    handleDeleteItem,
  };
}
```

### `hooks/index.ts`
```tsx
// file: frontend/src/features/<domain>/<feature>/hooks/index.ts

export { default as useFeaturePage } from "./useFeaturePage";
export * from "./useFeaturePage";
```

---

## 🧩 4. Component Code Template (`components/<Feature>Component.tsx`)

Components are strictly typed, focused UI units. Order of code:
1. Imports (React -> 3rd party -> Aliases -> Relatives)
2. Interfaces / Types
3. Module Constants
4. Component Definition (with hooks, memo, handlers, early returns, JSX)

```tsx
// file: frontend/src/features/<domain>/<feature>/components/FeatureHeader.tsx

import React from "react";
import { Search, Plus } from "lucide-react";

// 1. Props Contract
interface FeatureHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onCreate: () => void;
}

export default function FeatureHeader({
  searchQuery,
  onSearchChange,
  onCreate,
}: FeatureHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Feature Title
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Manage and monitor all your workspace items.
        </p>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search items..."
            className="w-48 sm:w-64 pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-neutral-600 transition"
          />
        </div>

        {/* Primary CTA */}
        <button
          onClick={onCreate}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black font-semibold text-sm rounded-xl hover:bg-neutral-200 transition shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>New Item</span>
        </button>
      </div>
    </div>
  );
}
```

### `components/index.ts`
```tsx
// file: frontend/src/features/<domain>/<feature>/components/index.ts

export { default as FeatureHeader } from "./FeatureHeader";
export { default as FeatureStats } from "./FeatureStats";
export { default as FeatureList } from "./FeatureList";
```

---

## 🛠️ 5. Utilities Code Template (`utils/<feature>Helpers.ts`)

Pure functions only. No React hooks or component rendering.

```tsx
// file: frontend/src/features/<domain>/<feature>/utils/featureHelpers.ts

import type { FeatureItem } from "../hooks/useFeaturePage";

/** Retrieve auth token safely for SSR and browser */
export function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("sonikoma_token") || sessionStorage.getItem("sonikoma_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Filter items by case-insensitive title */
export function filterItemsByQuery(items: FeatureItem[], query: string): FeatureItem[] {
  const q = (query || "").trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => item.title.toLowerCase().includes(q));
}

/** Calculate sum totals across items */
export function calculateItemTotals(items: FeatureItem[]): number {
  return items.reduce((acc, item) => acc + (item.count || 0), 0);
}
```

### `utils/index.ts`
```tsx
// file: frontend/src/features/<domain>/<feature>/utils/index.ts

export * from "./featureHelpers";
```

---

## 🌐 6. Feature Root Barrel (`index.ts`)

The single entry door for consumers outside this feature:

```tsx
// file: frontend/src/features/<domain>/<feature>/index.ts

export * from "./components";
export * from "./hooks";
export * from "./pages";
export * from "./utils";
export { default as FeaturePage } from "./pages/FeaturePage";
```

---

## 📖 7. Documentation Template (`README.md`)

Keep 1 single accurate documentation file at the root of the feature. **Do not create redundant 3-line READMEs inside every subfolder.**

```markdown
# <Feature Name> Module (`features/<domain>/<feature>/`)

## 1. Overview & Scope
Concise description of the user problems solved by this module.

## 2. Directory Structure
- **`components/`**: Active presentation widgets:
  - `<Feature>Header.tsx`: Search and action controls.
  - `<Feature>Stats.tsx`: High-level metrics.
  - `<Feature>List.tsx`: Grid or table view.
- **`hooks/`**:
  - `use<Feature>Page.ts`: Reactive state, caching, search filtering, and handlers.
- **`pages/`**:
  - `<Feature>Page.tsx`: Primary view route assembling components and hook.
- **`utils/`**:
  - `<feature>Helpers.ts`: Pure formatting, data parsing, and helper functions.
```

---

## ✅ Checklist for Every Feature

| Step | Requirement | Verified? |
|---|---|---|
| 1 | Dedicated subfolders: `components/`, `hooks/`, `pages/`, `utils/` | [ ] |
| 2 | Each subfolder has an `index.ts` exporting only active artifacts | [ ] |
| 3 | Root `index.ts` exports all subfolders and the main `FeaturePage` | [ ] |
| 4 | No dead, unimported, or duplicate placeholder components | [ ] |
| 5 | Page only connects hooks to components (no raw API calls in Page) | [ ] |
| 6 | No README clutter in subfolders (1 root README per feature) | [ ] |
| 7 | Zero TypeScript errors (`npx tsc --noEmit` passes) | [ ] |
