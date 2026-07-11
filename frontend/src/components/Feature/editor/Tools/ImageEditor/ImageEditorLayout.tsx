import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MainMiniSidebar from "@/components/MainMiniSidebar";
import { ImageEditorHeader } from "./ImageEditorHeader";
import { ImageEditorMiniSidebar } from "./ImageEditorMiniSidebar";
import { ImageEditorRightSidebar } from "./ImageEditorRightSidebar";

interface ImageEditorLayoutProps {
  children: React.ReactNode;
  onClose: () => void;
  onApply: () => void;
  header: React.ReactNode;
  sidebar: React.ReactNode;
}

export const ImageEditorLayout: React.FC<ImageEditorLayoutProps> = ({
  children,
  onClose,
  onApply,
  header,
  sidebar
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0F19] text-white !p-0 !m-0 z-[100] fixed inset-0 rounded-none border-none">
      {/* Global Far-Left Sidebar */}
      <MainMiniSidebar
        currentPath={location.pathname}
        navigateTo={(path) => navigate(path)}
        notificationsCount={0}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative lg:ml-20 rounded-none border-none">
        {header}
        <div className="flex-1 flex flex-row overflow-hidden w-full rounded-none border-none">

          {/* Left Column: Image Editor Mini Sidebar */}
          <ImageEditorMiniSidebar />

          {/* Center Column: The Interactive Canvas */}
          <main className="flex-1 h-full relative overflow-hidden bg-black/50 flex items-center justify-center rounded-none border-none">
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                 style={{ backgroundImage: "radial-gradient(#374151 1px, transparent 0)", backgroundSize: "20px 20px" }} />

            <div className="relative w-full h-full z-10 flex items-center justify-center p-8">
              {children}
            </div>
          </main>

          {/* Right Column: Properties Panel */}
          {sidebar}

        </div>
      </div>
    </div>
  );
};