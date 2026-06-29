export {
  stripRegionFromUrl,
  parseWebtoonUrl,
  getSourceName,
  getSourceIcon,
  getProxiedImageUrl,
} from "./utils/url";
export { getPanelFilterStyle } from "./utils/filter";

export const fetchWithAuth = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  const token =
    localStorage.getItem("sonikoma_token") ||
    sessionStorage.getItem("sonikoma_token");
  const headers = new Headers(init?.headers);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
};
