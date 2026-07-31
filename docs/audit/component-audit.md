# Enterprise Component Audit Report: Sonikoma Frontend

This report presents a thorough structural audit of the frontend React components of **Sonikoma**.
Every component file (`.tsx`) under `frontend/src/` has been systematically evaluated to detect architectural bottlenecks, code duplication, size violations, incorrect placement, and candidate modules for splitting.

---

## 📊 1. Executive Summary

- **Total Components Audited:** 280
- **Healthy Components (≤ 200 LOC):** 169 (60.4%)
- **Review Recommended (201–400 LOC):** 65 (23.2%)
- **Large Components (401–700 LOC):** 20 (7.1%)
- **Critical Split Candidates (> 700 LOC):** 26 (9.3%)
- **Unused Components (Delete Candidates):** 21
- **Duplicate Component Groups Identified:** 5 Major Groups
- **Shared Component Opportunities:** 12 components identified for migration into a global `shared/components/` directory
- **Feature Organization Opportunities:** Restructuring admin tabs and authentication modules to follow strict separation of concerns

---

## 🚨 2. Top 20 High-Priority Components Requiring Attention

These components represent the highest architectural risk, highest complexity, and lowest maintainability in the Sonikoma workspace.

| Rank | Component Name | File Path | Size (LOC) | Complexity | Quality | Maintainability | Recommendation | Key Risk Reason |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| 1 | `App` | `App.tsx` | 2166 | Critical | 4/10 | 4/10 | **Split** | Extreme size, multiple nested states and prop drilling |
| 2 | `ProfilePage` | `components/profile/ProfilePage.tsx` | 1741 | Critical | 4/10 | 4/10 | **Split** | Extreme size, multiple nested states and prop drilling |
| 3 | `CinemaPlayer` | `components/Feature/video/CinemaPlayer.tsx` | 1408 | Critical | 4/10 | 4/10 | **Split** | Extreme size, multiple nested states and prop drilling |
| 4 | `AIModelsPage` | `components/Feature/ai_models/AIModelsPage.tsx` | 1381 | Critical | 4/10 | 4/10 | **Split** | Extreme size, multiple nested states and prop drilling |
| 5 | `AppWorkspace` | `components/Workspace/AppWorkspace.tsx` | 1302 | Critical | 4/10 | 4/10 | **Split** | Extreme size, multiple nested states and prop drilling |
| 6 | `MainHeader` | `components/MainHeader.tsx` | 1296 | Critical | 4/10 | 4/10 | **Split** | Extreme size, multiple nested states and prop drilling |
| 7 | `FloatingSelectionBar` | `components/Feature/editor/seloect/FloatingSelectionBar.tsx` | 1295 | Critical | 4/10 | 4/10 | **Split** | Extreme size, multiple nested states and prop drilling |
| 8 | `AdminCreditsTab` | `components/admin/Tabs/AdminCreditsTab.tsx` | 1130 | Critical | 4/10 | 4/10 | **Split** | Extreme size, multiple nested states and prop drilling |
| 9 | `ProfilePreferencesTab` | `components/profile/ProfilePreferencesTab.tsx` | 1123 | Critical | 4/10 | 4/10 | **Split** | Extreme size, multiple nested states and prop drilling |
| 10 | `AdvancedSettings` | `components/Feature/video/AdvancedSettings.tsx` | 1091 | Critical | 4/10 | 4/10 | **Split** | Extreme size, multiple nested states and prop drilling |
| 11 | `StatusPage` | `components/Status/StatusPage.tsx` | 1051 | Critical | 4/10 | 4/10 | **Split** | Extreme size, multiple nested states and prop drilling |
| 12 | `StoryboardTimeline` | `components/Feature/timeline/StoryboardTimeline.tsx` | 1035 | Critical | 4/10 | 4/10 | **Split** | Extreme size, multiple nested states and prop drilling |
| 13 | `PublishMonitor` | `components/Feature/youtube/PublishMonitor.tsx` | 1006 | Critical | 4/10 | 4/10 | **Split** | Extreme size, multiple nested states and prop drilling |
| 14 | `ModelPlaygroundAndSkills` | `components/Feature/ai_models/ModelPlaygroundAndSkills.tsx` | 1003 | Critical | 4/10 | 4/10 | **Split** | Extreme size, multiple nested states and prop drilling |
| 15 | `TimelineCard` | `components/Feature/timeline/TimelineCard.tsx` | 961 | Critical | 4/10 | 4/10 | **Split** | Huge render blocks, complex routing or tab management |
| 16 | `ProfileProjectsTab` | `components/profile/ProfileProjectsTab.tsx` | 946 | Critical | 4/10 | 4/10 | **Delete Candidate** | Huge render blocks, complex routing or tab management |
| 17 | `AdminDashboardPage` | `components/admin/AdminDashboardPage.tsx` | 915 | Critical | 4/10 | 4/10 | **Split** | Huge render blocks, complex routing or tab management |
| 18 | `EpisodeScraper` | `components/Feature/episode-scraper/EpisodeScraper.tsx` | 908 | Critical | 4/10 | 4/10 | **Split** | Huge render blocks, complex routing or tab management |
| 19 | `ProfileSecurityTab` | `components/profile/ProfileSecurityTab.tsx` | 779 | Critical | 4/10 | 4/10 | **Split** | Huge render blocks, complex routing or tab management |
| 20 | `AutoCropEngineSelector` | `components/Feature/editor/Tools/ImageEditor/AutoCrop/AutoCropEngineSelector.tsx` | 775 | Critical | 4/10 | 4/10 | **Split** | Huge render blocks, complex routing or tab management |

---

## 🔍 3. Structural & Folder Violations

### ❌ Wrong Folder Placements
According to the `docs/architecture/project_structure.md` guidelines, generic UI primitives or global layout elements must reside in dedicated shared paths rather than nested inside deep feature folders.

1. **Confirmation Modals (`components/confirmationmodels/`)**
   - **Files:** `ConfirmModal.tsx`, `DeleteConfirmModal.tsx`, `ErrorPopupModal.tsx`, `InfoModal.tsx`, `ProjectConfirmPanel.tsx`
   - **Violation:** The folder is misspelled (`confirmationmodels` missing underscore) and lies directly at the root of the components folder. These should be moved to a standard `components/shared/dialogs/` folder.
2. **Generic Layout Elements (`components/Shortcuts/`)**
   - **Files:** `ShortcutFilters.tsx`, `ShortcutItem.tsx`, `ShortcutList.tsx`, `ShortcutsPage.tsx`, `shortcutUtils.tsx`
   - **Violation:** Placed directly at root of components directory rather than grouped inside `components/Feature/shortcuts/` or `components/shared/` for utility files.
3. **Image Editor Helpers (`components/Feature/editor/shared/`)**
   - **Files:** `RangeSlider.tsx`, `SectionTitle.tsx`
   - **Violation:** Nested deep within the editor feature. Because they are highly generic, they belong in a top-level global `components/shared/primitives/` directory.

---

## 👥 4. Code Duplication Audit (Similarity: Medium to High)

The automated scan detected severe code duplications in the following component groups:

### 1. Header & Navigation Duplication (High Duplication)
- **Files Involved:**
  - `MainHeader.tsx` (1296 LOC)
  - `AdminHeaderPage.tsx` (458 LOC)
  - `CreativeSuiteHeader.tsx` (310 LOC)
  - `ImageEditorHeader.tsx` (340 LOC)
- **Observation:** These 4 headers contain redundant search bar implementations, user dropdown menus, theme-switching buttons, and identical notifications overlay dropdown layouts.
- **Action:** Refactor into a unified `Header` component with custom left/right prop actions.

### 2. Tab-Based Form Optimization & Copy Action (Medium Duplication)
- **Files Involved:**
  - `AdPlacementTab.tsx`
  - `SeoOptimizationTab.tsx`
  - `ShortsScriptTab.tsx`
  - `SoundOutroTab.tsx`
- **Observation:** Each tab repeats identical async fetching block templates, loading indicators, and identical `copyToClipboard` helper functions.
- **Action:** Extract the copy actions and API hook templates into dedicated custom React hooks (`useClipboard`, `useAIOptimization`).

### 3. Page Shells & Forms Layout (Medium Duplication)
- **Files Involved:**
  - `ForgotPasswordForm.tsx`
  - `LoginForm.tsx`
  - `RegisterForm.tsx`
- **Observation:** Repeated layout boilerplate, field styles, error boundaries, and logo configurations.
- **Action:** Leverage a shared `FormShell` layout component.

---

## 🗑️ 5. Unused & Orphaned Components (Delete Candidates)

These components are not imported or referenced anywhere in the workspace. They represent deprecated or orphaned code that can be safely deleted.

| Component Name | File Path | Size (LOC) | Complexity | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| `notificationHelpers` | `components/notification/utils/notificationHelpers.tsx` | 125 | Low | **Delete Candidate** |
| `ProfileProjectsTab` | `components/profile/ProfileProjectsTab.tsx` | 946 | Critical | **Delete Candidate** |
| `DeleteConfirmModal` | `components/confirmationmodels/DeleteConfirmModal.tsx` | 79 | Low | **Delete Candidate** |
| `InfoModal` | `components/confirmationmodels/InfoModal.tsx` | 75 | Low | **Delete Candidate** |
| `ErrorPopupModal` | `components/confirmationmodels/ErrorPopupModal.tsx` | 196 | Low | **Delete Candidate** |
| `GlobalScraperConfigTool` | `components/Feature/scraper/GlobalScraperConfigTool.tsx` | 178 | Low | **Delete Candidate** |
| `LiveScraperHeader` | `components/Feature/scraper/LiveScraperHeader.tsx` | 75 | Low | **Delete Candidate** |
| `ScraperLogStream` | `components/Feature/scraper/ScraperLogStream.tsx` | 125 | Low | **Delete Candidate** |
| `LiveScraperGrid` | `components/Feature/scraper/LiveScraperGrid.tsx` | 92 | Low | **Delete Candidate** |
| `ImportedImagesPage` | `components/Feature/scraper/ImportedImagesPage.tsx` | 15 | Low | **Delete Candidate** |
| `ConfigHistoryDropdown` | `components/Feature/scraper/ConfigHistoryDropdown.tsx` | 40 | Low | **Delete Candidate** |
| `ToolSidebar` | `components/Feature/editor/Layout/ToolSidebar.tsx` | 104 | Low | **Delete Candidate** |
| `ImageEditorFooter` | `components/Feature/editor/Tools/ImageEditor/ImageEditorFooter.tsx` | 152 | Low | **Delete Candidate** |
| `AutoCropCustomProfileManager` | `components/Feature/editor/Tools/ImageEditor/AutoCrop/AutoCropCustomProfileManager.tsx` | 62 | Low | **Delete Candidate** |
| `AutoCropEngineComparison` | `components/Feature/editor/Tools/ImageEditor/AutoCrop/AutoCropEngineComparison.tsx` | 340 | Medium | **Delete Candidate** |
| `AutoCropSettingsPanel` | `components/Feature/editor/Tools/ImageEditor/AutoCrop/AutoCropSettingsPanel.tsx` | 119 | Low | **Delete Candidate** |
| `RangeSlider` | `components/Feature/editor/shared/RangeSlider.tsx` | 58 | Low | **Delete Candidate** |
| `logRenderers` | `components/Feature/terminal/utils/logRenderers.tsx` | 287 | Medium | **Delete Candidate** |
| `shortcutUtils` | `components/Shortcuts/shortcutUtils.tsx` | 112 | Low | **Delete Candidate** |
| `AuthFooter` | `components/auth/AuthFooter.tsx` | 9 | Low | **Delete Candidate** |
| `useThemeMode` | `hooks/useThemeMode.tsx` | 96 | Low | **Delete Candidate** |

