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
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const now = new Date();
    const currentMonth = months[now.getMonth()];
    const currentYear = now.getFullYear();

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

    const paidMemberIdsInCurrentMonth = new Set(
      allPayments
        .filter(p => p.month === currentMonth && p.year === currentYear && p.payment_status === 'paid')
        .map(p => p.member_id)
    );
    
    // Unpaid count is total members minus those who paid this month
    const pendingCount = Math.max(0, totalMembers - paidMemberIdsInCurrentMonth.size);

    // Process Chart Data
    const currentMonthIndex = now.getMonth();
    
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
        supabase.from('payments').select('total_amount, month, year, payment_status, member_id')
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

      {/* Standalone Slider Section */}
      <section className="relative group">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gray-100 dark:bg-white/5 aspect-[16/9] md:aspect-[21/7] shadow-2xl border border-gray-200/50 dark:border-white/5">
          {loadingSlider ? (
            <Skeleton className="h-full w-full rounded-[2.5rem]" />
          ) : sliderImages.length > 0 ? (
            <div className="h-full w-full relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute inset-0"
                >
                  <img 
                    src={sliderImages[currentSlide].image_url} 
                    alt={sliderImages[currentSlide].title || 'Slide'} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 w-full p-8 md:p-12">
                    <motion.div
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="max-w-3xl"
                    >
                      {sliderImages[currentSlide].title && (
                        <h2 className="text-2xl md:text-5xl font-black text-white mb-4 tracking-tight drop-shadow-2xl">
                          {sliderImages[currentSlide].title}
                        </h2>
                      )}
                      {sliderImages[currentSlide].description && (
                        <p className="text-white/80 text-xs md:text-xl font-medium max-w-2xl leading-relaxed drop-shadow-lg opacity-90 line-clamp-2 md:line-clamp-none">
                          {sliderImages[currentSlide].description}
                        </p>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation Controls */}
              {sliderImages.length > 1 && (
                <>
                  <div className="absolute top-1/2 -translate-y-1/2 left-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 hidden md:block">
                    <button 
                      onClick={prevSlide}
                      className="p-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 hover:scale-110 transition-all"
                    >
                      <ChevronLeft className="w-8 h-8" />
                    </button>
                  </div>
                  <div className="absolute top-1/2 -translate-y-1/2 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-4 group-hover:translate-x-0 hidden md:block">
                    <button 
                      onClick={nextSlide}
                      className="p-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 hover:scale-110 transition-all"
                    >
                      <ChevronRight className="w-8 h-8" />
                    </button>
                  </div>

                  {/* Progress Indicators */}
                  <div className="absolute bottom-8 right-8 md:right-12 flex gap-2 md:gap-3">
                    {sliderImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSlide(i)}
                        className={cn(
                          "h-1 md:h-1.5 rounded-full transition-all duration-500",
                          currentSlide === i 
                            ? "w-8 md:w-12 bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]" 
                            : "w-1.5 md:w-2 bg-white/30 hover:bg-white/50"
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50 dark:bg-white/10">
              <div className="p-8 rounded-full bg-white dark:bg-white/5 shadow-inner mb-6">
                <ImageIcon className="w-16 h-16 opacity-10" />
              </div>
              <p className="font-black text-gray-300 dark:text-white/20 uppercase tracking-[0.4em] text-sm">Visionary Platform</p>
              <p className="text-xs mt-2 opacity-50 font-medium">Empowering progress through unified vision.</p>
            </div>
          )}
        </div>
      </section>

      {/* Dashboard Header Box */}
      <motion.section 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 p-6 md:p-8 shadow-xl"
      >
        {/* Abstract Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/10 blur-[80px] rounded-full -translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  fetchDashboardData(true);
                  if (isAdmin) fetchRecentPayments();
                  fetchSliderImages();
                }}
                disabled={loading}
                className={cn(
                  "p-2.5 rounded-2xl bg-gray-100 dark:bg-white/10 text-indigo-500 transition-all",
                  loading && "animate-spin opacity-50"
                )}
              >
                <RefreshCcw className="w-5 h-5" />
              </motion.button>
            </div>
            <p className="text-gray-400 dark:text-white/30 font-bold uppercase tracking-[0.3em] text-[10px] flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Welcome back, {member?.name || 'User'}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <CountdownTimer />
            <div className="hidden md:flex px-6 py-3 rounded-2xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-white/50 backdrop-blur-md">
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Bento Grid Stats */}
      <motion.div 
        layout
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
      >
        {loading ? (
          [...Array(5)].map((_, i) => (
            <Skeleton key={`stat-skeleton-${i}`} className="h-32 md:h-40 rounded-3xl" />
          ))
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="h-full p-5 md:p-6 rounded-3xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full -mr-12 -mt-12 group-hover:bg-emerald-500/10 transition-colors" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Savings</span>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white truncate">৳{stats.totalSavings.toLocaleString()}</h3>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="h-full p-5 md:p-6 rounded-3xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full -mr-12 -mt-12 group-hover:bg-indigo-500/10 transition-colors" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Monthly Coll.</span>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white truncate">৳{stats.monthlyCollection.toLocaleString()}</h3>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="h-full p-5 md:p-6 rounded-3xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 group hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-white/20 transition-colors" />
                <div className="flex flex-col h-full relative z-10">
                  <div className="flex items-center justify-between mb-auto text-white/70">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest leading-tight mb-1">Target Monthly Collection</span>
                      <span className="text-sm font-bold text-white">৳{stats.collectionGoal.toLocaleString()}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <div className="flex justify-between items-end mb-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Progress</span>
                       <span className="text-xl font-black">{Math.min(100, Math.round(stats.collectionProgress))}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, stats.collectionProgress)}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="h-full bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.7)]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              onClick={() => navigate('/members')}
              className="cursor-pointer group"
            >
              <div className="h-full p-5 md:p-6 rounded-3xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-xl hover:shadow-purple-500/10 transition-all overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-2xl rounded-full -mr-12 -mt-12 group-hover:bg-purple-500/10 transition-colors" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Members</span>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white transition-colors group-hover:text-purple-600">{stats.totalMembers}</h3>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <div className="h-full p-5 md:p-6 rounded-3xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-xl hover:shadow-amber-500/10 transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl rounded-full -mr-12 -mt-12 group-hover:bg-amber-500/10 transition-colors" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Unpaid Members</span>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">{stats.pendingCount}</h3>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <div className="h-full p-5 md:p-6 rounded-3xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full -mr-12 -mt-12 group-hover:bg-blue-500/10 transition-colors" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Shares</span>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">{stats.totalShares}</h3>
              </div>
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {loading ? (
          <>
            <Skeleton className="h-[350px] rounded-[2.5rem] col-span-1 lg:col-span-2" />
            <Skeleton className="h-[350px] rounded-[2.5rem]" />
          </>
        ) : (
          <>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="lg:col-span-2 min-h-[320px] bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all relative overflow-hidden group flex flex-col"
            >
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full -mr-32 -mt-32 group-hover:bg-indigo-500/10 transition-colors" />
               <div className="relative z-10 flex flex-col h-full">
                 <div className="flex items-center gap-3 mb-6">
                   <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600">
                     <TrendingUp className="w-5 h-5" />
                   </div>
                   <div>
                     <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Monthly Savings</h3>
                     <p className="text-[10px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-[0.2em] mt-0.5">Last 6 Months Performance</p>
                   </div>
                 </div>
                 <div className="flex-1">
                   <MonthlySavingsChart data={chartData.monthly} />
                 </div>
               </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="min-h-[320px] bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:shadow-purple-500/5 transition-all relative overflow-hidden group flex flex-col"
            >
               <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-3xl rounded-full -mr-32 -mt-32 group-hover:bg-purple-500/10 transition-colors" />
               <div className="relative z-10 flex flex-col h-full">
                 <div className="flex items-center gap-3 mb-6">
                   <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600">
                     <Users className="w-5 h-5" />
                   </div>
                   <div>
                     <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Share Distribution</h3>
                     <p className="text-[10px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-[0.2em] mt-0.5">Stakeholder Overview</p>
                   </div>
                 </div>
                 <div className="flex-1">
                   <DistributionChart data={chartData.distribution} />
                 </div>
               </div>
            </motion.div>
          </>
        )}
        
        {isAdmin && (
          <div className="lg:col-span-3">
             <section className="relative overflow-hidden bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[2.5rem] p-6 md:p-8 shadow-xl">
               <div className="flex items-center justify-between mb-8 px-2">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Recent Activity</h3>
                  </div>
                  <motion.button 
                    whileHover={{ x: 5 }}
                    onClick={() => navigate('/members')}
                    className="flex items-center gap-2 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 rounded-xl transition-all"
                  >
                    View All
                    <TrendingUp className="w-3.5 h-3.5 rotate-90" />
                  </motion.button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div className="space-y-3">
                    {loadingPayments ? (
                      [...Array(3)].map((_, i) => (
                        <Skeleton key={`payment-skeleton-${i}`} className="h-20 rounded-2xl" />
                      ))
                    ) : recentPayments.length > 0 ? (
                      recentPayments.map((p, i) => (
                        <motion.div 
                          key={p.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-indigo-500/30 hover:bg-white dark:hover:bg-white/10 transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-600 overflow-hidden shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all shrink-0">
                              {p.members?.photo_url ? (
                                <img src={p.members.photo_url} alt={p.members.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white font-black text-lg">
                                  {p.members?.name?.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-base font-black text-gray-900 dark:text-white leading-tight truncate">{p.members?.name}</p>
                              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5 opacity-60 leading-none">{p.month} {p.year}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">৳{p.total_amount.toLocaleString()}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">
                              {new Date(p.payment_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="h-48 flex flex-col items-center justify-center text-gray-400 bg-gray-50 dark:bg-white/5 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-white/10">
                         <AlertCircle className="w-6 h-6 opacity-20 mb-3" />
                         <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">No settlements found</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 dark:bg-white/10 rounded-[2rem] p-6 border border-gray-100 dark:border-white/5">
                    <div className="mb-4 flex items-center justify-between">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Growth Visualization</h4>
                       <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
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
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-950 rounded-[2rem] p-6 md:p-8 text-white shadow-2xl border border-white/5">
         <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/30 blur-[130px] rounded-full -translate-y-1/2" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/20 blur-[100px] rounded-full translate-y-1/2" />
         </div>
         
         <div className="relative z-10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
               <div className="space-y-1.5">
                 <div className="flex items-center gap-2.5">
                   <div className="h-10 w-10 rounded-lg bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center">
                     <TrendingUp className="w-5 h-5 text-indigo-300" />
                   </div>
                   <div>
                     <h3 className="text-xl md:text-2xl font-black tracking-tight">Savings Growth History</h3>
                     <p className="text-[8px] font-bold text-white/40 uppercase tracking-[0.3em]">Cumulative performance index</p>
                   </div>
                 </div>
               </div>
               
               <div className="flex items-center gap-3 bg-white/5 backdrop-blur-2xl rounded-xl p-3 border border-white/10 shadow-2xl">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Total Assets</p>
                    <p className="text-lg md:text-xl font-black text-white leading-none">৳{stats.totalSavings.toLocaleString()}</p>
                  </div>
                  <div className="h-8 w-px bg-white/20" />
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <TrendingUp className="w-5 h-5" />
                  </div>
               </div>
            </div>
            
            <div className="w-full h-[280px] bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5 shadow-inner">
               <div className="h-full w-full">
                  {loading ? (
                    <Skeleton className="h-full w-full rounded-2xl opacity-10" />
                  ) : (
                    <GrowthChart data={chartData.growth} />
                  )}
               </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 opacity-50">
               <div className="flex items-center gap-1.5">
                 <div className="w-2 h-2 rounded-full bg-indigo-500" />
                 <span className="text-[8px] font-bold uppercase tracking-widest italic">Growth Trend</span>
               </div>
               <div className="flex items-center gap-1.5">
                 <div className="w-2 h-2 rounded-full bg-emerald-500" />
                 <span className="text-[8px] font-bold uppercase tracking-widest italic">Asset Accumulation</span>
               </div>
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
