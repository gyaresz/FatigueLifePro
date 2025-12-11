import React, { useState } from 'react';
import { X, Check, Copy, MousePointer2, AlertTriangle, Terminal, ChevronDown, ChevronUp, FileText, HelpCircle, Code, Info, ScanLine, Layers } from 'lucide-react';

interface AnsysExportModalProps {
  onClose: () => void;
}

export const AnsysExportModal: React.FC<AnsysExportModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'act'>('manual');
  const [copied, setCopied] = useState(false);

  // Python Content (Logic) - v22.0 (Diagnostic / Legacy)
  const pythonLegacyExport = `
# FatigueLife Pro - Simple Export Script
# Use this for older Ansys versions (<2023) to export CSV automatically.

import os

try:
    # Attempt Standard Export
    target = ExtAPI.DataModel.Tree.ActiveObjects[0]
    path = System.IO.Path.Combine(System.IO.Path.GetTempPath(), "flp_export.txt")
    
    if hasattr(target, "ExportToTextFile"):
        target.ExportToTextFile(path)
        print("Export Success to: " + path)
    elif hasattr(target, "Result") and hasattr(target.Result, "ExportToTextFile"):
        target.Result.ExportToTextFile(path)
        print("Result Export Success to: " + path)
    else:
        print("Please select a valid Result object first.")

except Exception as e:
    print("Error: " + str(e))
`;

  // Full Native Calculation Script for ACT App Builder
  const pythonNativeAct = `
# ---------------------------------------------------------
# FATIGUELIFE PRO - NATIVE ANSYS ACT SCRIPT
# Copy this into ACT App Builder > Code Section
# ---------------------------------------------------------
import math

def gamma_function(z):
    # Lanczos approximation for Gamma function (IronPython compatible)
    if z < 0.5: return math.pi / (math.sin(math.pi * z) * gamma_function(1 - z))
    z -= 1
    x = 0.99999999999980993
    p = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]
    for i in range(len(p)): x += p[i] / (z + i + 1)
    t = z + len(p) - 0.5
    return math.sqrt(2 * math.pi) * math.pow(t, z + 0.5) * math.exp(-t) * x

def calculate():
    # --- USER PARAMETERS ---
    m = 6.4         # S-N Slope
    K = 1e20        # S-N Constant
    T_hours = 1.0   # Exposure Time in Hours
    # -----------------------

    try:
        # 1. Get Data from Selected Object (RPSD Stress)
        obj = ExtAPI.DataModel.Tree.ActiveObjects[0]
        if not obj.Name.Contains("PSD"):
            print("Error: Please select a Response PSD Stress result.")
            return

        # Fetch plot data
        plot = obj.Result.PlotData
        freqs = plot["Frequency"]
        psd_vals = plot["Amplitude"] # Ensure this is Stress^2/Hz
        
        # 2. Calculate Moments
        m0, m1, m2, m4 = 0.0, 0.0, 0.0, 0.0
        
        for i in range(len(freqs) - 1):
            f1, g1 = freqs[i], psd_vals[i]
            f2, g2 = freqs[i+1], psd_vals[i+1]
            df = f2 - f1
            
            # Trapezoidal integration
            m0 += 0.5 * (g1 + g2) * df
            m1 += 0.5 * (f1*g1 + f2*g2) * df
            m2 += 0.5 * (f1**2*g1 + f2**2*g2) * df
            m4 += 0.5 * (f1**4*g1 + f2**4*g2) * df

        # 3. Stats
        rms = math.sqrt(m0)
        v0 = math.sqrt(m2/m0) # Zero crossings
        ep = math.sqrt(m4/m2) # Peaks
        gamma_val = v0/ep
        epsilon = math.sqrt(1 - gamma_val**2)
        
        # 4. Damage (Wirsching)
        T_sec = T_hours * 3600
        D_NB = (v0 * T_sec / K) * math.pow(math.sqrt(2), m) * gamma_function(1 + m/2.0) * math.pow(rms, m)
        
        # Wirsching Correction
        a = 0.926 - 0.033 * m
        b = 1.587 * m - 2.323
        lambda_w = a + (1 - a) * math.pow(1 - epsilon, b)
        D_W = D_NB * lambda_w
        
        Life_Hours = (1.0 / D_W) * T_hours

        # 5. Output
        msg = "--- FATIGUE RESULTS ---\\n"
        msg += "RMS Stress: {:.2f} MPa\\n".format(rms)
        msg += "Zero Crossings: {:.2f} Hz\\n".format(v0)
        msg += "Spectral Width (eps): {:.4f}\\n".format(epsilon)
        msg += "-----------------------\\n"
        msg += "Damage (Wirsching): {:.4e}\\n".format(D_W)
        msg += "Life (Hours): {:.2e}".format(Life_Hours)
        
        System.Windows.Forms.MessageBox.Show(msg, "FatigueLife Pro Calc")
        
    except Exception as ex:
        System.Windows.Forms.MessageBox.Show(str(ex), "Error")

calculate()
`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-xl">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-600 p-2 rounded-lg shadow-sm">
                <FileText className="w-5 h-5 text-white" />
             </div>
             <div>
                <h2 className="text-lg font-bold text-slate-900">Import & Calculation Options</h2>
                <p className="text-xs text-slate-500">Choose how you want to process your data</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
            <button 
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'manual' ? 'border-b-2 border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Option A: Manual Export (Recommended)
            </button>
            <button 
                onClick={() => setActiveTab('act')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'act' ? 'border-b-2 border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Option B: ACT Native Script
            </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow">
          
          {activeTab === 'manual' && (
              <div className="space-y-6 animate-in slide-in-from-left-2">
                 
                 {/* PRO TIP: How to get MAX PSD */}
                 <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3 shadow-sm">
                     <AlertTriangle className="w-5 h-5 text-amber-600 mt-1 shrink-0" />
                     <div className="space-y-2">
                         <h4 className="text-sm font-bold text-amber-900">WARNING: Avoid Stress Singularities</h4>
                         <p className="text-xs text-amber-800 leading-relaxed">
                             A single node in a sharp corner can report infinite stress (Singularity). Using this "Max" value leads to incorrect, near-zero fatigue life.
                         </p>
                         <div className="bg-white/60 p-3 rounded border border-amber-200 mt-2">
                             <p className="text-xs font-bold text-amber-900 mb-1 flex items-center gap-1">
                                 <ScanLine className="w-3.5 h-3.5"/>
                                 Recommended Solution: Hotspot Averaging
                             </p>
                             <ul className="list-disc pl-4 text-[11px] text-amber-800 space-y-1">
                                 <li>Do <strong>not</strong> just pick "Max over All Bodies".</li>
                                 <li>Create a <strong>Named Selection</strong> of the critical face or a group of nodes around the hotspot.</li>
                                 <li>In the Response PSD, scope to this Named Selection.</li>
                                 <li>Change Result Type to <strong>Average</strong> (or spatial average).</li>
                             </ul>
                             <p className="text-[10px] italic mt-2 text-amber-700">This smooths out numerical artifacts while keeping the physical stress concentration.</p>
                         </div>
                     </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <MousePointer2 className="w-4 h-4 text-indigo-600" />
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Standard Procedure</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all">
                            <div className="absolute top-0 left-0 bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-br group-hover:bg-indigo-600 group-hover:text-white transition-colors">STEP 1</div>
                            <p className="mt-3 text-sm font-medium text-slate-900">Define Scope</p>
                            <p className="text-xs text-slate-500 mt-1">Insert <strong>Response PSD</strong>. Scope to your critical <strong>Named Selection</strong> (Face/Nodes) to avoid singularities.</p>
                        </div>

                        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all">
                            <div className="absolute top-0 left-0 bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-br group-hover:bg-indigo-600 group-hover:text-white transition-colors">STEP 2</div>
                            <p className="mt-3 text-sm font-medium text-slate-900">Right-Click Chart</p>
                            <p className="text-xs text-slate-500 mt-1">Right-click directly on the <strong>Graph/Plot area</strong> (the white space) in Ansys.</p>
                        </div>

                        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all">
                            <div className="absolute top-0 left-0 bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-br group-hover:bg-indigo-600 group-hover:text-white transition-colors">STEP 3</div>
                            <p className="mt-3 text-sm font-medium text-slate-900">Export File</p>
                            <p className="text-xs text-slate-500 mt-1">Select <strong>"Export to Text File"</strong>. Save as .txt or .csv.</p>
                        </div>

                        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all">
                            <div className="absolute top-0 left-0 bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-br group-hover:bg-indigo-600 group-hover:text-white transition-colors">STEP 4</div>
                            <p className="mt-3 text-sm font-medium text-slate-900">Drag & Drop</p>
                            <p className="text-xs text-slate-500 mt-1">Drag the saved file into the <strong>Import Box</strong> on the left.</p>
                        </div>
                    </div>
                 </div>

                 <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-bold text-indigo-900">Note on Ansys 2024/2025</h3>
                            <p className="text-xs text-indigo-800 mt-1">
                                Newer versions have blocked automated export scripts ("Reflection Access Denied"). This manual export method works 100% of the time.
                            </p>
                        </div>
                    </div>
                 </div>
              </div>
          )}

          {activeTab === 'act' && (
              <div className="space-y-4 animate-in slide-in-from-right-2">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                          <Code className="w-5 h-5 text-indigo-600" />
                          <h3 className="font-bold text-slate-800">Use ACT App Builder</h3>
                      </div>
                      <p className="text-xs text-slate-600 mb-3">
                          Since you have ACT App Builder open, you can paste this code directly into the "Code" window (as seen in your screenshot). This will perform the Wirsching calculation <strong>inside Ansys</strong> without needing to export files.
                      </p>
                      <ol className="list-decimal pl-4 text-xs text-slate-600 space-y-1">
                          <li>In Ansys, select the <strong>Response PSD</strong> result you want to analyze.</li>
                          <li>Open ACT App Builder (or the Ansys Scripting Console).</li>
                          <li>Paste the code below into the editor.</li>
                          <li>Click Run / Execute.</li>
                      </ol>
                  </div>

                  <div className="relative">
                    <div className="absolute top-2 right-2 z-10">
                        <button 
                            onClick={() => handleCopy(pythonNativeAct)}
                            className="text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3 py-1.5 rounded flex items-center gap-2 transition-colors backdrop-blur-md"
                        >
                            {copied ? <Check className="w-3 h-3 text-green-400"/> : <Copy className="w-3 h-3"/>}
                            {copied ? 'Copied' : 'Copy Python Code'}
                        </button>
                    </div>
                    <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-700 shadow-inner">
                        <div className="px-4 py-2 bg-slate-800 border-b border-slate-700 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-xs text-slate-400 font-mono ml-2">act_calculation.py</span>
                        </div>
                        <pre className="p-4 text-xs font-mono text-indigo-100 overflow-x-auto h-64">
                            {pythonNativeAct}
                        </pre>
                    </div>
                  </div>
              </div>
          )}

        </div>
        
        <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end">
            <button 
                onClick={onClose}
                className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-500 transition-colors shadow-sm"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};