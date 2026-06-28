export const getProjects = async (fetchWithInterceptor: any) => {
  const res = await fetchWithInterceptor("/api/projects");
  return res.json();
};

export const getProject = async (
  fetchWithInterceptor: any,
  projectId: string
) => {
  const res = await fetchWithInterceptor(`/api/projects/${projectId}`);
  return res.json();
};

export const getPublicProject = async (
  fetchWithInterceptor: any,
  projectId: string
) => {
  const res = await fetchWithInterceptor(`/api/projects/public/${projectId}`);
  return res.json();
};

export const createProject = async (
  fetchWithInterceptor: any,
  projectData: any
) => {
  const res = await fetchWithInterceptor("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(projectData),
  });
  return res.json();
};

export const updateProject = async (
  fetchWithInterceptor: any,
  projectId: string,
  projectData: any
) => {
  const res = await fetchWithInterceptor(`/api/projects/${projectId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(projectData),
  });
  return res.json();
};

export const deleteProject = async (
  fetchWithInterceptor: any,
  projectId: string
) => {
  const res = await fetchWithInterceptor(`/api/projects/${projectId}`, {
    method: "DELETE",
  });
  return res.json();
};

export const batchDeleteProjects = async (
  fetchWithInterceptor: any,
  projectIds: string[]
) => {
  const res = await fetchWithInterceptor("/api/projects/batch-delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_ids: projectIds }),
  });
  return res.json();
};

export const getSeries = async (
  fetchWithInterceptor: any,
  seriesSlug: string
) => {
  const res = await fetchWithInterceptor(`/api/projects/series/${seriesSlug}`);
  return res.json();
};

export const deleteSeries = async (
  fetchWithInterceptor: any,
  seriesId: string
) => {
  const res = await fetchWithInterceptor(`/api/projects/series/${seriesId}`, {
    method: "DELETE",
  });
  return res.json();
};

export const updateProjectPanels = async (
  fetchWithInterceptor: any,
  projectId: string,
  panels: any[]
) => {
  const res = await fetchWithInterceptor(`/api/projects/${projectId}/panels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ panels }),
  });
  return res.json();
};

export const saveScrapedImages = async (
  fetchWithInterceptor: any,
  data: any
) => {
  const res = await fetchWithInterceptor("/api/save-scraped-images", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const updateProjectTokens = async (
  fetchWithInterceptor: any,
  projectId: string,
  tokens: number
) => {
  const res = await fetchWithInterceptor(`/api/projects/${projectId}/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tokens }),
  });
  return res.json();
};
