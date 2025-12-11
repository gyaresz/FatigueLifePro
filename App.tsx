import React, { useState, useEffect, useMemo } from 'react';
import { DataPoint, SnCurveParams, AnalysisParams, CalculationResults } from './types';
import { calculateFatigue } from './utils/math';
import { InputSection } from './components/InputSection';
import { ResultsSection } from './components/ResultsSection';
import { ParametersSection } from './components/ParametersSection';
import { PsdChart } from './components/PsdChart';
import { AnsysExportModal } from './components/AnsysExportModal';
import { TheoryGuideModal } from './components/TheoryGuideModal';
import { Activity, BookOpen, ChevronRight, AlertTriangle, Sparkles, ShieldAlert, FileText, HelpCircle, GraduationCap, CheckCircle2 } from 'lucide-react';

function App() {
  // Application State
  const [psdData, setPsdData] = useState<DataPoint[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showAnsysModal, setShowAnsysModal] = useState(false);
  const [showTheoryModal, setShowTheoryModal] = useState(false);
  
  // Default Params: Steel-like generic values for initial state
  const [snParams, setSnParams] = useState<SnCurveParams>({
    m: 6.4, 
    K: 1e20 // Placeholder large constant
  });
  
  const [analysisParams, setAnalysisParams] = useState<AnalysisParams>({
    exposureTime: 1,
    exposureTimeUnit: 'hours'
  });

  const [results, setResults] = useState<CalculationResults | null>(null);

  // Derived Values
  const effectiveDurationSeconds = useMemo(() => {
    const { exposureTime, exposureTimeUnit } = analysisParams;
    switch(exposureTimeUnit) {
      case 'minutes': return exposureTime * 60;
      case 'hours': return exposureTime * 3600;
      default: return exposureTime;
    }
  }, [analysisParams]);

  // Calculation Effect
  useEffect(() => {
    if (psdData.length > 1 && snParams.m > 0 && snParams.K > 0) {
      try {
        const calculated = calculateFatigue(psdData, snParams, effectiveDurationSeconds);
        setResults(calculated);
      } catch (err) {
        console.error("Calculation failed", err);
        setResults(null);
      }
    } else {
      setResults(null);
    }
  }, [psdData, snParams, effectiveDurationSeconds]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header - v1.0 RC */}
      <header className="bg-indigo-900 border-b border-indigo-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                  <h1 className="text-xl font-bold text-white tracking-tight">FatigueLife Pro</h1>
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-900/40 px-1.5 py-0.5 rounded border border-emerald-700/50">v1.0.0 RC</span>
              </div>
              <p className="text-xs text-indigo-200 font-medium">Wirsching & Light spectral fatigue method (Ansys Workbench)</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
                onClick={() => setShowTheoryModal(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-indigo-800/50 hover:bg-indigo-700 text-indigo-100 text-xs font-medium rounded-lg transition-all border border-indigo-700 hover:border-indigo-600"
             >
                <GraduationCap className="w-3.5 h-3.5" />
                Theory Guide
             </button>
             
             <button 
                onClick={() => setShowAnsysModal(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-all shadow-sm border border-indigo-500 hover:border-indigo-400"
             >
                <HelpCircle className="w-3.5 h-3.5" />
                Import Help
             </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-900/30 border border-emerald-700/50 text-emerald-200 backdrop-blur-sm">
               <CheckCircle2 className="w-3.5 h-3.5" />
               <span className="text-[10px] font-bold uppercase tracking-wide">Stable</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Data Import & Guide */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                 <div className="bg-slate-50 p-3 border-b border-slate-100 flex items-center gap-2 rounded-t-lg">
                     <FileText className="w-4 h-4 text-indigo-600"/>
                     <span className="text-xs font-bold text-slate-700 uppercase">Input Data Source</span>
                 </div>
                 <InputSection 
                    onDataLoaded={setPsdData}
                    hoveredIndex={hoveredIndex}
                    onHoverIndexChange={setHoveredIndex}
                 />
            </div>
            
            {/* Engineering Method Details */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
               <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-700" />
                    <h4 className="font-semibold text-indigo-900 text-sm">Calculation Process</h4>
                 </div>
                 <button 
                    onClick={() => setShowTheoryModal(true)}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 underline"
                 >
                    Full Guide
                 </button>
               </div>
               
               <div className="p-4 space-y-4">
                 <p className="text-xs text-slate-600 leading-relaxed">
                   This application implements the <strong>Wirsching & Light</strong> spectral fatigue method, designed to correct the conservatism of Narrow Band approximations for wide-band random processes.
                 </p>

                 <div className="space-y-3">
                    <div className="flex gap-2">
                        <div className="min-w-[16px] mt-0.5"><ChevronRight className="w-4 h-4 text-indigo-500" /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-800">1. Spectral Moments</p>
                            <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                                Calculate moments <i className="font-serif">m<sub>0</sub></i> through <i className="font-serif">m<sub>4</sub></i> from the Stress PSD curve integration.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <div className="min-w-[16px] mt-0.5"><ChevronRight className="w-4 h-4 text-indigo-500" /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-800">2. Wirsching Correction</p>
                            <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                                Apply the empirical correlation factor <i className="font-serif">λ(m, ε)</i> to account for rainflow cycles in wide-band signals:
                                <br/><span className="font-mono text-indigo-700 bg-indigo-50 px-1 rounded">D = D<sub>NB</sub> · λ</span>
                            </p>
                        </div>
                    </div>
                 </div>

                 <div className="flex items-start gap-2 bg-amber-50 text-amber-800 p-2 rounded border border-amber-100 text-[10px]">
                    <span className="font-bold text-xs">⚠️</span>
                    <span><strong>Manual Export Required:</strong> Right-click the Graph in Ansys and select 'Export to Text File'.</span>
                 </div>
               </div>
            </div>
          </div>

          {/* Right Column: Visualization, Parameters & Results */}
          <div className="lg:col-span-8 space-y-8">
            <div className="h-[400px]">
               <PsdChart 
                 data={psdData} 
                 hoveredIndex={hoveredIndex}
                 onHoverIndexChange={setHoveredIndex}
               />
            </div>

            <ParametersSection 
              currentParams={snParams}
              onParamsChange={setSnParams}
              currentAnalysis={analysisParams}
              onTimeChange={setAnalysisParams}
            />

            <ResultsSection 
              results={results} 
              snParams={snParams}
              duration={effectiveDurationSeconds}
            />
          </div>
        </div>

        {/* Modals */}
        {showAnsysModal && (
            <AnsysExportModal onClose={() => setShowAnsysModal(false)} />
        )}
        {showTheoryModal && (
            <TheoryGuideModal onClose={() => setShowTheoryModal(false)} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
                <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
                    <span className="font-medium text-slate-700">Created by Attila Péter Gyarmati</span>
                    <span className="hidden sm:inline text-slate-300">|</span>
                    <span className="flex items-center gap-1">
                        with <Sparkles className="w-3 h-3 text-indigo-500" /> <span className="font-semibold text-indigo-600">Gemini 3.0 Pro</span>
                    </span>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span className="font-medium">Use own risk</span>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}

export default App;