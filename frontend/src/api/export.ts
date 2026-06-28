export const exportToYoutube = async (fetchWithInterceptor: any, data: any) => {
  const res = await fetchWithInterceptor("/api/export/youtube", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};
