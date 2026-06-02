import React from 'react';
import Sidebar from '../components/Sidebar';
import { BarChart3 } from 'lucide-react';

function Analytics() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64 flex-1 p-8">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
            <p className="text-gray-600">Coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
