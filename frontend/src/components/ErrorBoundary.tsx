'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  portalName?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message || 'Unknown error occurred.' };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console for debugging — in production swap for Sentry/Datadog
    console.error(`[ErrorBoundary] ${this.props.portalName || 'Portal'} crashed:`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
          <div className="bg-white border border-rose-200 rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7 text-rose-500" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {this.props.portalName || 'Portal'} Encountered an Error
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                A rendering exception occurred. Your data is safe. Try reloading this section.
              </p>
              {this.state.errorMessage && (
                <p className="text-[13px] font-mono text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 mt-3 text-left break-words">
                  {this.state.errorMessage}
                </p>
              )}
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-colors shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry Section
              </button>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors border border-slate-200"
              >
                Full Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
