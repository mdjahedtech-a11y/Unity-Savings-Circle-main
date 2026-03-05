import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Member, Payment } from '../types/index';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Search, Plus, User as UserIcon, DollarSign, AlertTriangle, CheckCircle, XCircle, Shield, ShieldAlert, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export default function Members() {
  const { isAdmin, isMainAdmin } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  
  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);
  
  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMonth, setPaymentMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [paymentYear, setPaymentYear] = useState(new Date().getFullYear().toString());
  const [penaltyAmount, setPenaltyAmount] = useState('0');

  // Add/Edit Member Form State
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberShares, setNewMemberShares] = useState('1');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*')
        .order('name');
      
      if (membersError) throw membersError;

      // Fetch total savings for each member
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('member_id, total_amount')
        .eq('payment_status', 'paid');

      if (paymentsError) throw paymentsError;

      // Calculate total savings per member
      const membersWithSavings = membersData?.map(member => {
        const memberSavings = paymentsData
          ?.filter(p => p.member_id === member.id)
          .reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
        
        return { ...member, total_savings: memberSavings };
      });

      setMembers(membersWithSavings || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('members').insert({
        name: newMemberName,
        phone: newMemberPhone,
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
      const { error } = await supabase
        .from('members')
        .update({
          name: newMemberName,
          phone: newMemberPhone,
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

  const handlePromoteAdmin = async (memberId: string) => {
    if (!confirm('Are you sure you want to promote this user to Admin?')) return;

    try {
      const { error } = await supabase
        .from('members')
        .update({ role: 'admin' })
        .eq('id', memberId);

      if (error) throw error;
      toast.success('User promoted to Admin');
      fetchMembers();
    } catch (error) {
      console.error('Error promoting user:', error);
      toast.error('Failed to promote user');
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
        payment_date: new Date().toISOString(),
      });

      if (error) throw error;
      
      toast.success('Payment recorded successfully');
      setIsPaymentModalOpen(false);
    } catch (error) {
      console.error('Error adding payment:', error);
      toast.error('Failed to add payment');
    }
  };

  const openPaymentModal = (member: Member) => {
    setSelectedMember(member);
    setPaymentAmount((member.share_count * 1000).toString());
    setIsPaymentModalOpen(true);
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-white">Members</h1>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
            />
          </div>
          {isAdmin && (
            <Button onClick={() => setIsAddMemberModalOpen(true)} className="bg-pink-600 hover:bg-pink-700 text-white shrink-0">
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center text-lg font-bold text-white shadow-lg relative">
                      {member.name.charAt(0)}
                      {member.role === 'admin' && (
                        <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1 border border-black">
                          <Shield className="w-3 h-3 text-black fill-current" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">{member.name}</h3>
                      <p className="text-white/50 text-sm">{member.phone}</p>
                    </div>
                  </div>
                  <div className="bg-white/10 px-3 py-1 rounded-full text-xs font-medium text-pink-300">
                    {member.share_count} Share{member.share_count > 1 ? 's' : ''}
                  </div>
                </div>
                
                <div className="mt-6 flex items-center justify-between gap-2">
                  <div className="text-sm text-white/60">
                    Monthly: <span className="text-white font-medium">৳{(member.share_count * 1000).toLocaleString()}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    {isMainAdmin && member.role !== 'admin' && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300"
                        title="Promote to Admin"
                        onClick={() => handlePromoteAdmin(member.id)}
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {isAdmin && (
                      <Button 
                        size="sm" 
                        className="bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30"
                        onClick={() => openPaymentModal(member)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Pay
                      </Button>
                    )}
                  </div>
                </div>
                
                {!member.auth_user_id && isAdmin && (
                  <div className="mt-3 text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20 text-center">
                    Not Activated Yet
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Add Member Modal */}
      <Modal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        title="Add New Member"
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-white/70">Full Name</label>
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-pink-500/50"
              placeholder="e.g. Rahim Uddin"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-white/70">Phone Number</label>
            <input
              type="tel"
              value={newMemberPhone}
              onChange={(e) => setNewMemberPhone(e.target.value)}
              className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-pink-500/50"
              placeholder="e.g. 017..."
              required
            />
            <p className="text-xs text-white/40">User will use this number to activate their account.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-white/70">Number of Shares</label>
            <input
              type="number"
              min="1"
              value={newMemberShares}
              onChange={(e) => setNewMemberShares(e.target.value)}
              className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-pink-500/50"
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
            <label className="text-sm text-white/70">Full Name</label>
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-pink-500/50"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-white/70">Phone Number</label>
            <input
              type="tel"
              value={newMemberPhone}
              onChange={(e) => setNewMemberPhone(e.target.value)}
              className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-pink-500/50"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-white/70">Number of Shares</label>
            <input
              type="number"
              min="1"
              value={newMemberShares}
              onChange={(e) => setNewMemberShares(e.target.value)}
              className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-pink-500/50"
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
              <label className="text-sm text-white/70">Month</label>
              <select 
                value={paymentMonth}
                onChange={(e) => setPaymentMonth(e.target.value)}
                className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white"
              >
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/70">Year</label>
              <input
                type="number"
                value={paymentYear}
                onChange={(e) => setPaymentYear(e.target.value)}
                className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-white/70">Share Amount (৳)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-white/70">Penalty (৳)</label>
            <div className="relative">
              <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400/50" />
              <input
                type="number"
                value={penaltyAmount}
                onChange={(e) => setPenaltyAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black/20 border border-red-500/20 rounded-lg text-white focus:ring-red-500/50"
              />
            </div>
            <p className="text-xs text-white/40">Add ৳100 if unpaid for 2 months</p>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-between items-center">
            <div className="text-sm text-white/60">Total:</div>
            <div className="text-xl font-bold text-white">
              ৳{(parseInt(paymentAmount || '0') + parseInt(penaltyAmount || '0')).toLocaleString()}
            </div>
          </div>

          <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 text-white mt-4">
            Confirm Payment
          </Button>
        </form>
      </Modal>
    </div>
  );
}
