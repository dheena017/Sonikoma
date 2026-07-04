import React, { useState, useEffect } from "react";
import AdminHeaderPage from "./AdminHeaderPage";
import * as api from "@/api";

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPath: string;
  navigateTo: (path: string) => void;
  fetchWithInterceptor: any;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  currentPath,
  navigateTo,
  fetchWithInterceptor,
}) => {
  return (
    <div className="flex-1 flex flex-col min-h-full">
      {/* Admin Header with Stats */}
      <AdminHeaderPage 
        currentPath={currentPath} 
        navigateTo={navigateTo} 
        fetchWithInterceptor={fetchWithInterceptor}
      />

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-7xl mx-auto animate-[fadeIn_0.3s_ease-out]">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-8 border-t border-violet-900/10 text-center bg-black/20">
        <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.3em] font-mono">
          Sonikoma Command Center &bull; Privileged Access Only
        </p>
      </footer>
    </div>
  );
};

export default AdminLayout;
