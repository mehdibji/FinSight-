import React, { useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useStore } from '../../store/useStore';

export const PortfolioChart: React.FC = () => {
  const { getTotalPortfolioValue } = useStore();
  const totalValue = getTotalPortfolioValue();

  const data = useMemo(() => {
    // Generate a mock history based on the current total value
    const base = totalValue > 0 ? totalValue : 10000;
    return [
      { name: 'Jan', value: base * 0.6 },
      { name: 'Feb', value: base * 0.7 },
      { name: 'Mar', value: base * 0.65 },
      { name: 'Apr', value: base * 0.85 },
      { name: 'May', value: base * 0.8 },
      { name: 'Jun', value: base * 0.95 },
      { name: 'Jul', value: totalValue },
    ];
  }, [totalValue]);

  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            hide 
            domain={['dataMin - 5000', 'dataMax + 5000']}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1A1A1A', 
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: '#fff'
            }}
            itemStyle={{ color: '#F97316' }}
            formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Value']}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#F97316" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorValue)" 
            animationDuration={2000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
