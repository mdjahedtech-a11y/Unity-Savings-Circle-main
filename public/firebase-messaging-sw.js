importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// These are populated during build or need to match firebase-applet-config.json
// For simplicity in this environment, I'll hardcode or guide the user
// Actually, I'll use the values I saw in the file.

firebase.initializeApp({
  projectId: "rational-codex-n07pf",
  appId: "1:5302583012:web:57059ac335ee59696ef6f1",
  apiKey: "AIzaSyCoh-42qOp46ufVMXtDqX1uRZc7CNt5gQ8",
  messagingSenderId: "5302583012",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.image || '/firebase-logo.png', // Fallback icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
