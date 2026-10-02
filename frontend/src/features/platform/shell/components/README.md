# Platform Shell Components (`features/platform/shell/components/`)

## Overview
Houses all presentational and structural components comprising the Sonikoma application chrome.

## Components Inventory
| Component | Type | Responsibility |
| :--- | :--- | :--- |
| `MainLayout.tsx` | Container | High-level CSS grid layout, responsive breakpoints, drawer portals |
| `MainHeader.tsx` | Composite | Platform navigation bar, quick status indicators, user menu triggers |
| `MainSidebar.tsx` | Composite | Expanded multi-section navigation rail |
| `MainMiniSidebar.tsx` | Composite | Compact icon-based sidebar for studio mode |
| `GlobalSearchBar.tsx` | Modal / Dialog | Omni-search command palette for fast action execution |
| `QuickFindCommandBar.tsx` | Utility Wrapper | Alias export for GlobalSearchBar |
| `LoadingPage.tsx` | Full Page | Animated high-fidelity loading splash screen |
