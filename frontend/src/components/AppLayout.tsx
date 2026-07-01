import React from "react";

interface AppLayoutProps {
  sidebar: React.ReactNode;
  miniSidebar?: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  isAdminPath?: boolean;
  isSidebarOpen?: boolean;
}

export default function AppLayout({
  sidebar,
  miniSidebar,
  header,
  children,
  footer,
  isAdminPath = false,
  isSidebarOpen = false,
}: AppLayoutProps) {
  return (
    <div
      className={`h-screen w-full bg-[#070709] text-neutral-100 flex flex-col selection:text-white ${
        isAdminPath ? "selection:bg-violet-600" : "selection:bg-purple-600"
      }`}
    >
      {/* ===== HEADER: Full-width at top ===== */}
      <div className="w-full flex-shrink-0 sticky top-0 z-40">{header}</div>

      {/* ===== MAIN CONTENT AREA: Sidebar + Content ===== */}
      <div className="flex flex-1 overflow-hidden w-full">
        {/* Sidebar + Mini Sidebar Layer */}
        <div className="relative flex-shrink-0">
          {sidebar}
          {miniSidebar}
        </div>

        {/* Main Content Scroll Container */}
        <div
          id="main-scroll-container"
          className={`flex-1 flex flex-col overflow-y-auto transition-all duration-300 ${
            !isAdminPath && isSidebarOpen ? "lg:overflow-hidden" : ""
          }`}
        >
          {/* Content Pages */}
          <div className="flex-1 flex flex-col">{children}</div>

          {/* Footer */}
          {footer && <div className="flex-shrink-0 w-full">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
