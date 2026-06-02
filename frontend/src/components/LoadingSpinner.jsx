import React from 'react';

function LoadingSpinner({ message = 'Loading...', fullScreen = false }) {
  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-green-100">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <span className="text-6xl inline-block">🌾</span>
          </div>
          <p className="text-xl font-semibold text-gray-800">{message}</p>
          <p className="text-sm text-gray-600 mt-2">Please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <div className="animate-spin mb-2">
          <span className="text-4xl inline-block">🌾</span>
        </div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

export default LoadingSpinner;
