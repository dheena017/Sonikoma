import React, { useEffect } from "react";
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
  navigateTo?: (path: string) => void;
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
  navigateTo,
}) => {
  const isSidebarOpen = !isSidebarCollapsed && !isFocusMode;

  // PREMIUM SCROLL LOCK: Prevent the background page from scrolling when the sidebar overlay is open
  useEffect(() => {
    const mainScroll = document.getElementById("main-scroll-container");
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
      if (mainScroll) mainScroll.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      if (mainScroll) mainScroll.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      if (mainScroll) mainScroll.style.overflow = "";
    };
  }, [isSidebarOpen]);

  return (
    <div className="flex min-h-screen bg-[#050507] text-white selection:bg-purple-500/30">
      {/* Blurred Background Overlay when expanded sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity animate-fade-in"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

      {/* Sidebars */}
      {!isFocusMode &&
        (isSidebarCollapsed ? (
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
            navigateTo={navigateTo}
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
            navigateTo={navigateTo}
          />
        ))}

      {/* Fixed Premium Header */}
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
        />
      )}

      {/* Main Content Wrapper 
          PREMIUM LAYOUT SPACING: 
          - pt-16 (64px) clears the fixed header.
          - pl-20 (80px) clears the fixed mini sidebar so content doesn't hide underneath.
      */}
      <div
        className={`flex flex-1 flex-col min-w-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] min-h-screen ${
          isFocusMode ? "pt-0 pl-0" : "pt-16 pl-0 md:pl-16"
        }`}
      >
        {/* Inner container — allow overflow so the parent scrollbar handles scrolling */}
        <div className="flex-1 w-full relative min-w-0">
          <div className="animate-[fadeIn_0.3s_ease-out] w-full flex flex-col min-w-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LayoutEditorPage);
