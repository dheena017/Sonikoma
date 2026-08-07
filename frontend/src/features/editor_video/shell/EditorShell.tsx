import React from "react";
import VideoEditorHeader from "./VideoEditorHeader";
import VideoEditorSidebar from "./VideoEditorSidebar";
import { WorkspacePanel } from "./WorkspacePanel";

interface EditorShellProps {
  children?: React.ReactNode;
  headerProps?: React.ComponentProps<typeof VideoEditorHeader>;
  sidebarProps?: React.ComponentProps<typeof VideoEditorSidebar>;
  workspacePanelProps?: React.ComponentProps<typeof WorkspacePanel>;
  showWorkspacePanel?: boolean;
}

export const EditorShell: React.FC<EditorShellProps> = ({
  children,
  headerProps,
  sidebarProps,
  workspacePanelProps,
  showWorkspacePanel = true,
}) => {
  return (
    <div className="flex flex-col h-screen w-screen bg-[#050508] text-white overflow-hidden select-none font-sans fixed inset-0 z-[100]">
      {headerProps && <VideoEditorHeader {...headerProps} />}
      {sidebarProps && <VideoEditorSidebar {...sidebarProps} />}
      <div className="flex-1 flex min-h-0 relative">
        {showWorkspacePanel && workspacePanelProps && (
          <div className="h-full shrink-0 flex" style={{ width: 380 }}>
            <WorkspacePanel {...workspacePanelProps} />
          </div>
        )}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};

export default React.memo(EditorShell);
