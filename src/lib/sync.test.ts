import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pullAll, pushUpsert, pushDelete } from './sync';
import { useJobStore } from '../store/useJobStore';
import { useCriteriaStore } from '../store/useCriteriaStore';
import { useScoreStore } from '../store/useScoreStore';
import { supabase } from './supabase';
import type { Job, Criteria, Score } from '../types';

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
  },
}));

const mockJob: Job = {
  id: 'j1', companyName: 'テスト株式会社', position: 'エンジニア',
  source: 'doda', sourceNote: '', url: '', salaryMin: 600, salaryMax: 900,
  location: '東京', remoteType: 'フルリモート', employmentType: '正社員',
  yearEndHolidays: null, workStartTime: '9:00', housingAllowance: false,
  annualBonus: null, requiredSkills: [], preferredSkills: [], techStack: [],
  summary: '', notes: '', status: '未応募', appliedAt: null, nextActionAt: null,
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
};

const mockCriteria: Criteria = {
  id: 'c1', name: '年収', weight: 5, description: '希望年収', order: 0,
};

const mockScore: Score = {
  id: 's1', jobId: 'j1', criteriaId: 'c1', score: 4, memo: '', referenceUrl: '',
};

function setupMocks(tableData: Record<string, unknown[]>) {
  vi.mocked(supabase.auth.getSession).mockResolvedValue({
    data: { session: { user: { id: 'user-1' } } },
  } as never);

  vi.mocked(supabase.from).mockImplementation((table: string) => ({
    select: () => ({
      eq: () => Promise.resolve({ data: tableData[table] ?? [], error: null }),
    }),
  }) as never);
}

describe('pullAll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useJobStore.setState({ jobs: [] });
    useCriteriaStore.setState({ criteria: [] });
    useScoreStore.setState({ scores: [] });
  });

  it('Supabase の jobs レコードを Job[] に変換してストアに反映する', async () => {
    setupMocks({ jobs: [{ id: 'j1', data: mockJob }], criteria: [], scores: [] });

    await pullAll();

    expect(useJobStore.getState().jobs).toEqual([mockJob]);
  });

  it('Supabase の criteria レコードを Criteria[] に変換してストアに反映する', async () => {
    setupMocks({ jobs: [], criteria: [{ id: 'c1', data: mockCriteria }], scores: [] });

    await pullAll();

    expect(useCriteriaStore.getState().criteria).toEqual([mockCriteria]);
  });

  it('Supabase の scores レコードを Score[] に変換してストアに反映する', async () => {
    setupMocks({ jobs: [], criteria: [], scores: [{ id: 's1', data: mockScore }] });

    await pullAll();

    expect(useScoreStore.getState().scores).toEqual([mockScore]);
  });

  it('Supabase が空配列を返した場合、各ストアが空配列に更新される', async () => {
    useJobStore.setState({ jobs: [mockJob] });
    setupMocks({ jobs: [], criteria: [], scores: [] });

    await pullAll();

    expect(useJobStore.getState().jobs).toEqual([]);
    expect(useCriteriaStore.getState().criteria).toEqual([]);
    expect(useScoreStore.getState().scores).toEqual([]);
  });

  it('FROM クエリがエラーを返した場合に throw する', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
    } as never);
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: () => ({
        eq: () => Promise.resolve({ data: null, error: { message: 'network error' } }),
      }),
    }) as never);

    await expect(pullAll()).rejects.toThrow();
  });
});

describe('pushUpsert', () => {
  beforeEach(() => vi.clearAllMocks());

  it('正しい形式のレコードを Supabase にアップサートする', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue(
      { data: { session: { user: { id: 'user-1' } } } } as never
    );
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue({ upsert: mockUpsert } as never);

    await pushUpsert('jobs', 'j1', mockJob);

    expect(supabase.from).toHaveBeenCalledWith('jobs');
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'j1', user_id: 'user-1', data: mockJob })
    );
  });

  it('セッションがない場合は何もしない', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue(
      { data: { session: null } } as never
    );

    await pushUpsert('jobs', 'j1', mockJob);

    expect(supabase.from).not.toHaveBeenCalled();
  });
});

describe('pushDelete', () => {
  beforeEach(() => vi.clearAllMocks());

  it('正しい id で Supabase からレコードを削除する', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never);

    await pushDelete('jobs', 'j1');

    expect(supabase.from).toHaveBeenCalledWith('jobs');
    expect(mockEq).toHaveBeenCalledWith('id', 'j1');
  });
});
