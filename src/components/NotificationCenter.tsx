import React, { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { requestNotificationPermission, onForegroundMessage, db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export const NotificationCenter: React.FC = () => {
  const { member, refreshProfile } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!('Notification' in window)) {
        setIsSupported(false);
      } else {
        setPermission(Notification.permission);
      }
    }

    // Listen for foreground messages if permission is granted
    let unsubscribe: any;
    if (Notification.permission === 'granted') {
      onForegroundMessage((payload) => {
        console.log('[FCM] Foreground message received:', payload);
        toast(payload.notification?.title || 'New Notification', {
          description: payload.notification?.body,
          icon: <Bell className="w-4 h-4 text-indigo-500" />
        });
      }).then(unsub => { unsubscribe = unsub; });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleEnable = async () => {
    if (!member) return;
    setLoading(true);
    
    try {
      const result = await requestNotificationPermission();
      
      if ('token' in result && result.token) {
        // 1. Save token to Supabase
        try {
          const { error: supabaseError } = await supabase
            .from('members')
            .update({ fcm_token: result.token })
            .eq('id', member.id);
          
          if (supabaseError) console.error('Supabase token save error:', supabaseError);
        } catch (err) {
          console.error('Supabase update failed:', err);
        }
        
        // 2. Save to Firestore (More reliable for global broadcast counting)
        try {
          const tokenRef = doc(db, 'fcm_tokens', result.token);
          await setDoc(tokenRef, {
            userId: member.id,
            token: result.token,
            deviceType: 'web',
            updatedAt: serverTimestamp(),
          }, { merge: true });
        } catch (err) {
          console.error('Firestore token save error:', err);
        }
        
        setPermission('granted');
        await refreshProfile();
        toast.success('Notifications enabled successfully!');
      } else if ('error' in result) {
        toast.error(result.error);
      }
    } catch (err: any) {
      console.error('Error enabling notifications:', err);
      toast.error('Failed to enable notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) return null;

  return (
    <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[2rem] p-6 shadow-sm overflow-hidden relative group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors" />
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className={`p-4 rounded-2xl ${
            permission === 'granted' 
              ? 'bg-emerald-500/10 text-emerald-600' 
              : permission === 'denied'
              ? 'bg-red-500/10 text-red-600'
              : 'bg-indigo-500/10 text-indigo-600'
          }`}>
            {permission === 'granted' ? <Bell className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
              {permission === 'granted' ? 'Notifications Active' : 'Push Notifications'}
            </h3>
            <p className="text-xs font-bold text-gray-400 dark:text-white/30 uppercase tracking-widest mt-1">
              {permission === 'granted' 
                ? 'You will receive alerts for all activities' 
                : 'Stay updated with important announcements'}
            </p>
          </div>
        </div>

        <div className="shrink-0 w-full md:w-auto">
          <AnimatePresence mode="wait">
            {permission === 'granted' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                Enabled
              </motion.div>
            ) : permission === 'denied' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border border-red-100 dark:border-red-500/20"
              >
                <AlertCircle className="w-4 h-4" />
                Blocked in Browser
              </motion.div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                onClick={handleEnable}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
                {loading ? 'Processing...' : 'Enable Notifications'}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {permission === 'default' && (
        <div className="mt-4 pt-4 border-t border-gray-50 dark:border-white/5 space-y-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[10px] font-bold text-gray-400 dark:text-white/20 uppercase tracking-tighter leading-relaxed">
              Note: You must allow notifications in the browser popup. If you use the app as a PWA (installed), notifications work best.
            </p>
          </div>
          
          <div className="bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
            <p className="text-[9px] font-black text-amber-600/60 uppercase tracking-widest mb-1">Chrome Settings help:</p>
            <p className="text-[10px] font-medium text-amber-700/80 leading-relaxed">
              If the popup doesn't appear, go to **Settings** → **Privacy and security** → **Site settings** → **Notifications** → Allow **Unity Savings Circle**.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
