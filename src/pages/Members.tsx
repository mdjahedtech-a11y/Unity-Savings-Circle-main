import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Member, Payment } from '../types/index';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Search, Plus, User as UserIcon, DollarSign, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export default function Members() {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMonth, setPaymentMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [paymentYear, setPaymentYear] = useState(new Date().getFullYear().toString());
  const [penaltyAmount, setPenaltyAmount] = useState('0');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      // Mock data for demo
      setMembers([
        { id: '1', name: 'John Doe', phone: '01700000001', share_count: 2, role: 'admin' },
        { id: '2', name: 'Jane Smith', phone: '01700000002', share_count: 1, role: 'user' },
        { id: '3', name: 'Mike Johnson', phone: '01700000003', share_count: 5, role: 'user' },
        { id: '4', name: 'Sarah Connor', phone: '01700000004', share_count: 3, role: 'user' },
      ]);
    } finally {
      setLoading(false);
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
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
          />
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
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all group cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center text-lg font-bold text-white shadow-lg">
                      {member.name.charAt(0)}
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
                
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-white/60">
                    Monthly: <span className="text-white font-medium">৳{(member.share_count * 1000).toLocaleString()}</span>
                  </div>
                  {isAdmin && (
                    <Button 
                      size="sm" 
                      className="bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30"
                      onClick={() => openPaymentModal(member)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Payment
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

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
