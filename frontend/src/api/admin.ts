export const adminGetUsers = async (fetchWithInterceptor: any) => {
  const res = await fetchWithInterceptor("/api/auth/admin/users");
  return res.json();
};

export const adminUpdateUser = async (fetchWithInterceptor: any, userId: string, data: any) => {
  const res = await fetchWithInterceptor(`/api/auth/admin/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const adminDeleteUser = async (fetchWithInterceptor: any, userId: string) => {
  const res = await fetchWithInterceptor(`/api/auth/admin/users/${userId}`, {
    method: "DELETE",
  });
  return res.json();
};

export const adminGetSettings = async (fetchWithInterceptor: any) => {
  const res = await fetchWithInterceptor("/api/auth/admin/settings");
  return res.json();
};

export const adminUpdateSettings = async (fetchWithInterceptor: any, settings: any) => {
  const res = await fetchWithInterceptor("/api/auth/admin/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ settings }),
  });
  return res.json();
};

export const adminGetAuditLogs = async (fetchWithInterceptor: any) => {
  const res = await fetchWithInterceptor("/api/auth/admin/audit-logs");
  return res.json();
};

export const adminGetAnalytics = async (fetchWithInterceptor: any) => {
  const res = await fetchWithInterceptor("/api/auth/admin/analytics");
  return res.json();
};

export const adminGetProjects = async (fetchWithInterceptor: any) => {
  const res = await fetchWithInterceptor("/api/auth/admin/projects");
  return res.json();
};

export const adminDeleteProject = async (fetchWithInterceptor: any, projectId: string) => {
  const res = await fetchWithInterceptor(`/api/auth/admin/projects/${projectId}`, {
    method: "DELETE",
  });
  return res.json();
};

export const adminGetUserLogs = async (fetchWithInterceptor: any, userId: string, limit: number = 20) => {
  const res = await fetchWithInterceptor(`/api/auth/admin/users/${userId}/logs?limit=${limit}`);
  return res.json();
};

export const adminBulkAction = async (fetchWithInterceptor: any, data: any) => {
  const res = await fetchWithInterceptor("/api/auth/admin/users/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const adminImpersonateUser = async (fetchWithInterceptor: any, userId: string) => {
  const res = await fetchWithInterceptor(`/api/auth/admin/impersonate/${userId}`, {
    method: "POST",
  });
  return res.json();
};

export const adminGetAnnouncements = async (fetchWithInterceptor: any) => {
  const res = await fetchWithInterceptor("/api/auth/admin/announcements");
  return res.json();
};

export const adminCreateAnnouncement = async (fetchWithInterceptor: any, data: any) => {
  const res = await fetchWithInterceptor("/api/auth/admin/announcements", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const adminDeleteAnnouncement = async (fetchWithInterceptor: any, id: number) => {
  const res = await fetchWithInterceptor(`/api/auth/admin/announcements/${id}`, {
    method: "DELETE",
  });
  return res.json();
};
