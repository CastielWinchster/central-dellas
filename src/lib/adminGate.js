/** Senha compartilhada do painel admin (pode sobrescrever via VITE_ADMIN_PANEL_PASSWORD). */
export const ADMIN_PANEL_PASSWORD =
  import.meta.env.VITE_ADMIN_PANEL_PASSWORD || 'dellas2026';

const STORAGE_KEY = 'cd_admin_panel_unlocked';
const SESSION_MS = 8 * 60 * 60 * 1000;

export function isAdminPanelUnlocked() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!ts || Date.now() - ts > SESSION_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function unlockAdminPanel(password) {
  if (String(password).trim() !== ADMIN_PANEL_PASSWORD) return false;
  try {
    sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    return false;
  }
  return true;
}

export function lockAdminPanel() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (_) {}
}
