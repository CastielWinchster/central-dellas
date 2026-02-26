import { db } from './firebaseConfig';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';

/**
 * Cria uma notificação interna
 * @param {string} userId - ID do usuário
 * @param {string} type - Tipo: coupon, ride, event, chat, system
 * @param {string} title - Título
 * @param {string} body - Corpo da mensagem
 * @param {object} data - Dados extras
 * @returns {Promise<string>} ID da notificação criada
 */
export async function createNotification(userId, type, title, body, data = {}) {
  const notificationsRef = collection(db, 'notifications');
  const docRef = await addDoc(notificationsRef, {
    userId,
    type,
    title,
    body,
    data,
    isRead: false,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

/**
 * Lista notificações de um usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<Array>} Array de notificações
 */
export async function listNotifications(userId) {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate()
  }));
}

/**
 * Marca notificação como lida
 * @param {string} notificationId - ID da notificação
 */
export async function markRead(notificationId) {
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, {
    isRead: true
  });
}

/**
 * Deleta uma notificação
 * @param {string} notificationId - ID da notificação
 */
export async function deleteNotification(notificationId) {
  const notificationRef = doc(db, 'notifications', notificationId);
  await deleteDoc(notificationRef);
}