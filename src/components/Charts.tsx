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
    <Card className="col-span-1 lg:col-span-2 bg-white/80 dark:bg-white/5 border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-sm">
      <CardHeader className="p-5 sm:p-6">
        <CardTitle className="text-gray-900 dark:text-white text-lg sm:text-xl">Monthly Savings</CardTitle>
      </CardHeader>
      <CardContent className="h-[250px] sm:h-[300px] p-5 sm:p-6 pt-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} vertical={false} />
            <XAxis dataKey="name" stroke={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"} fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"} fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `৳${value}`} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDark ? '#1f2937' : '#fff', 
                border: isDark ? 'none' : '1px solid #e5e7eb', 
                borderRadius: '8px', 
                color: isDark ? '#fff' : '#111827',
                boxShadow: isDark ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
            />
            <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

export const DistributionChart = React.memo(({ data }: { data: any[] }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Card className="bg-white/80 dark:bg-white/5 border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-sm">
      <CardHeader className="p-5 sm:p-6">
        <CardTitle className="text-gray-900 dark:text-white text-lg sm:text-xl">Share Distribution</CardTitle>
      </CardHeader>
      <CardContent className="h-[250px] sm:h-[300px] flex flex-col p-5 sm:p-6 pt-0">
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ 
                backgroundColor: isDark ? '#1f2937' : '#fff', 
                border: isDark ? 'none' : '1px solid #e5e7eb', 
                borderRadius: '8px', 
                color: isDark ? '#fff' : '#111827',
                boxShadow: isDark ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-3">
          {data.map((entry, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="text-[10px] text-gray-500 dark:text-white/60 whitespace-nowrap">{entry.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

export const GrowthChart = React.memo(({ data }: { data: any[] }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Card className="col-span-1 lg:col-span-3 bg-white/80 dark:bg-white/5 border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-sm">
      <CardHeader className="p-5 sm:p-6">
        <CardTitle className="text-gray-900 dark:text-white text-lg sm:text-xl">Total Savings Growth</CardTitle>
      </CardHeader>
      <CardContent className="h-[250px] sm:h-[300px] p-5 sm:p-6 pt-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} vertical={false} />
            <XAxis dataKey="name" stroke={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"} fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"} fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `৳${value}`} />
            <Tooltip contentStyle={{ 
              backgroundColor: isDark ? '#1f2937' : '#fff', 
              border: isDark ? 'none' : '1px solid #e5e7eb', 
              borderRadius: '8px', 
              color: isDark ? '#fff' : '#111827',
              boxShadow: isDark ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }} />
            <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
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
          <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});
