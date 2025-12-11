import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { DataPoint } from '../types';

interface PsdChartProps {
  data: DataPoint[];
  hoveredIndex: number | null;
  onHoverIndexChange: (index: number | null) => void;
}

export const PsdChart: React.FC<PsdChartProps> = ({ data, hoveredIndex, onHoverIndexChange }) => {
  const [logScale, setLogScale] = useState(true);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200 border-dashed">
        <p className="text-slate-400">No data loaded to visualize</p>
      </div>
    );
  }

  // Get the hovered point data for the ReferenceDot
  const hoveredPoint = hoveredIndex !== null && data[hoveredIndex] ? data[hoveredIndex] : null;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-800">PSD Plot</h2>
        <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Log Scale</label>
            <input 
                type="checkbox" 
                checked={logScale} 
                onChange={() => setLogScale(!logScale)} 
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
        </div>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
            onMouseMove={(state: any) => {
              if (state && state.activeTooltipIndex !== undefined) {
                if (state.activeTooltipIndex !== hoveredIndex) {
                  onHoverIndexChange(state.activeTooltipIndex);
                }
              }
            }}
            onMouseLeave={() => onHoverIndexChange(null)}
          >
            <defs>
              <linearGradient id="colorPsd" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="frequency" 
              type="number" 
              scale={logScale ? "log" : "linear"}
              domain={['auto', 'auto']}
              tick={{fill: '#64748b', fontSize: 12}}
              label={{ value: 'Frequency (Hz)', position: 'bottom', offset: 0, fill: '#475569' }}
              allowDataOverflow
            />
            <YAxis 
              scale={logScale ? "log" : "linear"}
              domain={['auto', 'auto']}
              tick={{fill: '#64748b', fontSize: 12}}
              label={{ value: 'PSD (Stress²/Hz)', angle: -90, position: 'insideLeft', fill: '#475569' }}
              allowDataOverflow
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              itemStyle={{ color: '#4338ca' }}
              formatter={(value: number) => [value.toExponential(2), 'PSD']}
              labelFormatter={(label) => `Freq: ${Number(label).toFixed(1)} Hz`}
            />
            <Area 
              type="monotone" 
              dataKey="psd" 
              stroke="#6366f1" 
              fillOpacity={1} 
              fill="url(#colorPsd)" 
            />
            {hoveredPoint && (
              <ReferenceDot 
                x={hoveredPoint.frequency} 
                y={hoveredPoint.psd} 
                r={6} 
                fill="#4338ca" 
                stroke="#fff" 
                strokeWidth={2}
                isFront={true}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
