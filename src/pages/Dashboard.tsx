import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { StatsCard } from '../components/StatsCard';
import { MonthlySavingsChart, DistributionChart, GrowthChart, RecentPaymentsChart } from '../components/Charts';
import { CountdownTimer } from '../components/CountdownTimer';
import { Users, Wallet, TrendingUp, AlertCircle, RefreshCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { cn } from '../lib/utils';

import { useNavigate } from 'react-router-dom';

import { LoadingScreen } from '../components/LoadingScreen';

export default function Dashboard() {
  const { member, isAdmin, dashboardLoaded, setDashboardLoaded } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loading, setLoading] = useState(true);

  const { stats, chartData } = React.useMemo(() => {
    if (!members.length && !allPayments.length) {
      return {
        stats: { totalMembers: 0, totalShares: 0, totalSavings: 0, monthlyCollection: 0, pendingCount: 0 },
        chartData: { monthly: [], distribution: [], growth: [] }
      };
    }
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();

    // Calculate Stats
    const totalMembers = members.length;
    const totalShares = members.reduce((sum, m) => sum + (m.share_count || 0), 0);
    
    const paidPayments = allPayments.filter(p => p.payment_status === 'paid');
    const totalSavings = paidPayments.reduce((sum, p) => sum + (p.total_amount || 0), 0);
    
    const monthlyCollection = paidPayments
      .filter(p => p.month === currentMonth && p.year === currentYear)
      .reduce((sum, p) => sum + (p.total_amount || 0), 0);
    
    const collectionGoal = 41 * 1000; // 41 shares * 1000 taka
    const collectionProgress = (monthlyCollection / collectionGoal) * 100;

    const pendingCount = allPayments
      .filter(p => p.month === currentMonth && p.year === currentYear && p.payment_status === 'pending')
      .length;

    // Process Chart Data
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
      const amount = paidPayments
        .filter(p => p.month === m.month && p.year === m.year)
        .reduce((sum, p) => sum + (p.total_amount || 0), 0);
      return { name: m.name, amount };
    });

    // Share Distribution
    const shareDistribution = members.reduce((acc: any, curr) => {
      const key = `${curr.share_count} Share${curr.share_count > 1 ? 's' : ''}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const distributionData = Object.entries(shareDistribution).map(([name, value]) => ({
      name,
      value
    }));

    // Growth Chart (Cumulative Savings)
    let cumulative = 0;
    const growthData = monthlyData.map(m => {
      cumulative += m.amount;
      return { name: m.name, value: cumulative };
    });

    return {
      stats: {
        totalMembers,
        totalShares,
        totalSavings,
        monthlyCollection,
        collectionGoal,
        collectionProgress,
        pendingCount,
      },
      chartData: {
        monthly: monthlyData,
        distribution: distributionData,
        growth: growthData
      }
    };
  }, [members, allPayments]);

  const fetchRecentPayments = async () => {
    setLoadingPayments(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          members (name, photo_url)
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

  const fetchDashboardData = async (isRefresh = false) => {
    setLoading(true);
    try {
      const currentMonth = new Date().toLocaleString('default', { month: 'long' });
      const currentYear = new Date().getFullYear();

      // Fetch all data in parallel
      const [membersRes, paymentsRes] = await Promise.all([
        supabase.from('members').select('id, share_count'),
        supabase.from('payments').select('total_amount, month, year, payment_status')
      ]);

      if (membersRes.error) throw membersRes.error;
      if (paymentsRes.error) throw paymentsRes.error;

      const membersData = membersRes.data || [];
      const allPaymentsData = paymentsRes.data || [];

      setMembers(membersData);
      setAllPayments(allPaymentsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      // Add a small delay to ensure the UI doesn't flicker
      setTimeout(() => {
        setLoading(false);
        setDashboardLoaded(true);
      }, 800);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    if (isAdmin) {
      fetchRecentPayments();
    }

    // Real-time subscription for payments
    const subscription = supabase
      .channel('public:dashboard_payments')
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

  if (loading && !dashboardLoaded) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-10 w-full lg:w-auto">
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
              <button 
                onClick={() => {
                  fetchDashboardData(true);
                  if (isAdmin) fetchRecentPayments();
                }}
                disabled={loading}
                className={cn(
                  "p-3 rounded-2xl bg-white dark:bg-white/5 shadow-sm hover:shadow-md transition-all",
                  loading && "animate-spin opacity-50"
                )}
                title="Refresh Data"
              >
                <RefreshCcw className="w-5 h-5 text-indigo-500" />
              </button>
            </div>
            <p className="text-gray-400 dark:text-white/30 font-bold uppercase tracking-widest text-xs mt-2">Welcome back, {member?.name || 'User'}</p>
          </div>
          <div className="flex-1 sm:flex-none">
            <CountdownTimer />
          </div>
        </div>
        <div className="bg-white/50 dark:bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 dark:border-white/10 text-sm font-bold text-indigo-600 dark:text-indigo-400 shadow-xl shadow-indigo-500/5 uppercase tracking-widest">
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      <motion.div 
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8"
      >
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-[2rem] p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-32" />
                </div>
                <Skeleton className="h-14 w-14 rounded-2xl" />
              </div>
            </div>
          ))
        ) : (
          <>
            <StatsCard 
              title="Total Savings" 
              value={`৳${stats.totalSavings.toLocaleString()}`} 
              icon={Wallet} 
              color="text-emerald-500"
              delay={0.1}
            />
            <StatsCard 
              title="Monthly Collection" 
              value={`৳${stats.monthlyCollection.toLocaleString()}`} 
              icon={TrendingUp} 
              color="text-indigo-500"
              delay={0.2}
            />
            <div className="bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-[2rem] p-8 flex flex-col justify-between shadow-xl shadow-indigo-500/5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 dark:text-white/30 uppercase tracking-widest">Collection Goal</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">৳{stats.collectionGoal.toLocaleString()}</h3>
                </div>
                <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-500">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                  <span className="text-gray-400 dark:text-white/30">Progress</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{Math.min(100, Math.round(stats.collectionProgress))}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, stats.collectionProgress)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-indigo-500 rounded-full"
                  />
                </div>
              </div>
            </div>
            <StatsCard 
              title="Total Members" 
              value={stats.totalMembers} 
              icon={Users} 
              color="text-purple-500"
              delay={0.3}
              onClick={() => navigate('/members')}
            />
            <StatsCard 
              title="Pending Payments" 
              value={stats.pendingCount} 
              icon={AlertCircle} 
              color="text-amber-500"
              delay={0.4}
            />
          </>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {loading ? (
          <>
            <Skeleton className="h-[420px] rounded-[2rem] col-span-1 lg:col-span-2" />
            <Skeleton className="h-[420px] rounded-[2rem]" />
          </>
        ) : (
          <>
            <MonthlySavingsChart data={chartData.monthly} />
            <DistributionChart data={chartData.distribution} />
          </>
        )}
        
        {isAdmin && (
          <Card className="p-8 bg-white/70 dark:bg-gray-900/80 backdrop-blur-2xl border-white/40 dark:border-white/10 shadow-2xl shadow-indigo-500/10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Recent Activity</h3>
              <button 
                onClick={() => navigate('/members')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline"
              >
                View All
              </button>
            </div>
            <div className="space-y-5">
              {loadingPayments ? (
                <div className="space-y-5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-white/20">
                      <div className="flex items-center gap-4">
                        <Skeleton className="w-10 h-10 rounded-full" />
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
                  <div key={p.id} className="flex items-center justify-between p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-white/20 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400 overflow-hidden shadow-sm group-hover:scale-110 transition-transform">
                        {p.members?.photo_url ? (
                          <img src={p.members.photo_url} alt={p.members.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          p.members?.name?.charAt(0)
                        )}
                      </div>
                      <div>
                        <p className="text-base font-bold text-gray-900 dark:text-white">{p.members?.name}</p>
                        <p className="text-xs font-bold text-gray-400 dark:text-white/30 uppercase tracking-widest">{p.month} {p.year}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-indigo-600 dark:text-indigo-400">৳{p.total_amount.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-widest">
                        {new Date(p.payment_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 dark:text-white/40 text-sm py-12">No payments recorded yet.</p>
              )}
            </div>
            
            {!loadingPayments && recentPayments.length > 0 && (
              <div className="mt-8">
                <RecentPaymentsChart data={recentPayments} />
              </div>
            )}
          </Card>
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
