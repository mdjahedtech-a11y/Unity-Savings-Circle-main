import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef'];

export const MonthlySavingsChart = React.memo(({ data }: { data: any[] }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Monthly Savings</h4>
        <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[8px] font-black uppercase tracking-widest">Live</div>
      </div>
      <div className="flex-1 min-h-[180px] sm:min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} vertical={false} />
            <XAxis dataKey="name" stroke={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `৳${value}`} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDark ? '#111827' : '#fff', 
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb', 
                borderRadius: '16px', 
                color: isDark ? '#fff' : '#111827',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                padding: '12px'
              }}
              cursor={{ fill: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}
            />
            <Bar dataKey="amount" radius={[8, 8, 0, 0]} barSize={32}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export const DistributionChart = React.memo(({ data }: { data: any[] }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h4 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Distribution</h4>
        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Resource mapping</p>
      </div>
      <div className="flex-1 min-h-[180px] sm:min-h-[220px] flex flex-col justify-center">
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={6}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ 
                backgroundColor: isDark ? '#111827' : '#fff', 
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb', 
                borderRadius: '16px', 
                color: isDark ? '#fff' : '#111827',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 px-2">
          {data.map((entry, index) => (
            <div key={`dist-${entry.name}-${index}`} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="text-[11px] font-bold text-gray-600 dark:text-white/70 whitespace-nowrap">{entry.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export const GrowthChart = React.memo(({ data }: { data: any[] }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} dy={10} />
        <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `৳${value}`} dx={-10} />
        <Tooltip contentStyle={{ 
          backgroundColor: '#0f172a', 
          border: '1px solid rgba(255,255,255,0.1)', 
          borderRadius: '16px', 
          color: '#fff',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          padding: '12px'
        }} />
        <Area type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
      </AreaChart>
    </ResponsiveContainer>
  );
});

export const RecentPaymentsChart = React.memo(({ data }: { data: any[] }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Format data for chart: reverse to show chronological order (left to right)
  const chartData = React.useMemo(() => [...data].reverse().map(p => ({
    name: p.members?.name?.split(' ')[0] || 'User',
    amount: p.total_amount,
    date: new Date(p.payment_date).toLocaleDateString()
  })), [data]);

  return (
    <div className="h-[180px] mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
      <p className="text-[10px] font-medium text-gray-500 dark:text-white/40 mb-3 uppercase tracking-wider">Payment Trends</p>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} vertical={false} />
          <XAxis dataKey="name" stroke={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} fontSize={8} tickLine={false} axisLine={false} />
          <YAxis hide />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isDark ? '#1f2937' : '#fff', 
              border: isDark ? 'none' : '1px solid #e5e7eb', 
              borderRadius: '8px', 
              fontSize: '10px',
              color: isDark ? '#fff' : '#111827'
            }}
            formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Amount']}
          />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]} barSize={20}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});
