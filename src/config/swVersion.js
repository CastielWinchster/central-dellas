/** Incremente ao publicar alterações no service worker (quebra cache CDN do /sw.js). */
export const SW_BUILD_ID = '25';
export const SW_VERSION = `centraldellas-v${SW_BUILD_ID}`;
/** Exibido no header para admin confirmar deploy */
export const APP_BUILD_LABEL = `build-${SW_BUILD_ID}`;
