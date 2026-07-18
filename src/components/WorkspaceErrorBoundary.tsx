"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type WorkspaceErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
};

type WorkspaceErrorBoundaryState = {
  hasError: boolean;
};

export class WorkspaceErrorBoundary extends Component<WorkspaceErrorBoundaryProps, WorkspaceErrorBoundaryState> {
  state: WorkspaceErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Crelavo workspace render error", error, info);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
