import { base44 } from '@/api/base44Client';

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Falha ao ler arquivo'));
        return;
      }
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

/**
 * Envia arquivo para Supabase Storage via função serverless (não usa créditos base44).
 * @param {File} file
 * @param {string} folder - ex.: vehicles, profiles, documents, chat
 * @returns {Promise<string>} URL pública do arquivo
 */
export async function uploadFileToStorage(file, folder = 'misc') {
  if (!file) throw new Error('Arquivo não informado');

  const fileBase64 = await readFileAsBase64(file);
  const response = await base44.functions.invoke('uploadFile', {
    fileBase64,
    fileName: file.name || 'upload',
    mimeType: file.type || 'application/octet-stream',
    folder,
  });

  const file_url = response?.data?.file_url ?? response?.file_url;
  if (!file_url) {
    const message = response?.data?.error ?? response?.error ?? 'Servidor não retornou URL do arquivo';
    throw new Error(message);
  }

  return file_url;
}
