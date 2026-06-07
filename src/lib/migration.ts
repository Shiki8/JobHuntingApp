import type { Job, Criteria, Score } from '../types';

export const MIGRATION_FLAG_KEY = 'migration-done-v1';

interface MigrationConditions {
  supabaseEmpty: boolean;
  hasLocalData: boolean;
  flagSet: boolean;
}

export function needsMigration({ supabaseEmpty, hasLocalData, flagSet }: MigrationConditions): boolean {
  return supabaseEmpty && hasLocalData && !flagSet;
}

export function readLocalSnapshot(): { jobs: Job[]; criteria: Criteria[]; scores: Score[] } {
  const read = <T>(key: string, field: string): T[] => {
    try {
      const raw = localStorage.getItem(key);
      return JSON.parse(raw ?? '{}')?.state?.[field] ?? [];
    } catch {
      return [];
    }
  };
  return {
    jobs: read<Job>('job-store', 'jobs'),
    criteria: read<Criteria>('criteria-store', 'criteria'),
    scores: read<Score>('score-store', 'scores'),
  };
}

export function markMigrationDone(): void {
  localStorage.setItem(MIGRATION_FLAG_KEY, '1');
}

export function isMigrationFlagSet(): boolean {
  return localStorage.getItem(MIGRATION_FLAG_KEY) === '1';
}
