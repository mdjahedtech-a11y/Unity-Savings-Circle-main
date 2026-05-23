importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-messaging-compat.js');

// These must match firebase-applet-config.json
firebase.initializeApp({
  projectId: "unity-savings-circle",
  appId: "1:600550778467:web:5c30cc2f2dc4f94ee27a56",
  apiKey: "AIzaSyDVZFN9HNsD_kKbRxcC_Kwaj3uW53lZ5kk",
  messagingSenderId: "600550778467",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new update.',
    icon: payload.notification?.image || '/firebase-logo.png',
    data: payload.data,
    tag: 'unity-savings-notification'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
