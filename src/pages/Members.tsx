import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Member, Payment } from '../types/index';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Search, Plus, User as UserIcon, DollarSign, AlertTriangle, CheckCircle, XCircle, Shield, ShieldAlert, Edit2, Trash2, Database, Key, Phone, Calendar, Award, TrendingUp, ShieldCheck, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '../components/ui/Skeleton';
import { cn } from '../lib/utils';

export default function Members() {
  const { isAdmin, isMainAdmin } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'admin'>('all');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  
  // View Member Modal State
  const [isViewMemberModalOpen, setIsViewMemberModalOpen] = useState(false);
  const [memberToView, setMemberToView] = useState<Member | null>(null);
  
  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  // Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordToShow, setPasswordToShow] = useState<{name: string, password: string} | null>(null);
  
  // Month/Year Selection for View
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [monthlyPayments, setMonthlyPayments] = useState<Set<string>>(new Set());

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);
  
  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMonth, setPaymentMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [paymentYear, setPaymentYear] = useState(new Date().getFullYear().toString());
  const [penaltyAmount, setPenaltyAmount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('bKash');

  // Add/Edit Member Form State
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberShares, setNewMemberShares] = useState('1');

  // Revoke Payment Modal State
  const [isRevokePaymentModalOpen, setIsRevokePaymentModalOpen] = useState(false);
  const [memberToRevokePayment, setMemberToRevokePayment] = useState<Member | null>(null);

  const fetchMembers = async (isRefresh = false) => {
    if (isRefresh) setLoading(true);
    try {
      // Fetch all data in parallel
      const [membersRes, paymentsRes] = await Promise.all([
        supabase.from('members').select('*').order('name'),
        supabase.from('payments').select('member_id, total_amount, month, year, payment_status')
      ]);
      
      if (membersRes.error) throw membersRes.error;
      if (paymentsRes.error) throw paymentsRes.error;

      const membersData = membersRes.data || [];
      const allPayments = paymentsRes.data || [];

      // Filter paid payments for the selected month/year
      const paidMemberIds = new Set(
        allPayments
          .filter(p => p.month === selectedMonth && p.year === parseInt(selectedYear) && p.payment_status === 'paid')
          .map(p => p.member_id)
      );
      setMonthlyPayments(paidMemberIds);

      // Calculate total savings per member from allPayments
      const membersWithSavings = membersData.map(member => {
        const memberSavings = allPayments
          .filter(p => p.member_id === member.id && p.payment_status === 'paid')
          .reduce((sum, p) => sum + (p.total_amount || 0), 0);
        
        return { ...member, total_savings: memberSavings };
      });

      setMembers(membersWithSavings);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [selectedMonth, selectedYear]);

  const handleViewMember = (member: Member) => {
    setMemberToView(member);
    setIsViewMemberModalOpen(true);
  };

  const handleRevokePayment = async () => {
    if (!memberToRevokePayment) return;

    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('member_id', memberToRevokePayment.id)
        .eq('month', selectedMonth)
        .eq('year', parseInt(selectedYear));

      if (error) throw error;
      
      toast.success(`Payment for ${selectedMonth} revoked`);
      setIsRevokePaymentModalOpen(false);
      setMemberToRevokePayment(null);
      fetchMembers();
    } catch (error: any) {
      console.error('Error revoking payment:', error);
      toast.error(error.message || 'Failed to revoke payment');
    }
  };

  const confirmRevokePayment = (member: Member) => {
    setMemberToRevokePayment(member);
    setIsRevokePaymentModalOpen(true);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanPhone = newMemberPhone.trim().replace(/[^0-9]/g, '');
      const { error } = await supabase.from('members').insert({
        name: newMemberName,
        phone: cleanPhone,
        share_count: parseInt(newMemberShares),
        role: 'user'
      });

      if (error) throw error;
      
      toast.success('Member added successfully');

      setIsAddMemberModalOpen(false);
      resetForm();
      fetchMembers();
    } catch (error: any) {
      console.error('Error adding member:', error);
      toast.error(error.message || 'Failed to add member');
    }
  };

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    try {
      const cleanPhone = newMemberPhone.trim().replace(/[^0-9]/g, '');
      const { error } = await supabase
        .from('members')
        .update({
          name: newMemberName,
          phone: cleanPhone,
          share_count: parseInt(newMemberShares)
        })
        .eq('id', selectedMember.id);

      if (error) throw error;
      
      toast.success('Member updated successfully');
      setIsEditMemberModalOpen(false);
      resetForm();
      fetchMembers();
    } catch (error: any) {
      console.error('Error updating member:', error);
      toast.error(error.message || 'Failed to update member');
    }
  };

  const resetForm = () => {
    setNewMemberName('');
    setNewMemberPhone('');
    setNewMemberShares('1');
    setSelectedMember(null);
  };

  const openEditModal = (member: Member) => {
    setSelectedMember(member);
    setNewMemberName(member.name);
    setNewMemberPhone(member.phone);
    setNewMemberShares(member.share_count.toString());
    setIsEditMemberModalOpen(true);
  };

  const handleToggleAdmin = async (member: Member) => {
    const newRole = member.role === 'admin' ? 'user' : 'admin';
    const action = member.role === 'admin' ? 'demote this Admin to Member' : 'promote this user to Admin';
    
    if (!confirm(`Are you sure you want to ${action}?`)) return;

    try {
      const { error } = await supabase
        .from('members')
        .update({ role: newRole })
        .eq('id', member.id);

      if (error) throw error;
      
      toast.success(member.role === 'admin' ? 'Admin demoted to Member' : 'User promoted to Admin');
      fetchMembers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update user role');
    }
  };

  const handleDeleteClick = (member: Member) => {
    setMemberToDelete(member);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;

    try {
      // Delete member (cascade will handle payments if set up, but let's be safe)
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberToDelete.id);

      if (error) throw error;
      
      toast.success('Member deleted successfully');
      setIsDeleteModalOpen(false);
      setMemberToDelete(null);
      fetchMembers();
    } catch (error: any) {
      console.error('Error deleting member:', error);
      toast.error(error.message || 'Failed to delete member');
    }
  };

  const handleViewPassword = (member: Member) => {
    if (member.password) {
      setPasswordToShow({ name: member.name, password: member.password });
      setIsPasswordModalOpen(true);
    } else {
      toast.info('No password set yet');
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    try {
      const { error } = await supabase.from('payments').insert({
        member_id: selectedMember.id,
        month: paymentMonth,
        year: parseInt(paymentYear),
        share_amount: parseInt(paymentAmount),
        penalty: parseInt(penaltyAmount),
        total_amount: parseInt(paymentAmount) + parseInt(penaltyAmount),
        payment_status: 'paid',
        payment_method: paymentMethod,
        payment_date: new Date().toISOString(),
      });

      if (error) throw error;
      
      toast.success('Payment recorded successfully');

      setIsPaymentModalOpen(false);
      fetchMembers();
    } catch (error) {
      console.error('Error adding payment:', error);
      toast.error('Failed to add payment');
    }
  };

  const openPaymentModal = (member: Member) => {
    setSelectedMember(member);
    setPaymentAmount((member.share_count * 1000).toString());
    setPaymentMonth(selectedMonth);
    setPaymentYear(selectedYear);
    setPaymentMethod('bKash');
    setIsPaymentModalOpen(true);
  };

  const filteredMembers = members.filter(m => 
    (filter === 'all' || m.role === 'admin') &&
    (m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.phone.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Members</h1>
          <button 
            onClick={() => fetchMembers(true)}
            disabled={loading}
            className={cn(
              "p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-all active:scale-90",
              loading && "animate-spin opacity-50"
            )}
            title="Refresh Members"
          >
            <RefreshCcw className="w-5 h-5 text-gray-500 dark:text-white/60" />
          </button>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto flex-wrap justify-end">
          <div className="flex gap-2 w-full sm:w-auto">
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-1.5 bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 backdrop-blur-sm"
            >
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-1.5 bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 backdrop-blur-sm"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex bg-white/80 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none w-full sm:w-auto backdrop-blur-sm">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === 'all' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
                  : 'text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('admin')}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === 'admin' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
                  : 'text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Admins
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/50" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm dark:shadow-none backdrop-blur-sm"
            />
          </div>
          {isAdmin && (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={() => setIsAddMemberModalOpen(true)} className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 shadow-lg shadow-indigo-500/20 justify-center rounded-2xl">
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="bg-white/80 dark:bg-gray-900/80 border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-[2rem]">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-14 h-14 rounded-2xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32 rounded-lg" />
                      <Skeleton className="h-4 w-24 rounded-lg" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <Skeleton className="h-5 w-32 rounded-lg" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-8 w-16 rounded-lg" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          filteredMembers.map((member, index) => (
            <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: Math.min(index * 0.02, 0.2) }}
          >
            <Card 
              className="hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all group cursor-pointer relative overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1"
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('button')) return;
                handleViewMember(member);
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white shadow-lg relative overflow-hidden ring-2 ring-white/20">
                      {member.photo_url ? (
                        <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        member.name.charAt(0)
                      )}
                      {member.role === 'admin' && (
                        <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-lg p-1 border border-white dark:border-gray-900 shadow-sm">
                          <Shield className="w-3 h-3 text-white fill-current" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">{member.name}</h3>
                      <p className="text-gray-500 dark:text-white/50 text-sm font-medium">{member.phone}</p>
                    </div>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 uppercase tracking-wider">
                    {member.share_count} Share{member.share_count > 1 ? 's' : ''}
                  </div>
                </div>
                
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-sm text-gray-500 dark:text-white/60 font-medium">
                    Monthly: <span className="text-gray-900 dark:text-white font-bold">৳{(member.share_count * 1000).toLocaleString()}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {isMainAdmin && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-300 rounded-xl"
                        onClick={() => openEditModal(member)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}

                    {isMainAdmin && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className={`${
                          member.role === 'admin'
                            ? 'text-purple-500 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-300'
                            : 'text-amber-500 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-300'
                        } rounded-xl`}
                        title={member.role === 'admin' ? "Demote to Member" : "Promote to Admin"}
                        onClick={() => handleToggleAdmin(member)}
                      >
                        {member.role === 'admin' ? <Shield className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                      </Button>
                    )}

                    {isAdmin && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300 rounded-xl"
                        title="Delete Member"
                        onClick={() => handleDeleteClick(member)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {isAdmin && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-500/10 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl"
                        title="View Password"
                        onClick={() => handleViewPassword(member)}
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                    )}

                    {monthlyPayments.has(member.id) ? (
                      isAdmin ? (
                        <button
                          onClick={() => confirmRevokePayment(member)}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm font-bold hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all group/paid relative overflow-hidden shadow-sm"
                          title="Click to mark as Unpaid"
                        >
                          <div className="flex items-center gap-1.5 group-hover/paid:translate-y-[-150%] transition-transform duration-300 absolute inset-0 justify-center w-full h-full">
                            <CheckCircle className="w-4 h-4" />
                            <span>Paid</span>
                          </div>
                          <div className="flex items-center gap-1.5 translate-y-[150%] group-hover/paid:translate-y-0 transition-transform duration-300">
                            <XCircle className="w-4 h-4" />
                            <span>Unpay?</span>
                          </div>
                          {/* Invisible spacer to maintain width */}
                          <div className="flex items-center gap-1.5 opacity-0 pointer-events-none">
                            <CheckCircle className="w-4 h-4" />
                            <span>Paid</span>
                          </div>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm font-bold shadow-sm">
                          <CheckCircle className="w-4 h-4" />
                          <span>Paid</span>
                        </div>
                      )
                    ) : (
                      isAdmin ? (
                        <Button 
                          size="sm" 
                          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 rounded-xl px-4"
                          onClick={() => openPaymentModal(member)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Pay
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400 text-sm font-bold shadow-sm">
                          <XCircle className="w-4 h-4" />
                          <span>Unpaid</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
                
                {!member.auth_user_id && isAdmin && (
                  <div className="mt-3 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-500/20 text-center font-medium">
                    Not Activated Yet
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )))}
      </div>

      {/* Add Member Modal */}
      <Modal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        title="Add New Member"
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 dark:text-white/70 uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 transition-all"
              placeholder="e.g. Rahim Uddin"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 dark:text-white/70 uppercase tracking-wider">Phone Number</label>
            <input
              type="tel"
              value={newMemberPhone}
              onChange={(e) => setNewMemberPhone(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 transition-all"
              placeholder="e.g. 017..."
              required
            />
            <p className="text-xs text-gray-500 dark:text-white/40">User will use this number to activate their account.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 dark:text-white/70 uppercase tracking-wider">Number of Shares</label>
            <input
              type="number"
              min="1"
              value={newMemberShares}
              onChange={(e) => setNewMemberShares(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 transition-all"
              required
            />
          </div>

          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-4 py-6 rounded-2xl shadow-lg shadow-indigo-500/20">
            Add Member
          </Button>
        </form>
      </Modal>

      {/* Edit Member Modal */}
      <Modal
        isOpen={isEditMemberModalOpen}
        onClose={() => setIsEditMemberModalOpen(false)}
        title="Edit Member Details"
      >
        <form onSubmit={handleEditMember} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 dark:text-white/70 uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 transition-all"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 dark:text-white/70 uppercase tracking-wider">Phone Number</label>
            <input
              type="tel"
              value={newMemberPhone}
              onChange={(e) => setNewMemberPhone(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 dark:text-white/70 uppercase tracking-wider">Number of Shares</label>
            <input
              type="number"
              min="1"
              value={newMemberShares}
              onChange={(e) => setNewMemberShares(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 transition-all"
              required
            />
          </div>

          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-4 py-6 rounded-2xl shadow-lg shadow-indigo-500/20">
            Update Member
          </Button>
        </form>
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Add Payment for ${selectedMember?.name}`}
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600 dark:text-white/70 uppercase tracking-wider">Month</label>
              <select 
                value={paymentMonth}
                onChange={(e) => setPaymentMonth(e.target.value)}
                className="w-full px-3 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 transition-all"
              >
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600 dark:text-white/70 uppercase tracking-wider">Year</label>
              <input
                type="number"
                value={paymentYear}
                onChange={(e) => setPaymentYear(e.target.value)}
                className="w-full px-3 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 dark:text-white/70 uppercase tracking-wider">Share Amount (৳)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/50" />
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 dark:text-white/70 uppercase tracking-wider">Penalty (৳)</label>
            <div className="relative">
              <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50" />
              <input
                type="number"
                value={penaltyAmount}
                onChange={(e) => setPenaltyAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black/20 border border-amber-200 dark:border-amber-500/20 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 transition-all"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-white/40">Add ৳100 if unpaid for 2 months</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 dark:text-white/70 uppercase tracking-wider">Payment Method</label>
            <select 
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 transition-all"
            >
              {['bKash', 'Nagad', 'Bank', 'Cash'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex justify-between items-center">
            <div className="text-sm font-bold text-gray-600 dark:text-white/60 uppercase tracking-wider">Total:</div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              ৳{(parseInt(paymentAmount || '0') + parseInt(penaltyAmount || '0')).toLocaleString()}
            </div>
          </div>

          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-4 py-6 rounded-2xl shadow-lg shadow-indigo-500/20">
            Confirm Payment
          </Button>
        </form>
      </Modal>
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Member"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-red-900 dark:text-red-200">
                Are you sure you want to delete {memberToDelete?.name}?
              </p>
              <p className="text-xs text-red-700 dark:text-red-300">
                This action cannot be undone. All payment history and data associated with this member will be permanently removed.
              </p>
            </div>
          </div>
          
          <div className="flex gap-3 justify-end mt-6">
            <Button 
              variant="ghost" 
              onClick={() => setIsDeleteModalOpen(false)}
              className="text-gray-600 dark:text-white/70"
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={confirmDeleteMember}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Member
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Member Password"
      >
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Key className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              Password for {passwordToShow?.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-white/50 font-medium">
              Share this password with the member so they can log in.
            </p>
          </div>

          <div className="p-5 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-white/10 flex items-center justify-between shadow-inner">
            <code className="text-2xl font-mono font-bold text-indigo-600 dark:text-indigo-400 tracking-widest">
              {passwordToShow?.password}
            </code>
            <Button
              size="sm"
              variant="ghost"
              className="hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl"
              onClick={() => {
                if (passwordToShow?.password) {
                  navigator.clipboard.writeText(passwordToShow.password);
                  toast.success('Password copied to clipboard');
                }
              }}
              title="Copy to clipboard"
            >
              <Database className="w-4 h-4" />
              <span className="ml-2 font-bold uppercase text-xs tracking-wider">Copy</span>
            </Button>
          </div>

          <Button 
            className="w-full bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 py-6 rounded-2xl font-bold uppercase tracking-widest text-xs"
            onClick={() => setIsPasswordModalOpen(false)}
          >
            Close
          </Button>
        </div>
      </Modal>

      {/* View Member Details Modal */}
      <Modal
        isOpen={isViewMemberModalOpen}
        onClose={() => setIsViewMemberModalOpen(false)}
        title="Member Profile"
      >
        {memberToView && (
          <div className="space-y-6">
            {/* Header Section with Gradient */}
            <div className="relative -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 p-8 sm:p-10 text-center text-white mb-14 sm:mb-12 rounded-b-[2.5rem] shadow-lg">
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] bg-white dark:bg-gray-900 p-1.5 shadow-2xl ring-4 ring-white/10">
                  <div className="w-full h-full rounded-[1.75rem] bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center text-4xl sm:text-5xl font-black text-indigo-600 dark:text-indigo-400 shadow-inner">
                    {memberToView.name.charAt(0)}
                  </div>
                </div>
              </div>
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
                <div className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] border shadow-sm ${
                  memberToView.role === 'admin' 
                    ? 'bg-amber-400 text-amber-950 border-amber-500' 
                    : 'bg-white/20 text-white border-white/30 backdrop-blur-md'
                }`}>
                  {memberToView.role}
                </div>
              </div>
            </div>

            <div className="text-center pt-4 sm:pt-6 space-y-1.5">
              <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">{memberToView.name}</h3>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2 font-medium">
                <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${memberToView.auth_user_id ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {memberToView.auth_user_id ? 'Active Member' : 'Pending Activation'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="p-4 sm:p-5 rounded-[2rem] bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-500/20 space-y-2 shadow-sm">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Total Savings</span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  ৳{(memberToView.total_savings || 0).toLocaleString()}
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-[2rem] bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-500/20 space-y-2 shadow-sm">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                  <Award className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Shares</span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  {memberToView.share_count} <span className="text-sm font-bold opacity-50">({memberToView.share_count * 1000}/mo)</span>
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-[2rem] bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/20 space-y-2 sm:col-span-2 shadow-sm">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                  <Phone className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Contact Info</span>
                </div>
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white font-mono tracking-tight">
                  {memberToView.phone}
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] ml-2">Member Stats</h4>
              
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Joined Date</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {memberToView.created_at ? new Date(memberToView.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 shadow-sm">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Account Status</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {memberToView.auth_user_id ? 'Verified & Active' : 'Waiting for Activation'}
                    </p>
                  </div>
                </div>
                {memberToView.auth_user_id && (
                  <ShieldCheck className="w-6 h-6 text-emerald-500 drop-shadow-sm" />
                )}
              </div>
            </div>
            
            <div className="pt-6">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-indigo-500/20" onClick={() => setIsViewMemberModalOpen(false)}>
                Close Profile
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Revoke Payment Confirmation Modal */}
      <Modal
        isOpen={isRevokePaymentModalOpen}
        onClose={() => setIsRevokePaymentModalOpen(false)}
        title="Revoke Payment"
      >
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                Are you sure you want to mark {memberToRevokePayment?.name} as Unpaid for {selectedMonth} {selectedYear}?
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                This will delete the payment record. You can add it again later if needed.
              </p>
            </div>
          </div>
          
          <div className="flex gap-3 justify-end mt-6">
            <Button 
              variant="ghost" 
              onClick={() => setIsRevokePaymentModalOpen(false)}
              className="text-gray-600 dark:text-white/70"
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleRevokePayment}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Revoke Payment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
