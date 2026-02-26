import { db } from './firebaseConfig';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

/**
 * Garante que o chat existe para uma corrida
 * @param {string} rideId - ID da corrida
 * @param {string} driverUid - UID do motorista
 * @param {string} passengerUid - UID do passageiro
 */
export async function ensureChatExists(rideId, driverUid, passengerUid) {
  const chatRef = doc(db, 'chats', rideId);
  const chatDoc = await getDoc(chatRef);

  if (!chatDoc.exists()) {
    await setDoc(chatRef, {
      participants: [driverUid, passengerUid],
      createdAt: serverTimestamp(),
      lastMessage: '',
      lastMessageAt: serverTimestamp()
    });
  }

  return chatRef;
}

/**
 * Envia mensagem de texto
 * @param {string} rideId - ID da corrida
 * @param {string} senderId - UID do remetente
 * @param {string} text - Texto da mensagem
 */
export async function sendMessage(rideId, senderId, text) {
  if (!text || text.trim().length === 0 || text.length > 500) {
    throw new Error('Mensagem inválida');
  }

  const messagesRef = collection(db, 'chats', rideId, 'messages');
  const now = new Date();
  const expireAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24h

  await addDoc(messagesRef, {
    senderId,
    text: text.trim(),
    createdAt: serverTimestamp(),
    expireAt: Timestamp.fromDate(expireAt)
  });

  // Atualizar última mensagem no doc principal
  const chatRef = doc(db, 'chats', rideId);
  await setDoc(chatRef, {
    lastMessage: text.trim().substring(0, 50),
    lastMessageAt: serverTimestamp()
  }, { merge: true });
}

/**
 * Inscreve-se para receber mensagens em tempo real
 * @param {string} rideId - ID da corrida
 * @param {Function} callback - Callback com array de mensagens
 * @returns {Function} Unsubscribe function
 */
export function subscribeToMessages(rideId, callback) {
  const messagesRef = collection(db, 'chats', rideId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));
    callback(messages);
  }, (error) => {
    console.error('Erro ao ouvir mensagens:', error);
    callback([]);
  });
}

/**
 * Verifica se o chat existe
 * @param {string} rideId - ID da corrida
 * @returns {Promise<boolean>}
 */
export async function chatExists(rideId) {
  const chatRef = doc(db, 'chats', rideId);
  const chatDoc = await getDoc(chatRef);
  return chatDoc.exists();
}

/**
 * Obtém informações do chat
 * @param {string} rideId - ID da corrida
 * @returns {Promise<Object|null>}
 */
export async function getChatInfo(rideId) {
  const chatRef = doc(db, 'chats', rideId);
  const chatDoc = await getDoc(chatRef);
  
  if (!chatDoc.exists()) {
    return null;
  }
  
  return {
    id: chatDoc.id,
    ...chatDoc.data()
  };
}