import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
      try {
        // Collect tokens from both sources to be safe
        const [supabaseRes, firestoreRes] = await Promise.all([
          supabase.from('members').select('fcm_token').not('fcm_token', 'is', null),
          getDocs(collection(db, 'fcm_tokens'))
        ]);

        const supabaseTokens = supabaseRes.data?.map(m => m.fcm_token).filter(Boolean) || [];
        const firestoreTokens = firestoreRes.docs.map(doc => doc.data().token).filter(Boolean);
        
        // Unique tokens
        const allTokens = new Set([...supabaseTokens, ...firestoreTokens]);
        setTokenCount(allTokens.size);
      } catch (err) {
        console.error('Error fetching token count:', err);
      }
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
      // 1. Fetch from Supabase
      const { data: members, error: supabaseError } = await supabase
        .from('members')
        .select('fcm_token')
        .not('fcm_token', 'is', null);

      if (supabaseError) console.warn('Supabase fetch error:', supabaseError);
      
      // 2. Fetch from Firestore
      const firestoreSnapshot = await getDocs(collection(db, 'fcm_tokens'));
      
      const supabaseTokens = members?.map(m => m.fcm_token).filter(Boolean) || [];
      const firestoreTokens = firestoreSnapshot.docs.map(doc => doc.data().token).filter(Boolean);

      // Merge and deduplicate
      const allTokens = Array.from(new Set([...supabaseTokens, ...firestoreTokens]));

      if (allTokens.length === 0) {
        toast.error('No active device tokens found.');
        return;
      }

      let successCount = 0;
      for (const token of allTokens) {
        try {
          const response = await fetch('/api/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, title, body: message }),
          });
          
          if (response.ok) successCount++;
        } catch (err) {
          console.error('[Broadcast] Failed for token:', token, err);
        }
      }

      toast.success(`Broadcast complete! Sent to ${successCount} devices.`);
      setTitle('');
      setMessage('');
      
      // Refresh count
      setTokenCount(allTokens.length);
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
