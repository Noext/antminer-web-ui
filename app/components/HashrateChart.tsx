'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface HashrateChartProps {
  chartData: any;
}

export function HashrateChart({ chartData }: HashrateChartProps) {
  if (!chartData?.RATE?.[0]) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Aucune donnée disponible
      </div>
    );
  }

  const rate = chartData.RATE[0];
  
  // Transform data for recharts format
  const data = rate.xAxis.map((time: string, index: number) => ({
    time,
    chain0: (rate.series[0]?.data[index] / 1000).toFixed(2),
    chain1: (rate.series[1]?.data[index] / 1000).toFixed(2),
    chain2: (rate.series[2]?.data[index] / 1000).toFixed(2),
  }));

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="time" 
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <YAxis 
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            label={{ value: 'Hashrate (TH/s)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
            domain={[30, 'auto']}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1e293b', 
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f1f5f9'
            }}
            formatter={(value: any) => `${value} TH/s`}
          />
          <Legend 
            wrapperStyle={{ color: '#94a3b8' }}
            formatter={(value) => {
              const labels: Record<string, string> = {
                chain0: 'Hashboard #1',
                chain1: 'Hashboard #2',
                chain2: 'Hashboard #3',
              };
              return labels[value] || value;
            }}
          />
          <Line 
            type="monotone" 
            dataKey="chain0" 
            stroke="#06b6d4" 
            strokeWidth={2}
            dot={false}
            name="chain0"
          />
          <Line 
            type="monotone" 
            dataKey="chain1" 
            stroke="#8b5cf6" 
            strokeWidth={2}
            dot={false}
            name="chain1"
          />
          <Line 
            type="monotone" 
            dataKey="chain2" 
            stroke="#f59e0b" 
            strokeWidth={2}
            dot={false}
            name="chain2"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

