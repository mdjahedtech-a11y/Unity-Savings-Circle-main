import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Payment } from '../types/index';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Wallet, Calendar, CheckCircle, XCircle, Clock, Phone, User, Award, TrendingUp, ArrowUpRight, AlertTriangle, Camera, Loader2, RefreshCcw, FileText, Sparkles, Download, ArrowRight, BadgeCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Skeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { AgreementForm } from '../components/AgreementForm';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { NotificationToggle } from '../components/NotificationToggle';

export default function MySavings() {
  const { member, refreshProfile, isAdmin, cache, setCache } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>(cache.mySavings?.payments || []);
  const [loading, setLoading] = useState(!cache.mySavings && !member);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (member) {
      fetchMyPayments();
    }
  }, [member]);

  // Safety timeout for loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.warn('MySavings loading safety timeout fired');
        setLoading(false);
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [loading]);

  const fetchMyPayments = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      if (!cache.mySavings || isRefresh) setLoading(true);
      
      const { data, error } = await supabase
        .from('payments')
        .select('id, month, year, total_amount, penalty, payment_date, payment_method, payment_status, created_at')
        .eq('member_id', member?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const paymentsData = data || [];
      setPayments(paymentsData);
      
      // Update global cache
      setCache('mySavings', { payments: paymentsData });
      
      if (isRefresh) toast.success('Data refreshed');
    } catch (error) {
      console.error('Error fetching payments:', error);
      if (isRefresh) toast.error('Failed to refresh data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([
      fetchMyPayments(true),
      refreshProfile()
    ]);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB for remove.bg, but we'll keep it reasonable)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    const toastId = toast.loading('Removing background and resizing...');
    
    try {
      // 1. Remove background and resize to passport size
      const processedImageBase64 = await removeBackground(file);
      
      // 2. Update Supabase
      const { error } = await supabase
        .from('members')
        .update({ photo_url: processedImageBase64 })
        .eq('id', member?.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Profile picture updated successfully', { id: toastId });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to update profile picture', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.total_amount, 0);
  const totalPenalty = payments.reduce((sum, p) => sum + p.penalty, 0);
  const lastPayment = payments[0];

  if (!loading && !member) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
          <User className="h-10 w-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Not Found</h2>
        <p className="text-gray-500 dark:text-white/60 max-w-md">
          We couldn't find a member profile associated with your account. 
          Please contact the administrator to link your phone number.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12">
      {/* Dynamic Profile Header */}
      <section className="relative group">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[2rem] bg-indigo-950 p-8 md:p-12 text-white shadow-2xl"
        >
          {/* Subtle Ambient Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-10">
            {/* Profile Picture with Status Ring */}
            <div className="relative shrink-0">
              <div className="relative p-1 rounded-[2.5rem] bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-500 shadow-2xl">
                <div className="h-32 w-32 rounded-[2.3rem] bg-indigo-900 overflow-hidden relative border-4 border-indigo-950">
                  <div className="flex h-full w-full items-center justify-center bg-indigo-900 text-4xl font-black text-white/20">
                    {member?.photo_url ? (
                      <img 
                        src={member.photo_url} 
                        alt={member.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      member?.name?.charAt(0) || 'A'
                    )}
                  </div>
                  
                  {uploading && (
                    <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                      <Loader2 className="h-8 w-8 animate-spin text-white mb-2" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest text-center px-2">Processing</span>
                    </div>
                  )}
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={triggerFileInput}
                className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-xl border border-indigo-100 hover:bg-indigo-50 transition-colors z-20"
              >
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
              </motion.button>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            
            {/* Member Info */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                  <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">
                    {member?.role === 'admin' ? 'Strategic Partner' : 'Active Member'}
                  </span>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest border border-white/5",
                      refreshing && "animate-pulse"
                    )}
                  >
                    <RefreshCcw className={cn("w-3 h-3", refreshing && "animate-spin")} />
                    Refresh
                  </button>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-sm flex items-center justify-center md:justify-start gap-2">
                  {member?.name || 'Administrator'}
                  <BadgeCheck className="w-6 h-6 md:w-8 md:h-8 text-blue-400 fill-blue-400/20" />
                </h1>
                <p className="text-indigo-200/60 font-medium tracking-wide flex items-center justify-center md:justify-start gap-2">
                   <Phone className="w-3.5 h-3.5" />
                   {member?.phone || 'N/A'}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/80">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <div className="text-left">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Portfolio Value</p>
                    <p className="text-lg font-black text-white leading-none">৳{totalPaid.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/80">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <div className="text-left">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Equity Ownership</p>
                    <p className="text-lg font-black text-white leading-none">{member?.share_count || 0} Shares</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-3">
                <NotificationToggle />
                <button 
                  onClick={() => setShowAgreementModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-950 text-[11px] font-black uppercase tracking-widest shadow-lg hover:shadow-indigo-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Agreement
                </button>
                <button 
                  onClick={() => navigate('/reports')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 text-white text-[11px] font-black uppercase tracking-widest shadow-lg hover:shadow-indigo-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Reports
                </button>
                <a 
                  href="https://squoosh.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white/80 text-[11px] font-black uppercase tracking-widest hover:bg-white/20 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Tool
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))
        ) : (
          <>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
              <div className="h-full p-6 rounded-[2rem] bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Yield Progress</span>
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">৳{totalPaid.toLocaleString()}</h3>
                <div className="mt-2 h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
              <div className="h-full p-6 rounded-[2rem] bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Deductions</span>
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">৳{totalPenalty.toLocaleString()}</h3>
                <p className="text-[10px] font-bold text-purple-500/60 uppercase tracking-tighter mt-1">Maintenance & Fees</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
              <div className="h-full p-6 rounded-[2rem] bg-indigo-600 text-white shadow-xl shadow-indigo-500/20">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-2xl bg-white/20 text-white">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Cycle Period</span>
                </div>
                <h3 className="text-2xl font-black truncate">{lastPayment ? `${lastPayment.month} ${lastPayment.year}` : 'Pending'}</h3>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-tighter mt-1">Recent Settlement</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
              <div className="h-full p-6 rounded-[2rem] bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600">
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Asset Ranking</span>
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">Platinum</h3>
                <p className="text-[10px] font-bold text-blue-500/60 uppercase tracking-widest mt-1">Verified Partner</p>
              </div>
            </motion.div>
          </>
        )}
      </div>

      {/* Activity Timeline */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Financial Activity</h2>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Transaction history and settlement logs</p>
          </div>
          <button className="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 dark:hover:bg-indigo-500/10 px-4 py-2 rounded-xl transition-all">
            Filter Logs
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-[2rem]" />
            ))
          ) : payments.length > 0 ? (
            <AnimatePresence>
              {payments.map((payment, index) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[2rem] p-6 hover:shadow-xl hover:shadow-indigo-500/5 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.5rem] shadow-lg transition-all group-hover:scale-110 group-hover:rotate-6",
                        payment.payment_status === 'paid' 
                          ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                          : 'bg-amber-500 text-white shadow-amber-500/20'
                      )}>
                        {payment.payment_status === 'paid' ? <CheckCircle className="h-8 w-8" /> : <Clock className="h-8 w-8" />}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <h4 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{payment.month}</h4>
                           <span className="text-xs font-bold text-indigo-500/60">{payment.year}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/5 text-[10px] font-black text-gray-500 uppercase">
                            <Calendar className="w-3 h-3" />
                            {new Date(payment.payment_date || '').toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                          </div>
                          {payment.payment_method && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/5 text-[10px] font-black text-indigo-500 uppercase border border-indigo-500/10">
                              <Wallet className="w-3 h-3" />
                              {payment.payment_method}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-10">
                      <div className="text-right">
                        <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">৳{payment.total_amount.toLocaleString()}</p>
                        {payment.penalty > 0 && (
                          <div className="flex items-center justify-end gap-1 text-[10px] font-black text-purple-500 uppercase tracking-tighter mt-1">
                            <AlertTriangle className="h-3 w-3" />
                            ৳{payment.penalty} Penalty Included
                          </div>
                        )}
                      </div>
                      <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-300 dark:text-white/20 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                         <ArrowUpRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 bg-white dark:bg-white/5 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-white/5">
              <div className="h-24 w-24 rounded-[3rem] bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-300 dark:text-white/10">
                <Clock className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-gray-900 dark:text-white">No Activity Detected</h3>
                <p className="text-sm font-medium text-gray-400 max-w-[280px]">Your settlement history will appear here once verified by the board.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showAgreementModal}
        onClose={() => setShowAgreementModal(false)}
        title="Institutional Agreement"
        className="max-w-5xl"
      >
        <div className="bg-white dark:bg-indigo-950/40 p-4 rounded-3xl overflow-hidden border border-gray-100 dark:border-white/5 shadow-2xl">
          <AgreementForm documentOnly={true} />
        </div>
      </Modal>
    </div>
  );
}
