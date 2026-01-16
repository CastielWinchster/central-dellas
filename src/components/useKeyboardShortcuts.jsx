import { useEffect } from 'react';

export function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const handleKeyPress = (event) => {
      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;
      const alt = event.altKey;

      // Prevenir conflitos com inputs
      if (event.target.tagName === 'INPUT' || 
          event.target.tagName === 'TEXTAREA' || 
          event.target.isContentEditable) {
        return;
      }

      shortcuts.forEach(({ key: shortcutKey, ctrl: needsCtrl, shift: needsShift, alt: needsAlt, action }) => {
        if (key === shortcutKey.toLowerCase() && 
            ctrl === !!needsCtrl && 
            shift === !!needsShift && 
            alt === !!needsAlt) {
          event.preventDefault();
          action();
        }
      });
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [shortcuts]);
}