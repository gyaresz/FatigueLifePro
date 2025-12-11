import React from 'react';
import { X, BookOpen, Sigma, Divide, FunctionSquare, AlertTriangle, Crosshair, Scale, Map } from 'lucide-react';

interface TheoryGuideModalProps {
  onClose: () => void;
}

export const TheoryGuideModal: React.FC<TheoryGuideModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-xl">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-600 p-2 rounded-lg shadow-sm">
                <BookOpen className="w-5 h-5 text-white" />
             </div>
             <div>
                <h2 className="text-lg font-bold text-slate-900">Engineering Theory Guide</h2>
                <p className="text-xs text-slate-500">Spectral Fatigue Analysis Methodology (Wirsching & Light)</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto space-y-10 text-slate-800 leading-relaxed">
          
          {/* Section 1: Introduction */}
          <section>
            <h3 className="text-lg font-bold text-indigo-900 border-b border-indigo-100 pb-2 mb-4">1. Frequency Domain Fatigue Overview</h3>
            <p className="text-sm text-slate-600 mb-4">
              When a component is subjected to random vibration (defined by a Power Spectral Density, PSD), stress cycles do not follow a constant amplitude. 
              Instead of time-domain rainflow counting (which is computationally expensive for long signals), we use **Spectral Moments** to estimate the probability distribution of stress peaks.
            </p>
          </section>

          {/* Section 2: Spectral Moments */}
          <section>
            <div className="flex items-center gap-2 mb-4">
                <Sigma className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-indigo-900">2. Spectral Moments (mₙ)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="text-sm text-slate-600 space-y-2">
                    <p>The properties of the random signal are derived from the moments of the PSD area. The n-th spectral moment is defined as:</p>
                    <div className="bg-slate-100 p-4 rounded-lg font-serif text-center border border-slate-200 my-4">
                        m<sub>n</sub> = ∫ f<sup>n</sup> · G(f) df
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-xs">
                        <li><strong>G(f):</strong> The Stress PSD value [(MPa)²/Hz]</li>
                        <li><strong>f:</strong> Frequency [Hz]</li>
                    </ul>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-3">
                    <p><strong>Key Moments used in this app:</strong></p>
                    <ul className="space-y-2">
                        <li><span className="font-mono font-bold text-indigo-700">m₀</span> = Variance (RMS Stress squared). Represents the area under the curve.</li>
                        <li><span className="font-mono font-bold text-indigo-700">m₂</span> = Used to calculate the radius of gyration and zero-crossing rate.</li>
                        <li><span className="font-mono font-bold text-indigo-700">m₄</span> = Used to calculate the rate of peaks.</li>
                    </ul>
                </div>
            </div>
          </section>

          {/* Section 3: Statistical Properties */}
          <section>
            <div className="flex items-center gap-2 mb-4">
                <FunctionSquare className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-indigo-900">3. Statistical Properties</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-700">
                        <tr>
                            <th className="p-3 border border-slate-200">Parameter</th>
                            <th className="p-3 border border-slate-200">Symbol</th>
                            <th className="p-3 border border-slate-200">Formula</th>
                            <th className="p-3 border border-slate-200">Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="p-3 border border-slate-200">RMS Stress</td>
                            <td className="p-3 border border-slate-200 font-serif">σ<sub>rms</sub></td>
                            <td className="p-3 border border-slate-200 font-serif">√m₀</td>
                            <td className="p-3 border border-slate-200">The 1-sigma stress level.</td>
                        </tr>
                        <tr>
                            <td className="p-3 border border-slate-200">Zero Crossing Rate</td>
                            <td className="p-3 border border-slate-200 font-serif">ν₀</td>
                            <td className="p-3 border border-slate-200 font-serif">√(m₂ / m₀)</td>
                            <td className="p-3 border border-slate-200">How often the stress crosses zero (upwards) per second.</td>
                        </tr>
                        <tr>
                            <td className="p-3 border border-slate-200">Peak Rate</td>
                            <td className="p-3 border border-slate-200 font-serif">E[P]</td>
                            <td className="p-3 border border-slate-200 font-serif">√(m₄ / m₂)</td>
                            <td className="p-3 border border-slate-200">Total number of peaks per second.</td>
                        </tr>
                        <tr>
                            <td className="p-3 border border-slate-200">Irregularity Factor</td>
                            <td className="p-3 border border-slate-200 font-serif">γ</td>
                            <td className="p-3 border border-slate-200 font-serif">ν₀ / E[P]</td>
                            <td className="p-3 border border-slate-200">Values near 1.0 indicate a Narrow Band signal. Values near 0 indicate Wide Band.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
          </section>

          {/* Section 4: Damage Calculation */}
          <section>
            <div className="flex items-center gap-2 mb-4">
                <Divide className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-indigo-900">4. Damage Calculation (Wirsching Method)</h3>
            </div>
            
            <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                    <h4 className="font-bold text-sm text-slate-700 mb-2">Step A: Narrow Band Assumption (Miles)</h4>
                    <p className="text-xs text-slate-600 mb-3">
                        First, we calculate damage assuming the stress peaks follow a Rayleigh distribution (Ideal Narrow Band). This is usually conservative.
                    </p>
                    <div className="bg-white p-3 rounded shadow-inner font-serif text-center text-sm">
                        D<sub>NB</sub> = [ ν₀ · T / K ] · (√2)<sup>m</sup> · Γ(1 + m/2) · (σ<sub>rms</sub>)<sup>m</sup>
                    </div>
                    <div className="mt-2 flex gap-4 text-xs text-slate-500 justify-center">
                        <span>T: Exposure Time</span>
                        <span>m, K: S-N Curve Params</span>
                        <span>Γ: Gamma Function</span>
                    </div>
                </div>

                <div className="bg-indigo-50 p-4 rounded border border-indigo-200">
                    <h4 className="font-bold text-sm text-indigo-900 mb-2">Step B: Wirsching-Light Correction</h4>
                    <p className="text-xs text-indigo-800 mb-3">
                        Real-world Ansys PSDs are "Wide Band". We correct the conservative D<sub>NB</sub> using the spectral width parameter (ε).
                    </p>
                    <div className="flex flex-col gap-2">
                         <div className="bg-white p-2 rounded shadow-inner font-serif text-center text-sm">
                            ε = √(1 - γ²)
                        </div>
                        <div className="bg-white p-2 rounded shadow-inner font-serif text-center text-sm">
                            D<sub>Wirsching</sub> = D<sub>NB</sub> · [ a + (1-a)(1-ε)<sup>b</sup> ]
                        </div>
                        <p className="text-[10px] text-center italic text-indigo-600 mt-1">
                            Where a(m) and b(m) are empirical functions of the S-N slope m.
                        </p>
                    </div>
                </div>
            </div>
          </section>
          
          {/* Section 5: Singularities */}
          <section>
            <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-bold text-slate-900">5. FEA Singularities & Mitigation</h3>
            </div>
            <div className="bg-amber-50 p-5 rounded-lg border border-amber-200 text-sm text-slate-800 space-y-4">
                <div>
                    <h4 className="font-bold mb-1">The Problem: Single Node "Max"</h4>
                    <p>
                        In Finite Element Analysis, sharp re-entrant corners or point constraints can cause stress to tend toward infinity as mesh size decreases. This is a mathematical artifact called a <strong>Singularity</strong>. 
                    </p>
                    <p className="mt-2">
                        If you simply export the "Maximum" stress PSD from a model containing singularities, you are calculating fatigue life based on an artificial number, leading to near-zero life predictions.
                    </p>
                </div>
                
                <div className="bg-white p-4 rounded border border-amber-100">
                    <h4 className="font-bold mb-1 flex items-center gap-2 text-indigo-700">
                        <Crosshair className="w-4 h-4"/>
                        The Solution: Hotspot Stress (Area Averaging)
                    </h4>
                    <p className="mb-2">
                        Fatigue failure is a physical process that initiates over a finite volume of material (grain size), not a mathematical point.
                    </p>
                    <p>
                        <strong>Best Practice:</strong> Instead of taking the single max node:
                    </p>
                    <ol className="list-decimal pl-5 mt-2 space-y-1 text-slate-700">
                        <li>Identify the critical location (Hotspot).</li>
                        <li>Create a <strong>Named Selection</strong> in Ansys encompassing the small face or a group of nodes (e.g., 5-10 nodes) at the hotspot.</li>
                        <li>Export the <strong>Average</strong> Response PSD of this selection.</li>
                    </ol>
                    <p className="mt-3 italic text-xs text-slate-500">
                        This filters out the singular peak while retaining the true stress concentration of the geometry.
                    </p>
                </div>
            </div>
          </section>

          {/* Section 6: Limitations */}
          <section>
            <div className="flex items-center gap-2 mb-4">
                <Scale className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-bold text-slate-900">6. Assumptions & Limitations</h3>
            </div>
            <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 text-sm text-slate-800">
               <ul className="list-disc pl-5 space-y-2">
                   <li>
                       <strong>Zero Mean Stress:</strong> This tool assumes fully reversed random loading (Mean Stress = 0). It does not apply Goodman or Morrow corrections for static pre-load. If your component has significant static stress (e.g., bolt preload, gravity), this tool may overestimate life.
                   </li>
                   <li>
                       <strong>Unit Consistency:</strong> The calculation is unit-agnostic but requires consistency. If your S-N curve is in MPa, your Input PSD <strong>must</strong> be in MPa²/Hz. Mixing Pa and MPa will result in errors of magnitude 10<sup>6m</sup> (a factor of 1,000,000 raised to the power of the slope 'm').
                   </li>
                   <li>
                       <strong>Linear Damage:</strong> The tool assumes Miner's Rule (Linear Damage Accumulation) is valid.
                   </li>
               </ul>
            </div>
          </section>

          {/* Section 7: Future Development (Roadmap) */}
          <section>
             <div className="flex items-center gap-2 mb-4">
                <Map className="w-5 h-5 text-slate-500" />
                <h3 className="text-lg font-bold text-slate-900">7. Development Roadmap</h3>
            </div>
            <div className="bg-slate-50 p-4 rounded border border-slate-200 text-sm text-slate-600">
                <p className="mb-2">This application is currently in <strong>v1.0.0 RC</strong>. The following features are planned for v1.1:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Mean Stress Correction:</strong> Implementation of Goodman and Morrow corrections to account for static loads.</li>
                    <li><strong>Material Database:</strong> Preset S-N parameters for common aerospace and automotive alloys.</li>
                    <li><strong>Cumulative Damage:</strong> Ability to sum damage from multiple PSD load cases (Miner's Sum).</li>
                </ul>
            </div>
          </section>

           {/* Section 8: References */}
           <section className="border-t border-slate-200 pt-4">
              <h3 className="text-sm font-bold text-slate-700 mb-2">References</h3>
              <ul className="text-xs text-slate-500 list-disc pl-5 space-y-1">
                  <li>Wirsching, P.H., Light, M.C., "Fatigue under Wide Band Random Stresses", J. Struct. Div., ASCE, 1980.</li>
                  <li>Bishop, N.W.M., Sherratt, F., "Finite Element Based Fatigue Calculations", NAFEMS, 2000.</li>
                  <li>Shigley, J.E., "Mechanical Engineering Design", Chapter: Fatigue Failure resulting from Variable Loading.</li>
                  <li>Hobbacher, A., "Recommendations for Fatigue Design of Welded Joints and Components", IIW Collection.</li>
              </ul>
           </section>

        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end">
            <button 
                onClick={onClose}
                className="px-6 py-2 bg-slate-800 text-white text-sm font-medium rounded hover:bg-slate-700 transition-colors"
            >
                Close Guide
            </button>
        </div>
      </div>
    </div>
  );
};