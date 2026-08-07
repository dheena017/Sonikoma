import { useState } from "react";
import { WorkspaceId } from "../types/workspace.types";

export const useWorkspaceState = (initialWorkspace: WorkspaceId = "media") => {
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>(initialWorkspace);
  const [activeSubTab, setActiveSubTab] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const triggerFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 2500);
  };

  return {
    activeWorkspace,
    setActiveWorkspace,
    activeSubTab,
    setActiveSubTab,
    searchQuery,
    setSearchQuery,
    isExpanded,
    setIsExpanded,
    actionFeedback,
    triggerFeedback,
  };
};
