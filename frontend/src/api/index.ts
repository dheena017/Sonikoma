export * from "./types";
export * from "./request";
export * from "./auth";
export * from "./projects";
export * from "./image";
export * from "./ai";
export * from "./scraper";
export * from "./video";
export * from "./system";
export * from "./admin";
export * from "./skills";
export * from "./export";
export * from "./analytics";
export * from "./fetchWithInterceptor";

export const fetchBlob = async (
  url: string,
  headers?: HeadersInit
): Promise<Blob> => {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Failed to fetch asset: ${url}`);
  return res.blob();
};
