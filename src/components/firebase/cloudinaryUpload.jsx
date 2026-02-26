const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Upload de imagem para o Cloudinary
 * @param {File} file - Arquivo de imagem
 * @returns {Promise<string>} URL da imagem
 */
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'central-dellas/chat-images');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData
    }
  );

  if (!response.ok) {
    throw new Error('Falha no upload da imagem');
  }

  const data = await response.json();
  return data.secure_url;
}

/**
 * Upload de áudio para o Cloudinary
 * @param {Blob} blob - Blob de áudio
 * @returns {Promise<string>} URL do áudio
 */
export async function uploadAudio(blob) {
  const formData = new FormData();
  formData.append('file', blob, 'audio.webm');
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'central-dellas/chat-audio');
  formData.append('resource_type', 'video'); // Cloudinary trata áudio como vídeo

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
    {
      method: 'POST',
      body: formData
    }
  );

  if (!response.ok) {
    throw new Error('Falha no upload do áudio');
  }

  const data = await response.json();
  return data.secure_url;
}