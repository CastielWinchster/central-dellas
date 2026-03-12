import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// --- Diagnóstico de env vars ---
console.group('[firebaseConfig] Diagnóstico das variáveis de ambiente');
Object.entries(firebaseConfig).forEach(([key, value]) => {
  if (!value) {
    console.error(`  ❌ ${key}: UNDEFINED ou VAZIO`);
  } else {
    console.log(`  ✅ ${key}: OK (${String(value).slice(0, 8)}...)`);
  }
});
console.groupEnd();

// Inicializar Firebase apenas uma vez (evita "Firebase App named '[DEFAULT]' already exists")
// Guard: só inicializa se projectId estiver presente
let app;
if (!firebaseConfig.projectId) {
  console.error('[firebaseConfig] ❌ NÃO inicializando Firebase: projectId está undefined. Verifique as variáveis VITE_FIREBASE_* no Dashboard → Settings → Environment Variables.');
  app = null;
} else {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  console.log('[firebaseConfig] ✅ Firebase inicializado. Arquivo: components/firebase/firebaseConfig.js');
}
export { app };

// Firestore
export const db = getFirestore(app);

// Firebase Cloud Messaging (apenas se suportado)
let messaging = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  }).catch(console.error);
}

export { messaging };