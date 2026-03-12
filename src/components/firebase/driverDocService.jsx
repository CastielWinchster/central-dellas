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
  console.log(`[driverDocService] uploadDocFile → userId: ${userId}, path: ${path}`);
  const storageRef = ref(storage, `driver-documents/${userId}/${path}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  console.log(`[driverDocService] uploadDocFile → URL gerada: ${url}`);
  return url;
}

/**
 * Save the full driver document record to Firestore.
 * @param {string} userId
 * @param {object} data
 */
export async function saveDriverDocuments(userId, data) {
  if (!db) {
    throw new Error('[driverDocService] saveDriverDocuments → db é null. Firebase não foi inicializado.');
  }
  console.log(`[driverDocService] saveDriverDocuments → userId: ${userId}`, data);
  const docRef = doc(db, 'driverDocuments', userId);
  await setDoc(docRef, data, { merge: true });
  console.log('[driverDocService] saveDriverDocuments → salvo com sucesso');
}

/**
 * Fetch the driver document record from Firestore.
 * Returns a normalized object with safe defaults for all nested fields.
 * Never throws — logs the real error and returns null on failure.
 * @param {string} userId
 */
export async function getDriverDocuments(userId) {
  const collectionPath = 'driverDocuments';
  const docPath = `${collectionPath}/${userId}`;

  if (!db) {
    console.error('[driverDocService] getDriverDocuments → db é null. Firebase não foi inicializado (verifique as env vars VITE_FIREBASE_*)');
    return null;
  }

  console.log(`[driverDocService] getDriverDocuments → userId usado: "${userId}"`);
  console.log(`[driverDocService] getDriverDocuments → caminho Firestore: "${docPath}"`);

  try {
    const docRef = doc(db, collectionPath, userId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      console.log('[driverDocService] getDriverDocuments → documento NÃO existe (primeira vez)');
      return null;
    }

    const raw = snap.data();
    console.log('[driverDocService] getDriverDocuments → dados brutos recebidos:', raw);

    // Normalizar com valores padrão seguros para evitar undefined em objetos aninhados
    const normalized = {
      status: raw.status || 'pending',
      submittedAt: raw.submittedAt || null,
      responsibilityTerm: raw.responsibilityTerm || false,
      cnh: {
        number: '',
        category: '',
        expiresAt: '',
        frontPhoto: '',
        backPhoto: '',
        ...(raw.cnh && typeof raw.cnh === 'object' ? raw.cnh : {}),
      },
      rg: {
        number: '',
        issuer: '',
        frontPhoto: '',
        backPhoto: '',
        ...(raw.rg && typeof raw.rg === 'object' ? raw.rg : {}),
      },
      vehicle: {
        plate: '',
        renavam: '',
        brand: '',
        model: '',
        year: '',
        ownerName: '',
        photo: '',
        ...(raw.vehicle && typeof raw.vehicle === 'object' ? raw.vehicle : {}),
      },
      insurance: {
        insurer: '',
        policyNumber: '',
        expiresAt: '',
        photo: '',
        ...(raw.insurance && typeof raw.insurance === 'object' ? raw.insurance : {}),
      },
    };

    console.log('[driverDocService] getDriverDocuments → dados normalizados:', normalized);
    return normalized;
  } catch (err) {
    const code = err?.code || 'unknown';

    if (code === 'unavailable') {
      console.warn('[driverDocService] getDriverDocuments → OFFLINE: cliente sem conexão com o Firestore');
    } else if (code === 'permission-denied' || code === 'unauthenticated') {
      console.error('[driverDocService] getDriverDocuments → PERMISSÃO NEGADA:', err.message);
    } else {
      console.warn('[driverDocService] getDriverDocuments → ERRO NÃO CRÍTICO (config/init):', code, err?.message);
    }

    // Re-lançar apenas erros que a página precisa tratar explicitamente
    if (['unavailable', 'permission-denied', 'unauthenticated'].includes(code)) {
      throw err;
    }

    // Outros erros (config, inicialização) → formulário vazio sem bloquear
    return null;
  }
}