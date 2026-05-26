import React, { useEffect, useState } from 'react';
import { messaging, requestNotificationPermission, onForegroundMessage, db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { Bell, BellRing, CheckCircle2, ShieldCheck, Zap, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export const NotificationManager: React.FC = () => {
  const { user, member } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;

    let timer: NodeJS.Timeout;
    // Show popup ONLY if:
    // 1. Permission is default
    // 2. Not already showing
    // 3. User is a member (logged in)
    if (Notification.permission === 'default' && !showPopup && member) {
      timer = setTimeout(() => {
        setShowPopup(true);
      }, 3000); // 3 second delay to let the page settle
    }

    if (!messaging) return () => timer && clearTimeout(timer);

    const setupNotifications = async () => {
      // Avoid setup if already verified in this session or recently
      const lastVerified = localStorage.getItem('fcm_token_verified_at');
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      if (lastVerified && (now - parseInt(lastVerified)) < oneHour) {
        return;
      }

      const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      
      if (user && member && Notification.permission === 'granted') {
        try {
          const result = await requestNotificationPermission(VAPID_KEY || undefined);
          if (result.token) {
            setToken(result.token);
            await saveTokenToFirestore(result.token, member.id);
            localStorage.setItem('fcm_token_verified_at', now.toString());
            localStorage.setItem('notifications_enabled', 'true');
          }
        } catch (e) {
          console.error('[NotificationManager] Automatic setup failed', e);
        }
      }
    };

    setupNotifications();

    const unsubscribe = onForegroundMessage((payload) => {
      toast(payload.notification?.title || 'New Notification', {
        description: payload.notification?.body,
        icon: <BellRing className="w-4 h-4 text-indigo-500" />
      });
    });

    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [user, member, messaging, showPopup]);

  const saveTokenToFirestore = async (fcmToken: string, userId: string) => {
    try {
      const tokenRef = doc(db, 'fcm_tokens', fcmToken);
      await setDoc(tokenRef, {
        userId,
        token: fcmToken,
        deviceType: 'web',
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving token:', error);
    }
  };

  const handleEnableNotifications = async () => {
    const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    const currentPermission = Notification.permission as string;
    const isInIframe = window.self !== window.top;

    if (currentPermission === 'denied') {
      toast.error('Access Blocked', { 
        description: isInIframe 
          ? 'Notifications are blocked in this preview. Please open the app in a new tab to enable.'
          : 'Notifications are blocked. Please reset permission in your browser address bar.' 
      });
      return;
    }

    if (isInIframe && currentPermission === 'default') {
      toast.warning('Preview Constraint', {
        description: 'Notification requests may be blocked in the preview. If nothing happens, try opening the app in a new tab.'
      });
    }

    try {
      const result = await requestNotificationPermission(VAPID_KEY || undefined);
      const newPermission = Notification.permission;
      setPermission(newPermission);

      if (result.token) {
        setToken(result.token);
        setShowPopup(false);
        if (member) {
          await saveTokenToFirestore(result.token, member.id);
        }
        toast.success('Success!', { description: 'Notifications enabled successfully.' });
      } else if (result.error) {
        if (newPermission === 'denied') {
          toast.error('Permission Denied', { description: 'You blocked notifications. Please allow them in settings.' });
        } else {
          toast.error('Error', { description: result.error });
        }
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

