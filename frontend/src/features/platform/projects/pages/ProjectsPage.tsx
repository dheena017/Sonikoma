import React from "react";
import useProjectsPage from "@/features/platform/projects/hooks/useProjectsPage";
import ProjectsPageView from "@/features/platform/projects/components/ProjectsPageView";

export default function ProjectsPage() {
  const page = useProjectsPage();
  return <ProjectsPageView {...page} />;
}
