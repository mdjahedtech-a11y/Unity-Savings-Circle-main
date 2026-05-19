import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Bell, Send, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';

export const AdminNotificationCenter: React.FC = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);

  useEffect(() => {
    const fetchTokenCount = async () => {
      const querySnapshot = await getDocs(collection(db, 'fcm_tokens'));
      setTokenCount(querySnapshot.size);
    };
    fetchTokenCount();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      toast.error('Please fill in both title and message');
      return;
    }

    setSending(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'fcm_tokens'));
      const tokens = querySnapshot.docs.map(doc => doc.data().token);

      if (tokens.length === 0) {
        toast.error('No active device tokens found.');
        return;
      }

      let successCount = 0;
      for (const token of tokens) {
        const response = await fetch('/api/send-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, title, body: message }),
        });
        
        if (response.ok) successCount++;
      }

      toast.success(`Broadcast complete! Sent to ${successCount} devices.`);
      setTitle('');
      setMessage('');
    } catch (error) {
      console.error('Broadcast error:', error);
      toast.error('Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-white/5 rounded-[2.5rem] p-8 border border-gray-100 dark:border-white/10 shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full -mr-32 -mt-32" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Push Broadcast</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                <Users className="w-3 h-3" />
                {tokenCount} Devices Connected
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleBroadcast} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Notification Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Monthly Goal Reached!"
              className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-indigo-500 transition-all outline-none text-gray-900 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Message Content</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter the message you want to send to all members..."
              rows={3}
              className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-indigo-500 transition-all outline-none text-gray-900 dark:text-white resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={sending || tokenCount === 0}
            className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            {sending ? 'Sending...' : 'Send to All Devices'}
          </button>
        </form>
      </div>
    </div>
  );
};
