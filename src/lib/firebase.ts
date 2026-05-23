import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export const requestNotificationPermission = async (vapidKey?: string) => {
  if (!messaging) return { error: 'Messaging not supported' };
  
  // Use provided key, or environment variable, or hardcoded fallback
  const VAPID_KEY_FALLBACK = 'BFd61GInPVfOjRJasqwqSJjsRPmPjt2DLyErVSVgeosV4i41UzC9V7QbWPl-2-l4XGX22FoRRIqIEu1eCAiEaSc';
  try {
    console.log('[FCM] Requesting notification permission...');
    const permission = await Notification.requestPermission();
    console.log('[FCM] Permission result:', permission);
    
    if (permission === 'granted') {
      try {
        const envVapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        const cleanVapidKey = (vapidKey || (envVapidKey && envVapidKey.trim() !== '' ? envVapidKey : VAPID_KEY_FALLBACK)).replace(/['"]+/g, '').trim();
        
        if (!cleanVapidKey) {
          console.error('[FCM] VAPID Key is missing');
          return { error: 'VAPID Key is empty. Please set VITE_FIREBASE_VAPID_KEY.' };
        }

        console.log('[FCM] Registering service worker...');
        // Register the service worker
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        
        // Ensure service worker is active before proceeding
        // Instead of waiting for .ready (which can hang), we check the current state
        let sw = registration.active || registration.waiting || registration.installing;
        
        if (sw && sw.state !== 'activated') {
          console.log('[FCM] Waiting for SW to activate...');
          await new Promise<void>((resolve) => {
            const stateChangeListener = () => {
              if (sw?.state === 'activated') {
                sw.removeEventListener('statechange', stateChangeListener);
                resolve();
              }
            };
            sw?.addEventListener('statechange', stateChangeListener);
            // Safety timeout
            setTimeout(resolve, 5000);
          });
        }

        console.log('[FCM] Getting FCM token...');
        const token = await getToken(messaging, { 
          vapidKey: cleanVapidKey,
          serviceWorkerRegistration: registration
        });
        
        console.log('[FCM] Token generated successfully');
        return { token };
      } catch (tokenError: any) {
        console.error('[FCM] Full error details:', tokenError);
        let errorMessage = tokenError?.message || 'Failed to generate token';
        
        if (errorMessage.includes('missing required authentication credential') || errorMessage.includes('subscribe-failed')) {
          errorMessage = `VAPID Key mismatch. Ensure your VAPID key matches the Web Push Certificate for Firebase Project with Sender ID: ${firebaseConfig.messagingSenderId}.`;
        }
        
        return { error: `${errorMessage}. Please refresh and try again.` };
      }
    }
    return { error: 'Permission denied' };
  } catch (error) {
    console.error('[FCM] Unexpected system error:', error);
    return { error: 'An unexpected error occurred' };
  }
};

export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
};

export const sendPushNotification = async (token: string, title: string, body: string) => {
  try {
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, title, body }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { error: 'Failed to send notification' };
  }
};
