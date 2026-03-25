import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Member, Payment } from '../types/index';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Download, FileText, CheckCircle, XCircle, AlertTriangle, RefreshCcw, Image as ImageIcon, FileSpreadsheet, ChevronDown, DollarSign, Target } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Skeleton } from '../components/ui/Skeleton';
import { cn } from '../lib/utils';
import { toJpeg } from 'html-to-image';

export default function Reports() {
  const { isAdmin } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const exportButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportButtonRef.current && !exportButtonRef.current.contains(event.target as Node)) {
        setShowExportOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    generateReport();
  }, [selectedMonth, selectedYear]);

  const generateReport = async (isRefresh = false) => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [membersRes, paymentsRes] = await Promise.all([
        supabase.from('members').select('*').order('name'),
        supabase.from('payments').select('*').eq('month', selectedMonth).eq('year', parseInt(selectedYear))
      ]);
      
      if (membersRes.error) throw membersRes.error;
      if (paymentsRes.error) throw paymentsRes.error;

      const members = membersRes.data || [];
      const payments = paymentsRes.data || [];

      // Combine data
      const report = members.map(member => {
        const payment = payments.find(p => p.member_id === member.id);
        return {
          ...member,
          paymentStatus: payment ? payment.payment_status : 'unpaid',
          paymentMethod: payment ? payment.payment_method : '-',
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
      // Add a small delay for smoother transition
      setTimeout(() => {
        setLoading(false);
      }, 800);
    }
  };

  const exportReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Phone,Shares,Status,Method,Amount Paid,Penalty,Expected Amount\n"
      + reportData.map(row => `${row.name},${row.phone},${row.share_count},${row.paymentStatus},${row.paymentMethod || '-'},${row.amountPaid},${row.penalty},${row.expectedAmount}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `savings_report_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportOptions(false);
  };

  const exportAsImage = async () => {
    if (!reportRef.current) return;
    
    const toastId = toast.loading('Generating report image...');
    setShowExportOptions(false);
    
    try {
      // Small delay to ensure any UI states are settled
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await toJpeg(reportRef.current, {
        quality: 0.95,
        backgroundColor: '#f8fafc', // Matches bg-slate-50 or similar
        style: {
          padding: '20px',
          borderRadius: '20px'
        }
      });
      
      const link = document.createElement('a');
      link.download = `savings_report_${selectedMonth}_${selectedYear}.jpeg`;
      link.href = dataUrl;
      link.click();
      
      toast.success('Report image downloaded!', { id: toastId });
    } catch (err) {
      console.error('Error generating image:', err);
      toast.error('Failed to generate report image', { id: toastId });
    }
  };

  const totalCollection = reportData.reduce((sum, item) => sum + item.amountPaid, 0);
  const totalPending = reportData.filter(item => item.paymentStatus !== 'paid').length;
  const collectionGoal = 41 * 1000;
  const collectionProgress = (totalCollection / collectionGoal) * 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Monthly Reports</h1>
          <button 
            onClick={() => generateReport(true)}
            disabled={loading}
            className={cn(
              "p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-all",
              loading && "animate-spin opacity-50"
            )}
            title="Refresh Report"
          >
            <RefreshCcw className="w-5 h-5 text-gray-500 dark:text-white/60" />
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="flex gap-2 w-full sm:w-auto">
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm dark:shadow-none"
            >
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm dark:shadow-none"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="relative" ref={exportButtonRef}>
            <Button 
              onClick={() => setShowExportOptions(!showExportOptions)} 
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-indigo-500/20 justify-center rounded-xl px-6"
            >
              <Download className="w-4 h-4" />
              Export Report
              <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", showExportOptions && "rotate-180")} />
            </Button>

            <AnimatePresence>
              {showExportOptions && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 z-[60] overflow-hidden"
                >
                  <div className="p-2 space-y-1">
                    <button
                      onClick={exportReport}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-white/80 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Export as CSV
                    </button>
                    <button
                      onClick={exportAsImage}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-white/80 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-colors"
                    >
                      <ImageIcon className="w-4 h-4" />
                      Export as JPEG
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div ref={reportRef} className="space-y-6 p-1">
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
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/20 dark:to-orange-500/20 border-amber-100 dark:border-white/10 shadow-sm dark:shadow-none">
              <CardContent className="p-6 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-gray-500 dark:text-white/60 text-sm">Collection Goal</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">৳{collectionGoal.toLocaleString()}</h3>
                  </div>
                  <div className="p-3 bg-white dark:bg-white/10 rounded-xl shadow-sm dark:shadow-none">
                    <Target className="w-6 h-6 text-amber-500 dark:text-amber-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-gray-400 dark:text-white/40">Progress</span>
                    <span className="text-amber-600 dark:text-amber-400">{Math.min(100, Math.round(collectionProgress))}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${Math.min(100, collectionProgress)}%` }}
                      className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-500/20 dark:to-blue-500/20 border-indigo-100 dark:border-white/10 shadow-sm dark:shadow-none">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-white/60 text-sm">Pending Members</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalPending}</h3>
                </div>
                <div className="p-3 bg-white dark:bg-white/10 rounded-xl shadow-sm dark:shadow-none">
                  <AlertTriangle className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
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
          </>
        )}
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
                  <th className="p-4 font-medium text-center">Method</th>
                  <th className="p-4 font-medium text-center">Penalty</th>
                  <th className="p-4 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-700 dark:text-white/80">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td className="p-4"><Skeleton className="h-5 w-32" /></td>
                      <td className="p-4"><Skeleton className="h-5 w-8 mx-auto" /></td>
                      <td className="p-4"><Skeleton className="h-5 w-16 mx-auto" /></td>
                      <td className="p-4"><Skeleton className="h-5 w-16 mx-auto" /></td>
                      <td className="p-4"><Skeleton className="h-5 w-12 mx-auto" /></td>
                      <td className="p-4"><Skeleton className="h-6 w-20 rounded-full mx-auto" /></td>
                    </tr>
                  ))
                ) : (
                  reportData.map((row, index) => (
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
                      <td className="p-4 text-center text-gray-500 dark:text-white/60 text-sm">
                        {row.paymentMethod || '-'}
                      </td>
                      <td className="p-4 text-center text-indigo-500 dark:text-indigo-400">
                        {row.penalty > 0 ? `৳${row.penalty}` : '-'}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            row.paymentStatus === 'paid' 
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20' 
                              : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20'
                          }`}>
                            {row.paymentStatus === 'paid' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {row.paymentStatus.toUpperCase()}
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
