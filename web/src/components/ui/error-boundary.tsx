"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("ErrorBoundary caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            role="alert"
            className="flex flex-col items-center justify-center gap-4 px-4 py-16 text-center"
          >
            <AlertCircle className="h-12 w-12 text-red-300" aria-hidden="true" />
            <h2 className="text-base font-semibold text-[var(--color-markit-dark)]">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-500">
              {this.state.error?.message ?? "An unexpected error occurred."}
            </p>
            <Button
              onClick={() => this.setState({ hasError: false, error: null })}
              variant="outline"
              size="sm"
            >
              Try again
            </Button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