---

## 📋 6. Full Components Registry

Below is a complete, structured analysis of every front-end React component inside the workspace.

| Component Name | File Path | Purpose | Size (LOC) | Complexity | Quality | Maintainability | Dependencies | Used By | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| `App` | `App.tsx` | UI presentational layout component representing core application view elements. | 2166 | Critical | 4/10 | 4/10 | ModelTrainingPage, PageNotFound, ProjectConfirmPanel | main.tsx, LoadingPage.tsx, ErrorBoundary.tsx | **Split** |
| `DashboardAIPipeline` | `components/Dashboard/DashboardAIPipeline.tsx` | UI presentational layout component representing core application view elements. | 81 | Low | 9/10 | 9/10 | Sliders, Sparkles, Volume2 | DashboardPage.tsx | **Keep** |
| `DashboardActivityFeed` | `components/Dashboard/DashboardActivityFeed.tsx` | UI presentational layout component representing core application view elements. | 55 | Low | 9/10 | 9/10 | Activity, FileText | DashboardPage.tsx | **Keep** |
| `DashboardHeader` | `components/Dashboard/DashboardHeader.tsx` | UI presentational layout component representing core application view elements. | 66 | Low | 9/10 | 9/10 | Plus, Search | DashboardPage.tsx | **Keep** |
| `DashboardPage` | `components/Dashboard/DashboardPage.tsx` | UI presentational layout component representing core application view elements. | 100 | Low | 9/10 | 9/10 | DashboardActivityFeed, DashboardPage, DashboardStats | App.tsx | **Keep** |
| `DashboardProjectSection` | `components/Dashboard/DashboardProjectSection.tsx` | UI presentational layout component representing core application view elements. | 126 | Low | 9/10 | 9/10 | Film, Project, ProjectCard | DashboardPage.tsx | **Keep** |
| `DashboardQuickLinks` | `components/Dashboard/DashboardQuickLinks.tsx` | UI presentational layout component representing core application view elements. | 78 | Low | 9/10 | 9/10 | Plus, Settings, Volume2 | DashboardPage.tsx | **Keep** |
| `DashboardSidebar` | `components/Dashboard/DashboardSidebar.tsx` | UI presentational layout component representing core application view elements. | 28 | Low | 9/10 | 9/10 | OnboardingTask, Sidebar, SystemResources | DashboardPage.tsx | **Keep** |
| `DashboardStats` | `components/Dashboard/DashboardStats.tsx` | UI presentational layout component representing core application view elements. | 60 | Low | 9/10 | 9/10 | Film, Loader2, Video | DashboardPage.tsx | **Keep** |
| `EngineStatus` | `components/Dashboard/Sidebar/EngineStatus.tsx` | UI presentational layout component representing core application view elements. | 69 | Low | 9/10 | 9/10 | Activity | DashboardSidebar.tsx | **Keep** |
| `GuidesReference` | `components/Dashboard/Sidebar/GuidesReference.tsx` | UI presentational layout component representing core application view elements. | 79 | Low | 9/10 | 9/10 | BookOpen, FileText, Settings | DashboardSidebar.tsx | **Keep** |
| `QuickStartGuide` | `components/Dashboard/Sidebar/QuickStartGuide.tsx` | UI presentational layout component representing core application view elements. | 55 | Low | 9/10 | 9/10 | CheckCircle2, Circle, Sparkles | DashboardSidebar.tsx | **Keep** |
| `SystemResources` | `components/Dashboard/Sidebar/SystemResources.tsx` | UI presentational layout component representing core application view elements. | 107 | Low | 8/10 | 9/10 | Cpu | DashboardSidebar.tsx | **Keep** |
| `DisplayPage` | `components/DisplayPage.tsx` | UI presentational layout component representing core application view elements. | 5 | Low | 9/10 | 9/10 | None | App.tsx | **Keep** |
| `ErrorBoundary` | `components/ErrorBoundary.tsx` | UI presentational layout component representing core application view elements. | 96 | Low | 9/10 | 9/10 | AlertTriangle, Component, Home | main.tsx | **Keep** |
| `AIModelsPage` | `components/Feature/ai_models/AIModelsPage.tsx` | UI presentational layout component representing core application view elements. | 1381 | Critical | 4/10 | 4/10 | CredentialsAndTuner, CreditTransaction, ModelPlaygroundAndSkills | App.tsx | **Split** |
| `AIProviderKeysConfig` | `components/Feature/ai_models/AIProviderKeysConfig.tsx` | UI presentational layout component representing core application view elements. | 276 | Medium | 8/10 | 8/10 | EyeOff, Save, State | ProfileApiTab.tsx | **Keep** |
| `APITokenLedgerAndCosts` | `components/Feature/ai_models/APITokenLedgerAndCosts.tsx` | UI presentational layout component representing core application view elements. | 293 | Medium | 8/10 | 8/10 | Coins, Download, RefreshCw | AIModelsPage.tsx | **Keep** |
| `BenchmarkRunHistory` | `components/Feature/ai_models/BenchmarkRunHistory.tsx` | UI presentational layout component representing core application view elements. | 181 | Low | 9/10 | 9/10 | Download, History | AIModelsPage.tsx | **Keep** |
| `CredentialsAndTuner` | `components/Feature/ai_models/CredentialsAndTuner.tsx` | UI presentational layout component representing core application view elements. | 443 | High | 7/10 | 6/10 | None | AIModelsPage.tsx | **Refactor Later** |
| `ModelPlaygroundAndSkills` | `components/Feature/ai_models/ModelPlaygroundAndSkills.tsx` | UI presentational layout component representing core application view elements. | 1003 | Critical | 4/10 | 4/10 | None | AIModelsPage.tsx | **Split** |
| `ModelRegistryExplorer` | `components/Feature/ai_models/ModelRegistryExplorer.tsx` | UI presentational layout component representing core application view elements. | 308 | Medium | 8/10 | 8/10 | None | AIModelsPage.tsx | **Keep** |
| `CTRAnalyticsPage` | `components/Feature/analytics/CTRAnalyticsPage.tsx` | UI presentational layout component representing core application view elements. | 72 | Low | 9/10 | 9/10 | AreaChart, ArrowLeft, TitleABValidator | App.tsx | **Keep** |
| `TitleABValidator` | `components/Feature/analytics/TitleABValidator.tsx` | UI presentational layout component representing core application view elements. | 207 | Medium | 8/10 | 8/10 | Copy, Sparkles, State | CTRAnalyticsPage.tsx | **Keep** |
| `TokenUsageDashboard` | `components/Feature/analytics/TokenUsageDashboard.tsx` | UI presentational layout component representing core application view elements. | 214 | Medium | 8/10 | 8/10 | BarChart3, Effect, State | ProfileBillingTab.tsx, CTRAnalyticsPage.tsx | **Keep** |
| `AmbientSoundPicker` | `components/Feature/audio_lab/AmbientSoundPicker.tsx` | UI presentational layout component representing core application view elements. | 261 | Medium | 8/10 | 8/10 | Music, Pause, State | AudioLabPage.tsx | **Keep** |
| `AudioLabPage` | `components/Feature/audio_lab/AudioLabPage.tsx` | UI presentational layout component representing core application view elements. | 57 | Low | 9/10 | 9/10 | AmbientSoundPicker, ArrowLeft, SfxOverlayMixer | App.tsx | **Keep** |
| `SfxOverlayMixer` | `components/Feature/audio_lab/SfxOverlayMixer.tsx` | UI presentational layout component representing core application view elements. | 132 | Low | 9/10 | 9/10 | Sparkles, State, UserCredits | AudioLabPage.tsx | **Keep** |
| `AudioSettingsPage` | `components/Feature/audio_settings/AudioSettingsPage.tsx` | UI presentational layout component representing core application view elements. | 552 | High | 6/10 | 6/10 | Effect, State | App.tsx, EditorPage.tsx | **Refactor Later** |
| `CharacterAutoDetector` | `components/Feature/characters/CharacterAutoDetector.tsx` | UI presentational layout component representing core application view elements. | 69 | Low | 9/10 | 9/10 | Sparkles, State, WithAuth | CharacterProfilePage.tsx | **Keep** |
| `CharacterEditModal` | `components/Feature/characters/CharacterEditModal.tsx` | UI presentational layout component representing core application view elements. | 176 | Low | 9/10 | 9/10 | Image, State, User | CharacterProfilePage.tsx | **Keep** |
| `CharacterProfileCard` | `components/Feature/characters/CharacterProfileCard.tsx` | User profile management component focusing on user settings, security, or billing. | 122 | Low | 9/10 | 9/10 | Pencil, State, User | CharacterProfilePage.tsx | **Keep** |
| `CharacterProfilePage` | `components/Feature/characters/CharacterProfilePage.tsx` | User profile management component focusing on user settings, security, or billing. | 138 | Low | 9/10 | 9/10 | ArrowLeft, CharacterProfileCard, State | App.tsx | **Keep** |
| `EditorMiniSidebar` | `components/Feature/editor/EditorMiniSidebar.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 364 | Medium | 6/10 | 8/10 | ImageEditorState, ImageEditorStore, State | EditorPageLayout.tsx | **Keep** |
| `EditorPageHeader` | `components/Feature/editor/EditorPageHeader.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 293 | Medium | 6/10 | 8/10 | BellOff, Monitor, State | EditorPageLayout.tsx | **Keep** |
| `EditorPageLayout` | `components/Feature/editor/EditorPageLayout.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 184 | Low | 8/10 | 9/10 | EditorMiniSidebar, EditorSidebar, Effect | EditorPage.tsx | **Keep** |
| `EditorSidebar` | `components/Feature/editor/EditorSidebar.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 341 | Medium | 6/10 | 8/10 | ImageEditorState, ImageEditorStore, Navigation | EditorPageLayout.tsx | **Keep** |
| `EditorPage` | `components/Feature/editor/Layout/EditorPage.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 769 | Critical | 4/10 | 4/10 | AdvancedSettings, AudioSettingsPage, ImageEditorStore | App.tsx | **Split** |
| `ToolSidebar` | `components/Feature/editor/Layout/ToolSidebar.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 104 | Low | 9/10 | 9/10 | EditorState | None | **Delete Candidate** |
| `AutoCropAdvancedTab` | `components/Feature/editor/Tools/ImageEditor/AutoCrop/AutoCropAdvancedTab.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 149 | Low | 9/10 | 9/10 | AutoCropJsonDebugger, AutoCropParameterSlider, AutoCropSharedProps | AutoCropTabContent.tsx | **Keep** |
| `AutoCropCannyControls` | `components/Feature/editor/Tools/ImageEditor/AutoCrop/AutoCropCannyControls.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 80 | Low | 9/10 | 9/10 | Filter, SectionTitle | AutoCropAdvancedTab.tsx | **Keep** |
| `AutoCropComplexityAnalysis` | `components/Feature/editor/Tools/ImageEditor/AutoCrop/AutoCropComplexityAnalysis.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 126 | Low | 9/10 | 9/10 | Activity, State, Wand2 | AutoCropAdvancedTab.tsx | **Keep** |
| `AutoCropCustomProfileManager` | `components/Feature/editor/Tools/ImageEditor/AutoCrop/AutoCropCustomProfileManager.tsx` | User profile management component focusing on user settings, security, or billing. | 62 | Low | 9/10 | 9/10 | CustomCropPreset, Settings, State | None | **Delete Candidate** |
| `AutoCropEngineComparison` | `components/Feature/editor/Tools/ImageEditor/AutoCrop/AutoCropEngineComparison.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 340 | Medium | 8/10 | 8/10 | State | None | **Delete Candidate** |
| `AutoCropEngineSelector` | `components/Feature/editor/Tools/ImageEditor/AutoCrop/AutoCropEngineSelector.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 775 | Critical | 4/10 | 4/10 | Effect, SectionTitle, State | AutoCropGeneralTab.tsx | **Split** |
| `AutoCropGeneralTab` | `components/Feature/editor/Tools/ImageEditor/AutoCrop/AutoCropGeneralTab.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 74 | Low | 9/10 | 9/10 | AutoCropEngineSelector, AutoCropPresetGrid, AutoCropSharedProps | AutoCropTabContent.tsx | **Keep** |
| `AutoCropGutterModeToggle` | `components/Feature/editor/Tools/ImageEditor/AutoCrop/AutoCropGutterModeToggle.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 148 | Low | 9/10 | 9/10 | BG_MODE_OPTIONS, CropConfig, Wand2 | AutoCropLayoutTab.tsx | **Keep** |
| `AutoCropHelpTab` | `components/Feature/editor/Tools/ImageEditor/AutoCrop/AutoCropHelpTab.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 69 | Low | 9/10 | 9/10 | HelpCircle, Info | AutoCropTabContent.tsx | **Keep** |
| `AutoCropJsonDebugger` | `components/Feature/editor/Tools/ImageEditor/AutoCrop/AutoCropJsonDebugger.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 36 | Low | 9/10 | 9/10 | ChevronDown, FileJson, State | AutoCropAdvancedTab.tsx | **Keep** |
| `AutoCropLayoutTab` | `components/Feature/editor/Tools/ImageEditor/AutoCrop/AutoCropLayoutTab.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 96 | Low | 9/10 | 9/10 | AutoCrop, AutoCropRatioLockSelector, AutoCropSharedProps | AutoCropTabContent.tsx | **Keep** |
| `AutoCropMarginPadding` | `components/Feature/editor/Tools/ImageEditor/AutoCrop/AutoCropMarginPadding.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 73 | Low | 9/10 | 9/10 | Settings, State, Zap | AutoCropLayoutTab.tsx | **Keep** |
| `AutoCropParameterSlider` | `components/Feature/editor/Tools/ImageEditor/AutoCrop/AutoCropParameterSlider.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 53 | Low | 9/10 | 9/10 | None | AutoCropAdvancedTab.tsx | **Keep** |
| `AutoCropPresetGrid` | `components/Feature/editor/Tools/ImageEditor/AutoCrop/AutoCropPresetGrid.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 146 | Low | 9/10 | 9/10 | SectionTitle, Sparkles, Wand2 | AutoCropGeneralTab.tsx | **Keep** |
| `AutoCropRatioLockSelector` | `components/Feature/editor/Tools/ImageEditor/AutoCrop/AutoCropRatioLockSelector.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 48 | Low | 9/10 | 9/10 | ASPECT_RATIO_OPTIONS, CropConfig, Maximize2 | AutoCropLayoutTab.tsx | **Keep** |
| `AutoCropSettingsPanel` | `components/Feature/editor/Tools/ImageEditor/AutoCrop/AutoCropSettingsPanel.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 119 | Low | 9/10 | 9/10 | None | None | **Delete Candidate** |
| `AutoCropTabContent` | `components/Feature/editor/Tools/ImageEditor/AutoCrop/AutoCropTabContent.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 107 | Low | 9/10 | 9/10 | AutoCropGeneralTab, AutoCropHelpTab, AutoCropLayoutTab | AutoCropModal.tsx | **Keep** |
| `AutoCropVisualGuide` | `components/Feature/editor/Tools/ImageEditor/AutoCrop/AutoCropVisualGuide.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 294 | Medium | 8/10 | 8/10 | Effect, Ref, State | AutoCropLayoutTab.tsx | **Keep** |
| `AutoSlicer` | `components/Feature/editor/Tools/ImageEditor/AutoCrop/AutoSlicer.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 278 | Medium | 8/10 | 8/10 | AutoSlicerCanny, AutoSlicerSettings, State | ImageEditorSidebar.tsx | **Keep** |
| `AutoSlicerCanny` | `components/Feature/editor/Tools/ImageEditor/AutoCrop/AutoSlicerCanny.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 137 | Low | 9/10 | 9/10 | None | AutoSlicer.tsx | **Keep** |
| `AutoSlicerSettings` | `components/Feature/editor/Tools/ImageEditor/AutoCrop/AutoSlicerSettings.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 180 | Low | 9/10 | 9/10 | AIModels, ChevronDown | AutoSlicer.tsx | **Keep** |
| `CutsRegistry` | `components/Feature/editor/Tools/ImageEditor/CutsRegistry/CutsRegistry.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 110 | Low | 9/10 | 9/10 | Slice | ImageEditorSidebar.tsx, CutsRegistryList.tsx, CutsRegistryHeader.tsx | **Keep** |
| `CutsRegistryFineTune` | `components/Feature/editor/Tools/ImageEditor/CutsRegistry/CutsRegistryFineTune.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 184 | Low | 9/10 | 9/10 | None | CutsRegistry.tsx | **Keep** |
| `CutsRegistryHeader` | `components/Feature/editor/Tools/ImageEditor/CutsRegistry/CutsRegistryHeader.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 45 | Low | 9/10 | 9/10 | LayoutGrid, Slice, Trash2 | CutsRegistry.tsx | **Keep** |
| `CutsRegistryList` | `components/Feature/editor/Tools/ImageEditor/CutsRegistry/CutsRegistryList.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 118 | Low | 9/10 | 9/10 | Crop, Layers, RefreshCw | CutsRegistry.tsx | **Keep** |
| `CutsRegistrySelector` | `components/Feature/editor/Tools/ImageEditor/CutsRegistry/CutsRegistrySelector.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 58 | Low | 9/10 | 9/10 | Plus | CutsRegistry.tsx | **Keep** |
| `EnhancementsAudio` | `components/Feature/editor/Tools/ImageEditor/EnhancementsAudio.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 114 | Low | 9/10 | 9/10 | Type, Volume2 | EnhancementsPanel.tsx | **Keep** |
| `EnhancementsCinematic` | `components/Feature/editor/Tools/ImageEditor/EnhancementsCinematic.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 119 | Low | 8/10 | 9/10 | EnhancementsColors, Film, SliderRow | EnhancementsPanel.tsx | **Keep** |
| `EnhancementsColors` | `components/Feature/editor/Tools/ImageEditor/EnhancementsColors.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 131 | Low | 8/10 | 9/10 | None | EnhancementsPanel.tsx, EnhancementsCinematic.tsx | **Keep** |
| `EnhancementsPanel` | `components/Feature/editor/Tools/ImageEditor/EnhancementsPanel.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 79 | Low | 9/10 | 9/10 | EnhancementsCinematic, EnhancementsColors, EnhancementsPresets | ImageEditorSidebar.tsx | **Keep** |
| `EnhancementsPresets` | `components/Feature/editor/Tools/ImageEditor/EnhancementsPresets.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 105 | Low | 9/10 | 9/10 | Sparkles | EnhancementsPanel.tsx | **Keep** |
| `FreehandPanel` | `components/Feature/editor/Tools/ImageEditor/FreehandPanel.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 144 | Low | 9/10 | 9/10 | Eraser, Pen, Save | ImageEditorSidebar.tsx | **Keep** |
| `HorizontalSplitter` | `components/Feature/editor/Tools/ImageEditor/HorizontalSplitter/HorizontalSplitter.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 708 | Critical | 4/10 | 4/10 | HorizontalGutters, Scanner, State | ImageEditorSidebar.tsx | **Split** |
| `HorizontalSplitterControls` | `components/Feature/editor/Tools/ImageEditor/HorizontalSplitter/HorizontalSplitterControls.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 203 | Medium | 8/10 | 8/10 | ChevronDown, Magnet, Plus | HorizontalSplitter.tsx | **Keep** |
| `HorizontalSplitterPresets` | `components/Feature/editor/Tools/ImageEditor/HorizontalSplitter/HorizontalSplitterPresets.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 77 | Low | 9/10 | 9/10 | FolderOpen, Save, Trash2 | HorizontalSplitter.tsx | **Keep** |
| `HorizontalSplitterPreview` | `components/Feature/editor/Tools/ImageEditor/HorizontalSplitter/HorizontalSplitterPreview.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 50 | Low | 9/10 | 9/10 | Split | HorizontalSplitter.tsx | **Keep** |
| `ImageEditorCanvasContainer` | `components/Feature/editor/Tools/ImageEditor/ImageEditorCanvasContainer.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 229 | Medium | 8/10 | 8/10 | CanvasMultiLayer, GeneratedPanel, ImageTool | ImageEditorPage.tsx | **Keep** |
| `ImageEditorFooter` | `components/Feature/editor/Tools/ImageEditor/ImageEditorFooter.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 152 | Low | 9/10 | 9/10 | ImageEditorState, ImageTool, Undo2 | None | **Delete Candidate** |
| `ImageEditorHeader` | `components/Feature/editor/Tools/ImageEditor/ImageEditorHeader.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 359 | Medium | 6/10 | 8/10 | Adjust, ImageTool, State | ImageEditorPage.tsx | **Keep** |
| `ImageEditorLayout` | `components/Feature/editor/Tools/ImageEditor/ImageEditorLayout.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 31 | Low | 9/10 | 9/10 | ImageEditorMiniSidebar | ImageEditorPage.tsx | **Keep** |
| `ImageEditorMiniSidebar` | `components/Feature/editor/Tools/ImageEditor/ImageEditorMiniSidebar.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 127 | Low | 9/10 | 9/10 | ImageEditorStore, ImageTool, State | ImageEditorLayout.tsx | **Keep** |
| `ImageEditorPage` | `components/Feature/editor/Tools/ImageEditor/ImageEditorPage.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 302 | Medium | 8/10 | 8/10 | CropEditorStore, ImageEditorLayout, State | App.tsx, EditorPage.tsx | **Keep** |
| `ImageEditorPanel` | `components/Feature/editor/Tools/ImageEditor/ImageEditorPanel.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 506 | High | 6/10 | 6/10 | ImageEditorState, ImageEditorStore, State | ImageEditorSidebar.tsx | **Refactor Later** |
| `ImageEditorSidebar` | `components/Feature/editor/Tools/ImageEditor/ImageEditorSidebar.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 609 | High | 6/10 | 6/10 | CutsRegistry, ImageEditorPanel, ImageTool | ImageEditorPage.tsx | **Refactor Later** |
| `LayerSeparationPanel` | `components/Feature/editor/Tools/ImageEditor/LayerSeparationPanel.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 333 | Medium | 6/10 | 8/10 | AlertCircle, CheckCircle2, State | ImageEditorSidebar.tsx | **Keep** |
| `MergePanel` | `components/Feature/editor/Tools/ImageEditor/MergePanel/MergePanel.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 260 | Medium | 8/10 | 8/10 | MergePanelList, MergePanelOptions, State | ImageEditorSidebar.tsx | **Keep** |
| `MergePanelList` | `components/Feature/editor/Tools/ImageEditor/MergePanel/MergePanelList.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 84 | Low | 9/10 | 9/10 | ArrowDown | MergePanel.tsx | **Keep** |
| `MergePanelOptions` | `components/Feature/editor/Tools/ImageEditor/MergePanel/MergePanelOptions.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 217 | Medium | 8/10 | 8/10 | ArrowDown, Columns, Settings2 | MergePanel.tsx | **Keep** |
| `CanvasBrushLayer` | `components/Feature/editor/Workspace/CanvasBrushLayer.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 34 | Low | 9/10 | 9/10 | None | CropCanvas.tsx | **Keep** |
| `CanvasBubbleBoxes` | `components/Feature/editor/Workspace/CanvasBubbleBoxes.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 78 | Low | 9/10 | 9/10 | None | CropCanvas.tsx | **Keep** |
| `CanvasCropSelection` | `components/Feature/editor/Workspace/CanvasCropSelection.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 226 | Medium | 8/10 | 8/10 | Move | CropCanvas.tsx | **Keep** |
| `CanvasFabricLayer` | `components/Feature/editor/Workspace/CanvasFabricLayer.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 176 | Low | 9/10 | 9/10 | Effect, Ref | CropCanvas.tsx | **Keep** |
| `CanvasMultiLayer` | `components/Feature/editor/Workspace/CanvasMultiLayer.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 216 | Medium | 8/10 | 8/10 | DialogueSync, PanelLayers, PanelSyncMap | ImageEditorCanvasContainer.tsx | **Keep** |
| `CanvasSplitLines` | `components/Feature/editor/Workspace/CanvasSplitLines.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 77 | Low | 9/10 | 9/10 | None | CropCanvas.tsx | **Keep** |
| `CropCanvas` | `components/Feature/editor/Workspace/CropCanvas.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 520 | High | 6/10 | 6/10 | CanvasBrushLayer, CanvasCropSelection, ImageTool | ImageEditorCanvasContainer.tsx | **Refactor Later** |
| `FloatingSelectionBar` | `components/Feature/editor/seloect/FloatingSelectionBar.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 1295 | Critical | 4/10 | 4/10 | Portal | ScraperControls.tsx, LiveScraperDeck.tsx, StoryboardTimeline.tsx | **Split** |
| `RangeSlider` | `components/Feature/editor/shared/RangeSlider.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 58 | Low | 9/10 | 9/10 | None | None | **Delete Candidate** |
| `SectionTitle` | `components/Feature/editor/shared/SectionTitle.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 21 | Low | 9/10 | 9/10 | None | AutoCropCustomProfileManager.tsx, AutoCropMarginPadding.tsx, AutoCropCannyControls.tsx | **Keep** |
| `AnalyticsDashboard` | `components/Feature/episode-scraper/AnalyticsDashboard.tsx` | Manages webtoon scrapers, chapter downloads, and live crawling pipelines. | 742 | Critical | 4/10 | 4/10 | Memo, State | EpisodeScraper.tsx | **Split** |
| `BatchThumbnailDownloader` | `components/Feature/episode-scraper/BatchThumbnailDownloader.tsx` | Manages webtoon scrapers, chapter downloads, and live crawling pipelines. | 162 | Low | 9/10 | 9/10 | Download, State | EpisodeScraper.tsx | **Keep** |
| `EpisodeCard` | `components/Feature/episode-scraper/EpisodeCard.tsx` | Manages webtoon scrapers, chapter downloads, and live crawling pipelines. | 473 | High | 6/10 | 6/10 | Episode, Ref, State | EpisodeGrid.tsx | **Refactor Later** |
| `EpisodeControls` | `components/Feature/episode-scraper/EpisodeControls.tsx` | Manages webtoon scrapers, chapter downloads, and live crawling pipelines. | 320 | Medium | 8/10 | 8/10 | State | EpisodeScraper.tsx | **Keep** |
| `EpisodeGrid` | `components/Feature/episode-scraper/EpisodeGrid.tsx` | Manages webtoon scrapers, chapter downloads, and live crawling pipelines. | 50 | Low | 9/10 | 9/10 | Episode, EpisodeCard, EpisodeTypes | EpisodeScraper.tsx | **Keep** |
| `EpisodePreviewModal` | `components/Feature/episode-scraper/EpisodePreviewModal.tsx` | Manages webtoon scrapers, chapter downloads, and live crawling pipelines. | 319 | Medium | 8/10 | 8/10 | Effect, Episode, Minimize2 | EpisodeScraper.tsx | **Keep** |
| `EpisodeRatingDisplay` | `components/Feature/episode-scraper/EpisodeRatingDisplay.tsx` | Manages webtoon scrapers, chapter downloads, and live crawling pipelines. | 133 | Low | 8/10 | 9/10 | Eye, Star, ThumbsUp | LiveScraperDeck.tsx | **Keep** |
| `EpisodeScraper` | `components/Feature/episode-scraper/EpisodeScraper.tsx` | Manages webtoon scrapers, chapter downloads, and live crawling pipelines. | 908 | Critical | 4/10 | 4/10 | Effect, Episode, State | EpisodeScraperPage.tsx | **Split** |
| `EpisodeScraperPage` | `components/Feature/episode-scraper/EpisodeScraperPage.tsx` | Manages webtoon scrapers, chapter downloads, and live crawling pipelines. | 142 | Low | 9/10 | 9/10 | ArrowLeft, NotificationType, Zap | App.tsx | **Keep** |
| `FavoritesManager` | `components/Feature/episode-scraper/FavoritesManager.tsx` | Manages webtoon scrapers, chapter downloads, and live crawling pipelines. | 265 | Medium | 8/10 | 8/10 | Effect, ExternalLink, State | EpisodeScraper.tsx | **Keep** |
| `AIOptimizerPage` | `components/Feature/optimizer/AIOptimizerPage.tsx` | UI presentational layout component representing core application view elements. | 176 | Low | 9/10 | 9/10 | GeneratedPanel, SeoOptimizationTab, State | App.tsx | **Keep** |
| `AdPlacementTab` | `components/Feature/optimizer/AdPlacementTab.tsx` | UI presentational layout component representing core application view elements. | 285 | Medium | 8/10 | 8/10 | GeneratedPanel, State, WithAuth | AIOptimizerPage.tsx | **Keep** |
| `SeoOptimizationTab` | `components/Feature/optimizer/SeoOptimizationTab.tsx` | UI presentational layout component representing core application view elements. | 318 | Medium | 8/10 | 8/10 | GeneratedPanel, State, WithAuth | AIOptimizerPage.tsx | **Keep** |
| `ShortsScriptTab` | `components/Feature/optimizer/ShortsScriptTab.tsx` | UI presentational layout component representing core application view elements. | 331 | Medium | 8/10 | 8/10 | GeneratedPanel, State, WithAuth | AIOptimizerPage.tsx | **Keep** |
| `SoundOutroTab` | `components/Feature/optimizer/SoundOutroTab.tsx` | UI presentational layout component representing core application view elements. | 257 | Medium | 8/10 | 8/10 | GeneratedPanel, State, WithAuth | AIOptimizerPage.tsx | **Keep** |
| `PanelAssistantPage` | `components/Feature/panel_assistant/PanelAssistantPage.tsx` | UI presentational layout component representing core application view elements. | 213 | Medium | 8/10 | 8/10 | ArrowLeft, PanelCreativeTool, PanelTranslationTool | App.tsx | **Keep** |
| `PanelAudioTool` | `components/Feature/panel_assistant/PanelAudioTool.tsx` | UI presentational layout component representing core application view elements. | 180 | Low | 9/10 | 9/10 | Copy, Sparkles, State | PanelAssistantPage.tsx | **Keep** |
| `PanelCreativeTool` | `components/Feature/panel_assistant/PanelCreativeTool.tsx` | UI presentational layout component representing core application view elements. | 200 | Low | 9/10 | 9/10 | Copy, Sparkles, State | PanelAssistantPage.tsx | **Keep** |
| `PanelPacingTool` | `components/Feature/panel_assistant/PanelPacingTool.tsx` | UI presentational layout component representing core application view elements. | 231 | Medium | 8/10 | 8/10 | Copy, Sparkles, State | PanelAssistantPage.tsx | **Keep** |
| `PanelTranslationTool` | `components/Feature/panel_assistant/PanelTranslationTool.tsx` | UI presentational layout component representing core application view elements. | 182 | Low | 9/10 | 9/10 | Sparkles, State, WithAuth | PanelAssistantPage.tsx | **Keep** |
| `ProcessBar` | `components/Feature/pipeline/ProcessBar.tsx` | UI presentational layout component representing core application view elements. | 204 | Medium | 8/10 | 8/10 | CheckCircle2, Film, State | EditorPage.tsx | **Keep** |
| `AutoCropModal` | `components/Feature/processing/AutoCropModal.tsx` | UI presentational layout component representing core application view elements. | 459 | High | 6/10 | 6/10 | AutoCropTabContent, Feature, Tools | App.tsx | **Refactor Later** |
| `ConfigHistoryDropdown` | `components/Feature/scraper/ConfigHistoryDropdown.tsx` | Manages webtoon scrapers, chapter downloads, and live crawling pipelines. | 40 | Low | 9/10 | 9/10 | History, RotateCcw | None | **Delete Candidate** |
| `GlobalScraperConfigTool` | `components/Feature/scraper/GlobalScraperConfigTool.tsx` | Manages webtoon scrapers, chapter downloads, and live crawling pipelines. | 178 | Low | 8/10 | 9/10 | Clipboard, Share2, State | None | **Delete Candidate** |
| `ImportedImagesPage` | `components/Feature/scraper/ImportedImagesPage.tsx` | Manages webtoon scrapers, chapter downloads, and live crawling pipelines. | 15 | Low | 9/10 | 9/10 | Feature, LiveScraperDeck, LiveScraperDeckProps | None | **Delete Candidate** |
| `LiveScraperDeck` | `components/Feature/scraper/LiveScraperDeck.tsx` | Manages webtoon scrapers, chapter downloads, and live crawling pipelines. | 653 | High | 6/10 | 6/10 | LiveScraperDeckEmptyState, PanelCard, Portal | ImportedImagesPage.tsx, EditorPage.tsx | **Refactor Later** |
| `LiveScraperDeckEmptyState` | `components/Feature/scraper/LiveScraperDeckEmptyState.tsx` | Manages webtoon scrapers, chapter downloads, and live crawling pipelines. | 28 | Low | 9/10 | 9/10 | Image, ImageIcon, ReactNode | LiveScraperDeck.tsx | **Keep** |
| `LiveScraperGrid` | `components/Feature/scraper/LiveScraperGrid.tsx` | Manages webtoon scrapers, chapter downloads, and live crawling pipelines. | 92 | Low | 9/10 | 9/10 | PanelCard | None | **Delete Candidate** |
| `LiveScraperHeader` | `components/Feature/scraper/LiveScraperHeader.tsx` | Manages webtoon scrapers, chapter downloads, and live crawling pipelines. | 75 | Low | 9/10 | 9/10 | Download, Image, Plus | None | **Delete Candidate** |
| `PanelCard` | `components/Feature/scraper/PanelCard.tsx` | Manages webtoon scrapers, chapter downloads, and live crawling pipelines. | 308 | Medium | 6/10 | 8/10 | PanelCardActions, PanelCardControls, ScraperDeckProps | LiveScraperGrid.tsx, LiveScraperDeck.tsx | **Keep** |
| `PanelCardActions` | `components/Feature/scraper/PanelCardActions.tsx` | Manages webtoon scrapers, chapter downloads, and live crawling pipelines. | 138 | Low | 9/10 | 9/10 | Edit2, Portal, State | PanelCard.tsx | **Keep** |
| `PanelCardControls` | `components/Feature/scraper/PanelCardControls.tsx` | Manages webtoon scrapers, chapter downloads, and live crawling pipelines. | 71 | Low | 9/10 | 9/10 | Link2, Loader2, PlusCircle | PanelCard.tsx | **Keep** |
| `PanelCardThumbnail` | `components/Feature/scraper/PanelCardThumbnail.tsx` | Manages webtoon scrapers, chapter downloads, and live crawling pipelines. | 262 | Medium | 8/10 | 8/10 | None | PanelCard.tsx | **Keep** |
| `ScraperActionButtons` | `components/Feature/scraper/ScraperActionButtons.tsx` | Manages webtoon scrapers, chapter downloads, and live crawling pipelines. | 193 | Low | 9/10 | 9/10 | None | ScraperControls.tsx | **Keep** |
| `ScraperControls` | `components/Feature/scraper/ScraperControls.tsx` | Manages webtoon scrapers, chapter downloads, and live crawling pipelines. | 195 | Low | 8/10 | 9/10 | Feature, LiveScraperActions, ScraperActionButtons | LiveScraperDeck.tsx | **Keep** |
| `ScraperLogStream` | `components/Feature/scraper/ScraperLogStream.tsx` | Manages webtoon scrapers, chapter downloads, and live crawling pipelines. | 125 | Low | 9/10 | 9/10 | ChevronDown, State, Terminal | None | **Delete Candidate** |
| `UrlInputPanel` | `components/Feature/scraper/UrlInputPanel.tsx` | Manages webtoon scrapers, chapter downloads, and live crawling pipelines. | 563 | High | 6/10 | 6/10 | AIModels, Layout, WebtoonUrl | AppWorkspace.tsx | **Refactor Later** |
| `LogsPage` | `components/Feature/terminal/LogsPage.tsx` | UI presentational layout component representing core application view elements. | 293 | Medium | 8/10 | 8/10 | LogsPageHeader, LogsPageStats, LogsPageToolbar | App.tsx | **Keep** |
| `LogsPageConsole` | `components/Feature/terminal/LogsPageConsole.tsx` | UI presentational layout component representing core application view elements. | 323 | Medium | 8/10 | 8/10 | LogEntry | LogsPage.tsx | **Keep** |
| `LogsPageHeader` | `components/Feature/terminal/LogsPageHeader.tsx` | UI presentational layout component representing core application view elements. | 111 | Low | 9/10 | 9/10 | None | LogsPage.tsx | **Keep** |
| `LogsPageHelpBanner` | `components/Feature/terminal/LogsPageHelpBanner.tsx` | UI presentational layout component representing core application view elements. | 24 | Low | 9/10 | 9/10 | Info | LogsPage.tsx | **Keep** |
| `LogsPageStats` | `components/Feature/terminal/LogsPageStats.tsx` | UI presentational layout component representing core application view elements. | 64 | Low | 9/10 | 9/10 | Activity, AlertTriangle, CheckCircle2 | LogsPage.tsx | **Keep** |
| `LogsPageToolbar` | `components/Feature/terminal/LogsPageToolbar.tsx` | UI presentational layout component representing core application view elements. | 164 | Low | 9/10 | 9/10 | LogEntry | LogsPage.tsx | **Keep** |
| `TerminalLogs` | `components/Feature/terminal/TerminalLogs.tsx` | UI presentational layout component representing core application view elements. | 75 | Low | 9/10 | 9/10 | TerminalLogsFilter, TerminalLogsHeader, TerminalLogsOutput | App.tsx | **Keep** |
| `TerminalLogsFilter` | `components/Feature/terminal/TerminalLogsFilter.tsx` | UI presentational layout component representing core application view elements. | 69 | Low | 9/10 | 9/10 | LogEntry, Search | TerminalLogs.tsx | **Keep** |
| `TerminalLogsHeader` | `components/Feature/terminal/TerminalLogsHeader.tsx` | UI presentational layout component representing core application view elements. | 148 | Low | 9/10 | 9/10 | LogEntry | TerminalLogs.tsx | **Keep** |
| `TerminalLogsOutput` | `components/Feature/terminal/TerminalLogsOutput.tsx` | UI presentational layout component representing core application view elements. | 62 | Low | 9/10 | 9/10 | LogColor, ParsedLog, Terminal | TerminalLogs.tsx | **Keep** |
| `logRenderers` | `components/Feature/terminal/utils/logRenderers.tsx` | UI presentational layout component representing core application view elements. | 287 | Medium | 6/10 | 8/10 | ReactNode | None | **Delete Candidate** |
| `ThumbnailCompositionGuide` | `components/Feature/thumbnails/ThumbnailCompositionGuide.tsx` | Thumbnail studio and canvas layout composition helper. | 107 | Low | 9/10 | 9/10 | Sparkles, State, WithAuth | ThumbnailStudioPage.tsx | **Keep** |
| `ThumbnailGenerator` | `components/Feature/thumbnails/ThumbnailGenerator.tsx` | Thumbnail studio and canvas layout composition helper. | 139 | Low | 9/10 | 9/10 | Copy, Sparkles, State | ThumbnailStudioPage.tsx | **Keep** |
| `ThumbnailLayoutForm` | `components/Feature/thumbnails/ThumbnailLayoutForm.tsx` | Thumbnail studio and canvas layout composition helper. | 115 | Low | 9/10 | 9/10 | Layers, Sparkles, State | ThumbnailStudioPage.tsx | **Keep** |
| `ThumbnailStudioPage` | `components/Feature/thumbnails/ThumbnailStudioPage.tsx` | Thumbnail studio and canvas layout composition helper. | 168 | Low | 9/10 | 9/10 | ArrowLeft, State, ThumbnailLayoutForm | App.tsx | **Keep** |
| `StoryboardTimeline` | `components/Feature/timeline/StoryboardTimeline.tsx` | Visual storyboard timeline for organizing panel structures and chapter narrative. | 1035 | Critical | 4/10 | 4/10 | Portal, TimelineEmptyState, Utils | EditorPage.tsx | **Split** |
| `TimelineBulkOps` | `components/Feature/timeline/TimelineBulkOps.tsx` | Visual storyboard timeline for organizing panel structures and chapter narrative. | 174 | Low | 9/10 | 9/10 | RefreshCw, Sparkles | StoryboardTimeline.tsx | **Keep** |
| `TimelineCard` | `components/Feature/timeline/TimelineCard.tsx` | Visual storyboard timeline for organizing panel structures and chapter narrative. | 961 | Critical | 4/10 | 4/10 | ChevronDown, GeneratedPanel, Sparkles | StoryboardTimeline.tsx | **Split** |
| `TimelineEmptyState` | `components/Feature/timeline/TimelineEmptyState.tsx` | Visual storyboard timeline for organizing panel structures and chapter narrative. | 60 | Low | 9/10 | 9/10 | None | StoryboardTimeline.tsx | **Keep** |
| `TimelineHeader` | `components/Feature/timeline/TimelineHeader.tsx` | Visual storyboard timeline for organizing panel structures and chapter narrative. | 118 | Low | 8/10 | 9/10 | Sparkles | StoryboardTimeline.tsx | **Keep** |
| `ModelTrainingPage` | `components/Feature/training/ModelTrainingPage.tsx` | UI presentational layout component representing core application view elements. | 650 | High | 6/10 | 6/10 | Effect, State | App.tsx | **Refactor Later** |
| `BulkScrubberControl` | `components/Feature/translation/BulkScrubberControl.tsx` | UI presentational layout component representing core application view elements. | 235 | Medium | 8/10 | 8/10 | GeneratedPanel, Settings, State | TranslationStudioPage.tsx | **Keep** |
| `TimelineScriptTable` | `components/Feature/translation/TimelineScriptTable.tsx` | Visual storyboard timeline for organizing panel structures and chapter narrative. | 59 | Low | 9/10 | 9/10 | GeneratedPanel | TranslationStudioPage.tsx | **Keep** |
| `TranslationStudioPage` | `components/Feature/translation/TranslationStudioPage.tsx` | UI presentational layout component representing core application view elements. | 92 | Low | 9/10 | 9/10 | ArrowLeft, BulkScrubberControl, Sparkles | App.tsx | **Keep** |
| `AdvancedSettings` | `components/Feature/video/AdvancedSettings.tsx` | Cinematic timeline player for previewing panel sequences, speech TTS, and animations. | 1091 | Critical | 4/10 | 4/10 | None | App.tsx, EditorPage.tsx, YouTubePage.tsx | **Split** |
| `CinemaPlayer` | `components/Feature/video/CinemaPlayer.tsx` | Cinematic timeline player for previewing panel sequences, speech TTS, and animations. | 1408 | Critical | 4/10 | 4/10 | GeneratedPanel, Ref, State | EditorPage.tsx | **Split** |
| `OutputMetadataPanel` | `components/Feature/video/OutputMetadataPanel.tsx` | Cinematic timeline player for previewing panel sequences, speech TTS, and animations. | 149 | Low | 9/10 | 9/10 | Mic, Music, State | EditorPage.tsx | **Keep** |
| `ScriptDramatizerForm` | `components/Feature/voice/ScriptDramatizerForm.tsx` | TTS Voice configuration studio and dialogue narrative dramatizer. | 228 | Medium | 8/10 | 8/10 | Copy, State, Wand2 | VoiceStudioPage.tsx | **Keep** |
| `VoiceSettingsPanel` | `components/Feature/voice/VoiceSettingsPanel.tsx` | TTS Voice configuration studio and dialogue narrative dramatizer. | 362 | Medium | 8/10 | 8/10 | Sparkles, State, Users | VoiceStudioPage.tsx | **Keep** |
| `VoiceStudioPage` | `components/Feature/voice/VoiceStudioPage.tsx` | TTS Voice configuration studio and dialogue narrative dramatizer. | 90 | Low | 9/10 | 9/10 | ArrowLeft, Mic, VoiceSettingsPanel | App.tsx | **Keep** |
| `AdvancedSettings` | `components/Feature/youtube/AdvancedSettings.tsx` | YouTube publisher manager handling tags, descriptions, credentials, and uploads. | 340 | Medium | 8/10 | 8/10 | ChevronDown, ChevronUp, Settings | App.tsx, AdvancedSettings.tsx, EditorPage.tsx | **Keep** |
| `ChaptersTuner` | `components/Feature/youtube/ChaptersTuner.tsx` | YouTube publisher manager handling tags, descriptions, credentials, and uploads. | 163 | Low | 9/10 | 9/10 | BookOpen, Plus, State | YouTubePage.tsx | **Keep** |
| `CredentialsConfig` | `components/Feature/youtube/CredentialsConfig.tsx` | YouTube publisher manager handling tags, descriptions, credentials, and uploads. | 275 | Medium | 8/10 | 8/10 | Ref, State | YouTubePage.tsx | **Keep** |
| `DescriptionEditor` | `components/Feature/youtube/DescriptionEditor.tsx` | Rich panel/image editing component for speech bubble cleaning or cropping. | 306 | Medium | 8/10 | 8/10 | GeneratedPanel, State | YouTubePage.tsx | **Keep** |
| `PlaylistSelector` | `components/Feature/youtube/PlaylistSelector.tsx` | YouTube publisher manager handling tags, descriptions, credentials, and uploads. | 71 | Low | 9/10 | 9/10 | Effect, Loader2, State | YouTubePage.tsx | **Keep** |
| `ProfileManager` | `components/Feature/youtube/ProfileManager.tsx` | User profile management component focusing on user settings, security, or billing. | 128 | Low | 9/10 | 9/10 | Copy, FolderOpen, State | YouTubePage.tsx | **Keep** |
| `PublishMonitor` | `components/Feature/youtube/PublishMonitor.tsx` | YouTube publisher manager handling tags, descriptions, credentials, and uploads. | 1006 | Critical | 4/10 | 4/10 | Effect, Ref, State | YouTubePage.tsx | **Split** |
| `SelfRatingForm` | `components/Feature/youtube/SelfRatingForm.tsx` | YouTube publisher manager handling tags, descriptions, credentials, and uploads. | 126 | Low | 9/10 | 9/10 | ChevronDown, ChevronUp, FileCheck | YouTubePage.tsx | **Keep** |
| `SeoAuditor` | `components/Feature/youtube/SeoAuditor.tsx` | YouTube publisher manager handling tags, descriptions, credentials, and uploads. | 94 | Low | 9/10 | 9/10 | AlertCircle, CheckCircle2, TrendingUp | YouTubePage.tsx | **Keep** |
| `SocialsCustomizer` | `components/Feature/youtube/SocialsCustomizer.tsx` | YouTube publisher manager handling tags, descriptions, credentials, and uploads. | 97 | Low | 9/10 | 9/10 | Globe, Heart, MessageSquare | YouTubePage.tsx | **Keep** |
| `SubtitleConfig` | `components/Feature/youtube/SubtitleConfig.tsx` | YouTube publisher manager handling tags, descriptions, credentials, and uploads. | 74 | Low | 9/10 | 9/10 | Captions, Languages | YouTubePage.tsx | **Keep** |
| `TagManager` | `components/Feature/youtube/TagManager.tsx` | YouTube publisher manager handling tags, descriptions, credentials, and uploads. | 122 | Low | 9/10 | 9/10 | Plus, Tag | YouTubePage.tsx | **Keep** |
| `TitleOptimizer` | `components/Feature/youtube/TitleOptimizer.tsx` | YouTube publisher manager handling tags, descriptions, credentials, and uploads. | 145 | Low | 9/10 | 9/10 | Effect, HelpCircle, State | YouTubePage.tsx | **Keep** |
| `UploadHistory` | `components/Feature/youtube/UploadHistory.tsx` | YouTube publisher manager handling tags, descriptions, credentials, and uploads. | 80 | Low | 9/10 | 9/10 | Calendar, ExternalLink, History | YouTubePage.tsx | **Keep** |
| `WebtoonMetadata` | `components/Feature/youtube/WebtoonMetadata.tsx` | YouTube publisher manager handling tags, descriptions, credentials, and uploads. | 163 | Low | 9/10 | 9/10 | BookOpen, Globe, Palette | YouTubePage.tsx | **Keep** |
| `YouTubePage` | `components/Feature/youtube/YouTubePage.tsx` | YouTube publisher manager handling tags, descriptions, credentials, and uploads. | 540 | High | 7/10 | 6/10 | SocialsCustomizer, TitleOptimizer, WebtoonMetadata | App.tsx | **Refactor Later** |
| `LoadingPage` | `components/LoadingPage.tsx` | UI presentational layout component representing core application view elements. | 307 | Medium | 8/10 | 8/10 | Effect, State | App.tsx, useThemeMode.tsx | **Keep** |
| `MainHeader` | `components/MainHeader.tsx` | UI presentational layout component representing core application view elements. | 1296 | Critical | 4/10 | 4/10 | Portal, UserCredits, UserCreditsPayload | App.tsx | **Split** |
| `MainMiniSidebar` | `components/MainMiniSidebar.tsx` | UI presentational layout component representing core application view elements. | 324 | Medium | 8/10 | 8/10 | State, TooltipPortal | App.tsx | **Keep** |
| `MainSidebar` | `components/MainSidebar.tsx` | UI presentational layout component representing core application view elements. | 432 | High | 6/10 | 6/10 | Effect, Notification, ThemeMode | App.tsx | **Refactor Later** |
| `PageNotFound` | `components/PageNotFound.tsx` | UI presentational layout component representing core application view elements. | 72 | Low | 9/10 | 9/10 | ArrowLeft, Compass | App.tsx | **Keep** |
| `BulkActionFooter` | `components/Project/BulkActionFooter.tsx` | UI presentational layout component representing core application view elements. | 41 | Low | 9/10 | 9/10 | Trash2 | ProjectsPageResultView.tsx | **Keep** |
| `ProjectCard` | `components/Project/ProjectCard.tsx` | UI presentational layout component representing core application view elements. | 286 | Medium | 6/10 | 8/10 | Project, ProjectTypes | DashboardProjectSection.tsx, ProjectsPageResultView.tsx | **Keep** |
| `ProjectsFilters` | `components/Project/ProjectsFilters.tsx` | UI presentational layout component representing core application view elements. | 96 | Low | 9/10 | 9/10 | LayoutGrid, List, Search | ProjectsPageView.tsx | **Keep** |
| `ProjectsPage` | `components/Project/ProjectsPage.tsx` | UI presentational layout component representing core application view elements. | 6 | Low | 9/10 | 9/10 | ProjectsPageContent | App.tsx | **Keep** |
| `ProjectsPageContent` | `components/Project/ProjectsPageContent.tsx` | UI presentational layout component representing core application view elements. | 44 | Low | 9/10 | 9/10 | ProjectsPage, ProjectsPageView | ProjectsPage.tsx | **Keep** |
| `ProjectsPageHeader` | `components/Project/ProjectsPageHeader.tsx` | UI presentational layout component representing core application view elements. | 37 | Low | 9/10 | 9/10 | FolderOpen, Plus | ProjectsPageView.tsx | **Keep** |
| `ProjectsPageResultView` | `components/Project/ProjectsPageResultView.tsx` | UI presentational layout component representing core application view elements. | 169 | Low | 9/10 | 9/10 | FolderOpen, ProjectsTable, Search | ProjectsPageView.tsx | **Keep** |
| `ProjectsPageView` | `components/Project/ProjectsPageView.tsx` | UI presentational layout component representing core application view elements. | 134 | Low | 9/10 | 9/10 | Project, ProjectsFilters, ProjectsPageResultView | ProjectsPageContent.tsx | **Keep** |
| `ProjectsStats` | `components/Project/ProjectsStats.tsx` | UI presentational layout component representing core application view elements. | 88 | Low | 9/10 | 9/10 | BarChart2, CheckCircle2, Film | ProjectsPageView.tsx | **Keep** |
| `ProjectsTable` | `components/Project/hooks/ProjectsTable.tsx` | UI presentational layout component representing core application view elements. | 234 | Medium | 8/10 | 8/10 | Project, ProjectTypes | ProjectsPageResultView.tsx | **Keep** |
| `SeriesDetailsPage` | `components/SeriesDetailsPage.tsx` | UI presentational layout component representing core application view elements. | 5 | Low | 9/10 | 9/10 | None | App.tsx | **Keep** |
| `ShortcutFilters` | `components/Shortcuts/ShortcutFilters.tsx` | Shortcut key recorder, filters, and command mapping configuration UI. | 85 | Low | 9/10 | 9/10 | Category, Options, Utils | ShortcutsPageContent.tsx | **Keep** |
| `ShortcutItem` | `components/Shortcuts/ShortcutItem.tsx` | Shortcut key recorder, filters, and command mapping configuration UI. | 119 | Low | 9/10 | 9/10 | Edit3, Text, Utils | ShortcutList.tsx | **Keep** |
| `ShortcutList` | `components/Shortcuts/ShortcutList.tsx` | Shortcut key recorder, filters, and command mapping configuration UI. | 98 | Low | 9/10 | 9/10 | Search, ShortcutItem, Utils | ShortcutsPageContent.tsx | **Keep** |
| `ShortcutRecordingModal` | `components/Shortcuts/ShortcutRecordingModal.tsx` | Shortcut key recorder, filters, and command mapping configuration UI. | 84 | Low | 9/10 | 9/10 | Keyboard, ShieldAlert, ShortcutActionDetails | ShortcutsPageContent.tsx | **Keep** |
| `ShortcutsPage` | `components/Shortcuts/ShortcutsPage.tsx` | Shortcut key recorder, filters, and command mapping configuration UI. | 3 | Low | 9/10 | 9/10 | ShortcutsPageContent | App.tsx | **Keep** |
| `ShortcutsPageContent` | `components/Shortcuts/ShortcutsPageContent.tsx` | Shortcut key recorder, filters, and command mapping configuration UI. | 147 | Low | 9/10 | 9/10 | ArrowLeft, ShortcutList, Utils | ShortcutsPage.tsx | **Keep** |
| `shortcutUtils` | `components/Shortcuts/shortcutUtils.tsx` | Shortcut key recorder, filters, and command mapping configuration UI. | 112 | Low | 9/10 | 9/10 | Category, ShortcutActionDetails, Types | None | **Delete Candidate** |
| `BackendStatusPanel` | `components/Status/BackendStatusPanel.tsx` | UI presentational layout component representing core application view elements. | 106 | Low | 8/10 | 9/10 | None | AdminDashboardPage.tsx | **Keep** |
| `StatusPage` | `components/Status/StatusPage.tsx` | UI presentational layout component representing core application view elements. | 1051 | Critical | 4/10 | 4/10 | Callback, Effect, State | App.tsx | **Split** |
| `TooltipPortal` | `components/TooltipPortal.tsx` | UI presentational layout component representing core application view elements. | 45 | Low | 9/10 | 9/10 | Effect, ReactDOM, State | MainMiniSidebar.tsx, CreativeSuiteMiniSidebar.tsx, EditorMiniSidebar.tsx | **Keep** |
| `AppWorkspace` | `components/Workspace/AppWorkspace.tsx` | UI presentational layout component representing core application view elements. | 1302 | Critical | 4/10 | 4/10 | ProjectConfirmPanel, State, UrlInputPanel | App.tsx | **Split** |
| `AdminDashboardPage` | `components/admin/AdminDashboardPage.tsx` | Admin dashboard component managing platform operations, health, or logs. | 915 | Critical | 4/10 | 4/10 | BackendStatusPanel, Memo, State | App.tsx, AdminPage.tsx | **Split** |
| `AdminHeaderPage` | `components/admin/AdminHeaderPage.tsx` | Admin dashboard component managing platform operations, health, or logs. | 373 | Medium | 8/10 | 8/10 | Effect, NotificationDropdown, State | AdminLayout.tsx | **Keep** |
| `AdminLayout` | `components/admin/AdminLayout.tsx` | Admin dashboard component managing platform operations, health, or logs. | 120 | Low | 9/10 | 9/10 | AdminSidebar, ArrowLeft, State | AdminPage.tsx, AdminDashboardPage.tsx | **Keep** |
| `AdminMiniSidebar` | `components/admin/AdminMiniSidebar.tsx` | Admin dashboard component managing platform operations, health, or logs. | 214 | Medium | 8/10 | 8/10 | State, TooltipPortal | App.tsx, AdminLayout.tsx | **Keep** |
| `AdminPage` | `components/admin/AdminPage.tsx` | Admin dashboard component managing platform operations, health, or logs. | 277 | Medium | 8/10 | 8/10 | ArrowLeft, Lock, State | App.tsx | **Keep** |
| `AdminSidebar` | `components/admin/AdminSidebar.tsx` | Admin dashboard component managing platform operations, health, or logs. | 261 | Medium | 8/10 | 8/10 | Effect, ThemeMode | App.tsx, AdminLayout.tsx | **Keep** |
| `AdminActivityTab` | `components/admin/Tabs/AdminActivityTab.tsx` | Admin dashboard component managing platform operations, health, or logs. | 152 | Low | 9/10 | 9/10 | Search, State, User | AdminPage.tsx | **Keep** |
| `AdminAnalyticsTab` | `components/admin/Tabs/AdminAnalyticsTab.tsx` | Admin dashboard component managing platform operations, health, or logs. | 375 | Medium | 8/10 | 8/10 | Effect, State | AdminPage.tsx | **Keep** |
| `AdminAnnouncementsTab` | `components/admin/Tabs/AdminAnnouncementsTab.tsx` | Admin dashboard component managing platform operations, health, or logs. | 286 | Medium | 8/10 | 8/10 | Effect, State | AdminPage.tsx | **Keep** |
| `AdminConsoleTab` | `components/admin/Tabs/AdminConsoleTab.tsx` | Admin dashboard component managing platform operations, health, or logs. | 238 | Medium | 8/10 | 8/10 | Effect, Ref, State | AdminPage.tsx | **Keep** |
| `AdminContentTab` | `components/admin/Tabs/AdminContentTab.tsx` | Admin dashboard component managing platform operations, health, or logs. | 398 | Medium | 8/10 | 8/10 | Effect, ProxiedImageUrl, State | AdminPage.tsx | **Keep** |
| `AdminCreditsTab` | `components/admin/Tabs/AdminCreditsTab.tsx` | Admin dashboard component managing platform operations, health, or logs. | 1130 | Critical | 4/10 | 4/10 | Effect, State | AdminPage.tsx | **Split** |
| `AdminExplorerTab` | `components/admin/Tabs/AdminExplorerTab.tsx` | Admin dashboard component managing platform operations, health, or logs. | 326 | Medium | 8/10 | 8/10 | Effect, State | AdminPage.tsx | **Keep** |
| `AdminFinanceTab` | `components/admin/Tabs/AdminFinanceTab.tsx` | Admin dashboard component managing platform operations, health, or logs. | 156 | Low | 9/10 | 9/10 | Effect, State | AdminPage.tsx | **Keep** |
| `AdminHealthTab` | `components/admin/Tabs/AdminHealthTab.tsx` | Admin dashboard component managing platform operations, health, or logs. | 244 | Medium | 8/10 | 8/10 | Effect, State | AdminPage.tsx | **Keep** |
| `AdminScrapersTab` | `components/admin/Tabs/AdminScrapersTab.tsx` | Admin dashboard component managing platform operations, health, or logs. | 180 | Low | 9/10 | 9/10 | Effect, State | AdminPage.tsx | **Keep** |
| `AdminSettingsTab` | `components/admin/Tabs/AdminSettingsTab.tsx` | Admin dashboard component managing platform operations, health, or logs. | 305 | Medium | 8/10 | 8/10 | Effect, State, UpdateSettings | AdminPage.tsx | **Keep** |
| `AdminUsageTab` | `components/admin/Tabs/AdminUsageTab.tsx` | Admin dashboard component managing platform operations, health, or logs. | 181 | Low | 9/10 | 9/10 | Effect, State | AdminPage.tsx | **Keep** |
| `AdminUsersTab` | `components/admin/Tabs/AdminUsersTab.tsx` | Admin dashboard component managing platform operations, health, or logs. | 704 | Critical | 4/10 | 4/10 | Effect, State | AdminPage.tsx | **Split** |
| `AuthFooter` | `components/auth/AuthFooter.tsx` | User authentication component covering registration, login, or recovery forms. | 9 | Low | 9/10 | 9/10 | None | None | **Delete Candidate** |
| `AuthPageShell` | `components/auth/AuthPageShell.tsx` | User authentication component covering registration, login, or recovery forms. | 45 | Low | 9/10 | 9/10 | AuthShowcase, THEMES, ThemeKey | RegisterForm.tsx | **Keep** |
| `AuthShowcase` | `components/auth/AuthShowcase.tsx` | User authentication component covering registration, login, or recovery forms. | 664 | High | 6/10 | 6/10 | SHOWCASE_SLIDES, THEMES, ThemeKey | AuthPageShell.tsx, LoginForm.tsx, ForgotPasswordForm.tsx | **Refactor Later** |
| `ForgotPasswordForm` | `components/auth/ForgotPasswordForm.tsx` | User authentication component covering registration, login, or recovery forms. | 727 | Critical | 4/10 | 4/10 | AuthShowcase, ForgotPasswordForm, ThemeKey | App.tsx, ForgotPasswordPage.tsx | **Split** |
| `ForgotPasswordPage` | `components/auth/ForgotPasswordPage.tsx` | User authentication component covering registration, login, or recovery forms. | 12 | Low | 9/10 | 9/10 | ForgotPasswordForm | App.tsx, ForgotPasswordForm.tsx | **Keep** |
| `LoginForm` | `components/auth/LoginForm.tsx` | User authentication component covering registration, login, or recovery forms. | 743 | Critical | 4/10 | 4/10 | AuthShowcase, LoginForm | App.tsx, LoginPage.tsx | **Split** |
| `LoginPage` | `components/auth/LoginPage.tsx` | User authentication component covering registration, login, or recovery forms. | 13 | Low | 9/10 | 9/10 | LoginForm | App.tsx, LoginForm.tsx | **Keep** |
| `RegisterForm` | `components/auth/RegisterForm.tsx` | User authentication component covering registration, login, or recovery forms. | 485 | High | 6/10 | 6/10 | AuthPageShell, RegisterForm, ThemeSwitcher | RegisterPage.tsx | **Keep** |
| `RegisterPage` | `components/auth/RegisterPage.tsx` | User authentication component covering registration, login, or recovery forms. | 12 | Low | 9/10 | 9/10 | RegisterForm | App.tsx | **Keep** |
| `ThemeSwitcher` | `components/auth/ThemeSwitcher.tsx` | User authentication component covering registration, login, or recovery forms. | 45 | Low | 9/10 | 9/10 | THEMES, ThemeKey | RegisterForm.tsx | **Keep** |
| `ConfirmModal` | `components/confirmationmodels/ConfirmModal.tsx` | Interactive feedback, confirmation dialog, or error reporting modal. | 114 | Low | 9/10 | 8/10 | AlertTriangle, Portal | App.tsx | **Move** |
| `DeleteConfirmModal` | `components/confirmationmodels/DeleteConfirmModal.tsx` | Interactive feedback, confirmation dialog, or error reporting modal. | 79 | Low | 9/10 | 9/10 | AlertTriangle, Portal, Trash2 | None | **Delete Candidate** |
| `ErrorPopupModal` | `components/confirmationmodels/ErrorPopupModal.tsx` | Interactive feedback, confirmation dialog, or error reporting modal. | 196 | Low | 9/10 | 9/10 | State | None | **Delete Candidate** |
| `InfoModal` | `components/confirmationmodels/InfoModal.tsx` | Interactive feedback, confirmation dialog, or error reporting modal. | 75 | Low | 9/10 | 9/10 | Info, Portal | None | **Delete Candidate** |
| `ProjectConfirmPanel` | `components/confirmationmodels/ProjectConfirmPanel.tsx` | Interactive feedback, confirmation dialog, or error reporting modal. | 491 | High | 6/10 | 6/10 | Effect, Portal, State | App.tsx, AppWorkspace.tsx | **Move** |
| `CreativeSuiteDashboardPage` | `components/creative/CreativeSuiteDashboardPage.tsx` | UI presentational layout component representing core application view elements. | 417 | High | 6/10 | 6/10 | Memo, ProjectStore | App.tsx | **Refactor Later** |
| `CreativeSuiteHeader` | `components/creative/CreativeSuiteHeader.tsx` | UI presentational layout component representing core application view elements. | 398 | Medium | 6/10 | 8/10 | Ref, State, UserCreditsPayload | App.tsx, CreativeSuiteLayout.tsx | **Keep** |
| `CreativeSuiteLayout` | `components/creative/CreativeSuiteLayout.tsx` | UI presentational layout component representing core application view elements. | 241 | Medium | 8/10 | 8/10 | ArrowLeft, CreativeSuiteHeader, ProjectStore | App.tsx | **Keep** |
| `CreativeSuiteMiniSidebar` | `components/creative/CreativeSuiteMiniSidebar.tsx` | UI presentational layout component representing core application view elements. | 259 | Medium | 8/10 | 8/10 | State, TooltipPortal | App.tsx, CreativeSuiteLayout.tsx | **Keep** |
| `CreativeSuiteSidebar` | `components/creative/CreativeSuiteSidebar.tsx` | UI presentational layout component representing core application view elements. | 286 | Medium | 8/10 | 8/10 | Effect, ThemeMode | App.tsx, CreativeSuiteLayout.tsx | **Keep** |
| `LandingPage` | `components/landing/LandingPage.tsx` | UI presentational layout component representing core application view elements. | 552 | High | 6/10 | 6/10 | LandingPage, NewsletterForm | App.tsx | **Refactor Later** |
| `FeatureCard` | `components/landing/components/FeatureCard.tsx` | UI presentational layout component representing core application view elements. | 43 | Low | 9/10 | 9/10 | ThemeMode | LandingPage.tsx | **Keep** |
| `LandingFooter` | `components/landing/components/LandingFooter.tsx` | UI presentational layout component representing core application view elements. | 153 | Low | 8/10 | 9/10 | ThemeMode, Twitter, Youtube | LandingPage.tsx | **Keep** |
| `PricingCard` | `components/landing/components/PricingCard.tsx` | UI presentational layout component representing core application view elements. | 74 | Low | 9/10 | 9/10 | Check | LandingPage.tsx | **Keep** |
| `Step` | `components/landing/components/Step.tsx` | UI presentational layout component representing core application view elements. | 33 | Low | 9/10 | 9/10 | ThemeMode | AppWorkspace.tsx, LandingPage.tsx, ProcessBar.tsx | **Keep** |
| `TestimonialCard` | `components/landing/components/TestimonialCard.tsx` | UI presentational layout component representing core application view elements. | 44 | Low | 9/10 | 9/10 | None | LandingPage.tsx | **Keep** |
| `BubblesAfter` | `components/landing/components/demo/BubblesAfter.tsx` | UI presentational layout component representing core application view elements. | 19 | Low | 9/10 | 9/10 | None | LandingPage.tsx | **Keep** |
| `BubblesBefore` | `components/landing/components/demo/BubblesBefore.tsx` | UI presentational layout component representing core application view elements. | 21 | Low | 9/10 | 9/10 | None | LandingPage.tsx | **Keep** |
| `CinematicRenderDemo` | `components/landing/components/demo/CinematicRenderDemo.tsx` | UI presentational layout component representing core application view elements. | 213 | Medium | 8/10 | 8/10 | State, ThemeMode, Volume2 | LandingPage.tsx | **Keep** |
| `SlicingAfter` | `components/landing/components/demo/SlicingAfter.tsx` | UI presentational layout component representing core application view elements. | 41 | Low | 9/10 | 9/10 | None | LandingPage.tsx | **Keep** |
| `SlicingBefore` | `components/landing/components/demo/SlicingBefore.tsx` | UI presentational layout component representing core application view elements. | 23 | Low | 9/10 | 9/10 | None | LandingPage.tsx | **Keep** |
| `TranslationAfter` | `components/landing/components/demo/TranslationAfter.tsx` | UI presentational layout component representing core application view elements. | 23 | Low | 9/10 | 9/10 | None | LandingPage.tsx | **Keep** |
| `TranslationBefore` | `components/landing/components/demo/TranslationBefore.tsx` | UI presentational layout component representing core application view elements. | 21 | Low | 9/10 | 9/10 | None | LandingPage.tsx | **Keep** |
| `NotificationDropdown` | `components/notification/NotificationDropdown.tsx` | UI presentational layout component representing core application view elements. | 222 | Medium | 8/10 | 8/10 | DistanceToNow, Notification, NotificationExpand | MainHeader.tsx, CreativeSuiteHeader.tsx, EditorPageHeader.tsx | **Keep** |
| `NotificationStack` | `components/notification/NotificationStack.tsx` | UI presentational layout component representing core application view elements. | 157 | Low | 9/10 | 9/10 | NotificationCountdown, State, ToastStyles | App.tsx, MainHeader.tsx, MainSidebar.tsx | **Keep** |
| `NotificationsPage` | `components/notification/NotificationsPage.tsx` | UI presentational layout component representing core application view elements. | 513 | High | 6/10 | 6/10 | DistanceToNow, Notification, NotificationExpand | App.tsx | **Refactor Later** |
| `notificationHelpers` | `components/notification/utils/notificationHelpers.tsx` | UI presentational layout component representing core application view elements. | 125 | Low | 9/10 | 9/10 | AlertCircle, CheckCircle, Info | None | **Delete Candidate** |
| `ProfileAccountTab` | `components/profile/ProfileAccountTab.tsx` | User profile management component focusing on user settings, security, or billing. | 647 | High | 6/10 | 6/10 | None | ProfilePage.tsx | **Keep** |
| `ProfileAnalyticsTab` | `components/profile/ProfileAnalyticsTab.tsx` | User profile management component focusing on user settings, security, or billing. | 377 | Medium | 6/10 | 8/10 | None | ProfilePage.tsx | **Keep** |
| `ProfileApiTab` | `components/profile/ProfileApiTab.tsx` | User profile management component focusing on user settings, security, or billing. | 133 | Low | 9/10 | 9/10 | Copy, Plus, State | ProfilePage.tsx | **Keep** |
| `ProfileBillingTab` | `components/profile/ProfileBillingTab.tsx` | User profile management component focusing on user settings, security, or billing. | 242 | Medium | 8/10 | 8/10 | AlertTriangle, Ref, Zap | ProfilePage.tsx | **Keep** |
| `ProfilePage` | `components/profile/ProfilePage.tsx` | User profile management component focusing on user settings, security, or billing. | 1741 | Critical | 4/10 | 4/10 | ProfileAnalyticsTab, ProfilePreferencesTab, ProfileSecurityTab | App.tsx | **Split** |
| `ProfilePreferencesTab` | `components/profile/ProfilePreferencesTab.tsx` | User profile management component focusing on user settings, security, or billing. | 1123 | Critical | 4/10 | 4/10 | None | ProfilePage.tsx | **Split** |
| `ProfileProjectsTab` | `components/profile/ProfileProjectsTab.tsx` | User profile management component focusing on user settings, security, or billing. | 946 | Critical | 4/10 | 4/10 | SourceName | None | **Delete Candidate** |
| `ProfileSecurityTab` | `components/profile/ProfileSecurityTab.tsx` | User profile management component focusing on user settings, security, or billing. | 779 | Critical | 4/10 | 4/10 | None | ProfilePage.tsx | **Split** |
| `CardPaymentForm` | `components/profile/billing/CardPaymentForm.tsx` | User profile management component focusing on user settings, security, or billing. | 109 | Low | 9/10 | 9/10 | None | ProfileBillingTab.tsx | **Keep** |
| `CardPreview` | `components/profile/billing/CardPreview.tsx` | User profile management component focusing on user settings, security, or billing. | 50 | Low | 9/10 | 9/10 | CreditCard | ProfileBillingTab.tsx | **Keep** |
| `CreditCalculator` | `components/profile/billing/CreditCalculator.tsx` | User profile management component focusing on user settings, security, or billing. | 63 | Low | 9/10 | 9/10 | Gift | ProfileBillingTab.tsx | **Keep** |
| `DailyStreakTracker` | `components/profile/billing/DailyStreakTracker.tsx` | User profile management component focusing on user settings, security, or billing. | 139 | Low | 9/10 | 9/10 | CheckCircle2, Gift, Ticket | ProfileBillingTab.tsx | **Keep** |
| `SubscriptionPlanHeader` | `components/profile/billing/SubscriptionPlanHeader.tsx` | User profile management component focusing on user settings, security, or billing. | 75 | Low | 9/10 | 9/10 | Plus | ProfileBillingTab.tsx | **Keep** |
| `SubscriptionPlansGrid` | `components/profile/billing/SubscriptionPlansGrid.tsx` | User profile management component focusing on user settings, security, or billing. | 116 | Low | 9/10 | 9/10 | Ticket | ProfileBillingTab.tsx | **Keep** |
| `SettingsAccountPage` | `components/settings/SettingsAccountPage.tsx` | UI presentational layout component representing core application view elements. | 500 | High | 6/10 | 6/10 | Effect, State | App.tsx | **Refactor Later** |
| `useThemeMode` | `hooks/useThemeMode.tsx` | UI presentational layout component representing core application view elements. | 96 | Low | 9/10 | 9/10 | LoadingPage, Root, State | None | **Delete Candidate** |
| `main` | `main.tsx` | UI presentational layout component representing core application view elements. | 15 | Low | 9/10 | 9/10 | ErrorBoundary, Global, Root | None | **Keep** |

---

## 🛠️ 7. Architectural Observations & Recommendations

1. **State Centralization:**
   - **Observation:** `App.tsx` has bloated to over 2,160 lines due to managing multiple heavy features in a single file and drilling state props deep down.
   - **Recommendation:** Delegate all app routing, viewport settings, global modals, and theme states to a central state machine (e.g. Zustand) and keep `App.tsx` clean with router layouts.
2. **Form Layout Standardization:**
   - **Observation:** Forms throughout `auth/` and `profile/` folders implement their own custom inputs, button components, and tailwind gradients.
   - **Recommendation:** Build a design system library containing shared elements (`Input`, `Select`, `Button`, `Dialog`).
3. **Modular Sidebar Architecture:**
   - **Observation:** `MainSidebar.tsx` and `MainMiniSidebar.tsx` repeat navigation link structures, authorization checking, and route resolution logic.
   - **Recommendation:** Group sidebar structures under a single modular `Sidebar` folder containing state configurations and dry list mapping.

---

## 📈 8. Estimated Effort & Component Migration Plan

To refactor the Sonikoma workspace cleanly without disrupting business logic:

### Recommended Refactoring Order:
1. **Phase 1: Safe Deletions & Cleanups (1-2 Days)**
   - Delete all confirmed unused components (e.g., `ToolSidebar`, `AutoCropEngineComparison`).
   - Rename misspelled directory `components/confirmationmodels` to `components/shared/dialogs` and update imports.
2. **Phase 2: Extract Primitives & Shared Components (2-3 Days)**
   - Extract `RangeSlider`, `SectionTitle`, and common buttons into `components/shared/`.
   - Build unified generic modal wrapper to merge `ConfirmModal` and `DeleteConfirmModal`.
3. **Phase 3: Decouple Page Shells & Forms (3-4 Days)**
   - Extract layout wrappers inside authentication files into unified `AuthPageShell`.
4. **Phase 4: Component Splitting for Large Modules (5-7 Days)**
   - Split `ProfilePage`, `CinemaPlayer`, `AIModelsPage`, and `AppWorkspace` into cohesive child sub-directories.

### Estimated Total Refactoring Effort: **11–16 Person-Days**
