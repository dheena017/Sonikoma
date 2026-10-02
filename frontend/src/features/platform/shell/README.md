# Platform Shell Module (`features/platform/shell/`)

## 1. Executive Overview & Scope
The **Platform Shell** is the outermost UI and navigation container of the Sonikoma platform. It wraps all authenticated and studio views, housing the persistent `MainHeader`, multi-mode `MainSidebar`, collapsible `MainMiniSidebar`, global search command bar, and first-paint `LoadingPage`.

- **Primary Responsibility**: Master layout orchestration, drawer mounts, viewport sizing, global modal mounting, and router integration.
- **Delegated Responsibilities**: Domain-specific content rendering (delegated to routed page components via `<main>` children slot).

## 2. Directory & File Inventory
- **`components/`**:
  - `MainLayout.tsx`: Master grid container with header, sidebars, modal portals, and responsive content slots.
  - `MainHeader.tsx`: Top command bar with project selectors, status badges, notifications, and navigation triggers.
  - `MainSidebar.tsx`: Expanded sidebar containing full navigation links, workspace actions, and user menus.
  - `MainMiniSidebar.tsx`: Icon-only compact sidebar designed for focused studio workflows.
  - `GlobalSearchBar.tsx`: Command palette modal for quick search across projects, chapters, and actions.
  - `QuickFindCommandBar.tsx`: Ergonomic re-export of `GlobalSearchBar`.
  - `LoadingPage.tsx`: Full-screen studio initialization screen with themed progress animations.
- **`hooks/`**:
  - `useAppRouter.ts`: Custom routing controller managing history navigation, query sync, and active state.
- **`utils/`**: Helper formatting and layout layout calculators.
- **`pages/`**: Reserved for top-level shell landing wrappers.

## 3. State Architecture & Reactive Flow
```
URL / Route State
       │
       ▼
useAppRouter() ──► activePath, breadcrumbs, navigation dispatch
       │
       ▼
  MainLayout ──┬──► MainHeader (Active project, Notifications, ServerStatus)
               ├──► MainSidebar / MainMiniSidebar (Navigation links, Collapsed state)
               └──► Children Container (Routed page content)
```

## 4. UI Hierarchy & Component Blueprint
```
MainLayout
├── MainHeader
│   ├── SonikomaLogo
│   ├── ActiveProjectBar (from platform/projects)
│   ├── ServerStatusIndicator (from shared/ui/status)
│   ├── NotificationDropdown (from platform/notifications)
│   └── UserAvatarMenu
├── Sidebar Container
│   ├── MainSidebar (when expanded)
│   └── MainMiniSidebar (when collapsed)
├── GlobalSearchBar (Command Palette Dialog)
└── Main Content Viewport (<main>{children}</main>)
```

## 5. Utilities & Algorithmic Logic
- Viewport width breakpoints calculation for auto-collapsing sidebar.
- Path matcher utilities determining whether to mount studio headers or minimal headers.

## 6. Routing, URLs & Navigation
- Interacts with all top-level routes (`/`, `/dashboard`, `/projects`, `/editor`, etc.).
- Mounts `LoadingPage` while critical session and route dependencies hydrate.

## 7. Dependencies & Public Contract
- **Exports**: `MainLayout`, `MainHeader`, `MainSidebar`, `MainMiniSidebar`, `GlobalSearchBar`, `LoadingPage`, `useAppRouter`.
- **Imports from `@/shared/`**: `SonikomaLogo`, `ServerStatusIndicator`, `useThemeMode`, `useProjectStore`.

## 8. Testing & Quality Assurance
- Verifies responsive transitions between `MainSidebar` and `MainMiniSidebar`.
- Validates keyboard shortcut trigger (`Ctrl+K` / `Cmd+K`) for `GlobalSearchBar`.
- Type check: strict TypeScript compilation with zero `any` leaks.
