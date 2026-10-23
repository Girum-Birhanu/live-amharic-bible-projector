import { useEffect } from 'react';
import { offlineBibleDB } from '../services/bible-db';
import { useProjectionStore } from '../store/projection-store';

/**
 * Hook that initializes the offline Amharic Bible database (IndexedDB + O(1) in-memory map)
 * and syncs loaded books, verse count, and latency to the projection store.
 */
export function useBibleDB(): void {
  const setBibleBooks = useProjectionStore((s) => s.setBibleBooks);
  const setTotalIndexedVerses = useProjectionStore((s) => s.setTotalIndexedVerses);
  const setDbInitLatencyMs = useProjectionStore((s) => s.setDbInitLatencyMs);

  useEffect(() => {
    offlineBibleDB.init().then(({ books, totalVerses, latencyMs }) => {
      setBibleBooks(books);
      setTotalIndexedVerses(totalVerses);
      setDbInitLatencyMs(latencyMs);
    });
  }, [setBibleBooks, setTotalIndexedVerses, setDbInitLatencyMs]);
}
