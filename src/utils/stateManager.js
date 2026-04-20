const STATE_KEY = 'centraldellas_app_state';

export function saveState(key, value) {
  try {
    const current = JSON.parse(localStorage.getItem(STATE_KEY) || '{}');
    current[key] = { data: value, timestamp: Date.now() };
    localStorage.setItem(STATE_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('[StateManager] saveState error:', e);
  }
}

export function restoreState(key, maxAge = 60 * 60 * 1000) {
  try {
    const current = JSON.parse(localStorage.getItem(STATE_KEY) || '{}');
    const saved = current[key];
    if (!saved) return null;
    if (Date.now() - saved.timestamp > maxAge) {
      clearState(key);
      return null;
    }
    return saved.data;
  } catch (e) {
    console.warn('[StateManager] restoreState error:', e);
    return null;
  }
}

export function clearState(key) {
  try {
    const current = JSON.parse(localStorage.getItem(STATE_KEY) || '{}');
    delete current[key];
    localStorage.setItem(STATE_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('[StateManager] clearState error:', e);
  }
}

export function clearAllStates() {
  try {
    localStorage.removeItem(STATE_KEY);
  } catch (e) {
    console.warn('[StateManager] clearAllStates error:', e);
  }
}