import type { ErrorPopupDetail } from "../components/ErrorPopupModal";
import type { NotificationType } from "../components/NotificationStack";

export type AddNotificationFn = (
  message: string,
  type: NotificationType,
  options?: {
    errorCode?: number;
    retryDelay?: number;
    onRetry?: () => void;
  }
) => void;

export interface FetchInterceptorHandlers {
  addNotification: AddNotificationFn;
  setErrorPopup: (detail: ErrorPopupDetail | null) => void;
}

export function createFetchWithInterceptor({ addNotification, setErrorPopup }: FetchInterceptorHandlers) {
  return async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
    console.log(`[API Interceptor] Fetching: ${input}`);
    return new Promise<Response>((resolve, reject) => {
      const executeFetch = async () => {
        try {
          const response = await fetch(input, init);
          const contentType = response.headers.get("content-type") || "";
          const isHtml = contentType.includes("text/html") || contentType.includes("application/xhtml+xml");

          if (isHtml) {
            addNotification(
              "Service Unavailable: The app back-end returned an HTML routing fallback instead of JSON. Please check server configurations or retry.",
              "error"
            );
            const err = new Error("Service Unavailable (backend returned HTML instead of a valid JSON response)");
            (err as any).intercepted = true;
            reject(err);
            return;
          }

          if (!response.ok) {
            let errMsg = `Server returned HTTP ${response.status}`;
            let handled = false;

            if (response.status === 401) {
              errMsg = "Action Unauthorized (401): You do not have valid authentication or server credentials.";
              addNotification(errMsg, "error");
              setErrorPopup({
                title: "Authentication Required (401)",
                message: errMsg,
                type: "error",
                technicalDetails: `HTTP 401 Unauthorized\nRequested API Path: ${input}`,
                suggestion: "This action is protected. Please check that any API keys, credentials, or secrets are correctly declared in your container environment."
              });
              handled = true;
            } else if (response.status === 429) {
              errMsg = "Quota Exhausted (429): You've exceeded your request rate limit or daily API quota. Retrying automatically...";
              let suggestedDelay = 10;
              const retryAfterHeader = response.headers.get("Retry-After");
              if (retryAfterHeader) {
                const parsed = parseInt(retryAfterHeader, 10);
                if (!Number.isNaN(parsed) && parsed > 0) {
                  suggestedDelay = parsed;
                }
              }

              addNotification(errMsg, "error", {
                errorCode: 429,
                retryDelay: suggestedDelay,
                onRetry: () => {
                  executeFetch();
                }
              });

              setErrorPopup({
                title: "API Limit Enforced (429)",
                message: "Too many concurrent requests are active, or you've hit your daily API quota. The system will recover automatically.",
                type: "warning",
                technicalDetails: `HTTP 429 Too Many Requests\nEndpoint: ${input}\nSuggested Retry Delay: ${suggestedDelay}s`,
                suggestion: "Please wait for resets. For best stability, configure the processor model dropdown back to Gemini 3.5 Flash or Gemini 2.5 Flash, which have much larger free tiered bandwidths.",
                onRetry: () => {
                  executeFetch();
                }
              });

              handled = true;
              return;
            } else if (response.status === 500) {
              let backendError = "";
              if (contentType.includes("application/json")) {
                const errorData = await response.clone().json().catch(() => ({}));
                if (errorData.error) backendError = errorData.error;
                else if (errorData.message) backendError = errorData.message;
              }
              errMsg = backendError
                ? `Pipeline Failure (500): ${backendError}`
                : "Pipeline Failure (500): The backend server failed to process the request. Please check server console logs or retry.";

              addNotification(errMsg, "error", { errorCode: 500 });
              setErrorPopup({
                title: "Internal Engine Fault (500)",
                message: backendError || "The backend server encountered an unexpected error while executing this request.",
                type: "error",
                technicalDetails: `HTTP 500 Internal Server Error\nRequested path: ${input}\nDetails: ${backendError || 'N/A'}`,
                suggestion: "This usually points to a backend error, temporary memory constraints during image merging, or model processing issues. Make sure the scraped panel matches general dimensions and click Retry.",
                onRetry: () => {
                  executeFetch();
                }
              });
              handled = true;
            } else {
              if (contentType.includes("application/json")) {
                const errorData = await response.json().catch(() => ({}));
                errMsg = errorData.message || errorData.detail || errorData.error || errMsg;
              }
              setErrorPopup({
                title: `Server Operation Error (${response.status})`,
                message: errMsg,
                type: "error",
                technicalDetails: `HTTP ${response.status} Error\nEndpoint: ${input}`,
                suggestion: "Double check model specifications and link parameters. If problems persist, refresh your browser tab or choose an alternative frame.",
                onRetry: () => {
                  executeFetch();
                }
              });
            }

            const err = new Error(errMsg);
            if (handled) {
              (err as any).intercepted = true;
            }
            reject(err);
            return;
          }

          console.log(`[API Interceptor] Response OK: ${input} (${response.status})`);
          resolve(response);
        } catch (error: any) {
          if (error.intercepted) {
            reject(error);
            return;
          }
          const isNetError = error instanceof TypeError && (
            error.message === "Failed to fetch" ||
            error.message === "fetch failed" ||
            error.message.includes("NetworkError") ||
            error.message.includes("unreachable")
          );
          if (isNetError) {
            const netErrMessage = "The backend server is not running. Please make sure the backend server is started.";
            addNotification(netErrMessage, "error");
            setErrorPopup({
              title: "Backend Server Offline",
              message: netErrMessage,
              type: "error",
              technicalDetails: `Network TypeError: ${error.message}\nTarget URL: ${input}`,
              suggestion: "Please start the backend server or verify it is running on the correct port, then retry the request.",
              onRetry: () => {
                executeFetch();
              }
            });
            const customNetErr = new Error(netErrMessage);
            (customNetErr as any).intercepted = true;
            reject(customNetErr);
            return;
          }
          reject(error);
        }
      };

      executeFetch();
    });
  };
}
