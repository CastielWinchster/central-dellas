import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { app, db } from './firebaseConfig';

const storage = getStorage(app);

/**
 * Upload a file to Firebase Storage and return its download URL.
 * @param {string} userId
 * @param {string} path - e.g. 'cnh/front'
 * @param {File} file
 */
export async function uploadDocFile(userId, path, file) {
  const storageRef = ref(storage, `driver-documents/${userId}/${path}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

/**
 * Save the full driver document record to Firestore.
 * @param {string} userId
 * @param {object} data
 */
export async function saveDriverDocuments(userId, data) {
  const docRef = doc(db, 'driverDocuments', userId);
  await setDoc(docRef, data, { merge: true });
}

/**
 * Fetch the driver document record from Firestore.
 * @param {string} userId
 */
export async function getDriverDocuments(userId) {
  const docRef = doc(db, 'driverDocuments', userId);
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
}