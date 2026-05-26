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
          return { error: 'VAPID Key is missing. Please set VITE_FIREBASE_VAPID_KEY.' };
        }

        console.log('[FCM] Ensuring service worker is registered...');
        // Use a more robust way to get/register service worker
        let registration = await navigator.serviceWorker.getRegistration('/');
        
        if (!registration) {
          console.log('[FCM] Registering new service worker...');
          registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/'
          });
        }
        
        console.log('[FCM] Service worker registration status:', registration.active ? 'active' : (registration.waiting ? 'waiting' : 'installing'));

        // Wait for service worker to be ready with a reasonable timeout
        const readyPromise = navigator.serviceWorker.ready;
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Service Worker ready timeout (10s)')), 10000)
        );
        
        console.log('[FCM] Waiting for SW ready state...');
        await Promise.race([readyPromise, timeoutPromise]);
        
        console.log('[FCM] SW ready. Requesting FCM token...');
        // getToken usually takes care of waiting for the SW to be active
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
        const errorCode = tokenError?.code || '';
        const errorMessage = tokenError?.message || 'Unknown FCM error';
        
        if (errorMessage.includes('missing required authentication credential') || 
            errorMessage.includes('subscribe-failed') || 
            errorCode === 'messaging/failed-serviceworker-registration') {
          return { error: `Connection failed. This usually means the VAPID key or Firebase configuration is incorrect for this domain.` };
        }
        
        return { error: errorMessage };
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
