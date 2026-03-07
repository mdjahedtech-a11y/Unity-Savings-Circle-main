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

const COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981'];

export function MonthlySavingsChart({ data }: { data: any[] }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Card className="col-span-1 lg:col-span-2 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">Monthly Savings</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} vertical={false} />
            <XAxis dataKey="name" stroke={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `৳${value}`} />
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
            <Bar dataKey="amount" fill="#ec4899" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function DistributionChart({ data }: { data: any[] }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Card className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">Share Distribution</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] flex flex-col">
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
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
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
          {data.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="text-xs text-gray-500 dark:text-white/60 whitespace-nowrap">{entry.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function GrowthChart({ data }: { data: any[] }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Card className="col-span-1 lg:col-span-3 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">Total Savings Growth</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} vertical={false} />
            <XAxis dataKey="name" stroke={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `৳${value}`} />
            <Tooltip contentStyle={{ 
              backgroundColor: isDark ? '#1f2937' : '#fff', 
              border: isDark ? 'none' : '1px solid #e5e7eb', 
              borderRadius: '8px', 
              color: isDark ? '#fff' : '#111827',
              boxShadow: isDark ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }} />
            <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
