import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

function RiskIndicator({ riskScore, riskLevel, riskColor }) {
  const getRiskIcon = () => {
    if (riskLevel === 'LOW') return <CheckCircle className="w-12 h-12 text-green-500" />;
    if (riskLevel === 'MEDIUM') return <AlertCircle className="w-12 h-12 text-yellow-500" />;
    return <AlertCircle className="w-12 h-12 text-red-500" />;
  };

  const getRiskMessage = () => {
    if (riskLevel === 'LOW') return '✅ Low Risk - Good farming conditions';
    if (riskLevel === 'MEDIUM') return '⚠️ Moderate Risk - Enhanced monitoring needed';
    return '🚨 High Risk - Immediate action required';
  };

  const getProgressColor = () => {
    if (riskLevel === 'LOW') return 'bg-green-500';
    if (riskLevel === 'MEDIUM') return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div
      className="rounded-lg shadow-lg p-8 text-center text-white"
      style={{ backgroundColor: riskColor || '#22c55e' }}
    >
      <div className="flex justify-center mb-4">
        {getRiskIcon()}
      </div>

      <div className="mb-4">
        <p className="text-sm opacity-90 mb-2">Current Risk Level</p>
        <p className="text-5xl font-bold">{riskScore.toFixed(1)}%</p>
        <p className="text-lg font-semibold mt-2">{riskLevel}</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="bg-white bg-opacity-30 rounded-full h-3 overflow-hidden">
          <div
            className={`${getProgressColor()} h-full transition-all duration-500`}
            style={{ width: `${riskScore}%` }}
          />
        </div>
      </div>

      <p className="text-sm">{getRiskMessage()}</p>
    </div>
  );
}

export default RiskIndicator;
