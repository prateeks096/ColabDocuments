import { useState, useMemo } from 'react';

export function useDocSearch(docs) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter(d =>
      d.title.toLowerCase().includes(q) ||
      d.owner?.toLowerCase().includes(q)
    );
  }, [docs, query]);

  return { query, setQuery, filtered };
}
