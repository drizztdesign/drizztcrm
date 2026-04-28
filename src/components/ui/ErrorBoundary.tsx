"use client";
import { Component, type ReactNode } from "react";

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex-1 grid place-items-center p-8">
          <div className="text-center max-w-[340px]">
            <div className="text-[40px] mb-4">⚠️</div>
            <div className="text-[15px] font-semibold text-fg-0 mb-2">Algo salió mal</div>
            <div className="text-[12.5px] text-fg-2 mb-4">
              {this.state.error?.message ?? "Error inesperado"}
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 rounded-lg bg-accent text-accent-ink text-[12.5px] font-semibold hover:opacity-90"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
