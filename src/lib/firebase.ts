import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Messaging singleton setup
let messagingInstance: any = null;

const getMessagingInstance = async () => {
  if (typeof window === 'undefined') return null;
  if (messagingInstance) return messagingInstance;
  
  try {
    const supported = await isSupported();
    if (supported) {
      messagingInstance = getMessaging(app);
      return messagingInstance;
    }
  } catch (err) {
    console.error('[FCM] Error checking messaging support:', err);
  }
  return null;
};

export const requestNotificationPermission = async (vapidKey?: string) => {
  const messaging = await getMessagingInstance();
  if (!messaging) {
    console.error('[FCM] Messaging is not supported in this browser environment.');
    return { error: 'Your browser does not support push notifications.' };
  }
  
  // VAPID Key is required for web push notifications in Firebase.
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
          return { error: 'Configuration Error: VAPID Key is missing.' };
        }

        console.log('[FCM] Ensuring service worker is registered...');
        let registration = await navigator.serviceWorker.getRegistration('/');
        
        if (!registration) {
          console.log('[FCM] Registering new service worker...');
          registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/'
          });
        }
        
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        
        console.log('[FCM] SW ready. Requesting FCM token...');
        const token = await getToken(messaging, { 
          vapidKey: cleanVapidKey,
          serviceWorkerRegistration: registration
        });
        
        if (!token) {
          throw new Error('FCM token is empty');
        }

        console.log('[FCM] Token generated successfully');
        return { token };
      } catch (tokenError: any) {
        console.error('[FCM] Token Retrieval Error:', tokenError);
        return { error: tokenError?.message || 'Failed to generate security token.' };
      }
    } else if (permission === 'denied') {
      return { error: 'Notifications blocked. Please enable them in your browser settings code/profile.' };
    }
    return { error: 'Permission dismissed.' };
  } catch (error) {
    console.error('[FCM] Unexpected system error:', error);
    return { error: 'A system error occurred. Please try again.' };
  }
};

export const onForegroundMessage = async (callback: (payload: any) => void) => {
  const messaging = await getMessagingInstance();
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
