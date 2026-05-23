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
  const [isEnabled, setIsEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('notifications_enabled') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !member) return;
    
    const checkStatus = async () => {
      // If we already think it's enabled from local storage, 
      // we still check permission but don't show loading
      if (Notification.permission !== 'granted') {
        setIsEnabled(false);
        localStorage.setItem('notifications_enabled', 'false');
        return;
      }

      // If enabled but we haven't verified in this session, verify in background
      if (isEnabled && messaging) {
        // Just verify the token exists silently if possible
        const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        try {
          // Rapid check if we can get a token (usually takes < 100ms if cached)
          // We pass a smaller timeout if possible or just rely on the fact that it's background
          const result = await requestNotificationPermission(VAPID_KEY || undefined);
          if (result.token) {
            setIsEnabled(true);
            localStorage.setItem('notifications_enabled', 'true');
          } else {
            // Only disable if we are sure it's invalid
            if (result.error && (result.error.includes('denied') || result.error.includes('permission'))) {
              setIsEnabled(false);
              localStorage.setItem('notifications_enabled', 'false');
            }
          }
        } catch (e) {
          console.error("Silent background check failed", e);
        }
      }
    };

    checkStatus();
  }, [member]);

  const handleToggle = async () => {
    if (typeof window === 'undefined' || !messaging || !member) return;

    const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
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
        const result = await requestNotificationPermission(VAPID_KEY || undefined);
        if (result.token) {
          const tokenRef = doc(db, 'fcm_tokens', result.token);
          await setDoc(tokenRef, {
            userId: member.id,
            token: result.token,
            deviceType: 'web',
            updatedAt: serverTimestamp(),
          }, { merge: true });
          
          localStorage.setItem('notifications_enabled', 'true');
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
        // Disable - Just remove from Firestore and local state
        // We try to get the current token silently to delete it from DB
        try {
          const result = await requestNotificationPermission(VAPID_KEY || undefined);
          if (result.token) {
            const tokenRef = doc(db, 'fcm_tokens', result.token);
            await deleteDoc(tokenRef);
          }
        } catch (e) {
          console.error("Error during silent token retrieval for disable:", e);
        }

        localStorage.setItem('notifications_enabled', 'false');
        localStorage.setItem('notifications_disabled_manually', 'true');
        setIsEnabled(false);
        toast.success('Notifications Disabled', {
          description: 'You will no longer receive push alerts on this device.'
        });
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
