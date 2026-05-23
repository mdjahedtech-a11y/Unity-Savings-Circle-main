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
    console.log('Requesting notification permission...');
    const permission = await Notification.requestPermission();
    console.log('Permission result:', permission);
    if (permission === 'granted') {
      try {
        const envVapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        const cleanVapidKey = (vapidKey || (envVapidKey && envVapidKey.trim() !== '' ? envVapidKey : VAPID_KEY_FALLBACK)).replace(/['"]+/g, '').trim();
        
        if (!cleanVapidKey) {
          console.error('VAPID Key is missing');
          return { error: 'VAPID Key is empty. Please set VITE_FIREBASE_VAPID_KEY.' };
        }

        console.log('Registering service worker...');
        // Register the service worker
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/'
        });
        
        console.log('Waiting for service worker ready (with 10s timeout)...');
        // Wait for it to be active with a timeout
        const swReadyPromise = navigator.serviceWorker.ready;
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Service worker ready timeout')), 10000)
        );
        
        await Promise.race([swReadyPromise, timeoutPromise]);
        console.log('Service worker ready');

        console.log('Getting FCM token...');
        const token = await getToken(messaging, { 
          vapidKey: cleanVapidKey,
          serviceWorkerRegistration: registration
        });
        console.log('FCM token received');
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
