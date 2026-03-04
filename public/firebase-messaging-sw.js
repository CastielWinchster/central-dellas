importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDRNqvm4iWZLzyrbsZA2ZeJKcXku6k1wzY",
  authDomain: "centraldellas-408d4.firebaseapp.com",
  projectId: "centraldellas-408d4",
  storageBucket: "centraldellas-408d4.firebasestorage.app",
  messagingSenderId: "223072086607",
  appId: "1:223072086607:web:3bb6664afeb70ed574983a"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'Central Dellas';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: payload.data || {}
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
