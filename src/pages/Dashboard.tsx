import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { StatsCard } from '../components/StatsCard';
import { MonthlySavingsChart, DistributionChart, GrowthChart } from '../components/Charts';
import { Users, Wallet, TrendingUp, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Skeleton } from '../components/ui/Skeleton';

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

  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    if (isAdmin) {
      fetchRecentPayments();
    }

    // Real-time subscription for payments
    const subscription = supabase
      .channel('public:payments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, (payload) => {
        console.log('Payment change received!', payload);
        fetchDashboardData();
        if (isAdmin) {
          fetchRecentPayments();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [isAdmin]);

  const fetchRecentPayments = async () => {
    setLoadingPayments(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          members (name)
        `)
        .order('payment_date', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      setRecentPayments(data || []);
    } catch (error) {
      console.error('Error fetching recent payments:', error);
    } finally {
      setLoadingPayments(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch Members Count
      const { count: membersCount, error: membersError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true });
      
      if (membersError) throw membersError;
      
      // Fetch Total Shares
      const { data: members, error: sharesError } = await supabase
        .from('members')
        .select('share_count');
      
      if (sharesError) throw sharesError;

      const totalShares = members?.reduce((sum, m) => sum + m.share_count, 0) || 0;

      // Fetch Payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('total_amount, payment_status, month, year');
      
      if (paymentsError) throw paymentsError;

      const totalSavings = payments?.filter(p => p.payment_status === 'paid').reduce((sum, p) => sum + p.total_amount, 0) || 0;
      
      const currentMonth = new Date().toLocaleString('default', { month: 'long' });
      const currentYear = new Date().getFullYear();

      const monthlyCollection = payments
        ?.filter(p => p.month === currentMonth && p.year === currentYear && p.payment_status === 'paid')
        .reduce((sum, p) => sum + p.total_amount, 0) || 0;

      const pendingCount = payments
        ?.filter(p => p.month === currentMonth && p.year === currentYear && p.payment_status === 'pending')
        .length || 0;

      setStats({
        totalMembers: membersCount || 0,
        totalShares: totalShares || 0,
        totalSavings: totalSavings || 0,
        monthlyCollection: monthlyCollection || 0,
        pendingCount: pendingCount || 0
      });

      // Process Chart Data
      // 1. Monthly Savings (Last 6 months)
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const currentMonthIndex = new Date().getMonth();
      
      // Get last 6 months
      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(currentMonthIndex - i);
        last6Months.push({
          month: months[d.getMonth()],
          year: d.getFullYear(),
          name: months[d.getMonth()].substring(0, 3)
        });
      }

      const monthlyData = last6Months.map(m => {
        const amount = payments
          ?.filter(p => p.month === m.month && p.year === m.year && p.payment_status === 'paid')
          .reduce((sum, p) => sum + p.total_amount, 0) || 0;
        return { name: m.name, amount };
      });

      // 2. Share Distribution
      const shareDistribution = members?.reduce((acc: any, curr) => {
        const key = `${curr.share_count} Share${curr.share_count > 1 ? 's' : ''}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      const distributionData = Object.entries(shareDistribution || {}).map(([name, value]) => ({
        name,
        value
      }));

      // 3. Growth Chart (Cumulative)
      let cumulative = 0;
      const growthData = monthlyData.map(m => {
        cumulative += m.amount;
        return { name: m.name, value: cumulative };
      });

      setChartData({
        monthly: monthlyData,
        distribution: distributionData,
        growth: growthData
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-white/60 mt-1">Welcome back, {member?.name || 'User'}</p>
        </div>
        <div className="bg-white dark:bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-mono text-pink-600 dark:text-pink-300 shadow-sm dark:shadow-none">
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                </div>
                <Skeleton className="h-12 w-12 rounded-xl" />
              </div>
            </div>
          ))
        ) : (
          <>
            <StatsCard 
              title="Total Savings" 
              value={`৳${stats.totalSavings.toLocaleString()}`} 
              icon={Wallet} 
              color="text-emerald-500 dark:text-emerald-400"
              delay={0.1}
            />
            <StatsCard 
              title="Monthly Collection" 
              value={`৳${stats.monthlyCollection.toLocaleString()}`} 
              icon={TrendingUp} 
              color="text-blue-500 dark:text-blue-400"
              delay={0.2}
            />
            <StatsCard 
              title="Total Members" 
              value={stats.totalMembers} 
              icon={Users} 
              color="text-purple-500 dark:text-purple-400"
              delay={0.3}
              onClick={() => navigate('/members')}
            />
            <StatsCard 
              title="Pending Payments" 
              value={stats.pendingCount} 
              icon={AlertCircle} 
              color="text-pink-500 dark:text-pink-400"
              delay={0.4}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {loading ? (
          <>
            <Skeleton className="h-[380px] rounded-2xl col-span-1 lg:col-span-2" />
            <Skeleton className="h-[380px] rounded-2xl" />
          </>
        ) : (
          <>
            <MonthlySavingsChart data={chartData.monthly} />
            <DistributionChart data={chartData.distribution} />
          </>
        )}
        
        {isAdmin && (
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Payments</h3>
              <button 
                onClick={() => navigate('/members')}
                className="text-xs text-pink-500 dark:text-pink-400 hover:underline"
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {loadingPayments ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <div className="space-y-2 text-right">
                        <Skeleton className="h-4 w-16 ml-auto" />
                        <Skeleton className="h-3 w-20 ml-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentPayments.length > 0 ? (
                recentPayments.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-500/20 flex items-center justify-center text-xs font-bold text-pink-600 dark:text-pink-400">
                        {p.members?.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{p.members?.name}</p>
                        <p className="text-[10px] text-gray-500 dark:text-white/40">{p.month} {p.year}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">৳{p.total_amount.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400 dark:text-white/40">{new Date(p.payment_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 dark:text-white/40 text-sm py-8">No payments recorded yet.</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1">
        {loading ? (
          <Skeleton className="h-[380px] rounded-2xl" />
        ) : (
          <GrowthChart data={chartData.growth} />
        )}
      </div>
    </div>
  );
}
