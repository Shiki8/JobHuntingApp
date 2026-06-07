import { supabase } from './supabase';
import { useJobStore } from '../store/useJobStore';
import { useCriteriaStore } from '../store/useCriteriaStore';
import { useScoreStore } from '../store/useScoreStore';
import type { Job, Criteria, Score } from '../types';

type SyncTable = 'jobs' | 'criteria' | 'scores';

export async function pullAll(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const userId = session.user.id;
  const [jobsResult, criteriaResult, scoresResult] = await Promise.all([
    supabase.from('jobs').select('id, data').eq('user_id', userId),
    supabase.from('criteria').select('id, data').eq('user_id', userId),
    supabase.from('scores').select('id, data').eq('user_id', userId),
  ]);

  const fetchError = jobsResult.error ?? criteriaResult.error ?? scoresResult.error;
  if (fetchError) throw fetchError;

  useJobStore.setState({ jobs: (jobsResult.data ?? []).map(r => r.data as Job) });
  useCriteriaStore.setState({ criteria: (criteriaResult.data ?? []).map(r => r.data as Criteria) });
  useScoreStore.setState({ scores: (scoresResult.data ?? []).map(r => r.data as Score) });
}

export async function pushUpsert(table: SyncTable, id: string, data: unknown): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  await supabase.from(table).upsert({
    id,
    user_id: session.user.id,
    updated_at: new Date().toISOString(),
    data,
  });
}

export async function pushDelete(table: SyncTable, id: string): Promise<void> {
  await supabase.from(table).delete().eq('id', id);
}
