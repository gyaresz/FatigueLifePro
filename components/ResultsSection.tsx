import React, { useState } from 'react';
import { CalculationResults, SnCurveParams } from '../types';
import { Activity, Waves, Clock, AlertTriangle, Bot, Sigma, FunctionSquare, FileText, Download } from 'lucide-react';
import { generateEngineeringReport } from '../services/geminiService';
import { generatePdfReport } from '../services/reportService';
import ReactMarkdown from 'react-markdown';

interface ResultsSectionProps {
  results: CalculationResults | null;
  snParams: SnCurveParams;
  duration: number;
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({ results, snParams, duration }) => {
  const [report, setReport] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!results) {
    return (
      <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
        <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900">Ready to Calculate</h3>
        <p className="text-slate-500 mt-2">Upload data and set parameters to see fatigue life estimation.</p>
      </div>
    );
  }

  const formatLife = (seconds: number) => {
    if (seconds === Infinity) return "Infinite";
    
    // Safety check for extremely large numbers (likely infinite in practice)
    if (seconds > 3.154e10) return "> 1000 Years"; 

    // Helper to format large hours with thousands separator
    const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 1 });

    if (seconds < 60) return `${seconds.toFixed(1)} sec`;
    if (seconds < 3600) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}m ${secs}s`;
    }
    if (seconds < 86400 * 3) { // Less than 3 days, show detailed hours
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${mins}m`;
    }
    
    // Large hours
    const hours = seconds / 3600;
    return `${fmt(hours)} Hours`;
  };

  const handleAiAnalysis = async () => {
    setLoadingReport(true);
    setError(null);
    try {
      const text = await generateEngineeringReport(results, snParams, duration);
      setReport(text);
    } catch (e) {
      setError("Could not generate report. Check API Key configuration.");
    } finally {
      setLoadingReport(false);
    }
  };

  const handleDownloadPdf = () => {
    generatePdfReport(results, snParams, duration);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex justify-end">
          <button 
             onClick={handleDownloadPdf}
             className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded-lg hover:bg-slate-700 transition-all shadow-md active:scale-95"
          >
             <FileText className="w-4 h-4" />
             Download Engineering Report (.pdf)
          </button>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-indigo-600 rounded-xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-indigo-100 font-medium">Fatigue Life (Wirsching)</h3>
                <Clock className="w-6 h-6 text-indigo-200" />
            </div>
            <div className="text-3xl font-bold tracking-tight">{formatLife(results.wirschingLifeSeconds)}</div>
            <div className="mt-4 pt-4 border-t border-indigo-500 flex justify-between items-center">
                <span className="text-sm text-indigo-200">Total Damage (D):</span>
                <span className="font-mono font-bold text-lg">{results.wirschingDamage.toExponential(3)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
           <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium">RMS Stress</h3>
            <Waves className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{results.rmsStress.toFixed(2)} <span className="text-lg font-medium text-slate-500">MPa</span></div>
          <div className="text-sm text-slate-500 mt-2">1σ Value (Area under PSD)</div>
        </div>
      </div>

      {/* Engineering Details (Formulas & Moments) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <FunctionSquare className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-800">Spectral Moments Breakdown</h3>
        </div>
        
        <div className="p-6">
            <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                        <th className="px-4 py-2 font-medium">Moment</th>
                        <th className="px-4 py-2 font-medium">Value</th>
                        <th className="px-4 py-2 font-medium">Description</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    <tr>
                        <td className="px-4 py-2 font-serif italic text-slate-800">m<sub>0</sub></td>
                        <td className="px-4 py-2 font-mono text-indigo-700">{results.m0.toExponential(4)}</td>
                        <td className="px-4 py-2 text-slate-500">Variance (Area)</td>
                    </tr>
                    <tr>
                        <td className="px-4 py-2 font-serif italic text-slate-800">m<sub>1</sub></td>
                        <td className="px-4 py-2 font-mono text-indigo-700">{results.m1.toExponential(4)}</td>
                        <td className="px-4 py-2 text-slate-500">Centroid</td>
                    </tr>
                    <tr>
                        <td className="px-4 py-2 font-serif italic text-slate-800">m<sub>2</sub></td>
                        <td className="px-4 py-2 font-mono text-indigo-700">{results.m2.toExponential(4)}</td>
                        <td className="px-4 py-2 text-slate-500">Radius of Gyration (used for &nu;<sub>0</sub>)</td>
                    </tr>
                    <tr>
                        <td className="px-4 py-2 font-serif italic text-slate-800">m<sub>4</sub></td>
                        <td className="px-4 py-2 font-mono text-indigo-700">{results.m4.toExponential(4)}</td>
                        <td className="px-4 py-2 text-slate-500">Used for Peak rate (E[P])</td>
                    </tr>
                </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
           <Sigma className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-800">Spectral Statistics</h3>
        </div>
        <div className="grid grid-cols-2 divide-x divide-slate-100">
          <div className="p-4 space-y-4">
             <div>
               <p className="text-xs text-slate-500 uppercase tracking-wide">Zero Crossings (&nu;<sub>0</sub>)</p>
               <p className="text-lg font-mono text-slate-800">{results.expectedZeroCrossings.toFixed(2)} Hz</p>
             </div>
             <div>
               <p className="text-xs text-slate-500 uppercase tracking-wide">Expected Peaks (E[P])</p>
               <p className="text-lg font-mono text-slate-800">{results.expectedPeaks.toFixed(2)} Hz</p>
             </div>
          </div>
          <div className="p-4 space-y-4">
             <div>
               <p className="text-xs text-slate-500 uppercase tracking-wide">Spectral Width (&epsilon;)</p>
               <p className="text-lg font-mono text-slate-800">{results.spectralWidth.toFixed(4)}</p>
             </div>
             <div>
               <p className="text-xs text-slate-500 uppercase tracking-wide">Wirsching Correction (&lambda;)</p>
               <p className="text-lg font-mono text-slate-800">{(results.wirschingDamage / results.narrowBandDamage).toFixed(3)}</p>
             </div>
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-lg border border-slate-700 text-white overflow-hidden">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-400" />
                <h3 className="font-semibold">AI Engineering Assistant</h3>
            </div>
            {!report && (
                <button 
                    onClick={handleAiAnalysis}
                    disabled={loadingReport}
                    className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-3 py-1.5 rounded transition-colors"
                >
                    {loadingReport ? 'Thinking...' : 'Analyze Results'}
                </button>
            )}
        </div>
        <div className="p-6">
            {error && <p className="text-red-400 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> {error}</p>}
            {!report && !loadingReport && !error && (
                <p className="text-slate-400 text-sm">Click "Analyze Results" to get an AI-generated interpretation of these fatigue parameters using the Gemini model.</p>
            )}
            {loadingReport && (
                <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                    <div className="h-4 bg-slate-700 rounded w-5/6"></div>
                </div>
            )}
            {report && (
                <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{report}</ReactMarkdown>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};