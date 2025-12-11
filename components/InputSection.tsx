import React, { useRef, useState, useEffect } from 'react';
import { DataPoint } from '../types';
import { Upload, FileText, AlertCircle, Table as TableIcon, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

interface InputSectionProps {
  onDataLoaded: (data: DataPoint[]) => void;
  hoveredIndex: number | null;
  onHoverIndexChange: (index: number | null) => void;
}

export const InputSection: React.FC<InputSectionProps> = ({
  onDataLoaded,
  hoveredIndex,
  onHoverIndexChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [dataWarning, setDataWarning] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<DataPoint[]>([]);
  const [showPreview, setShowPreview] = useState(true);
  const [fileName, setFileName] = useState<string | null>(null);

  const parseCSV = (text: string, name: string) => {
    try {
      setParseError(null);
      setDataWarning(null);
      setFileName(name);
      
      const lines = text.trim().split(/\r?\n/);
      const data: DataPoint[] = [];
      let negativeCount = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        // Skip header lines that start with letters (unless scientific notation)
        if (/^[a-zA-Z]/.test(line) && !/^[eE]/.test(line)) continue;

        let parts = line.split(/[\t;]+/).filter(p => p.trim() !== '');
        if (parts.length < 2) {
             parts = line.split(/[\s]+/).filter(p => p.trim() !== '');
        }

        if (parts.length >= 2) {
          const freqStr = parts[0].replace(/,/g, '.');
          const psdStr = parts[1].replace(/,/g, '.');
          let freq = parseFloat(freqStr);
          let psd = parseFloat(psdStr);

          if (!isNaN(freq) && !isNaN(psd)) {
            // Handle Ansys Instability (Negative PSD)
            if (psd < 0) {
                psd = 0;
                negativeCount++;
            }
            data.push({ frequency: freq, psd: psd });
          }
        }
      }

      if (data.length < 2) {
        setParseError("Insufficient valid data points found.");
        return;
      }

      if (negativeCount > 0) {
          setDataWarning(`Detected ${negativeCount} negative PSD values (clamped to 0). This usually indicates an unstable Ansys simulation.`);
      }

      setPreviewData(data);
      onDataLoaded(data);
      setShowPreview(true);
    } catch (e) {
      setParseError("Error parsing file.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) parseCSV(evt.target.result as string, file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) parseCSV(evt.target.result as string, file.name);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-4 p-4">
        
        <div 
          className={`relative border-2 border-dashed rounded-lg py-10 px-4 text-center transition-all ${
            dragActive 
            ? "border-indigo-500 bg-indigo-50 scale-[1.02]" 
            : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept=".csv,.txt,.dat"
            onChange={handleFileChange}
          />
          <div className="flex flex-col items-center gap-3 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className={`p-3 rounded-full ${fileName ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                <Upload className={`w-6 h-6 ${fileName ? 'text-indigo-600' : 'text-slate-400'}`} />
            </div>
            <div>
                <p className="text-sm font-bold text-slate-700">{fileName || "Drop Ansys Export Here"}</p>
                <p className="text-xs text-slate-500 mt-1">Accepts .txt or .csv</p>
            </div>
          </div>
        </div>

        {/* Format Instruction Box */}
        <div className="bg-slate-50 border border-slate-200 rounded p-3 text-[10px] text-slate-600">
            <p className="font-bold mb-1">REQUIRED FILE FORMAT:</p>
            <p className="font-mono">
                Column 1: Frequency [Hz]<br/>
                Column 2: PSD [MPa²/Hz]
            </p>
            <p className="mt-2 text-slate-500 italic border-t border-slate-200 pt-1">
                <strong className="text-indigo-700">Best Practice:</strong> To avoid singularities (infinite stress at corners), create a Named Selection of the critical area and export the <strong>Average</strong> PSD of those nodes, rather than the single Maximum node.
            </p>
        </div>
        
        {parseError && (
          <div className="mt-2 text-sm text-red-600 flex items-center gap-1 bg-red-50 p-2 rounded border border-red-100">
            <AlertCircle className="w-4 h-4" /> {parseError}
          </div>
        )}

        {dataWarning && (
           <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">{dataWarning}</p>
           </div>
        )}

        {/* Data Preview Table */}
        {previewData.length > 0 && !parseError && (
          <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden">
            <button 
                onClick={() => setShowPreview(!showPreview)}
                className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
                <span className="flex items-center gap-2">
                    <TableIcon className="w-4 h-4" />
                    Preview ({previewData.length} pts)
                </span>
                {showPreview ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
            </button>
            
            {showPreview && (
                <div className="max-h-64 overflow-y-auto relative">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10">
                            <tr>
                                <th className="px-4 py-2 font-semibold text-slate-600 bg-slate-50">Row</th>
                                <th className="px-4 py-2 font-semibold text-slate-600 bg-slate-50">Freq (Hz)</th>
                                <th className="px-4 py-2 font-semibold text-slate-600 bg-slate-50">PSD</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {previewData.map((point, index) => {
                                const isHovered = index === hoveredIndex;
                                return (
                                    <tr 
                                        key={index} 
                                        onClick={() => onHoverIndexChange(index)}
                                        onMouseEnter={() => onHoverIndexChange(index)}
                                        onMouseLeave={() => onHoverIndexChange(null)}
                                        className={`cursor-pointer transition-colors duration-75 ${!isHovered ? 'hover:bg-slate-50' : ''}`}
                                        style={{ backgroundColor: isHovered ? '#4f46e5' : undefined }}
                                    >
                                        <td className="px-4 py-1 font-mono" style={{ color: isHovered ? '#ffffff' : '#94a3b8' }}>{index + 1}</td>
                                        <td className="px-4 py-1 font-mono" style={{ color: isHovered ? '#ffffff' : '#334155' }}>{point.frequency.toFixed(1)}</td>
                                        <td className="px-4 py-1 font-mono" style={{ color: isHovered ? '#ffffff' : '#334155' }}>{point.psd.toExponential(4)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
          </div>
        )}
    </div>
  );
};