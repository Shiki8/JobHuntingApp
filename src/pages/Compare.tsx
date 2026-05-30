import { useNavigate } from 'react-router-dom';
import { X, GitCompareArrows, ArrowLeft, Pencil } from 'lucide-react';
import { useCompareStore } from '../store/useCompareStore';
import { useJobStore } from '../store/useJobStore';
import { useCriteriaStore } from '../store/useCriteriaStore';
import { useScoreStore } from '../store/useScoreStore';
import { type Job } from '../types';
import { StatusBadge, ScoreDots, EmptyState, Button } from '../components/ui';
import { useDocumentTitle } from '../lib/useDocumentTitle';

// ── Helper ────────────────────────────────────────────────────────────────────

function salaryLabel(job: Job) {
  if (!job.salaryMin && !job.salaryMax) return '—';
  const lo = job.salaryMin ? `${job.salaryMin}万` : '?';
  const hi = job.salaryMax ? `${job.salaryMax}万` : '?';
  return `${lo}〜${hi}`;
}

// ── Column header card ────────────────────────────────────────────────────────

function JobHeader({
  job,
  score,
  isTop,
  onRemove,
}: {
  job: Job;
  score: number | null;
  isTop: boolean;
  onRemove: () => void;
}) {
  const navigate = useNavigate();
  return (
    <div
      className={[
        'min-w-[240px] w-[240px] rounded-xl border p-4 flex flex-col gap-3 relative shrink-0',
        isTop ? 'border-blue-400 bg-blue-50/40' : 'border-gray-200 bg-white',
      ].join(' ')}
    >
      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute top-3 right-3 p-1 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="比較から外す"
      >
        <X size={13} />
      </button>

      {/* Company + status */}
      <div className="pr-5">
        <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
          {job.companyName}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{job.position}</p>
      </div>

      <StatusBadge status={job.status} />

      {/* Basic info */}
      <div className="flex flex-col gap-1 text-xs text-gray-600">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">年収</span>
          <span className="font-medium">{salaryLabel(job)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">リモート</span>
          <span className="font-medium">{job.remoteType}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">勤務地</span>
          <span className="font-medium">{job.location || '—'}</span>
        </div>
      </div>

      {/* Score */}
      <div
        className={[
          'flex items-center justify-between pt-2 border-t',
          isTop ? 'border-blue-200' : 'border-gray-100',
        ].join(' ')}
      >
        <span className="text-xs text-gray-400">合致度</span>
        {score !== null ? (
          <div className="flex items-center gap-1.5">
            <span
              className={[
                'text-lg font-bold tabular-nums',
                isTop ? 'text-blue-600' : 'text-gray-700',
              ].join(' ')}
            >
              {score}%
            </span>
            {isTop && (
              <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                TOP
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-300">未評価</span>
        )}
      </div>

      {/* Link to score input */}
      <button
        onClick={() => navigate(`/jobs/${job.id}/score`)}
        className="flex items-center justify-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors"
      >
        <Pencil size={11} />
        評価を編集
      </button>
    </div>
  );
}

// ── Score cell ────────────────────────────────────────────────────────────────

function ScoreCell({
  score,
  memo,
  isTop,
}: {
  score: number | null;
  memo: string;
  isTop: boolean;
}) {
  if (score === null) {
    return (
      <div className="min-w-[240px] w-[240px] px-4 py-3 flex items-center justify-center shrink-0">
        <span className="text-sm text-gray-300 font-medium">—</span>
      </div>
    );
  }

  return (
    <div
      className={[
        'min-w-[240px] w-[240px] px-4 py-3 flex flex-col gap-1.5 shrink-0',
        isTop ? 'bg-blue-50/20' : '',
      ].join(' ')}
    >
      <ScoreDots score={score} size="sm" />
      {memo && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{memo}</p>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Compare() {
  const navigate = useNavigate();
  const { selectedIds, toggle, clear } = useCompareStore();
  const jobs = useJobStore((s) => s.jobs);
  const criteria = useCriteriaStore((s) => s.criteria);
  const { getScore, weightedTotal } = useScoreStore();

  useDocumentTitle('比較');
  const selectedJobs = selectedIds
    .map((id) => jobs.find((j) => j.id === id))
    .filter((j): j is Job => !!j);

  // 評価軸：設定順
  const sortedCriteria = [...criteria].sort((a, b) => a.order - b.order);
  const activeCriteria = sortedCriteria.filter((c) => c.weight > 0);
  const inactiveCriteria = sortedCriteria.filter((c) => c.weight === 0);

  // 合致度スコア計算（weight>0 の軸のみ）
  const scores = selectedJobs.map((job) =>
    activeCriteria.length > 0 ? weightedTotal(job.id, activeCriteria) : null
  );
  const maxScore = scores.some((s) => s !== null)
    ? Math.max(...scores.filter((s): s is number => s !== null))
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">比較</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {selectedJobs.length}件を比較中
            </p>
          </div>
        </div>
        {selectedJobs.length >= 2 && (
          <Button variant="ghost" size="sm" onClick={clear}>
            選択をクリア
          </Button>
        )}
      </div>

      {/* Empty state */}
      {selectedJobs.length < 2 ? (
        <EmptyState
          icon={<GitCompareArrows size={48} />}
          title="比較する求人を選んでください"
          description="求人一覧でチェックボックスを2件以上選択してから比較できます"
          action={
            <Button onClick={() => navigate('/')}>
              求人一覧に戻る
            </Button>
          }
        />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* ── 固定左カラム（軸名） ── */}
          <div className="w-44 shrink-0 flex flex-col border-r border-gray-100 bg-gray-50">
            {/* ヘッダ高さ合わせ（列ヘッダカード分） */}
            <div className="h-[264px] shrink-0 border-b border-gray-100" />

            {/* スコア対象軸 */}
            {activeCriteria.length > 0 && (
              <>
                <div className="px-4 py-2 bg-gray-100 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    評価軸
                  </span>
                </div>
                {activeCriteria.map((c) => (
                  <div
                    key={c.id}
                    className="px-4 py-3 border-b border-gray-100 flex flex-col gap-0.5 min-h-[52px] justify-center"
                  >
                    <span className="text-sm text-gray-700 font-medium leading-snug">
                      {c.name}
                    </span>
                    <span className="text-xs text-gray-400">重み {c.weight}</span>
                  </div>
                ))}
              </>
            )}

            {/* 参考記録軸 */}
            {inactiveCriteria.length > 0 && (
              <>
                <div className="px-4 py-2 bg-gray-100 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    参考記録
                  </span>
                </div>
                {inactiveCriteria.map((c) => (
                  <div
                    key={c.id}
                    className="px-4 py-3 border-b border-gray-100 flex items-center min-h-[52px]"
                  >
                    <span className="text-sm text-gray-500 leading-snug">{c.name}</span>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* ── 横スクロール領域（求人カラム） ── */}
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <div className="flex min-w-max">
              {selectedJobs.map((job, colIdx) => {
                const jobScore = scores[colIdx];
                const isTop = jobScore !== null && jobScore === maxScore;

                return (
                  <div
                    key={job.id}
                    className="flex flex-col border-r border-gray-100 last:border-r-0"
                  >
                    {/* ヘッダカード */}
                    <div className="p-3 border-b border-gray-100 bg-white sticky top-0 z-10">
                      <JobHeader
                        job={job}
                        score={jobScore}
                        isTop={isTop}
                        onRemove={() => toggle(job.id)}
                      />
                    </div>

                    {/* スコア対象軸 セクションヘッダ */}
                    {activeCriteria.length > 0 && (
                      <>
                        <div className="h-[36px] border-b border-gray-100 bg-gray-100" />
                        {activeCriteria.map((c) => {
                          const sc = getScore(job.id, c.id);
                          return (
                            <div key={c.id} className="border-b border-gray-100">
                              <ScoreCell
                                score={sc ? sc.score : null}
                                memo={sc?.memo ?? ''}
                                isTop={isTop}
                              />
                            </div>
                          );
                        })}
                      </>
                    )}

                    {/* 参考記録軸 セクションヘッダ */}
                    {inactiveCriteria.length > 0 && (
                      <>
                        <div className="h-[36px] border-b border-gray-100 bg-gray-100" />
                        {inactiveCriteria.map((c) => {
                          const sc = getScore(job.id, c.id);
                          return (
                            <div key={c.id} className="border-b border-gray-100">
                              <ScoreCell
                                score={sc ? sc.score : null}
                                memo={sc?.memo ?? ''}
                                isTop={false}
                              />
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
