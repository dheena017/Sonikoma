import React from "react";
import EditorSidebar from "./EditorSidebar";
import EditorMiniSidebar from "./EditorMiniSidebar";
import EditorPageHeader from "./EditorPageHeader";

interface LayoutEditorPageProps {
  children: React.ReactNode;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  currentSection: string;
  setCurrentSection: React.Dispatch<React.SetStateAction<string>>;
  onBackToApp: () => void;
  scrapedCount: number;
  panelsCount: number;
  isBatchCropping: boolean;
  isCleaningBubbles: boolean;
  title: string;
  subtitle?: string;
  onSave: () => void;
  isSaving: boolean;
  isFocusMode: boolean;
  setIsFocusMode: React.Dispatch<React.SetStateAction<boolean>>;
}

const LayoutEditorPage: React.FC<LayoutEditorPageProps> = ({
  children,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  currentSection,
  setCurrentSection,
  onBackToApp,
  scrapedCount,
  panelsCount,
  isBatchCropping,
  isCleaningBubbles,
  title,
  subtitle,
  onSave,
  isSaving,
  isFocusMode,
  setIsFocusMode,
}) => {
  const isSidebarOpen = !isSidebarCollapsed && !isFocusMode;

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#070709] text-white">
      {/* Blurred Background Overlay when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

      {!isFocusMode && (isSidebarCollapsed ? (
        <EditorMiniSidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          currentSection={currentSection}
          setCurrentSection={setCurrentSection}
          onBackToApp={onBackToApp}
          scrapedCount={scrapedCount}
          panelsCount={panelsCount}
          isBatchCropping={isBatchCropping}
          isCleaningBubbles={isCleaningBubbles}
        />
      ) : (
        <EditorSidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          currentSection={currentSection}
          setCurrentSection={setCurrentSection}
          onBackToApp={onBackToApp}
          scrapedCount={scrapedCount}
          panelsCount={panelsCount}
          isBatchCropping={isBatchCropping}
          isCleaningBubbles={isCleaningBubbles}
        />
      ))}

      {/* Fixed Header */}
      {!isFocusMode && (
        <EditorPageHeader
          title={title}
          subtitle={subtitle}
          onBackToApp={onBackToApp}
          onSave={onSave}
          isSaving={isSaving}
          isFocusMode={isFocusMode}
          setIsFocusMode={setIsFocusMode}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isSidebarCollapsed={isSidebarCollapsed}
          isSidebarOpen={isSidebarOpen}
          className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        />
      )}

      <div
        className={`flex flex-1 flex-col transition-all duration-300 ${
          isFocusMode
            ? "pt-4 ml-0"
            : "pt-24 ml-0"
        }`}
      >
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default React.memo(LayoutEditorPage);
