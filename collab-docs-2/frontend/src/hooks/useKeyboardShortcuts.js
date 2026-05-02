import { useEffect } from 'react';

/**
 * shortcuts: array of { key, ctrl?, shift?, meta?, action }
 * key: e.g. 's', 'k', 'Enter'
 */
export function useKeyboardShortcuts(shortcuts, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e) => {
      for (const { key, ctrl, shift, meta, action } of shortcuts) {
        const ctrlMatch  = ctrl  ? (e.ctrlKey || e.metaKey) : (!e.ctrlKey && !e.metaKey);
        const shiftMatch = shift ? e.shiftKey : !e.shiftKey;
        const keyMatch   = e.key.toLowerCase() === key.toLowerCase();

        if (keyMatch && ctrlMatch && shiftMatch) {
          e.preventDefault();
          action(e);
          return;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts, enabled]);
}
