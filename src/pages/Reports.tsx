import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Member, Payment } from '../types/index';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Download, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export default function Reports() {
  const { isAdmin } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateReport();
  }, [selectedMonth, selectedYear]);

  const generateReport = async () => {
    setLoading(true);
    try {
      // Fetch all members
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('*')
        .order('name');
      
      if (membersError) throw membersError;

      // Fetch payments for the selected month/year
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('month', selectedMonth)
        .eq('year', parseInt(selectedYear));

      if (paymentsError) throw paymentsError;

      // Combine data
      const report = members.map(member => {
        const payment = payments?.find(p => p.member_id === member.id);
        return {
          ...member,
          paymentStatus: payment ? payment.payment_status : 'unpaid',
          amountPaid: payment ? payment.total_amount : 0,
          penalty: payment ? payment.penalty : 0,
          expectedAmount: member.share_count * 1000
        };
      });

      setReportData(report);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Phone,Shares,Status,Amount Paid,Penalty,Expected Amount\n"
      + reportData.map(row => `${row.name},${row.phone},${row.share_count},${row.paymentStatus},${row.amountPaid},${row.penalty},${row.expectedAmount}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `savings_report_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalCollection = reportData.reduce((sum, item) => sum + item.amountPaid, 0);
  const totalPending = reportData.filter(item => item.paymentStatus !== 'paid').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Monthly Reports</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="flex gap-2 w-full sm:w-auto">
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 shadow-sm dark:shadow-none"
            >
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 shadow-sm dark:shadow-none"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <Button onClick={exportReport} className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white gap-2 shadow-sm justify-center">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/20 dark:to-purple-500/20 border-indigo-100 dark:border-white/10 shadow-sm dark:shadow-none">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-white/60 text-sm">Total Collection</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">৳{totalCollection.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-white dark:bg-white/10 rounded-xl shadow-sm dark:shadow-none">
              <DollarSign className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-500/20 dark:to-rose-500/20 border-pink-100 dark:border-white/10 shadow-sm dark:shadow-none">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-white/60 text-sm">Pending Members</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalPending}</h3>
            </div>
            <div className="p-3 bg-white dark:bg-white/10 rounded-xl shadow-sm dark:shadow-none">
              <AlertTriangle className="w-6 h-6 text-pink-500 dark:text-pink-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-500/20 dark:to-cyan-500/20 border-blue-100 dark:border-white/10 shadow-sm dark:shadow-none">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-white/60 text-sm">Total Shares</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {reportData.reduce((sum, item) => sum + item.share_count, 0)}
              </h3>
            </div>
            <div className="p-3 bg-white dark:bg-white/10 rounded-xl shadow-sm dark:shadow-none">
              <FileText className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-none">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Detailed Report - {selectedMonth} {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-white/60 text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium">Member</th>
                  <th className="p-4 font-medium text-center">Shares</th>
                  <th className="p-4 font-medium text-center">Expected</th>
                  <th className="p-4 font-medium text-center">Paid</th>
                  <th className="p-4 font-medium text-center">Penalty</th>
                  <th className="p-4 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-700 dark:text-white/80">
                {reportData.map((row, index) => (
                  <motion.tr 
                    key={row.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15, delay: Math.min(index * 0.02, 0.2) }}
                    className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4 font-medium">{row.name}</td>
                    <td className="p-4 text-center">{row.share_count}</td>
                    <td className="p-4 text-center">৳{row.expectedAmount.toLocaleString()}</td>
                    <td className="p-4 text-center text-emerald-600 dark:text-emerald-400 font-medium">
                      {row.amountPaid > 0 ? `৳${row.amountPaid.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-4 text-center text-red-500 dark:text-red-400">
                      {row.penalty > 0 ? `৳${row.penalty}` : '-'}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          row.paymentStatus === 'paid' 
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20' 
                            : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/20'
                        }`}>
                          {row.paymentStatus === 'paid' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {row.paymentStatus.toUpperCase()}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper component for icon
function DollarSign({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
