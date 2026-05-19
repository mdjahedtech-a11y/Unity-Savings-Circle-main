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
    if (typeof window === 'undefined' || !messaging) return;

    const setupNotifications = async () => {
      const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

      if (!VAPID_KEY) {
        console.warn('VAPID key not found.');
        return;
      }

      if (user && member) {
        if (Notification.permission === 'granted') {
          const fcmToken = await requestNotificationPermission(VAPID_KEY);
          if (fcmToken) {
            setToken(fcmToken);
            await saveTokenToFirestore(fcmToken, member.id);
          }
        } else if (Notification.permission === 'default') {
          // Only show popup for new users or if not dismissed in session
          // The user specifically asked it to show every visit until enabled
          setTimeout(() => setShowPopup(true), 2000);
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

    return () => unsubscribe();
  }, [user, member]);

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
    if (!VAPID_KEY) {
      toast.error('Setup incomplete', { description: 'Contact admin to set VAPID key.' });
      return;
    }

    try {
      const fcmToken = await requestNotificationPermission(VAPID_KEY);
      if (fcmToken) {
        setToken(fcmToken);
        setPermission('granted');
        setShowPopup(false);
        if (member) {
          await saveTokenToFirestore(fcmToken, member.id);
        }
        toast.success('Awesome!', { description: 'Notifications enabled successfully.' });
      } else {
        toast.error('Permission Denied', { description: 'Please enable notifications in browser settings.' });
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md overflow-hidden bg-white dark:bg-[#0f172a] rounded-[2.5rem] shadow-[0_20px_50px_rgba(79,70,229,0.3)] border border-gray-100 dark:border-white/10"
          >
            {/* Top Graphics */}
            <div className="relative h-32 bg-indigo-600 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 opacity-90" />
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute bottom-[-20%] left-[10%] w-24 h-24 bg-white/10 rounded-full blur-xl" />
              
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                  className="p-4 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30"
                >
                  <BellRing className="w-10 h-10 text-white" />
                </motion.div>
              </div>

              <button 
                onClick={() => setShowPopup(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-8 pb-10">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                  Stay in the Loop!
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Enable notifications to never miss an update from your circle.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                {benefits.map((benefit, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 * idx }}
                    className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-indigo-500/30 transition-all group"
                  >
                    <div className={cn("p-2 rounded-xl bg-white dark:bg-white/10 shadow-sm", benefit.color)}>
                      {benefit.icon}
                    </div>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      {benefit.text}
                    </span>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleEnableNotifications}
                  className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                >
                  Allow Notifications
                </button>
                <button
                  onClick={() => setShowPopup(false)}
                  className="w-full py-4 rounded-2xl text-gray-400 dark:text-gray-500 font-black text-[10px] uppercase tracking-[0.2em] hover:text-gray-600 dark:hover:text-gray-300 transition-all"
                >
                  Maybe Later
                </button>
              </div>

              <p className="mt-6 text-[9px] text-center text-gray-400 dark:text-gray-600 uppercase tracking-widest font-bold flex items-center justify-center gap-2">
                <ShieldCheck className="w-3 h-3" />
                Trusted & Secure Connection
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

