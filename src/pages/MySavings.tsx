import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Payment } from '../types/index';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Wallet, Calendar, CheckCircle, XCircle, Clock, Phone, User, Award, TrendingUp, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Skeleton } from '../components/ui/Skeleton';
import { cn } from '../lib/utils';

export default function MySavings() {
  const { member } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (member) {
      fetchMyPayments();
    }
  }, [member]);

  const fetchMyPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('member_id', member?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
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
    <div className="space-y-8 pb-12">
      {/* Hero Section - Colorful & Stylish */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl shadow-purple-500/20"
      >
        {/* Decorative Circles */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-pink-500/20 blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <div className="h-24 w-24 rounded-full border-4 border-white/30 bg-white/20 p-1 backdrop-blur-md">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-tr from-white/40 to-white/10 text-3xl font-bold">
                {member?.name?.charAt(0) || 'A'}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 border-2 border-white shadow-lg">
              <Award className="h-4 w-4 text-white" />
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">{member?.name || 'Administrator'}</h1>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-widest border border-white/10">
                {member?.role === 'admin' ? 'Admin' : 'Active Member'}
              </span>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-white/80">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span className="text-sm font-medium">{member?.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {member?.created_at 
                    ? `Joined ${new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                    : 'System Account'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 min-w-[140px]">
            <span className="text-[10px] uppercase tracking-[0.2em] font-black text-white/60 mb-1">Total Shares</span>
            <span className="text-4xl font-black">{member?.share_count || 0}</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          [...Array(3)].map((_, i) => (
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
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="group relative overflow-hidden border-none bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/20">
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 transition-transform group-hover:scale-150" />
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-1">Total Contributed</p>
                      <h3 className="text-3xl font-black">৳{totalPaid.toLocaleString()}</h3>
                    </div>
                    <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-md">
                      <Wallet className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="group relative overflow-hidden border-none bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-xl shadow-rose-500/20">
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 transition-transform group-hover:scale-150" />
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-rose-100 text-xs font-bold uppercase tracking-widest mb-1">Total Penalties</p>
                      <h3 className="text-3xl font-black">৳{totalPenalty.toLocaleString()}</h3>
                    </div>
                    <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-md">
                      <XCircle className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="group relative overflow-hidden border-none bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/20">
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 transition-transform group-hover:scale-150" />
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Last Payment</p>
                      <h3 className="text-2xl font-black">{lastPayment ? `${lastPayment.month} ${lastPayment.year}` : 'N/A'}</h3>
                    </div>
                    <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-md">
                      <Calendar className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      <Card className="overflow-hidden border-none bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl shadow-2xl shadow-gray-200/50 dark:shadow-none">
        <CardHeader className="border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 px-8 py-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-black tracking-tight text-gray-900 dark:text-white">Payment History</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-500/10 text-pink-500">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-8 gap-4 sm:gap-0">
                  <div className="flex items-center gap-6 w-full sm:w-auto">
                    <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                  <div className="w-full sm:w-auto pl-20 sm:pl-0 space-y-2 flex flex-col items-start sm:items-end">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))
            ) : payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-white/20">
                <Clock className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-lg font-medium">No payment history found.</p>
              </div>
            ) : (
              <AnimatePresence>
                {payments.map((payment, index) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-8 hover:bg-gray-50 dark:hover:bg-white/5 transition-all gap-4 sm:gap-0"
                  >
                    <div className="flex items-center gap-6 w-full sm:w-auto">
                      <div className={cn(
                        "flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-transform group-hover:scale-110",
                        payment.payment_status === 'paid' 
                          ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                          : 'bg-amber-500 text-white shadow-amber-500/20'
                      )}>
                        {payment.payment_status === 'paid' ? <CheckCircle className="h-7 w-7" /> : <Clock className="h-7 w-7" />}
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">{payment.month} {payment.year}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest">
                            {new Date(payment.payment_date || '').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          {payment.payment_method && (
                            <>
                              <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-white/20" />
                              <span className="text-xs font-black text-pink-500 uppercase tracking-widest">via {payment.payment_method}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto pl-20 sm:pl-0">
                      <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">৳{payment.total_amount.toLocaleString()}</p>
                      {payment.penalty > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 uppercase tracking-widest mt-1">
                          <AlertTriangle className="h-3 w-3" />
                          +৳{payment.penalty} Penalty
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
