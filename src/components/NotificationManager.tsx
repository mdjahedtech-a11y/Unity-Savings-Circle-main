import React, { useEffect, useState } from 'react';
import { requestNotificationPermission, onForegroundMessage, db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { Bell, BellRing, CheckCircle2, ShieldCheck, Zap, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export const NotificationManager: React.FC = () => {
  const { user, member, refreshProfile } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timer: NodeJS.Timeout;
    
    // Show popup ONLY if:
    // 1. Permission is default
    // 2. Not already showing
    // 3. User is a member (logged in)
    if (Notification.permission === 'default' && !showPopup && member) {
      timer = setTimeout(() => {
        setShowPopup(true);
      }, 5000); // 5 second delay
    }

    const setupNotifications = async () => {
      // Avoid setup if already verified in this session or recently
      const lastVerified = localStorage.getItem('fcm_token_verified_at');
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      if (lastVerified && (now - parseInt(lastVerified)) < oneHour) {
        return;
      }

      if (user && member && Notification.permission === 'granted') {
        try {
          const result = await requestNotificationPermission();
          if ('token' in result && result.token) {
            await saveToken(result.token, member.id);
            localStorage.setItem('fcm_token_verified_at', now.toString());
          }
        } catch (e) {
          console.error('[NotificationManager] Automatic setup failed', e);
        }
      }
    };

    setupNotifications();

    let unsubscribe: any;
    onForegroundMessage((payload) => {
      console.log('[FCM] Foreground message received:', payload);
      toast(payload.notification?.title || 'New Notification', {
        description: payload.notification?.body,
        icon: <BellRing className="w-4 h-4 text-indigo-500" />
      });
    }).then(unsub => { unsubscribe = unsub; });

    return () => {
      if (timer) clearTimeout(timer);
      if (unsubscribe) unsubscribe();
    };
  }, [user, member, showPopup]);

  const saveToken = async (fcmToken: string, memberId: string) => {
    try {
      // 1. Save to Supabase (Primary)
      const { error: supabaseError } = await supabase
        .from('members')
        .update({ fcm_token: fcmToken })
        .eq('id', memberId);
      
      if (supabaseError) console.error('Supabase token save error:', supabaseError);

      // 2. Save to Firestore (Secondary/Backup)
      try {
        const tokenRef = doc(db, 'fcm_tokens', fcmToken);
        await setDoc(tokenRef, {
          userId: memberId,
          token: fcmToken,
          deviceType: 'web',
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (firestoreError) {
        // Firestore might fail if rules are strict, that's okay as Supabase is primary
        console.warn('Firestore token save failed (expected if rules not setup):', firestoreError);
      }
    } catch (error) {
      console.error('General error saving token:', error);
    }
  };

  const handleEnableNotifications = async () => {
    const currentPermission = Notification.permission;
    const isInIframe = window.self !== window.top;

    if (currentPermission === 'denied') {
      toast.error('Notifications Blocked', { 
        description: 'Please reset notification permissions in your browser settings (click the lock icon in the address bar).' 
      });
      return;
    }

    if (isInIframe && currentPermission === 'default') {
      toast.warning('Preview Constraint', {
        description: 'Notification requests might be blocked in the preview. Please open the app in a new tab if this doesn\'t work.'
      });
    }

    try {
      const result = await requestNotificationPermission();
      setPermission(Notification.permission);

      if ('token' in result && result.token) {
        setShowPopup(false);
        if (member) {
          await saveToken(result.token, member.id);
          await refreshProfile();
        }
        toast.success('Success!', { description: 'Notifications enabled successfully.' });
      } else if ('error' in result) {
        toast.error('Could not enable', { description: result.error });
      }
    } catch (err) {
      toast.error('Request failed');
    }
  };

  const benefits = [
    { icon: <Zap className="w-4 h-4" />, text: "Instant Payment Confirmations", color: "text-amber-500" },
    { icon: <BellRing className="w-4 h-4" />, text: "Monthly Savings Reminders", color: "text-indigo-500" },
    { icon: <ShieldCheck className="w-4 h-4" />, text: "Security & Account Alerts", color: "text-emerald-500" },
    { icon: <CheckCircle2 className="w-4 h-4" />, text: "Group Announcement Updates", color: "text-blue-500" },
  ];

  return (
    <AnimatePresence>
      {showPopup && permission !== 'granted' && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:bottom-8 z-[100] flex items-end justify-center md:block">
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            className="relative w-full max-w-[340px] overflow-hidden bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-[0_20px_50px_rgba(79,70,229,0.25)] border border-indigo-50 dark:border-white/10"
          >
            {/* Minimal Header with Icon */}
            <div className="relative h-24 bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-indigo-400 rounded-full blur-2xl translate-x-1/2 translate-y-1/2" />
              </div>
              
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="relative z-10 p-3 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30"
              >
                <BellRing className="w-8 h-8 text-white" />
              </motion.div>

              <button 
                onClick={() => setShowPopup(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/10 text-white/80 hover:bg-black/20 transition-colors"
                title="Dismiss for now"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-6">
              <div className="text-center mb-5">
                <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight mb-1">
                  Don't Miss Out!
                </h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold leading-relaxed">
                  Get instant payment alerts & group updates directly on your device.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-6">
                {benefits.slice(0, 4).map((benefit, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center text-center gap-1.5 p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-indigo-500/20 transition-all"
                  >
                    <div className={cn("p-1.5 rounded-lg bg-white dark:bg-white/10 shadow-sm", benefit.color)}>
                      {React.cloneElement(benefit.icon as React.ReactElement, { className: 'w-3.5 h-3.5' })}
                    </div>
                    <span className="text-[9px] font-black leading-tight text-gray-600 dark:text-gray-400 uppercase tracking-tighter">
                      {benefit.text.split(' ')[1] || benefit.text}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <motion.button
                  onClick={handleEnableNotifications}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  animate={{ 
                    boxShadow: ["0 0 0 0 rgba(79, 70, 229, 0)", "0 0 0 10px rgba(79, 70, 229, 0.1)", "0 0 0 0 rgba(79, 70, 229, 0)"] 
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-[11px] uppercase tracking-widest hover:shadow-indigo-500/30 transition-all shadow-lg active:scale-[0.97]"
                >
                  Enable Now
                </motion.button>
                <button
                  onClick={() => setShowPopup(false)}
                  className="w-full py-2 rounded-xl text-gray-400 dark:text-gray-500 font-black text-[9px] uppercase tracking-[0.15em] hover:text-gray-600 dark:hover:text-gray-300 transition-all"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

