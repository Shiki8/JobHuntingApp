import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { type ApplicationStatus, APPLICATION_STATUSES } from '../types';
import { useJobStore } from '../store/useJobStore';
import { useScoreStore } from '../store/useScoreStore';
import { useCriteriaStore } from '../store/useCriteriaStore';
import {
  StatusBadge, Button, ConfirmModal, ScoreWithLabel, Tag,
} from '../components/ui';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export default function JobDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { jobs, updateJob, deleteJob } = useJobStore();
  const { criteria } = useCriteriaStore();
  const { getScore, getScoresByJob, deleteScoresByJob, weightedTotal } = useScoreStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const job = jobs.find((j) => j.id === id);
  useDocumentTitle(job?.companyName);

  if (!job) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        求人が見つかりません
      </div>
    );
  }

  const scores = getScoresByJob(job.id);
  const activeCriteria = criteria.filter((c) => c.weight > 0);
  const total = activeCriteria.length > 0 ? weightedTotal(job.id, activeCriteria) : null;
  const unentered = activeCriteria.filter((c) => !scores.find((s) => s.criteriaId === c.id)).length;

  const handleDelete = () => {
    deleteScoresByJob(job.id); // 連鎖削除（Q6 の決定事項）
    deleteJob(job.id);
    navigate('/');
  };

  const salaryLabel =
    job.salaryMin || job.salaryMax
      ? `${job.salaryMin ? job.salaryMin + '万' : '?'}〜${job.salaryMax ? job.salaryMax + '万' : '?'}円`
      : '—';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{job.companyName}</h1>
            <p className="text-sm text-gray-500">{job.position}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<Pencil size={14} />}
            onClick={() => navigate(`/jobs/${job.id}/edit`)}
          >
            編集
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 size={14} />}
            onClick={() => setConfirmDelete(true)}
            className="text-red-500 hover:bg-red-50 border-red-200"
          >
            削除
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-8 flex flex-col gap-8">

          {/* Status + score summary */}
          <div className="flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">ステータス</p>
                <select
                  value={job.status}
                  onChange={(e) => updateJob(job.id, { status: e.target.value as ApplicationStatus })}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {APPLICATION_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              {job.appliedAt && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">応募日</p>
                  <p className="text-sm text-gray-700">{job.appliedAt}</p>
                </div>
              )}
              {job.nextActionAt && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">次アクション</p>
                  <p className="text-sm text-gray-700">{job.nextActionAt}</p>
                </div>
              )}
            </div>
            {total !== null && (
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-1">合致度スコア</p>
                <p className="text-2xl font-bold text-blue-600">{total}%</p>
                {unentered > 0 && (
                  <p className="text-xs text-amber-500 mt-0.5">未入力 {unentered}軸あり</p>
                )}
              </div>
            )}
          </div>

          {/* Basic info */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">基本情報</h2>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {[
                { label: '媒体', value: job.source === 'その他' && job.sourceNote ? job.sourceNote : job.source },
                { label: '年収', value: salaryLabel },
                { label: '勤務地', value: job.location || '—' },
                { label: 'リモート', value: job.remoteType },
                { label: '雇用形態', value: job.employmentType },
                { label: '始業時間', value: job.workStartTime || '—' },
                { label: '年末年始休暇', value: job.yearEndHolidays != null ? `${job.yearEndHolidays}日` : '—' },
                { label: '賞与', value: job.annualBonus != null ? `年${job.annualBonus}回` : '—' },
                { label: '住宅補助', value: job.housingAllowance ? 'あり' : 'なし' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center px-5 py-3 gap-4">
                  <span className="text-sm text-gray-400 w-28 shrink-0">{label}</span>
                  <span className="text-sm text-gray-800">{value}</span>
                </div>
              ))}
              {job.url && (
                <div className="flex items-center px-5 py-3 gap-4">
                  <span className="text-sm text-gray-400 w-28 shrink-0">求人URL</span>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1 truncate"
                  >
                    {job.url}
                    <ExternalLink size={12} className="shrink-0" />
                  </a>
                </div>
              )}
            </div>
          </section>

          {/* Skills */}
          {(job.requiredSkills.length > 0 || job.preferredSkills.length > 0 || job.techStack.length > 0) && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">スキル・技術</h2>
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {job.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 px-5 py-3">
                    <span className="text-sm text-gray-400 w-28 shrink-0 pt-0.5">必須</span>
                    <div className="flex flex-wrap gap-1.5">
                      {job.requiredSkills.map((s) => <Tag key={s}>{s}</Tag>)}
                    </div>
                  </div>
                )}
                {job.preferredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 px-5 py-3">
                    <span className="text-sm text-gray-400 w-28 shrink-0 pt-0.5">歓迎</span>
                    <div className="flex flex-wrap gap-1.5">
                      {job.preferredSkills.map((s) => <Tag key={s}>{s}</Tag>)}
                    </div>
                  </div>
                )}
                {job.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 px-5 py-3">
                    <span className="text-sm text-gray-400 w-28 shrink-0 pt-0.5">技術スタック</span>
                    <div className="flex flex-wrap gap-1.5">
                      {job.techStack.map((s) => <Tag key={s} variant="blue">{s}</Tag>)}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Memo */}
          {(job.summary || job.notes) && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">メモ</h2>
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {job.summary && (
                  <div className="px-5 py-4">
                    <p className="text-xs text-gray-400 mb-2">業務内容・要約</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{job.summary}</p>
                  </div>
                )}
                {job.notes && (
                  <div className="px-5 py-4">
                    <p className="text-xs text-gray-400 mb-2">気になる点・懸念</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{job.notes}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Score per criteria */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">評価</h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/jobs/${job.id}/score`)}
              >
                評価を入力する
              </Button>
            </div>
            {criteria.length === 0 ? (
              <p className="text-sm text-gray-400">評価軸が設定されていません。</p>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {criteria.map((c) => {
                  const sc = getScore(job.id, c.id);
                  const isUnset = !sc || sc.score === 0;
                  return (
                    <div key={c.id} className="px-5 py-4 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">{c.name}</span>
                          {c.weight === 0 && (
                            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                              スコア対象外
                            </span>
                          )}
                        </div>
                        {isUnset ? (
                          <span className="text-xs text-amber-500 font-medium">未入力</span>
                        ) : (
                          <ScoreWithLabel score={sc.score} size="sm" />
                        )}
                      </div>
                      {sc?.memo && (
                        <p className="text-xs text-gray-500 leading-relaxed">{sc.memo}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Delete confirm modal */}
      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="求人を削除"
        message={`「${job.companyName}」を削除します。この求人に入力した評価もすべて削除されます。`}
        confirmLabel="削除する"
        danger
      />
    </div>
  );
}
