import { db } from './firebaseConfig';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { uploadImage, uploadAudio } from './cloudinaryUpload';

const SESSION_DURATION_MINUTES = 24;

/**
 * Inicia ou renova uma sessão de chat
 * @param {string} conversationId - ID da conversa
 * @returns {Promise<{sessionId: string, expiresAt: Date}>}
 */
export async function startOrRefreshSession(conversationId) {
  const conversationRef = doc(db, 'conversations', conversationId);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MINUTES * 60 * 1000);
  const sessionId = `session_${Date.now()}`;

  await updateDoc(conversationRef, {
    sessionId,
    sessionStartedAt: Timestamp.fromDate(now),
    sessionExpiresAt: Timestamp.fromDate(expiresAt),
    updatedAt: serverTimestamp()
  });

  return { sessionId, expiresAt };
}

/**
 * Inscreve-se para receber mensagens em tempo real
 * @param {string} conversationId - ID da conversa
 * @param {string} sessionId - ID da sessão
 * @param {Function} callback - Callback com array de mensagens
 * @returns {Function} Unsubscribe function
 */
export function subscribeMessages(conversationId, sessionId, callback) {
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef,
    where('conversationId', '==', conversationId),
    where('sessionId', '==', sessionId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));
    callback(messages);
  });
}

/**
 * Envia mensagem de texto
 * @param {string} conversationId - ID da conversa
 * @param {string} sessionId - ID da sessão
 * @param {string} senderId - ID do remetente
 * @param {string} receiverId - ID do destinatário
 * @param {string} text - Texto da mensagem
 */
export async function sendText(conversationId, sessionId, senderId, receiverId, text) {
  const messagesRef = collection(db, 'messages');
  await addDoc(messagesRef, {
    conversationId,
    sessionId,
    senderId,
    receiverId,
    type: 'text',
    text,
    fileUrl: null,
    durationSec: null,
    createdAt: serverTimestamp(),
    status: 'visible'
  });

  // Notificar destinatário
  await notifyReceiver(receiverId, conversationId, senderId, 'Nova mensagem', text);
}

/**
 * Envia mensagem com imagem
 * @param {string} conversationId - ID da conversa
 * @param {string} sessionId - ID da sessão
 * @param {string} senderId - ID do remetente
 * @param {string} receiverId - ID do destinatário
 * @param {File} file - Arquivo de imagem
 */
export async function sendImage(conversationId, sessionId, senderId, receiverId, file) {
  const fileUrl = await uploadImage(file);
  const messagesRef = collection(db, 'messages');
  await addDoc(messagesRef, {
    conversationId,
    sessionId,
    senderId,
    receiverId,
    type: 'image',
    text: null,
    fileUrl,
    durationSec: null,
    createdAt: serverTimestamp(),
    status: 'visible'
  });

  // Notificar destinatário
  await notifyReceiver(receiverId, conversationId, senderId, 'Nova mensagem', '📷 Imagem');
}

/**
 * Envia mensagem com áudio
 * @param {string} conversationId - ID da conversa
 * @param {string} sessionId - ID da sessão
 * @param {string} senderId - ID do remetente
 * @param {string} receiverId - ID do destinatário
 * @param {Blob} blob - Blob de áudio
 * @param {number} durationSec - Duração em segundos
 */
export async function sendAudio(conversationId, sessionId, senderId, receiverId, blob, durationSec) {
  const fileUrl = await uploadAudio(blob);
  const messagesRef = collection(db, 'messages');
  await addDoc(messagesRef, {
    conversationId,
    sessionId,
    senderId,
    receiverId,
    type: 'audio',
    text: null,
    fileUrl,
    durationSec,
    createdAt: serverTimestamp(),
    status: 'visible'
  });

  // Notificar destinatário
  await notifyReceiver(receiverId, conversationId, senderId, 'Nova mensagem', '🎤 Áudio');
}

/**
 * Calcula o tempo restante da sessão
 * @param {Date} expiresAt - Data de expiração
 * @returns {number} Segundos restantes
 */
export function getSessionTimeRemaining(expiresAt) {
  const now = new Date();
  const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
  return remaining;
}

/**
 * Notifica o destinatário via backend
 * @param {string} receiverId - ID do destinatário
 * @param {string} conversationId - ID da conversa
 * @param {string} senderId - ID do remetente
 * @param {string} title - Título
 * @param {string} body - Corpo
 */
async function notifyReceiver(receiverId, conversationId, senderId, title, body) {
  try {
    const { base44 } = await import('@/api/base44Client');
    await base44.functions.invoke('notifyUser', {
      toUserId: receiverId,
      type: 'chat',
      title,
      body,
      data: { conversationId, senderId }
    });
  } catch (error) {
    console.error('Erro ao notificar destinatário:', error);
  }
}