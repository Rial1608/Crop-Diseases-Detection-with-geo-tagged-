import React from 'react';
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Zap,
  Droplets,
} from 'lucide-react';

/* ── Format raw class name → human readable ──────────────────────────────── */
function formatDiseaseName(raw) {
  if (!raw) return 'Unknown';
  // "Apple___Apple_scab" → "Apple Scab (Apple)"
  const parts = raw.split('___');
  if (parts.length > 1) {
    const crop = parts[0].replace(/[_,]+/g, ' ').trim();
    const disease = parts[1].replace(/[_]+/g, ' ').trim();
    return `${disease} (${crop})`;
  }
  return raw.replace(/[_]+/g, ' ');
}

function ResultCard({ result, loading }) {
  /* ── Loading state ──────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Analyzing image…</h3>
        <p className="text-sm text-gray-600">
          Our AI is examining your plant image for disease indicators
        </p>
      </div>
    );
  }

  if (!result) return null;

  const { prediction, disease_info, risk_analysis, warning } = result;
  const isHealthy = !prediction?.is_diseased;
  const isUncertain = prediction?.is_uncertain;
  const confidence = prediction?.confidence ?? 0;
  const displayName =
    disease_info?.name || formatDiseaseName(prediction?.disease_class || prediction?.disease_name);

  return (
    <div className="space-y-4 animate-fadeInUp">
      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm ${
          isHealthy
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {isHealthy ? (
            <>
              <ShieldCheck size={18} />
              Healthy Plant
            </>
          ) : (
            <>
              <ShieldAlert size={18} />
              Disease Detected
            </>
          )}
        </div>
      </div>

      {/* Uncertainty Warning */}
      {isUncertain && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-900">Low Confidence Detection</p>
            <p className="text-sm text-yellow-800 mt-1">
              Confidence is {confidence.toFixed(1)}%. Please upload a clearer image for better results.
            </p>
          </div>
        </div>
      )}

      {/* Main Result Card */}
      <div className={`bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-6 ${
        isHealthy ? 'border-green-200' : 'border-red-200'
      }`}>
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            {isHealthy ? (
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{displayName}</h2>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Confidence</p>
                <p className="text-2xl font-bold text-gray-900">{confidence.toFixed(1)}%</p>
              </div>
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isHealthy ? 'bg-green-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${Math.min(confidence, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Analysis */}
      {risk_analysis && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Risk Analysis
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">
                Overall Risk
              </p>
              <p className="text-3xl font-bold text-orange-600">
                {(risk_analysis.risk_score ?? 0).toFixed(0)}%
              </p>
              <p className="text-xs text-orange-700 font-medium mt-1">
                {risk_analysis.risk_level || 'UNKNOWN'}
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                Weather Risk
              </p>
              <p className="text-3xl font-bold text-blue-600">
                {(risk_analysis.component_scores?.weather_risk ?? 0).toFixed(0)}%
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">
                Location Risk
              </p>
              <p className="text-3xl font-bold text-purple-600">
                {(risk_analysis.component_scores?.location_risk ?? 0).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Disease Details */}
      {disease_info && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Details Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-green-600" />
              Disease Details
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  Causes
                </p>
                <p className="text-sm text-gray-700">{disease_info.causes}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  Symptoms
                </p>
                <p className="text-sm text-gray-700">{disease_info.symptoms}</p>
              </div>
            </div>
          </div>

          {/* Risk Factors Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-600" />
              Risk Factors
            </h3>
            <ul className="space-y-2">
              {disease_info.risk_factors?.map((f, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-green-600 font-bold">•</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Prevention & Treatment */}
      {disease_info && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Prevention Card */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-4">🛡️ Prevention</h3>
            <ul className="space-y-2">
              {disease_info.prevention?.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-blue-800">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Treatment Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-green-900 mb-4">🌿 Treatment</h3>
            <ul className="space-y-2">
              {disease_info.treatment?.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-green-800">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Recommendation */}
      {risk_analysis?.recommendation && (
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-2xl shadow-md p-6 text-white">
          <h3 className="text-lg font-bold mb-3">📋 Recommendation</h3>
          <p className="text-sm mb-4 leading-relaxed">{risk_analysis.recommendation}</p>
          {risk_analysis.next_steps && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Next Steps:</p>
              <ul className="space-y-1">
                {risk_analysis.next_steps.map((s, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span>→</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ResultCard;
