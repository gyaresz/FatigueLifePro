import React, { useState, useEffect } from 'react';
import { SnCurveParams, AnalysisParams } from '../types';
import { Calculator, ArrowRight, Clock, Settings, RotateCcw, AlertTriangle, Scale } from 'lucide-react';
import { calculateBasquinParams, calculateBasquinRegression, generateSnCurveData } from '../utils/math';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Scatter } from 'recharts';

interface ParametersSectionProps {
  currentParams: SnCurveParams;
  onParamsChange: (params: SnCurveParams) => void;
  currentAnalysis: AnalysisParams;
  onTimeChange: (params: AnalysisParams) => void;
}

export const ParametersSection: React.FC<ParametersSectionProps> = ({
  currentParams,
  onParamsChange,
  currentAnalysis,
  onTimeChange,
}) => {
  // Calculator State
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcMode, setCalcMode] = useState<'material' | 'table'>('material');
  
  // Mode: Material
  const [calcRm, setCalcRm] = useState<string>("460"); 
  const [calcSe, setCalcSe] = useState<string>("");    

  // Mode: Table (Multi-point)
  const [tableInput, setTableInput] = useState<string>("1000, 414\n10000, 350\n100000, 290\n1000000, 230");
  const [tableError, setTableError] = useState<string | null>(null);

  // Chart Data State
  const [snPlotData, setSnPlotData] = useState<any[]>([]);
  const [inputPointsData, setInputPointsData] = useState<any[]>([]);

  const loadAnsysStructuralSteel = () => {
      setCalcRm("460"); 
      setCalcSe(""); 
      setCalcMode('material');
  };

  // Update Chart Data whenever calculator inputs change
  useEffect(() => {
    try {
        let m, K;
        let points: {cycles: number, stress: number}[] = [];

        if (calcMode === 'material') {
             const Rm = parseFloat(calcRm);
             const Se = calcSe ? parseFloat(calcSe) : undefined;
             if (!isNaN(Rm) && Rm > 0) {
                 const res = calculateBasquinParams(Rm, Se);
                 m = res.m; K = res.K;
             }
             setInputPointsData([]);
        } else {
             // Parse Table Input
             const lines = tableInput.trim().split(/\n/);
             const parsedPoints: {cycles: number, stress: number}[] = [];
             
             for (const line of lines) {
                 const parts = line.split(/[,\t; ]+/).filter(p => p.trim() !== "");
                 if (parts.length >= 2) {
                     const N = parseFloat(parts[0]);
                     const S = parseFloat(parts[1]);
                     if (!isNaN(N) && !isNaN(S) && N > 0 && S > 0) {
                         parsedPoints.push({ cycles: N, stress: S });
                     }
                 }
             }

             if (parsedPoints.length >= 2) {
                 try {
                     const res = calculateBasquinRegression(parsedPoints);
                     m = res.m; K = res.K;
                     setTableError(null);
                     setInputPointsData(parsedPoints);
                 } catch (err) {
                     setTableError("Regression failed. Ensure data is valid.");
                 }
             } else {
                 // Not enough points yet, clear chart
             }
        }

        if (m && K) {
            const curveData = generateSnCurveData(m, K);
            setSnPlotData(curveData);
        } else {
            setSnPlotData([]);
        }
    } catch (e) {
        setSnPlotData([]);
    }
  }, [calcMode, calcRm, calcSe, tableInput]);

  const handleCalculate = () => {
    try {
        let m, K;
        if (calcMode === 'material') {
            const Rm = parseFloat(calcRm);
            const Se = calcSe ? parseFloat(calcSe) : undefined;
            if (isNaN(Rm) || Rm <= 0) throw new Error("Invalid Rm");
            const res = calculateBasquinParams(Rm, Se);
            m = res.m; K = res.K;
        } else {
             const lines = tableInput.trim().split(/\n/);
             const parsedPoints: {cycles: number, stress: number}[] = [];
             for (const line of lines) {
                 const parts = line.split(/[,\t; ]+/).filter(p => p.trim() !== "");
                 if (parts.length >= 2) {
                     const N = parseFloat(parts[0]);
                     const S = parseFloat(parts[1]);
                     if (!isNaN(N) && !isNaN(S) && N > 0 && S > 0) parsedPoints.push({ cycles: N, stress: S });
                 }
             }
             if (parsedPoints.length < 2) throw new Error("Need at least 2 valid points.");
             const res = calculateBasquinRegression(parsedPoints);
             m = res.m; K = res.K;
        }

        onParamsChange({ m, K });
    } catch (e) {
        alert("Calculation error. Check your inputs.");
    }
  };

  return (
    <div className="space-y-6">
        {/* Main Control Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-600" />
                    <h2 className="font-semibold text-slate-800">Analysis Configuration</h2>
                </div>
                <button 
                    onClick={() => setShowCalculator(!showCalculator)}
                    className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md border transition-colors ${
                        showCalculator 
                        ? "bg-indigo-600 text-white border-indigo-600" 
                        : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                    }`}
                >
                    <Calculator className="w-3.5 h-3.5" />
                    {showCalculator ? "Hide Calculator" : "S-N Calculator"}
                </button>
            </div>

            <div className="p-6">
                
                {/* Unit Safety Warning */}
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
                    <Scale className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-xs font-bold text-amber-900 uppercase">Engineering Check: Units</h4>
                        <p className="text-xs text-amber-800 mt-1">
                            Ensure your <strong>Input PSD</strong> and <strong>S-N Parameters</strong> use the SAME unit system (e.g., MPa and MPa).
                            <br/>
                            <span className="opacity-80 italic">Common Error: Ansys exports in Pa, but S-N is in MPa. This causes massive errors.</span>
                        </p>
                    </div>
                </div>

                {/* Calculator Section (Expandable) */}
                {showCalculator && (
                    <div className="mb-8 bg-slate-50 rounded-xl border border-indigo-100 overflow-hidden shadow-inner animate-in fade-in slide-in-from-top-4">
                        <div className="flex border-b border-indigo-100">
                            <button 
                                onClick={() => setCalcMode('material')}
                                className={`flex-1 py-3 text-sm font-medium transition-colors ${calcMode === 'material' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            >
                                Estimate from Material
                            </button>
                            <button 
                                onClick={() => setCalcMode('table')}
                                className={`flex-1 py-3 text-sm font-medium transition-colors ${calcMode === 'table' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            >
                                Table Input & Regression
                            </button>
                        </div>
                        
                        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left: Inputs */}
                            <div className="space-y-6">
                                {calcMode === 'material' ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-sm font-semibold text-indigo-900">Shigley Approximation</h3>
                                            <button 
                                                onClick={loadAnsysStructuralSteel}
                                                className="text-xs flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded hover:bg-slate-100 text-slate-600 transition-colors"
                                            >
                                                <RotateCcw className="w-3 h-3"/> Reset to Structural Steel
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-indigo-800 mb-1">Ultimate Strength (Rm) [MPa]</label>
                                                <input
                                                    type="number"
                                                    value={calcRm}
                                                    onChange={(e) => setCalcRm(e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-indigo-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-indigo-800 mb-1">Endurance Limit (Se) [MPa]</label>
                                                <input
                                                    type="number"
                                                    value={calcSe}
                                                    onChange={(e) => setCalcSe(e.target.value)}
                                                    placeholder="Default: 0.5 * Rm"
                                                    className="w-full px-3 py-2 text-sm border border-indigo-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 italic bg-white p-3 rounded border border-indigo-50">
                                            ℹ️ Estimates parameters using two points: <br/>
                                            1. (N=10³, S=0.9·Rm)<br/>
                                            2. (N=10⁶, S=Se)
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-sm font-semibold text-indigo-900">Multi-Point Curve Fitting</h3>
                                            <span className="text-[10px] text-slate-500 bg-white px-2 py-1 rounded border">Best Fit (Least Squares)</span>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="block text-[10px] text-slate-600 uppercase tracking-wide">
                                                Paste S-N Data (Cycles, Alternating Stress [MPa])
                                            </label>
                                            <textarea 
                                                value={tableInput}
                                                onChange={(e) => setTableInput(e.target.value)}
                                                rows={6}
                                                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                                placeholder={`1000, 400\n10000, 350\n...`}
                                            />
                                            <p className="text-[10px] text-slate-500">
                                                Format: <code>Cycles, Alternating Stress</code> (comma or tab separated). 
                                                The tool will calculate the best fitting straight line (log-log) required for the Wirsching method.
                                            </p>
                                            {tableError && (
                                                <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {tableError}</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <button 
                                    onClick={handleCalculate}
                                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-3 rounded-lg shadow-sm transition-all active:scale-[0.99]"
                                >
                                    Apply Calculated Parameters <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Right: Visualization */}
                            <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col h-[300px]">
                                <h4 className="text-xs uppercase font-bold text-slate-400 mb-4 text-center">Calculated S-N Curve Preview</h4>
                                <div className="flex-1 w-full min-h-0">
                                    {snPlotData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                <XAxis 
                                                    dataKey="cycles" 
                                                    type="number" 
                                                    scale="log" 
                                                    domain={['auto', 'auto']}
                                                    tick={{fontSize: 10, fill: '#64748b'}}
                                                    tickFormatter={(val) => val.toExponential(0)}
                                                    label={{ value: 'log N', position: 'bottom', offset: 0, fontSize: 10 }}
                                                    allowDataOverflow
                                                />
                                                <YAxis 
                                                    dataKey="stress"
                                                    type="number"
                                                    scale="log" 
                                                    domain={['auto', 'auto']}
                                                    tick={{fontSize: 10, fill: '#64748b'}}
                                                    label={{ value: 'Alternating Stress (S) [MPa]', angle: -90, position: 'insideLeft', fontSize: 10 }}
                                                    allowDataOverflow
                                                />
                                                <Tooltip 
                                                    contentStyle={{fontSize: '12px'}}
                                                    formatter={(val: number, name: string) => [val.toFixed(1) + ' MPa', name]}
                                                    labelFormatter={(val) => `N: ${Number(val).toExponential(2)}`}
                                                />
                                                {/* The Fitted Line */}
                                                <Line 
                                                    data={snPlotData}
                                                    type="monotone" 
                                                    dataKey="stress" 
                                                    stroke="#4f46e5" 
                                                    strokeWidth={2} 
                                                    dot={false}
                                                    name="Fitted"
                                                />
                                                {/* The Input Points (Scatter) */}
                                                {inputPointsData.length > 0 && (
                                                    <Scatter 
                                                        data={inputPointsData} 
                                                        fill="#ef4444" 
                                                        line={false}
                                                        shape="circle"
                                                        name="Input"
                                                    />
                                                )}
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                                            <Calculator className="w-8 h-8 opacity-20"/>
                                            <span className="text-xs">Enter material data to visualize curve</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Applied Parameters Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Fatigue Slope */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">Slope (m)</label>
                        <div className="relative">
                            <input
                                type="number"
                                step="0.01"
                                value={currentParams.m}
                                onChange={(e) => onParamsChange({...currentParams, m: parseFloat(e.target.value) || 0})}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-slate-900"
                            />
                        </div>
                        <p className="text-xs text-slate-500">S-N curve inverse slope.</p>
                    </div>

                    {/* Fatigue Constant */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">Constant (K)</label>
                        <div className="relative">
                            <input
                                type="number"
                                step="any"
                                value={currentParams.K}
                                onChange={(e) => onParamsChange({...currentParams, K: parseFloat(e.target.value) || 0})}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-slate-900"
                            />
                        </div>
                        <p className="text-xs text-slate-500">Basquin equation constant (N &middot; S<sup>m</sup> = K).</p>
                    </div>

                    {/* Exposure Time */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 flex items-center gap-1">
                             <Clock className="w-3.5 h-3.5" /> Exposure Duration
                        </label>
                        <div className="flex rounded-lg shadow-sm">
                            <input
                                type="number"
                                value={currentAnalysis.exposureTime}
                                onChange={(e) => onTimeChange({...currentAnalysis, exposureTime: parseFloat(e.target.value) || 0})}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-slate-900 border-r-0"
                            />
                            <select 
                                value={currentAnalysis.exposureTimeUnit}
                                onChange={(e) => onTimeChange({...currentAnalysis, exposureTimeUnit: e.target.value as any})}
                                className="bg-slate-100 border border-slate-300 text-slate-700 text-sm rounded-r-lg focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2.5 font-medium"
                            >
                                <option value="seconds">Sec</option>
                                <option value="minutes">Min</option>
                                <option value="hours">Hr</option>
                            </select>
                        </div>
                        <p className="text-xs text-slate-500">Time to calculate damage for.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};