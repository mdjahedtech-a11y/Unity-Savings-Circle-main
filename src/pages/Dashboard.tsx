import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { StatsCard } from '../components/StatsCard';
import { MonthlySavingsChart, DistributionChart, GrowthChart, RecentPaymentsChart } from '../components/Charts';
import { CountdownTimer } from '../components/CountdownTimer';
import { Users, Wallet, TrendingUp, AlertCircle, RefreshCcw, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { LoadingScreen } from '../components/LoadingScreen';
import { Marquee } from '../components/Marquee';
import { Modal } from '../components/ui/Modal';
import { AgreementForm } from '../components/AgreementForm';

export default function Dashboard() {
  const { member, isAdmin, dashboardLoaded, setDashboardLoaded, cache, setCache } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<any[]>(cache.dashboard?.members || []);
  const [allPayments, setAllPayments] = useState<any[]>(cache.dashboard?.allPayments || []);
  const [recentPayments, setRecentPayments] = useState<any[]>(cache.dashboard?.recentPayments || []);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loading, setLoading] = useState(!cache.dashboard);
  const [showAgreementPopup, setShowAgreementPopup] = useState(false);
  const [sliderImages, setSliderImages] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadingSlider, setLoadingSlider] = useState(true);

  const fetchSliderImages = async () => {
    try {
      const { data, error } = await supabase
        .from('slider_images')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });
      
      if (!error && data) {
        setSliderImages(data);
      }
    } catch (err) {
      console.error('Slider fetch error:', err);
    } finally {
      setLoadingSlider(false);
    }
  };

  useEffect(() => {
    fetchSliderImages();
  }, []);

  useEffect(() => {
    if (sliderImages.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [sliderImages]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + sliderImages.length) % sliderImages.length);

  useEffect(() => {
    if (member && !member.agreement_accepted) {
      setShowAgreementPopup(true);
    }
  }, [member?.agreement_accepted]);

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
          id, month, year, payment_date, total_amount, member_id,
          members (name, photo_url)
        `)
        .order('payment_date', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      setRecentPayments(data || []);
      
      // Update cache
      if (cache.dashboard) {
        setCache('dashboard', { ...cache.dashboard, recentPayments: data || [] });
      }
    } catch (error) {
      console.error('Error fetching recent payments:', error);
    } finally {
      setLoadingPayments(false);
    }
  };

  const fetchDashboardData = async (isRefresh = false) => {
    if (!cache.dashboard || isRefresh) setLoading(true);
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
      
      // Update global cache
      setCache('dashboard', { 
        stats: null, // stats are calculated via useMemo
        members: membersData, 
        allPayments: allPaymentsData,
        recentPayments: cache.dashboard?.recentPayments || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setDashboardLoaded(true);
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
    <div className="space-y-10 pb-12">
      <div className="-mt-8 -mx-4 sm:-mx-8">
        <Marquee />
      </div>

      {/* Modern Slider Section */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
            <p className="text-gray-400 dark:text-white/30 font-bold uppercase tracking-widest text-xs mt-2">
              Welcome back, {member?.name || 'User'}
            </p>
          </div>
          <div className="flex items-center gap-3">
             <CountdownTimer />
             <motion.button 
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  fetchDashboardData(true);
                  if (isAdmin) fetchRecentPayments();
                }}
                disabled={loading}
                className={cn(
                  "p-3 rounded-2xl bg-white dark:bg-white/5 shadow-sm border border-gray-100 dark:border-white/10 text-indigo-500 transition-all",
                  loading && "animate-spin opacity-50"
                )}
              >
                <RefreshCcw className="w-5 h-5" />
              </motion.button>
          </div>
        </div>

        <div className="relative group overflow-hidden rounded-[2.5rem] bg-gray-100 dark:bg-white/5 aspect-[16/9] md:aspect-[21/9] shadow-2xl">
          {loadingSlider ? (
            <Skeleton className="h-full w-full rounded-[2.5rem]" />
          ) : sliderImages.length > 0 ? (
            <div className="h-full w-full relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <img 
                    src={sliderImages[currentSlide].image_url} 
                    alt={sliderImages[currentSlide].title || 'Slide'} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {(sliderImages[currentSlide].title || sliderImages[currentSlide].description) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-12">
                      <motion.h2 
                        initial={{ y: 20, opacity: 0 }} 
                        animate={{ y: 0, opacity: 1 }} 
                        className="text-2xl md:text-4xl font-black text-white mb-2"
                      >
                        {sliderImages[currentSlide].title}
                      </motion.h2>
                      <motion.p 
                        initial={{ y: 20, opacity: 0 }} 
                        animate={{ y: 0, opacity: 1 }} 
                        transition={{ delay: 0.1 }}
                        className="text-white/70 text-sm md:text-lg max-w-2xl"
                      >
                        {sliderImages[currentSlide].description}
                      </motion.p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation Controls */}
              {sliderImages.length > 1 && (
                <>
                  <div className="absolute top-1/2 -translate-y-1/2 left-4 md:left-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={prevSlide}
                      className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="absolute top-1/2 -translate-y-1/2 right-4 md:right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={nextSlide}
                      className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Indicators */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {sliderImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSlide(i)}
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-300",
                          currentSlide === i ? "w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" : "w-1.5 bg-white/40"
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
              <div className="p-6 rounded-3xl bg-gray-50 dark:bg-white/5 mb-4">
                <ImageIcon className="w-12 h-12 opacity-20" />
              </div>
              <p className="font-bold opacity-40 uppercase tracking-widest text-sm">Welcome to our platform</p>
              <p className="text-xs mt-1">Admin has not added any slides yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Stats Cards Moved to Secondary Row or kept minimal */}
      <motion.div 
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6"
      >
        {loading ? (
          [...Array(5)].map((_, i) => (
            <Skeleton key={`stat-skeleton-${i}`} className="h-40 rounded-[2.5rem]" />
          ))
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="h-full p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Savings</span>
                </div>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white">৳{stats.totalSavings.toLocaleString()}</h3>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="h-full p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Monthly Collection</span>
                </div>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white">৳{stats.monthlyCollection.toLocaleString()}</h3>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="h-full p-8 rounded-[2.5rem] bg-indigo-600 text-white shadow-xl shadow-indigo-500/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Collection Goal</span>
                  <div className="p-2 rounded-xl bg-white/20">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-3xl font-black mb-4">৳{stats.collectionGoal.toLocaleString()}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                    <span>Progress</span>
                    <span>{Math.min(100, Math.round(stats.collectionProgress))}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, stats.collectionProgress)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-white rounded-full shadow-[0_0_10px_white]"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              onClick={() => navigate('/members')}
              className="cursor-pointer group"
            >
              <div className="h-full p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-xl hover:shadow-purple-500/5 transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Members</span>
                </div>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white transition-colors group-hover:text-purple-600">{stats.totalMembers}</h3>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <div className="h-full p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-xl hover:shadow-amber-500/5 transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pending Payments</span>
                </div>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stats.pendingCount}</h3>
              </div>
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {loading ? (
          <>
            <Skeleton className="h-[450px] rounded-[3rem] col-span-1 lg:col-span-2" />
            <Skeleton className="h-[450px] rounded-[3rem]" />
          </>
        ) : (
          <>
            <div className="lg:col-span-2 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[3rem] p-8 shadow-sm">
               <MonthlySavingsChart data={chartData.monthly} />
            </div>
            <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[3rem] p-8 shadow-sm">
               <DistributionChart data={chartData.distribution} />
            </div>
          </>
        )}
        
        {isAdmin && (
          <div className="lg:col-span-3">
             <section className="relative overflow-hidden bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[3rem] p-8 shadow-xl">
               <div className="flex items-center justify-between mb-10 px-4">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Recent Activity</h3>
                  </div>
                  <motion.button 
                    whileHover={{ x: 5 }}
                    onClick={() => navigate('/members')}
                    className="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-500/10 px-6 py-3 rounded-2xl transition-all"
                  >
                    View All
                    <TrendingUp className="w-4 h-4 rotate-90" />
                  </motion.button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  <div className="space-y-4">
                    {loadingPayments ? (
                      [...Array(3)].map((_, i) => (
                        <Skeleton key={`payment-skeleton-${i}`} className="h-24 rounded-3xl" />
                      ))
                    ) : recentPayments.length > 0 ? (
                      recentPayments.map((p, i) => (
                        <motion.div 
                          key={p.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-center justify-between p-5 bg-gray-50 dark:bg-white/5 rounded-3xl border border-transparent hover:border-indigo-500/30 hover:bg-white dark:hover:bg-white/10 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group"
                        >
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-600 overflow-hidden shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all">
                              {p.members?.photo_url ? (
                                <img src={p.members.photo_url} alt={p.members.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white font-black text-xl">
                                  {p.members?.name?.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-lg font-black text-gray-900 dark:text-white leading-tight">{p.members?.name}</p>
                              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1 opacity-60">{p.month} {p.year}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">৳{p.total_amount.toLocaleString()}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">
                              {new Date(p.payment_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50 dark:bg-white/5 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-white/10">
                         <div className="p-4 rounded-full bg-gray-100 dark:bg-white/5 mb-4">
                           <AlertCircle className="w-8 h-8 opacity-20" />
                         </div>
                         <p className="text-sm font-bold uppercase tracking-widest opacity-40">No settlements found</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 dark:bg-white/5 rounded-[3rem] p-8 border border-white/40 dark:border-white/5">
                    <div className="mb-6 flex items-center justify-between">
                       <h4 className="text-sm font-black uppercase tracking-widest text-gray-400">Growth Visualization</h4>
                       <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                    </div>
                    {!loadingPayments && recentPayments.length > 0 && (
                      <RecentPaymentsChart data={recentPayments} />
                    )}
                  </div>
               </div>
             </section>
          </div>
        )}
      </div>

      {/* Global Growth Visualization */}
      <section className="relative overflow-hidden bg-indigo-900 rounded-[3rem] p-8 md:p-12 text-white shadow-2xl">
         <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-white/20 blur-[150px] rounded-full -translate-y-1/2" />
         </div>
         
         <div className="relative z-10 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
               <div className="space-y-2">
                 <h3 className="text-3xl font-black tracking-tight">Savings Growth History</h3>
               </div>
               <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Total Savings</p>
                    <p className="text-xl font-black text-white leading-none">৳{stats.totalSavings.toLocaleString()}</p>
                  </div>
                  <div className="h-10 w-px bg-white/10" />
                  <TrendingUp className="w-8 h-8 text-emerald-400" />
               </div>
            </div>
            
            <div className="w-full h-[400px] bg-white/5 rounded-[2rem] border border-white/10 p-6">
              {loading ? (
                <Skeleton className="h-full w-full rounded-2xl" />
              ) : (
                <GrowthChart data={chartData.growth} />
              )}
            </div>
         </div>
      </section>

      {/* Agreement Popup */}
      <Modal
        isOpen={showAgreementPopup}
        onClose={() => setShowAgreementPopup(false)}
        title="Membership Agreement"
        className="max-w-4xl"
        closable={!!member?.agreement_accepted}
      >
        <div className="text-sm font-medium text-gray-500 dark:text-white/50 mb-8 px-2 border-l-4 border-indigo-500">
          {!member?.agreement_accepted 
            ? "Please review and accept our membership agreement to continue using the application."
            : "Your agreement has been successfully completed. You can download it below or view it later in your profile."
          }
        </div>
        <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-[2rem]">
           <AgreementForm />
        </div>
      </Modal>
    </div>
  );
}
