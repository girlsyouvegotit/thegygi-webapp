import { useNavigate, useRouteError, isRouteErrorResponse } from "react-router";
import AppErrorView, {
  formatErrorDetails,
} from "@/components/errors/AppErrorView";
import NotFound from "@/pages/public/NotFound";

/** React Router `errorElement` — friendly page for route/render failures. */
export default function RouteError() {
  const error = useRouteError();
  const navigate = useNavigate();

  let status: number | string | undefined;
  let title = "Something went wrong";
  let message =
    "We hit an unexpected snag loading this page. Try again or head home.";

  if (isRouteErrorResponse(error)) {
    status = error.status;
    if (error.status === 404) {
      return <NotFound />;
    } else if (error.status === 401 || error.status === 403) {
      title = "Access denied";
      message = "You don’t have permission to view this page. Try signing in.";
    } else if (error.status >= 500) {
      title = "Server issue";
      message =
        "Our servers had trouble with this request. Please try again shortly.";
    } else {
      title = error.statusText || title;
      message =
        typeof error.data === "string"
          ? error.data
          : error.data?.message || message;
    }
  } else if (error instanceof Error) {
    // Keep user-facing copy calm; details stay in the collapsible (dev).
    if (/ChunkLoadError|Loading chunk|Failed to fetch dynamically/i.test(error.message)) {
      title = "Update available";
      message =
        "A newer version of GYGI finished loading. Reload to continue.";
    }
  }

  return (
    <AppErrorView
      status={status}
      title={title}
      message={message}
      details={formatErrorDetails(error)}
      onRetry={() => {
        // Re-attempt current route without a full hard reload when possible
        void navigate(0);
      }}
    />
  );
}
