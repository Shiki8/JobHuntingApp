import { create } from 'zustand';

const MAX_COMPARE = 5;

interface CompareStore {
  selectedIds: string[];
  toggle: (jobId: string) => void;
  clear: () => void;
  isSelected: (jobId: string) => boolean;
  isFull: () => boolean;
}

export const useCompareStore = create<CompareStore>()((set, get) => ({
  selectedIds: [],

  toggle: (jobId) =>
    set((s) => {
      if (s.selectedIds.includes(jobId)) {
        return { selectedIds: s.selectedIds.filter((id) => id !== jobId) };
      }
      if (s.selectedIds.length >= MAX_COMPARE) return s;
      return { selectedIds: [...s.selectedIds, jobId] };
    }),

  clear: () => set({ selectedIds: [] }),

  isSelected: (jobId) => get().selectedIds.includes(jobId),

  isFull: () => get().selectedIds.length >= MAX_COMPARE,
}));
