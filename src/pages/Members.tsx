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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Members</h1>
          <button 
            onClick={() => fetchMembers(true)}
            disabled={loading}
            className={cn(
              "p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-all",
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
              className="flex-1 sm:flex-none px-3 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50"
            >
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex bg-white dark:bg-white/5 p-1 rounded-lg border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none w-full sm:w-auto">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                filter === 'all' 
                  ? 'bg-pink-500 text-white shadow-lg' 
                  : 'text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('admin')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                filter === 'admin' 
                  ? 'bg-pink-500 text-white shadow-lg' 
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
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500/50 shadow-sm dark:shadow-none"
            />
          </div>
          {isAdmin && (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={() => setIsAddMemberModalOpen(true)} className="flex-1 sm:flex-none bg-pink-600 hover:bg-pink-700 text-white shrink-0 shadow-md justify-center">
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
            <Card key={i} className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <Skeleton className="h-5 w-32" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-16 rounded-md" />
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
              className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all group shadow-sm dark:shadow-none cursor-pointer relative overflow-hidden"
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('button')) return;
                handleViewMember(member);
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center text-lg font-bold text-white shadow-lg relative overflow-hidden">
                      {member.photo_url ? (
                        <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        member.name.charAt(0)
                      )}
                      {member.role === 'admin' && (
                        <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1 border border-white dark:border-black">
                          <Shield className="w-3 h-3 text-black fill-current" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{member.name}</h3>
                      <p className="text-gray-500 dark:text-white/50 text-sm">{member.phone}</p>
                    </div>
                  </div>
                  <div className="bg-pink-50 dark:bg-white/10 px-3 py-1 rounded-full text-xs font-medium text-pink-600 dark:text-pink-300 border border-pink-100 dark:border-transparent">
                    {member.share_count} Share{member.share_count > 1 ? 's' : ''}
                  </div>
                </div>
                
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-sm text-gray-500 dark:text-white/60">
                    Monthly: <span className="text-gray-900 dark:text-white font-medium">৳{(member.share_count * 1000).toLocaleString()}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {isMainAdmin && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-300"
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
                            : 'text-yellow-500 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 hover:text-yellow-600 dark:hover:text-yellow-300'
                        }`}
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
                        className="text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300"
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
                        className="text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-500/10 hover:text-gray-600 dark:hover:text-gray-300"
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
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all group/paid relative overflow-hidden"
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
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                          <CheckCircle className="w-4 h-4" />
                          <span>Paid</span>
                        </div>
                      )
                    ) : (
                      isAdmin ? (
                        <Button 
                          size="sm" 
                          className="bg-pink-50 dark:bg-pink-500/20 hover:bg-pink-100 dark:hover:bg-pink-500/30 text-pink-600 dark:text-pink-300 border border-pink-200 dark:border-pink-500/30"
                          onClick={() => openPaymentModal(member)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Pay
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-red-600 dark:text-red-400 text-sm font-medium">
                          <XCircle className="w-4 h-4" />
                          <span>Unpaid</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
                
                {!member.auth_user_id && isAdmin && (
                  <div className="mt-3 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-2 py-1 rounded border border-orange-200 dark:border-orange-500/20 text-center">
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
            <label className="text-sm text-gray-600 dark:text-white/70">Full Name</label>
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500/50"
              placeholder="e.g. Rahim Uddin"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-gray-600 dark:text-white/70">Phone Number</label>
            <input
              type="tel"
              value={newMemberPhone}
              onChange={(e) => setNewMemberPhone(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500/50"
              placeholder="e.g. 017..."
              required
            />
            <p className="text-xs text-gray-500 dark:text-white/40">User will use this number to activate their account.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-600 dark:text-white/70">Number of Shares</label>
            <input
              type="number"
              min="1"
              value={newMemberShares}
              onChange={(e) => setNewMemberShares(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500/50"
              required
            />
          </div>

          <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 text-white mt-4">
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
            <label className="text-sm text-gray-600 dark:text-white/70">Full Name</label>
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500/50"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-gray-600 dark:text-white/70">Phone Number</label>
            <input
              type="tel"
              value={newMemberPhone}
              onChange={(e) => setNewMemberPhone(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500/50"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-600 dark:text-white/70">Number of Shares</label>
            <input
              type="number"
              min="1"
              value={newMemberShares}
              onChange={(e) => setNewMemberShares(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500/50"
              required
            />
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4">
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
              <label className="text-sm text-gray-600 dark:text-white/70">Month</label>
              <select 
                value={paymentMonth}
                onChange={(e) => setPaymentMonth(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
              >
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-600 dark:text-white/70">Year</label>
              <input
                type="number"
                value={paymentYear}
                onChange={(e) => setPaymentYear(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-600 dark:text-white/70">Share Amount (৳)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/50" />
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-600 dark:text-white/70">Penalty (৳)</label>
            <div className="relative">
              <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500/50" />
              <input
                type="number"
                value={penaltyAmount}
                onChange={(e) => setPenaltyAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-black/20 border border-red-200 dark:border-red-500/20 rounded-lg text-gray-900 dark:text-white focus:ring-red-500/50"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-white/40">Add ৳100 if unpaid for 2 months</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-600 dark:text-white/70">Payment Method</label>
            <select 
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
            >
              {['bKash', 'Nagad', 'Bank', 'Cash'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-white/60">Total:</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              ৳{(parseInt(paymentAmount || '0') + parseInt(penaltyAmount || '0')).toLocaleString()}
            </div>
          </div>

          <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 text-white mt-4">
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
            <div className="w-16 h-16 bg-pink-100 dark:bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-pink-600 dark:text-pink-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Password for {passwordToShow?.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-white/50">
              Share this password with the member so they can log in.
            </p>
          </div>

          <div className="p-4 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 flex items-center justify-between">
            <code className="text-xl font-mono font-bold text-gray-900 dark:text-white tracking-wider">
              {passwordToShow?.password}
            </code>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (passwordToShow?.password) {
                  navigator.clipboard.writeText(passwordToShow.password);
                  toast.success('Password copied to clipboard');
                }
              }}
              title="Copy to clipboard"
            >
              <Database className="w-4 h-4" /> {/* Reusing icon for copy since Copy icon not imported, or just use text */}
              <span className="ml-2">Copy</span>
            </Button>
          </div>

          <Button 
            className="w-full bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800"
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
            <div className="relative -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 p-6 sm:p-8 text-center text-white mb-12 sm:mb-10">
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white dark:bg-gray-900 p-1 shadow-xl">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/50 dark:to-purple-900/50 flex items-center justify-center text-3xl sm:text-4xl font-bold text-pink-600 dark:text-pink-400">
                    {memberToView.name.charAt(0)}
                  </div>
                </div>
              </div>
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                <div className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider border ${
                  memberToView.role === 'admin' 
                    ? 'bg-yellow-400 text-yellow-900 border-yellow-500' 
                    : 'bg-white/20 text-white border-white/30'
                }`}>
                  {memberToView.role}
                </div>
              </div>
            </div>

            <div className="text-center pt-2 sm:pt-4 space-y-1">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{memberToView.name}</h3>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                <span className={`w-2 h-2 rounded-full ${memberToView.auth_user_id ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                {memberToView.auth_user_id ? 'Active Member' : 'Pending Activation'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 rounded-2xl bg-pink-50 dark:bg-pink-900/10 border border-pink-100 dark:border-pink-500/20 space-y-2">
                <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Total Savings</span>
                </div>
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  ৳{(memberToView.total_savings || 0).toLocaleString()}
                </p>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-500/20 space-y-2">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                  <Award className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Shares</span>
                </div>
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  {memberToView.share_count} <span className="text-sm font-normal opacity-70">({memberToView.share_count * 1000}/mo)</span>
                </p>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/20 space-y-2 sm:col-span-2">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                  <Phone className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Contact Info</span>
                </div>
                <p className="text-base sm:text-lg font-medium text-gray-900 dark:text-white font-mono">
                  {memberToView.phone}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Member Stats</h4>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Joined</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {memberToView.created_at ? new Date(memberToView.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Status</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {memberToView.auth_user_id ? 'Account Verified' : 'Account Not Verified'}
                    </p>
                  </div>
                </div>
                {memberToView.auth_user_id && (
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                )}
              </div>
            </div>
            
            <div className="pt-4">
              <Button className="w-full" onClick={() => setIsViewMemberModalOpen(false)}>
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
