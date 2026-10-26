# Admin Components (`features/admin/components/`)

Administrative layout shells, navigation bars, and modular page subcomponents.

## Component Inventory

### 1. Shell & Navigation Compounds
| Component | Description |
|-----------|-------------|
| `AdminLayout` | Master layout shell managing header, sidebars, and viewport padding |
| `AdminHeader` | Sticky navigation bar with command palette, health indicator, credits popover, and profile controls |
| `AdminSidebar` | Responsive drawer navigation with categorized navigation groups |
| `AdminMiniSidebar` | Collapsed compact icon rail for fast switching |

### 2. Dashboard Components
| Component | Description |
|-----------|-------------|
| `AdminDashboardStats` | Creator, project, MRR, and pipeline health statistic cards |
| `AdminDashboardChart` | Interactive SVG growth chart with bezier trends and date points |
| `AdminDashboardPulse` | Infrastructure pulse meters (CPU load, RSS memory, system uptime, DB status, DB latency) |
| `AdminDashboardQuickActions` | Executive actions panel for log exports and job shortcuts |
| `AdminDashboardBroadcaster` | Broadcast announcement push form |
| `AdminDashboardUsers` | Active creators list with search filter and user impersonation action |
| `AdminDashboardAuditEvents` | Security audit event stream card |

### 3. User Management Components
| Component | Description |
|-----------|-------------|
| `AdminUserEditModal` | Account modifier dialog for role, credits, and account lock |
| `AdminUserDeleteModal` | Critical confirmation dialog for account purging with audit reasons |
| `AdminUserGrantCreditsModal` | Credit grant and balance adjustment dialog |
| `AdminUserLogsModal` | Audit log history viewer for individual users |
| `AdminUsersBulkBar` | Floating bulk action bar for multi-user lock/unlock/delete operations |

## Usage

```tsx
import {
  AdminLayout,
  AdminHeader,
  AdminSidebar,
  AdminMiniSidebar,
  AdminDashboardStats,
  AdminDashboardChart,
  AdminUserEditModal,
} from "@/features/admin/components";
```
