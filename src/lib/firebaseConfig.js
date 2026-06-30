/** Config Firebase — mesma do firebase-messaging-sw.js */
export const firebaseConfig = {
  apiKey: 'AIzaSyDRNqvm4iWZLzyrbsZA2ZeJKcXku6k1wzY',
  authDomain: 'centraldellas-408d4.firebaseapp.com',
  projectId: 'centraldellas-408d4',
  storageBucket: 'centraldellas-408d4.firebasestorage.app',
  messagingSenderId: '223072086607',
  appId: '1:223072086607:web:3bb6664afeb70ed574983a',
};

export const FCM_VAPID_KEY =
  import.meta.env.VITE_FIREBASE_VAPID_KEY ||
  import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  '';
