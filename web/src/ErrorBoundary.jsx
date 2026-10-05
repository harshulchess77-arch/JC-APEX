import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Application Error</h1>
            <p className="text-slate-300 mb-4">
              Something went wrong. Please refresh the page or try again later.
            </p>
            {this.state.error && (
              <details className="mt-4" open>
                <summary className="text-slate-400 cursor-pointer mb-2">Error details</summary>
                <pre className="text-xs text-red-400 bg-slate-950 p-2 rounded overflow-auto max-h-60 whitespace-pre-wrap">
                  {this.state.error?.stack || this.state.error?.toString()}
                  {this.state.errorInfo?.componentStack && `\n\nComponent Stack:${this.state.errorInfo.componentStack}`}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
