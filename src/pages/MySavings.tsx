import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Payment } from '../types/index';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { StatsCard } from '../components/StatsCard';
import { Wallet, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { motion } from 'motion/react';

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Savings</h1>
          <p className="text-gray-500 dark:text-white/60 mt-1">Track your contributions and history</p>
        </div>
        <div className="bg-white dark:bg-white/10 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
          <span className="text-gray-500 dark:text-white/60 text-sm">My Shares: </span>
          <span className="text-pink-600 dark:text-pink-300 font-bold text-lg">{member?.share_count || 0}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard 
          title="Total Contributed" 
          value={`৳${totalPaid.toLocaleString()}`} 
          icon={Wallet} 
          color="text-emerald-500 dark:text-emerald-400"
          delay={0.1}
        />
        <StatsCard 
          title="Total Penalties" 
          value={`৳${totalPenalty.toLocaleString()}`} 
          icon={XCircle} 
          color="text-red-500 dark:text-red-400"
          delay={0.2}
        />
        <StatsCard 
          title="Last Payment" 
          value={lastPayment ? `${lastPayment.month} ${lastPayment.year}` : 'N/A'} 
          icon={Calendar} 
          color="text-blue-500 dark:text-blue-400"
          delay={0.3}
        />
      </div>

      <Card className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.length === 0 ? (
              <div className="text-center py-10 text-gray-400 dark:text-white/40">
                No payment history found.
              </div>
            ) : (
              payments.map((payment, index) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${
                      payment.payment_status === 'paid' 
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {payment.payment_status === 'paid' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{payment.month} {payment.year}</h4>
                      <p className="text-xs text-gray-500 dark:text-white/50">
                        Paid on {new Date(payment.payment_date || '').toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">৳{payment.total_amount.toLocaleString()}</p>
                    {payment.penalty > 0 && (
                      <p className="text-xs text-red-500 dark:text-red-400">+৳{payment.penalty} penalty</p>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
