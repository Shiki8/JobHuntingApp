import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Score } from '../types';
import { nanoid } from '../lib/nanoid';
import { pushUpsert, pushDelete } from '../lib/sync';

interface ScoreStore {
  scores: Score[];
  _version: number;

  upsertScore: (jobId: string, criteriaId: string, patch: Omit<Score, 'id' | 'jobId' | 'criteriaId'>) => void;
  deleteScore: (id: string) => void;
  deleteScoresByJob: (jobId: string) => void;
  deleteScoresByCriteria: (criteriaId: string) => void;
  getScore: (jobId: string, criteriaId: string) => Score | undefined;
  getScoresByJob: (jobId: string) => Score[];
  weightedTotal: (jobId: string, criteria: { id: string; weight: number }[]) => number;
}

export const useScoreStore = create<ScoreStore>()(
  persist(
    (set, get) => ({
      scores: [],
      _version: 1,

      upsertScore: (jobId, criteriaId, patch) => {
        set((s) => {
          const existing = s.scores.find(
            (sc) => sc.jobId === jobId && sc.criteriaId === criteriaId
          );
          if (existing) {
            return {
              scores: s.scores.map((sc) =>
                sc.id === existing.id ? { ...sc, ...patch } : sc
              ),
            };
          }
          return {
            scores: [...s.scores, { id: nanoid(), jobId, criteriaId, ...patch }],
          };
        });
        const score = get().scores.find((sc) => sc.jobId === jobId && sc.criteriaId === criteriaId);
        if (score) pushUpsert('scores', score.id, score).catch(console.error);
      },

      deleteScore: (id) => {
        set((s) => ({ scores: s.scores.filter((sc) => sc.id !== id) }));
        pushDelete('scores', id).catch(console.error);
      },

      deleteScoresByJob: (jobId) => {
        const ids = get().scores.filter((sc) => sc.jobId === jobId).map((sc) => sc.id);
        set((s) => ({ scores: s.scores.filter((sc) => sc.jobId !== jobId) }));
        ids.forEach((id) => pushDelete('scores', id).catch(console.error));
      },

      deleteScoresByCriteria: (criteriaId) => {
        const ids = get().scores.filter((sc) => sc.criteriaId === criteriaId).map((sc) => sc.id);
        set((s) => ({ scores: s.scores.filter((sc) => sc.criteriaId !== criteriaId) }));
        ids.forEach((id) => pushDelete('scores', id).catch(console.error));
      },

      getScore: (jobId, criteriaId) =>
        get().scores.find((sc) => sc.jobId === jobId && sc.criteriaId === criteriaId),

      getScoresByJob: (jobId) =>
        get().scores.filter((sc) => sc.jobId === jobId),

      // 重み付き合計スコア（0〜100に正規化）
      weightedTotal: (jobId, criteria) => {
        const { scores } = get();
        const maxPossible = criteria.reduce((sum, c) => sum + c.weight * 5, 0);
        if (maxPossible === 0) return 0;
        const actual = criteria.reduce((sum, c) => {
          const sc = scores.find((s) => s.jobId === jobId && s.criteriaId === c.id);
          return sum + (sc ? sc.score * c.weight : 0);
        }, 0);
        return Math.round((actual / maxPossible) * 100);
      },
    }),
    {
      name: 'score-store',
      version: 1,
    }
  )
);
