import React, { useState, useEffect } from 'react';
import { messaging, requestNotificationPermission, db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { doc, deleteDoc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Bell, BellOff, Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

export const NotificationToggle: React.FC = () => {
  const { user, member } = useAuth();
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkStatus = async () => {
      if (Notification.permission === 'granted' && member) {
        // We need to check if we have a token in Firestore for this user
        // But since we don't know the exact token without requesting it, 
        // we'll check if the browser has a token and if it exists in DB.
        const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        if (!VAPID_KEY || !messaging) return;

        try {
          const result = await requestNotificationPermission(VAPID_KEY);
          if (result.token) {
            const tokenRef = doc(db, 'fcm_tokens', result.token);
            const tokenDoc = await getDoc(tokenRef);
            setIsEnabled(tokenDoc.exists());
          }
        } catch (error) {
          console.error('Error checking notification status:', error);
        }
      }
    };

    checkStatus();
  }, [member]);

  const handleToggle = async () => {
    if (typeof window === 'undefined' || !messaging || !member) return;

    const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!VAPID_KEY) {
      toast.error('Notification system not configured');
      return;
    }

    setLoading(true);
    try {
      const isInIframe = window.self !== window.top;
      const currentPermission = Notification.permission as string;

      if (currentPermission === 'denied') {
        toast.error('Access Blocked', {
          description: isInIframe
            ? 'Notifications are blocked in this preview. Please open the app in a new tab.'
            : 'Notifications are blocked. Please reset permission in your browser address bar.'
        });
        setLoading(false);
        return;
      }

      if (isInIframe && currentPermission === 'default') {
        toast.warning('Preview Constraint', {
          description: 'Permission requests may be blocked here. Please open in a new tab if no prompt appears.'
        });
      }

      if (!isEnabled) {
        // Enable
        const result = await requestNotificationPermission(VAPID_KEY);
        if (result.token) {
          const tokenRef = doc(db, 'fcm_tokens', result.token);
          await setDoc(tokenRef, {
            userId: member.id,
            token: result.token,
            deviceType: 'web',
            updatedAt: serverTimestamp(),
          }, { merge: true });
          
          localStorage.removeItem('notifications_disabled_manually');
          setIsEnabled(true);
          setPermission('granted');
          toast.success('Notifications Enabled', {
            description: 'You will now receive payment and group alerts.'
          });
        } else if (result.error) {
          toast.error('Failed to enable', { description: result.error });
        }
      } else {
        // Disable
        const result = await requestNotificationPermission(VAPID_KEY);
        if (result.token) {
          const tokenRef = doc(db, 'fcm_tokens', result.token);
          await deleteDoc(tokenRef);
          localStorage.setItem('notifications_disabled_manually', 'true');
          setIsEnabled(false);
          toast.success('Notifications Disabled', {
            description: 'You will no longer receive push alerts on this device.'
          });
        }
      }
    } catch (error) {
      console.error('Toggle error:', error);
      toast.error('Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95",
        isEnabled 
          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20" 
          : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20"
      )}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isEnabled ? (
        <Bell className="w-3.5 h-3.5" />
      ) : (
        <BellOff className="w-3.5 h-3.5" />
      )}
      {isEnabled ? 'Notifications On' : 'Enable Alerts'}
    </button>
  );
};
