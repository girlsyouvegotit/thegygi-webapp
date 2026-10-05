import { Component, type ErrorInfo, type ReactNode } from "react";
import AppErrorView, { formatErrorDetails } from "@/components/errors/AppErrorView";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

/** Catches render errors outside (or above) the router errorElement. */
export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[GYGI ErrorBoundary]", error, info.componentStack);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const isChunk =
      /ChunkLoadError|Loading chunk|Failed to fetch dynamically/i.test(
        error.message,
      );

    return (
      <AppErrorView
        title={isChunk ? "Update available" : "Something went wrong"}
        message={
          isChunk
            ? "A newer version of GYGI finished loading. Reload to continue."
            : "We hit an unexpected snag. You can try again or head back home."
        }
        details={formatErrorDetails(error)}
        onRetry={() => {
          this.reset();
          window.location.reload();
        }}
      />
    );
  }
}
