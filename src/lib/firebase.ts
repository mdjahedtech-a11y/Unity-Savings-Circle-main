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
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      try {
        const envVapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        const cleanVapidKey = (vapidKey || (envVapidKey && envVapidKey.trim() !== '' ? envVapidKey : VAPID_KEY_FALLBACK)).replace(/['"]+/g, '').trim();
        
        if (!cleanVapidKey) {
          return { error: 'VAPID Key is empty. Please set VITE_FIREBASE_VAPID_KEY.' };
        }

        // Check if service worker is already registered and active
        let registration = await navigator.serviceWorker.getRegistration('/');
        
        if (!registration) {
          // Only register if not found
          registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/'
          });
          // Wait for it to be active
          await navigator.serviceWorker.ready;
        }

        const token = await getToken(messaging, { 
          vapidKey: cleanVapidKey,
          serviceWorkerRegistration: registration
        });
        return { token };
      } catch (tokenError: any) {
        console.error('Full FCM error:', tokenError);
        let errorMessage = tokenError?.message || 'Failed to generate token';
        
        if (errorMessage.includes('missing required authentication credential') || errorMessage.includes('subscribe-failed')) {
          errorMessage = `VAPID Key mismatch. Ensure your VAPID key matches the Web Push Certificate for Firebase Project with Sender ID: ${firebaseConfig.messagingSenderId}.`;
        }
        
        return { error: `${errorMessage}. Please refresh and try again.` };
      }
    }
    return { error: 'Permission denied' };
  } catch (error) {
    console.error('Error requesting notification permission:', error);
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
