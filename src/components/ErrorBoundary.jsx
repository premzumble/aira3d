import React from 'react';
import { ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an uncaught exception:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center bg-white rounded-3xl border border-red-100 shadow-sm my-6 max-w-xl mx-auto">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-500 text-sm max-w-md mb-8 leading-relaxed">
            The application encountered an unexpected runtime error. We've logged the error and are working on fixing it.
          </p>
          
          {this.state.error && (
            <div className="w-full text-left bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-8 font-mono text-xs overflow-auto max-h-40">
              <p className="font-bold text-red-700">{this.state.error.toString()}</p>
              {this.state.errorInfo && (
                <pre className="text-gray-500 mt-2 whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>
          )}
          
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-500/10 transition-all text-sm"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Try Reloading Component
            </button>
            <a
              href="/"
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all text-sm"
            >
              <HomeIcon className="w-4 h-4" />
              Go to Home Page
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
