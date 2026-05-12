import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Member, Payment } from '../types/index';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Download, 
  FileText, 
  CheckCircle,
  XCircle,
  AlertTriangle, 
  RefreshCcw, 
  FileSpreadsheet, 
  ChevronDown, 
  DollarSign, 
  Target,
  Users,
  Wallet,
  PieChart,
  TrendingUp,
  Coins,
  Briefcase,
  Clock,
  Zap,
  ShieldCheck,
  Award,
  Calendar,
  PiggyBank
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Skeleton } from '../components/ui/Skeleton';
import { cn } from '../lib/utils';
import html2canvas from 'html2canvas';

export default function Reports() {
  const { isAdmin } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [reportData, setReportData] = useState<any[]>([]);
  const [allTimeTotal, setAllTimeTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [issuedDate, setIssuedDate] = useState(new Date().toLocaleDateString());
  const [showExportOptions, setShowExportOptions] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const exportButtonRef = useRef<HTMLDivElement>(null);
  const pdfTemplateRef = useRef<HTMLDivElement>(null);

  const totalPaidMembers = reportData.filter(item => item.paymentStatus === 'paid').length;
  const totalUnpaidMembers = reportData.filter(item => item.paymentStatus !== 'paid').length;
  const totalShares = reportData.reduce((sum, item) => sum + item.share_count, 0);

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
      // Fetch data in parallel
      // Only fetch allTimeTotal on mount or explicit refresh to save bandwidth
      const promises: any[] = [
        supabase.from('members').select('*').order('name'),
        supabase.from('payments').select('*').eq('month', selectedMonth).eq('year', parseInt(selectedYear))
      ];
      
      if (allTimeTotal === 0 || isRefresh) {
        promises.push(supabase.from('payments').select('total_amount'));
      }
      
      const results = await Promise.all(promises);
      const membersRes = results[0];
      const paymentsRes = results[1];
      const allPaymentsRes = results.length > 2 ? results[2] : null;
      
      if (membersRes.error) throw membersRes.error;
      if (paymentsRes.error) throw paymentsRes.error;

      const members = membersRes.data || [];
      const currentMonthPayments = paymentsRes.data || [];
      
      // Update all-time total if it was fetched
      if (allPaymentsRes && !allPaymentsRes.error) {
        const total = (allPaymentsRes.data || []).reduce((sum: number, p: any) => sum + (p.total_amount || 0), 0);
        setAllTimeTotal(total);
      }

      // Use a Map for O(1) payment lookups instead of .find() O(N)
      const paymentMap = new Map();
      currentMonthPayments.forEach(p => {
        paymentMap.set(p.member_id, p);
      });

      // Combine data efficiently
      const report = members.map(member => {
        const payment = paymentMap.get(member.id);
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
      // Remove artificial delay for immediate response
      setLoading(false);
    }
  };

  const totalCollection = reportData.reduce((sum, item) => sum + item.amountPaid, 0);
  const totalExpected = reportData.reduce((sum, item) => sum + item.expectedAmount, 0);
  const totalPenalty = reportData.reduce((sum, item) => sum + item.penalty, 0);

    const exportReport = async () => {
    const excelModule = await import('exceljs');
    const { saveAs } = await import('file-saver');
    
    // Handle different import patterns (ESM vs CJS)
    const ExcelJS = (excelModule as any).default || excelModule;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${selectedMonth} ${selectedYear}`);

    // Define columns and their keys
    const columnsDef = [
      { header: 'MEMBER NAME', key: 'name' },
      { header: 'PHONE NUMBER', key: 'phone' },
      { header: 'SHARES', key: 'shares' },
      { header: 'PAYMENT STATUS', key: 'status' },
      { header: 'PAYMENT METHOD', key: 'method' },
      { header: 'AMOUNT PAID', key: 'amountPaid' },
      { header: 'PENALTY', key: 'penalty' },
      { header: 'EXPECTED COLLECTION', key: 'expected' }
    ];

    // Prepare the data to be added (to calculate widths)
    const dataRecords = reportData.map(row => ({
      name: row.name,
      phone: row.phone,
      shares: row.share_count.toString(),
      status: row.paymentStatus === 'paid' ? `✅ Paid` : `❗ UNPAID`,
      method: row.paymentMethod || '-',
      amountPaid: row.amountPaid > 0 ? `৳${row.amountPaid.toLocaleString()}` : '-',
      penalty: row.penalty > 0 ? `৳${row.penalty}` : '-',
      expected: `৳${row.expectedAmount.toLocaleString()}`
    }));

    // Calculate maximum length for each column to determine width
    const columnWidths = columnsDef.map(col => {
      const headerLen = col.header.length;
      const contentMaxLen = Math.max(
        ...dataRecords.map(row => (row[col.key as keyof typeof row] || '').toString().length),
        headerLen
      );
      // Ensure a reasonable width range (min 12, adding some padding)
      return { 
        header: '', // We set empty headers here because we add custom styled headers later
        key: col.key, 
        width: Math.max(12, contentMaxLen + 8) 
      };
    });

    worksheet.columns = columnWidths;

    // --- ADD BRANDED HEADER ---
    
    // Row 1: Credits (Small)
    const creditRow = worksheet.getRow(1);
    creditRow.values = ['', '', '', '', '', '', '', 'Made By Jahed Hasan Najim'];
    creditRow.height = 15;
    const creditCell = creditRow.getCell(8);
    creditCell.font = { name: 'Helvetica', family: 2, size: 8, italic: true, color: { argb: 'FF9CA3AF' } };
    creditCell.alignment = { vertical: 'middle', horizontal: 'right' };

    // Row 2: App Name
    const titleRow = worksheet.getRow(2);
    titleRow.values = ['Unity Savings Circle'];
    titleRow.height = 40;
    worksheet.mergeCells('A2:H2');
    const titleCell = titleRow.getCell(1);
    titleCell.font = { name: 'Helvetica', family: 2, size: 24, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Row 3: Subtitle
    const subtitleRow = worksheet.getRow(3);
    subtitleRow.values = ['Savings Management & Shared Growth System'];
    subtitleRow.height = 25;
    worksheet.mergeCells('A3:H3');
    const subtitleCell = subtitleRow.getCell(1);
    subtitleCell.font = { name: 'Helvetica', family: 2, size: 14, italic: true, color: { argb: 'FFFFFFFF' } };
    subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Row 4: Report Metadata
    const metaRow = worksheet.getRow(4);
    metaRow.values = [`Monthly Report: ${selectedMonth} ${selectedYear}`, '', '', '', '', '', '', `Generated: ${new Date().toLocaleDateString()}`];
    metaRow.height = 30;
    worksheet.mergeCells('A4:G4');
    metaRow.eachCell((cell) => {
      cell.font = { bold: true, size: 12, color: { argb: 'FF374151' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      if (cell.address === `H4`) cell.alignment = { vertical: 'middle', horizontal: 'right' };
    });

    // Row 5: Spacer
    worksheet.addRow([]);

    // --- TABLE HEADERS (Row 6) ---
    const tableHeaderRow = worksheet.getRow(6);
    tableHeaderRow.values = ['MEMBER NAME', 'PHONE NUMBER', 'SHARES', 'PAYMENT STATUS', 'PAYMENT METHOD', 'AMOUNT PAID', 'PENALTY', 'EXPECTED COLLECTION'];
    tableHeaderRow.height = 30;
    tableHeaderRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F2937' } // Gray 800
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    // Add the report data to the worksheet starting from row 6
    dataRecords.forEach((row, index) => {
      const excelRow = worksheet.addRow(row);

      // Style the data cells
      excelRow.height = 28;
      excelRow.eachCell((cell, colNumber) => {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };

        // Status-based coloring
        if (colNumber === 4) { // Status column
          const rawStatus = reportData[index].paymentStatus;
          if (rawStatus === 'paid') {
            cell.font = { color: { argb: 'FF059669' }, bold: true }; // Emerald 600
          } else {
            cell.font = { color: { argb: 'FFDC2626' }, bold: true }; // Red 600
          }
        }

        // Amount coloring
        if (colNumber === 6 && reportData[index].amountPaid > 0) {
          cell.font = { color: { argb: 'FF059669' }, bold: true };
        }
      });

      // Alternating row background color
      if (index % 2 === 1) {
        excelRow.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' } // Gray 50
          };
        });
      }
    });

    // Add an empty row for separation
    worksheet.addRow({});

    // Add Summary Rows
    const summaryRow1 = worksheet.addRow(['', '', '', '', 'MONTH TOTAL:', `৳${totalCollection.toLocaleString()}`, `৳${totalPenalty.toLocaleString()}`, `৳${totalExpected.toLocaleString()}`]);
    const summaryRow2 = worksheet.addRow(['', '', '', '', 'OVERALL TOTAL SAVINGS:', `৳${allTimeTotal.toLocaleString()}`, '', '']);

    // Style Summary Rows
    [summaryRow1, summaryRow2].forEach((row, index) => {
      row.height = 35;
      row.eachCell((cell, colNumber) => {
        if (colNumber >= 5) {
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: index === 0 ? 'FF10B981' : 'FF8B5CF6' } // Emerald 500 or Violet 500
          };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.border = {
            top: { style: 'medium', color: { argb: 'FFFFFFFF' } },
            left: { style: 'medium', color: { argb: 'FFFFFFFF' } },
            bottom: { style: 'medium', color: { argb: 'FFFFFFFF' } },
            right: { style: 'medium', color: { argb: 'FFFFFFFF' } }
          };
        }
      });
    });

    // Merge cells for Overall Total Savings label
    worksheet.mergeCells(`E${summaryRow2.number}:F${summaryRow2.number}`);

    // Footer
    const footerRow = worksheet.addRow([]);
    const signatureRow = worksheet.addRow(['', '', '', '', '', '', '', 'Generated by Unity App']);
    signatureRow.getCell(8).font = { italic: true, size: 8, color: { argb: 'FF9CA3AF' } };

    // Generate and Save the Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Savings_Report_${selectedMonth}_${selectedYear}.xlsx`);
    
    toast.success('Excel report downloaded!');
    setShowExportOptions(false);
  };

  const exportAsPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    
    const toastId = toast.loading('Generating Premium PDF report...');
    setShowExportOptions(false);
    
    // Update issued date to current moment
    setIssuedDate(new Date().toLocaleDateString());
    
    try {
      // Small timeout to ensure template is re-rendered with new date
      await new Promise(resolve => setTimeout(resolve, 600));

      if (!pdfTemplateRef.current) throw new Error("Template not found");

      const canvas = await html2canvas(pdfTemplateRef.current, {
        scale: 2, // High quality
        useCORS: true,
        logging: false,
        backgroundColor: '#F9FAFB',
        onclone: (clonedDoc) => {
          // Remove all existing styles that might contain oklab/oklch 
          // This prevents html2canvas from crashing while parsing modern CSS
          const styles = Array.from(clonedDoc.getElementsByTagName('style'));
          styles.forEach(s => s.remove());
          
          const links = Array.from(clonedDoc.getElementsByTagName('link'));
          links.forEach(l => {
            if (l.rel === 'stylesheet') l.remove();
          });

          // Add a basic layout-only style for things we don't handle inline
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
            body { font-family: sans-serif; }
          `;
          clonedDoc.head.appendChild(style);
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgRatio = imgProps.width / imgProps.height;
      
      let scaledWidth = pdfWidth;
      let scaledHeight = pdfWidth / imgRatio;

      if (scaledHeight > pdfHeight) {
        scaledHeight = pdfHeight;
        scaledWidth = pdfHeight * imgRatio;
      }
      
      const xOffset = (pdfWidth - scaledWidth) / 2;
      const yOffset = (pdfHeight - scaledHeight) / 2;

      pdf.addImage(imgData, 'JPEG', xOffset, yOffset, scaledWidth, scaledHeight);
      
      pdf.save(`Unity_Savings_Circle_Report_${selectedMonth}_${selectedYear}.pdf`);
      toast.success('Premium PDF report downloaded!', { id: toastId });
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Failed to generate premium PDF report', { id: toastId });
    }
  };

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
                      Export as Excel
                    </button>
                    <button
                      onClick={exportAsPDF}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-white/80 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Export as PDF
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

      {/* PDF Background Template - Hidden from UI, used for PDF generation only */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', overflow: 'hidden', height: 0 }}>
        <div 
          ref={pdfTemplateRef} 
          style={{ 
            backgroundColor: '#F9FAFB',
            padding: '1.5rem',
            width: '1123px',
            minHeight: 'auto',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          {/* Header with Gradient */}
          <div 
            style={{ 
              background: 'linear-gradient(to right, #4338ca, #7e22ce, #3730a3)',
              color: '#FFFFFF',
              borderRadius: '1.5rem',
              padding: '1.5rem 2rem',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.05)', transform: 'translateX(80px) skewX(-12deg)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 10 }}>
              <div 
                style={{ 
                  backgroundColor: '#FFFFFF',
                  padding: '0.5rem',
                  borderRadius: '1rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div 
                  style={{ 
                    width: '36px',
                    height: '36px',
                    borderRadius: '0.4rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#4f46e5',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <PiggyBank className="w-6 h-6" style={{ color: '#FFFFFF' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0rem' }}>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.05em', textTransform: 'uppercase', color: '#FFFFFF', margin: 0 }}>UNITY SAVINGS CIRCLE</h1>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.875rem', fontWeight: 500, color: '#e0e7ff', margin: 0 }}>
                    <Zap className="w-3.5 h-3.5" style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                    Savings Management & Shared Growth System
                  </p>
                  <p style={{ fontSize: '0.55rem', fontWeight: 600, color: '#c7d2fe', opacity: 0.8, margin: 0, paddingLeft: '1.8rem', letterSpacing: '0.05em' }}>
                    Made By Jahed Hasan Najim
                  </p>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', position: 'relative', zIndex: 10 }}>
              <div 
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  marginBottom: '0.5rem'
                }}
              >
                <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 900, marginBottom: '0rem', color: '#c7d2fe', margin: 0 }}>Financial Period</p>
                <p style={{ fontSize: '1.125rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>{selectedMonth} {selectedYear}</p>
              </div>
              <div 
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontWeight: 700,
                  padding: '0.35rem 0.875rem',
                  borderRadius: '9999px',
                  border: '1px solid rgba(79, 70, 229, 0.3)',
                  color: '#e0e7ff',
                  backgroundColor: 'rgba(49, 46, 129, 0.4)'
                }}
              >
                <Clock className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Issued: {issuedDate}</span>
              </div>
            </div>
          </div>

            {/* Info Bar - Premium Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
              {[
                { label: 'Monthly Report', value: `${selectedMonth.substring(0,3)} ${selectedYear}`, icon: <Calendar className="w-4 h-4" />, bg: '#eef2ff', text: '#4f46e5' },
                { label: 'Total Members', value: reportData.length, icon: <Users className="w-4 h-4" />, bg: '#eff6ff', text: '#2563eb' },
                { label: 'Paid Members', value: totalPaidMembers, icon: <CheckCircle className="w-4 h-4" />, bg: '#ecfdf5', text: '#059669' },
                { label: 'Unpaid Members', value: totalUnpaidMembers, icon: <XCircle className="w-4 h-4" />, bg: '#fff1f2', text: '#e11d48' },
                { label: 'Total Shares', value: totalShares, icon: <PieChart className="w-4 h-4" />, bg: '#fffbeb', text: '#d97706' }
              ].map((card, i) => (
                <div 
                  key={i}
                  style={{ 
                    backgroundColor: '#FFFFFF',
                    padding: '0.75rem',
                    borderRadius: '1rem',
                    border: '1px solid #f3f4f6',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    gap: '0.25rem',
                    boxShadow: '0 5px 10px -2px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <div style={{ padding: '0.4rem', borderRadius: '0.6rem', marginBottom: '0.1rem', backgroundColor: card.bg, color: card.text }}>
                    {card.icon}
                  </div>
                  <p style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', margin: 0 }}>{card.label}</p>
                  <p style={{ fontSize: i === 0 ? '0.875rem' : '1.125rem', fontWeight: 900, color: i === 2 ? '#059669' : i === 3 ? '#e11d48' : '#1f2937', margin: 0 }}>{card.value}</p>
                </div>
              ))}
            </div>

          {/* Premium Table */}
          <div 
            style={{ 
              backgroundColor: '#FFFFFF',
              borderRadius: '1.5rem',
              overflow: 'hidden',
              marginBottom: '1rem',
              border: '1px solid #f3f4f6',
              flexGrow: 1,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr 
                  style={{ 
                    background: 'linear-gradient(to right, #111827, #1f2937, #111827)',
                    color: '#FFFFFF',
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    fontWeight: 900
                  }}
                >
                  <th style={{ padding: '1rem 0.6rem', textAlign: 'center', borderRight: '1px solid rgba(255, 255, 255, 0.05)' }}>#</th>
                  <th style={{ padding: '1rem 0.6rem', textAlign: 'left', borderRight: '1px solid rgba(255, 255, 255, 0.05)' }}>Member Identity</th>
                  <th style={{ padding: '1rem 0.6rem', textAlign: 'left', borderRight: '1px solid rgba(255, 255, 255, 0.05)' }}>Contact info</th>
                  <th style={{ padding: '1rem 0.6rem', textAlign: 'center', borderRight: '1px solid rgba(255, 255, 255, 0.05)' }}>Shares</th>
                  <th style={{ padding: '1rem 0.6rem', textAlign: 'center', borderRight: '1px solid rgba(255, 255, 255, 0.05)' }}>Status Badge</th>
                  <th style={{ padding: '1rem 0.6rem', textAlign: 'center', borderRight: '1px solid rgba(255, 255, 255, 0.05)' }}>Method</th>
                  <th style={{ padding: '1rem 0.6rem', textAlign: 'right', borderRight: '1px solid rgba(255, 255, 255, 0.05)' }}>Contribution</th>
                  <th style={{ padding: '1rem 0.6rem', textAlign: 'right', borderRight: '1px solid rgba(255, 255, 255, 0.05)' }}>Fine</th>
                  <th style={{ padding: '1rem 0.6rem', textAlign: 'right', paddingRight: '1rem' }}>Projection</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, idx) => (
                  <tr 
                    key={idx} 
                    style={{ 
                      fontSize: '10px', 
                      fontWeight: 700, 
                      borderBottom: '1px solid #f3f4f6',
                      backgroundColor: idx % 2 === 1 ? 'rgba(249, 250, 251, 0.4)' : '#FFFFFF'
                    }}
                  >
                    <td style={{ padding: '0.35rem 0', textAlign: 'center', color: '#9ca3af', fontFamily: 'monospace', fontSize: '9px', borderRight: '1px solid #f9fafb' }}>{String(idx + 1).padStart(2, '0')}</td>
                    <td style={{ padding: '0.35rem 0.5rem', fontWeight: 900, color: '#1f2937', borderRight: '1px solid #f9fafb' }}>{row.name}</td>
                    <td style={{ padding: '0.35rem 0.5rem', color: '#6b7280', fontWeight: 500, borderRight: '1px solid #f9fafb' }}>{row.phone}</td>
                    <td style={{ padding: '0.35rem 0', textAlign: 'center', borderRight: '1px solid #f9fafb' }}>
                      <span style={{ backgroundColor: '#F3F4F6', color: '#374151', padding: '0.15rem 0.4rem', borderRadius: '0.4rem', fontWeight: 900, fontSize: '9px' }}>{row.share_count}</span>
                    </td>
                    <td style={{ padding: '0.35rem 0', borderRight: '1px solid #f9fafb' }}>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {row.paymentStatus === 'paid' ? (
                          <span 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.2rem', 
                              padding: '0.15rem 0.4rem', 
                              borderRadius: '0.6rem', 
                              fontSize: '8px', 
                              fontWeight: 900, 
                              textTransform: 'uppercase', 
                              letterSpacing: '0.05em',
                              backgroundColor: '#ecfdf5', 
                              color: '#047857',
                              border: '1px solid #a7f3d0'
                            }}
                          >
                            <CheckCircle style={{ width: '0.65rem', height: '0.65rem' }} /> PAID
                          </span>
                        ) : (
                          <span 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.2rem', 
                              padding: '0.15rem 0.4rem', 
                              borderRadius: '0.6rem', 
                              fontSize: '8px', 
                              fontWeight: 900, 
                              textTransform: 'uppercase', 
                              letterSpacing: '0.05em',
                              backgroundColor: '#fff1f2', 
                              color: '#be123c',
                              border: '1px solid #fecdd3'
                            }}
                          >
                            <XCircle style={{ width: '0.65rem', height: '0.65rem' }} /> UNPAID
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.35rem 0', textAlign: 'center', borderRight: '1px solid #f9fafb' }}>
                      {row.paymentMethod && row.paymentMethod !== '-' ? (
                         <span 
                           style={{ 
                             padding: '0.15rem 0.4rem', 
                             borderRadius: '0.4rem', 
                             fontSize: '8px', 
                             fontWeight: 900, 
                             textTransform: 'uppercase', 
                             backgroundColor: row.paymentMethod.toLowerCase().includes('cash') ? '#ecfdf5' : 
                                            row.paymentMethod.toLowerCase().includes('bank') ? '#eff6ff' : '#eef2ff',
                             color: row.paymentMethod.toLowerCase().includes('cash') ? '#047857' : 
                                    row.paymentMethod.toLowerCase().includes('bank') ? '#1d4ed8' : '#4338ca',
                             border: '1px solid rgba(0,0,0,0.05)'
                           }}
                         >
                           {row.paymentMethod}
                         </span>
                      ) : <span style={{ color: '#d1d5db' }}>N/A</span>}
                    </td>
                    <td style={{ padding: '0.35rem 0.5rem', textAlign: 'right', fontWeight: 900, color: '#059669', borderRight: '1px solid #f9fafb' }}>৳{row.amountPaid.toLocaleString()}</td>
                    <td style={{ padding: '0.35rem 0.5rem', textAlign: 'right', fontWeight: 900, color: '#f43f5e', borderRight: '1px solid #f9fafb' }}>৳{row.penalty}</td>
                    <td style={{ padding: '0.35rem 0.5rem', textAlign: 'right', paddingRight: '1rem', fontWeight: 900, color: '#4f46e5' }}>৳{row.expectedAmount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Section - Dashboard Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '0.75rem', padding: '0 0.5rem' }}>
            {[
              { label: 'Total Collection', value: `৳${totalCollection.toLocaleString()}`, icon: <Wallet style={{ width: '1.25rem', height: '1.25rem' }} />, bg: 'linear-gradient(to bottom right, #10b981, #059669)', shadow: 'rgba(16, 185, 129, 0.2)', iconBg: 'rgba(255, 255, 255, 0.2)', miniIcon: <Coins style={{ width: '4rem', height: '4rem' }} /> },
              { label: 'Penalty Collected', value: `৳${totalPenalty.toLocaleString()}`, icon: <Zap style={{ width: '1.25rem', height: '1.25rem' }} />, bg: 'linear-gradient(to bottom right, #f43f5e, #e11d48)', shadow: 'rgba(244, 63, 94, 0.2)', iconBg: 'rgba(255, 255, 255, 0.2)', miniIcon: <AlertTriangle style={{ width: '4rem', height: '4rem' }} /> },
              { label: 'Expected Collection', value: `৳${totalExpected.toLocaleString()}`, icon: <TrendingUp style={{ width: '1.25rem', height: '1.25rem' }} />, bg: 'linear-gradient(to bottom right, #f59e0b, #ea580c)', shadow: 'rgba(245, 158, 11, 0.2)', iconBg: 'rgba(255, 255, 255, 0.2)', miniIcon: <Target style={{ width: '4rem', height: '4rem' }} /> },
              { label: 'Contribution Rate', value: `${Math.round((totalPaidMembers/reportData.length)*100)}%`, icon: <Briefcase style={{ width: '1.25rem', height: '1.25rem' }} />, bg: 'linear-gradient(to bottom right, #4f46e5, #7e22ce)', shadow: 'rgba(79, 70, 229, 0.2)', iconBg: 'rgba(255, 255, 255, 0.2)', miniIcon: <ShieldCheck style={{ width: '4rem', height: '4rem' }} /> }
            ].map((card, i) => (
              <div 
                key={i}
                style={{ 
                  padding: '0.875rem',
                  borderRadius: '1.25rem',
                  position: 'relative',
                  overflow: 'hidden',
                  background: card.bg,
                  boxShadow: `0 8px 12px -2px ${card.shadow}`,
                  color: '#FFFFFF'
                }}
              >
                <div style={{ position: 'absolute', right: '-0.25rem', bottom: '-0.25rem', opacity: 0.1 }}>
                  {card.miniIcon}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div 
                    style={{ 
                      padding: '0.4rem',
                      borderRadius: '0.6rem',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      backgroundColor: card.iconBg
                    }}
                  >
                    {card.icon}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8, color: '#FFFFFF', margin: 0 }}>{card.label}</p>
                    <p style={{ fontSize: '1.125rem', fontWeight: 900, margin: 0 }}>{card.value}</p>
                  </div>
                </div>
                <div style={{ height: '0.2rem', width: '100%', borderRadius: '9999px', overflow: 'hidden', backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      backgroundColor: '#FFFFFF', 
                      borderRadius: '9999px',
                      width: i === 2 ? `${Math.min(100, (totalCollection / totalExpected) * 100)}%` : '100%'
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Footer - Stylish Gradient Bar */}
          <div 
            style={{ 
                height: '4rem',
                borderRadius: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 2rem',
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(to right, #4338ca, #7e22ce, #3730a3)',
                color: '#FFFFFF',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                marginTop: '0.5rem'
            }}
          >
            <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }} />
            <div style={{ position: 'absolute', top: 0, right: 0, width: '33%', height: '100%', background: 'linear-gradient(to left, rgba(255,255,255,0.1), transparent)', transform: 'translateX(40px) skewX(12deg)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 10 }}>
              <div 
                style={{ 
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }}
              >
                <PieChart style={{ width: '1.25rem', height: '1.25rem', color: '#34d399' }} />
              </div>
              <p style={{ fontSize: '1.125rem', fontWeight: 900, letterSpacing: '0.15em', fontStyle: 'italic', margin: 0 }}>“TOGETHER WE SAVE, TOGETHER WE GROW”</p>
            </div>
            <div 
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 1.5rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                position: 'relative',
                zIndex: 10,
                backgroundColor: 'rgba(0, 0, 0, 0.2)'
              }}
            >
              <div 
                style={{ 
                  width: '0.5rem',
                  height: '0.5rem',
                  borderRadius: '9999px',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
                }} 
              />
              <span style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#e0e7ff' }}>Unity Premium Analytics</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
