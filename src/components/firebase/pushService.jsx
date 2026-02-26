import { messaging } from './firebaseConfig';
import { getToken, onMessage } from 'firebase/messaging';
import { db } from './firebaseConfig';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * Verifica se push notifications são suportadas
 * @returns {boolean}
 */
export function checkSupport() {
  return 'Notification' in window && 'serviceWorker' in navigator && messaging !== null;
}

/**
 * Solicita permissão e obtém token FCM
 * @param {string} userId - ID do usuário Base44
 * @returns {Promise<string|null>} Token ou null se falhar
 */
export async function requestPermissionAndGetToken(userId) {
  if (!checkSupport()) {
    console.warn('Push notifications não suportadas neste navegador');
    return null;
  }

  try {
    // Solicitar permissão
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Permissão de notificação negada');
      return null;
    }

    // Registrar service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;

    // Obter token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      // Salvar token no Firestore
      await saveToken(userId, token);
      return token;
    }

    return null;
  } catch (error) {
    console.error('Erro ao obter token FCM:', error);
    return null;
  }
}

/**
 * Salva token no Firestore
 * @param {string} userId - ID do usuário
 * @param {string} token - Token FCM
 */
async function saveToken(userId, token) {
  const devicesRef = collection(db, 'user_devices');
  
  // Verificar se já existe
  const q = query(devicesRef, where('userId', '==', userId), where('token', '==', token));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    await addDoc(devicesRef, {
      userId,
      token,
      platform: 'web',
      createdAt: serverTimestamp(),
      lastSeenAt: serverTimestamp()
    });
  }
}

/**
 * Remove token do Firestore (desativar notificações)
 * @param {string} userId - ID do usuário
 */
export async function removeToken(userId) {
  const devicesRef = collection(db, 'user_devices');
  const q = query(devicesRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  
  const deletePromises = snapshot.docs.map(docSnapshot => 
    deleteDoc(doc(db, 'user_devices', docSnapshot.id))
  );
  
  await Promise.all(deletePromises);
}

/**
 * Configura listener para mensagens em foreground
 * @param {Function} callback - Callback com payload da mensagem
 */
export function onMessageListener(callback) {
  if (!messaging) {
    console.warn('Messaging não disponível');
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    console.log('Mensagem recebida em foreground:', payload);
    callback(payload);
  });
}