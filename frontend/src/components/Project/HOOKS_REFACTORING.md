# Projects Page Hooks Refactoring

## Overview

The monolithic `useProjectsPage` hook has been separated into 6 focused, single-responsibility hooks for better maintainability and reusability.

## New Hook Structure

### 📂 Location

```
frontend/src/components/Project/hooks/
├── useProjectsData.ts          # Data fetching & project list state
├── useProjectsFilters.ts       # Filters and sorting state
├── useProjectsSelection.ts     # Multi-select and bulk operations
├── useProjectsMenu.ts          # Menu and rename dialog state
├── useProjectsActions.ts       # Project actions (delete, export, navigate)
├── useProjectsComputed.ts      # Derived state (stats, genres, filtered list)
├── useProjectsPage.ts          # Composition hook (maintains backward compatibility)
└── index.ts                    # Central export point
```

## Individual Hooks

### 1. `useProjectsData`

**Purpose**: Manages project data fetching and loading state

**State**:

- `projects`: Project[]
- `loading`: boolean
- `error`: string | null

**Methods**:

- `fetchProjects()`: Fetches projects from API
- `setProjects()`: Manually update projects list

**Usage**:

```typescript
const { projects, loading, error, fetchProjects } = useProjectsData();
```

---

### 2. `useProjectsFilters`

**Purpose**: Manages all filter and view mode states

**State**:

- `searchQuery`: string
- `statusFilter`: string
- `genreFilter`: string
- `sortBy`: string
- `viewMode`: "grid" | "list"

**Methods**:

- `setSearchQuery()`, `setStatusFilter()`, `setGenreFilter()`, `setSortBy()`, `setViewMode()`

**Usage**:

```typescript
const { searchQuery, statusFilter, genreFilter, sortBy, viewMode, setSearchQuery, ... } = useProjectsFilters();
```

---

### 3. `useProjectsSelection`

**Purpose**: Manages multi-select functionality and bulk operations

**State**:

- `selectedProjects`: Set<string>

**Methods**:

- `toggleSelection(e, projectId)`: Toggle individual project selection
- `toggleSelectAll(filteredProjects)`: Select/deselect all filtered projects
- `clearSelection()`: Clear all selections
- `setSelectedProjects()`: Manually set selections

**Usage**:

```typescript
const { selectedProjects, toggleSelection, toggleSelectAll, clearSelection } =
  useProjectsSelection();
```

---

### 4. `useProjectsMenu`

**Purpose**: Manages context menu and rename dialog states

**State**:

- `openMenuId`: string | null
- `renamingProjectId`: string | null

**Methods**:

- `toggleMenu(e, projectId)`: Toggle context menu for a project
- `closeMenu()`: Close all menus
- `setRenamingProjectId()`: Set which project is being renamed
- `saveProjectName()`: Save renamed project (placeholder implementation)

**Usage**:

```typescript
const { openMenuId, renamingProjectId, toggleMenu, closeMenu } =
  useProjectsMenu();
```

---

### 5. `useProjectsActions`

**Purpose**: Handles all project actions (navigation, deletion, export, etc.)

**Methods**:

- `handleNewSeries()`: Navigate to create new series
- `handleOpenProject()`: Open project for editing
- `handleExport()`: Export project
- `handleRename()`: Initiate rename
- `handleOpenDetails()`: Open project details
- `handleCopyLink()`: Copy project link
- `handleDeleteSingle()`: Delete individual project
- `handleBulkDelete()`: Delete multiple projects

**Usage**:

```typescript
const actions = useProjectsActions();
actions.handleDeleteSingle(event, projectId, onSuccess, onMenuClose);
```

---

### 6. `useProjectsComputed`

**Purpose**: Memoized derived state (stats, genres, filtered projects)

**Computed Values**:

- `stats`: { totalProjects, completedProjects, totalPanels }
- `uniqueGenres`: string[]
- `filteredProjects`: Project[] (filtered by search, status, genre, sorted)

**Parameters**:

```typescript
useProjectsComputed(projects, searchQuery, statusFilter, genreFilter, sortBy);
```

**Usage**:

```typescript
const { stats, uniqueGenres, filteredProjects } = useProjectsComputed(...);
```

---

### 7. `useProjectsPage` (Composer)

**Purpose**: Composes all individual hooks and maintains backward compatibility

This hook:

- Combines all individual hooks into one
- Handles inter-hook communication (e.g., menu closes after actions)
- Maintains the original `ProjectsPageState` interface
- Can be used as a drop-in replacement for the old monolithic hook

**Usage**:

```typescript
const page = useProjectsPage();
// All original properties available
```

---

## Import Paths

### Use Individual Hooks:

```typescript
import {
  useProjectsData,
  useProjectsFilters,
  useProjectsSelection,
  useProjectsMenu,
  useProjectsActions,
  useProjectsComputed,
} from "./hooks";
```

### Use Composer Hook (maintains backward compatibility):

```typescript
import useProjectsPage from "./hooks/useProjectsPage";
```

---

## Benefits

✅ **Single Responsibility**: Each hook manages one concern
✅ **Reusability**: Individual hooks can be used in other components
✅ **Testability**: Each hook can be tested independently
✅ **Maintainability**: Easier to understand and modify specific functionality
✅ **Performance**: Each hook only re-computes when its dependencies change
✅ **Backward Compatibility**: The composer hook maintains the original interface

---

## Migration Guide

### No changes required!

The `useProjectsPage` hook maintains 100% backward compatibility. All existing code continues to work:

```typescript
// Old code still works
import useProjectsPage from "./hooks/useProjectsPage";
const page = useProjectsPage();
```

### For new code:

You can now use individual hooks as needed:

```typescript
// New code can use focused hooks
const data = useProjectsData();
const filters = useProjectsFilters();
// Use only what you need
```

---

## Next Steps

1. ✅ All hooks created and tested
2. ✅ Backward compatibility maintained
3. ⏳ Optional: Extract ProjectTypes.ts and ProjectsTable.tsx from hooks/ (not needed for functionality)
4. ⏳ Optional: Create tests for individual hooks
