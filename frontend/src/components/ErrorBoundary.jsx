import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ Error Caught by Error Boundary:');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  resetError = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full border-l-4 border-red-500">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
              <h1 className="text-2xl font-bold text-red-700">Oops! Error Occurred</h1>
            </div>
            
            <p className="text-gray-700 mb-4">
              Something went wrong while loading this component. This is usually not a critical issue.
            </p>

            {this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                <p className="text-sm font-mono text-red-800 break-words">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <details className="mb-4 cursor-pointer">
              <summary className="text-sm text-gray-600 hover:text-gray-800 font-semibold">
                Technical Details (for debugging)
              </summary>
              {this.state.errorInfo && (
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40 text-gray-700">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </details>

            <button
              onClick={this.resetError}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition"
            >
              Try Again
            </button>

            <button
              onClick={() => window.location.href = '/'}
              className="w-full mt-2 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition"
            >
              Go to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
