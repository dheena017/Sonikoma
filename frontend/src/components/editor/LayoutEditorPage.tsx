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
  return (
    <div className="flex min-h-screen overflow-hidden bg-[#070709] text-white">
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

      <div
        className={`flex flex-1 flex-col transition-all duration-300 ${
          isFocusMode
            ? "ml-0"
            : isSidebarCollapsed
            ? "ml-16"
            : "ml-64"
        }`}
      >
        <div className="flex-1 overflow-y-auto">
          <div className="sticky top-0 z-50 border-b border-white/10 bg-[#070709]/95 px-4 pt-4 md:px-6 lg:px-8">
            <EditorPageHeader
              title={title}
              subtitle={subtitle}
              onBackToApp={onBackToApp}
              onSave={onSave}
              isSaving={isSaving}
              isFocusMode={isFocusMode}
              setIsFocusMode={setIsFocusMode}
            />
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};

export default React.memo(LayoutEditorPage);
