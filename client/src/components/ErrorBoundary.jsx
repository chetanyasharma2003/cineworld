import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="bg-[#0a0a0a] min-h-screen text-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-6xl mb-4">🎬</p>
          <h1 className="text-2xl font-black mb-2">Something went wrong</h1>
          <p className="text-gray-500 text-sm mb-6">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={this.reset}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-semibold transition-all"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = "/"}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-semibold transition-all"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }
}
