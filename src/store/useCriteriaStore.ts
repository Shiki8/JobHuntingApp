import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Criteria, DEFAULT_CRITERIA } from '../types';
import { nanoid } from '../lib/nanoid';
import { pushUpsert, pushDelete } from '../lib/sync';

interface CriteriaStore {
  criteria: Criteria[];
  _version: number;

  addCriteria: (c: Omit<Criteria, 'id' | 'order'>) => void;
  updateCriteria: (id: string, patch: Partial<Omit<Criteria, 'id'>>) => void;
  deleteCriteria: (id: string) => void;
  reorder: (orderedIds: string[]) => void;
  initDefaults: () => void;
}

export const useCriteriaStore = create<CriteriaStore>()(
  persist(
    (set, get) => ({
      criteria: [],
      _version: 1,

      addCriteria: (c) => {
        const newCriteria = { ...c, id: nanoid(), order: 0 };
        set((s) => {
          newCriteria.order = s.criteria.length;
          return { criteria: [...s.criteria, newCriteria] };
        });
        pushUpsert('criteria', newCriteria.id, get().criteria.find(x => x.id === newCriteria.id)).catch(console.error);
      },

      updateCriteria: (id, patch) => {
        set((s) => ({
          criteria: s.criteria.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }));
        const updated = get().criteria.find((c) => c.id === id);
        if (updated) pushUpsert('criteria', id, updated).catch(console.error);
      },

      deleteCriteria: (id) => {
        set((s) => ({
          criteria: s.criteria
            .filter((c) => c.id !== id)
            .map((c, i) => ({ ...c, order: i })),
        }));
        pushDelete('criteria', id).catch(console.error);
      },

      reorder: (orderedIds) => {
        set((s) => ({
          criteria: orderedIds
            .map((id, i) => {
              const c = s.criteria.find((c) => c.id === id);
              return c ? { ...c, order: i } : null;
            })
            .filter(Boolean) as Criteria[],
        }));
        get().criteria.forEach((c) => pushUpsert('criteria', c.id, c).catch(console.error));
      },

      initDefaults: () => {
        if (get().criteria.length > 0) return;
        set({
          criteria: DEFAULT_CRITERIA.map((c, i) => ({
            ...c,
            id: nanoid(),
            order: i,
          })),
        });
      },
    }),
    {
      name: 'criteria-store',
      version: 1,
    }
  )
);
