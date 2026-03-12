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
    console.error('[driverDocService] getDriverDocuments → ERRO:', err?.code, err?.message);

    // Erros de configuração/inicialização do Firebase não devem bloquear a página
    // Tratar como "documento não encontrado" e retornar null
    const fatalCodes = ['permission-denied', 'unavailable', 'unauthenticated'];
    if (fatalCodes.includes(err?.code)) {
      throw err; // Re-lançar apenas erros reais de rede/permissão
    }

    // Qualquer outro erro (configuração, inicialização, etc.) → retorna null
    return null;
  }
}