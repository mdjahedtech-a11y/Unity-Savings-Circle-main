importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-messaging-compat.js');

// These must match firebase-applet-config.json
firebase.initializeApp({
  projectId: "rational-codex-n07pf",
  appId: "1:5302583012:web:57059ac335ee59696ef6f1",
  apiKey: "AIzaSyCoh-42qOp46ufVMXtDqX1uRZc7CNt5gQ8",
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
