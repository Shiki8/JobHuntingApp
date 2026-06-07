import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Job, type ApplicationStatus } from '../types';
import { pushUpsert, pushDelete } from '../lib/sync';

interface JobFilters {
  search: string;
  status: ApplicationStatus | 'すべて';
  source: string;
  remoteType: string;
}

interface JobStore {
  jobs: Job[];
  filters: JobFilters;
  _version: number;

  addJob: (job: Job) => void;
  updateJob: (id: string, patch: Partial<Omit<Job, 'id' | 'createdAt'>>) => void;
  deleteJob: (id: string) => void;
  setFilters: (patch: Partial<JobFilters>) => void;
  resetFilters: () => void;
  filteredJobs: () => Job[];
}

const DEFAULT_FILTERS: JobFilters = {
  search: '',
  status: 'すべて',
  source: '',
  remoteType: '',
};

export const useJobStore = create<JobStore>()(
  persist(
    (set, get) => ({
      jobs: [],
      filters: DEFAULT_FILTERS,
      _version: 1,

      addJob: (job) => {
        set((s) => ({ jobs: [...s.jobs, job] }));
        pushUpsert('jobs', job.id, job).catch(console.error);
      },

      updateJob: (id, patch) => {
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === id ? { ...j, ...patch, updatedAt: new Date().toISOString() } : j
          ),
        }));
        const updated = get().jobs.find((j) => j.id === id);
        if (updated) pushUpsert('jobs', id, updated).catch(console.error);
      },

      deleteJob: (id) => {
        set((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) }));
        pushDelete('jobs', id).catch(console.error);
      },

      setFilters: (patch) =>
        set((s) => ({ filters: { ...s.filters, ...patch } })),

      resetFilters: () => set({ filters: DEFAULT_FILTERS }),

      filteredJobs: () => {
        const { jobs, filters } = get();
        return jobs.filter((j) => {
          if (filters.status !== 'すべて' && j.status !== filters.status) return false;
          if (filters.source && j.source !== filters.source) return false;
          if (filters.remoteType && j.remoteType !== filters.remoteType) return false;
          if (filters.search) {
            const q = filters.search.toLowerCase();
            const hit =
              j.companyName.toLowerCase().includes(q) ||
              j.position.toLowerCase().includes(q) ||
              j.techStack.some((t) => t.toLowerCase().includes(q));
            if (!hit) return false;
          }
          return true;
        });
      },
    }),
    {
      name: 'job-store',
      version: 1,
    }
  )
);
