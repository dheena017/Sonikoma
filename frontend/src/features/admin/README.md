# Admin Domain (`features/admin/`)

## 1. Executive Overview & Scope
The **Admin Domain** provides administrative back-office controls, user account management, model training dashboards, system resource metrics, and elevated access configuration for Sonikoma operators.

## 2. Directory & File Inventory
- **`components/`**:
  - `AdminLayout.tsx`: Dedicated admin shell layout with header, sidebar, and tab navigation.
  - `AdminSidebar.tsx`: Expanded sidebar containing admin-specific navigation routes.
  - `AdminMiniSidebar.tsx`: Collapsed compact sidebar for administrative workflows.
  - `Tabs/`: Tabbed sub-views (Settings, Training, Usage, Users).
- **`pages/`**:
  - `AdminPage.tsx`: Root admin gateway.
  - `AdminDashboardPage.tsx`: Primary telemetry and system metrics board.
  - `AdminHeaderPage.tsx`: Dedicated administrative navigation bar view.
- **`hooks/`**: Admin permissions and metric collection hooks.
- **`utils/`**: Metric aggregation and user permission validators.

## 3. State Architecture & Reactive Flow
Admin state tracks elevated user credentials and polling data for system operations, server load, and active worker pools.

## 4. UI Hierarchy Blueprint
```
AdminLayout
├── AdminHeaderPage
├── AdminSidebar / AdminMiniSidebar
└── Tab Container (Settings | Training | Usage | Users)
```

## 5. Utilities & Algorithms
Role-based access evaluation, quota usage math, and server telemetry calculation.

## 6. Routing & Navigation
Mounted under `/admin`, `/admin/dashboard`, `/admin/users`, `/admin/settings`. Guarded by superuser / administrator role verifications.

## 7. Dependencies & Public API
Exports: `AdminPage`, `AdminDashboardPage`, `AdminHeaderPage`, `AdminLayout`, `AdminSidebar`.
Allowed Imports: `@/shared/`, `@/api`.

## 8. Testing & Quality Assurance
Strict role checking, mock user elevation, and telemetry parsing test cases.
