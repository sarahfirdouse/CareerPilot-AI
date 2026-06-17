import { Component, type ReactNode, type ErrorInfo } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
          <div className="glass-panel rounded-2xl p-8 max-w-md w-full text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7 text-destructive" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Something went wrong</h2>
              <p className="text-sm text-muted-foreground">
                An unexpected error occurred. Refreshing the page usually fixes it.
              </p>
              {this.state.error && (
                <p className="mt-3 text-xs text-muted-foreground/60 font-mono bg-white/4 rounded-lg p-3 text-left break-all border border-white/6">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <Button
              onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
              className="bg-primary hover:bg-primary/90 rounded-xl gap-2 h-9"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" /> Reload Page
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
