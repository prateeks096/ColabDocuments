import { useEffect, useRef, useState } from 'react';
import { updateDoc } from '../utils/api';

export function useAutoSave(docId, content, title, permission, delay = 1500) {
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved' | 'error'
  const timerRef = useRef(null);
  const lastSavedRef = useRef({ content, title });
  const canEdit = permission === 'owner' || permission === 'edit';

  useEffect(() => {
    if (!docId || !canEdit) return;

    const hasChanged =
      content !== lastSavedRef.current.content ||
      title !== lastSavedRef.current.title;

    if (!hasChanged) return;

    setSaveStatus('unsaved');

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await updateDoc(docId, { content, title });
        lastSavedRef.current = { content, title };
        setSaveStatus('saved');
      } catch (e) {
        setSaveStatus('error');
      }
    }, delay);

    return () => clearTimeout(timerRef.current);
  }, [content, title, docId, canEdit, delay]);

  return saveStatus;
}
