import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { StatsCard } from '../components/StatsCard';
import { MonthlySavingsChart, DistributionChart, GrowthChart } from '../components/Charts';
import { Users, Wallet, TrendingUp, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { member, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalShares: 0,
    totalSavings: 0,
    monthlyCollection: 0,
    pendingCount: 0,
  });
  const [chartData, setChartData] = useState<any>({
    monthly: [],
    distribution: [],
    growth: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Mock data for now if Supabase is empty or connection fails
    // In a real app, we would query Supabase here
    
    // Fetch Members Count
    const { count: membersCount } = await supabase.from('members').select('*', { count: 'exact', head: true });
    
    // Fetch Total Shares
    const { data: members } = await supabase.from('members').select('share_count');
    const totalShares = members?.reduce((sum, m) => sum + m.share_count, 0) || 0;

    // Fetch Payments
    const { data: payments } = await supabase.from('payments').select('total_amount, payment_status, month');
    const totalSavings = payments?.filter(p => p.payment_status === 'paid').reduce((sum, p) => sum + p.total_amount, 0) || 0;
    
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const monthlyCollection = payments
      ?.filter(p => p.month === currentMonth && p.payment_status === 'paid')
      .reduce((sum, p) => sum + p.total_amount, 0) || 0;

    const pendingCount = payments
      ?.filter(p => p.month === currentMonth && p.payment_status === 'pending')
      .length || 0;

    setStats({
      totalMembers: membersCount || 20,
      totalShares: totalShares || 45,
      totalSavings: totalSavings || 150000,
      monthlyCollection: monthlyCollection || 45000,
      pendingCount: pendingCount || 5
    });

    // Mock Chart Data (Replace with real aggregation in production)
    setChartData({
      monthly: [
        { name: 'Jan', amount: 40000 },
        { name: 'Feb', amount: 42000 },
        { name: 'Mar', amount: 45000 },
        { name: 'Apr', amount: 41000 },
        { name: 'May', amount: 45000 },
      ],
      distribution: [
        { name: '1 Share', value: 10 },
        { name: '2 Shares', value: 5 },
        { name: '3 Shares', value: 3 },
        { name: '5 Shares', value: 2 },
      ],
      growth: [
        { name: 'Jan', value: 40000 },
        { name: 'Feb', value: 82000 },
        { name: 'Mar', value: 127000 },
        { name: 'Apr', value: 168000 },
        { name: 'May', value: 213000 },
      ]
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-white/60 mt-1">Welcome back, {member?.name || 'User'}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 text-sm font-mono text-pink-300">
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Savings" 
          value={`৳${stats.totalSavings.toLocaleString()}`} 
          icon={Wallet} 
          color="text-emerald-400"
          delay={0.1}
        />
        <StatsCard 
          title="Monthly Collection" 
          value={`৳${stats.monthlyCollection.toLocaleString()}`} 
          icon={TrendingUp} 
          color="text-blue-400"
          delay={0.2}
        />
        <StatsCard 
          title="Total Members" 
          value={stats.totalMembers} 
          icon={Users} 
          color="text-purple-400"
          delay={0.3}
          onClick={() => navigate('/members')}
        />
        <StatsCard 
          title="Pending Payments" 
          value={stats.pendingCount} 
          icon={AlertCircle} 
          color="text-pink-400"
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MonthlySavingsChart data={chartData.monthly} />
        <DistributionChart data={chartData.distribution} />
      </div>

      <div className="grid grid-cols-1">
        <GrowthChart data={chartData.growth} />
      </div>
    </div>
  );
}
