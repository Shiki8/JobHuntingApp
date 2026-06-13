import { useNavigate } from 'react-router-dom';
import { GitCompareArrows, ArrowLeft } from 'lucide-react';
import { useCompareStore } from '../store/useCompareStore';
import { useJobStore } from '../store/useJobStore';
import { type Job } from '../types';
import { StatusBadge, EmptyState, Button } from '../components/ui';
import { useDocumentTitle } from '../lib/useDocumentTitle';

// ── Helpers ───────────────────────────────────────────────────────────────────

function salaryCell(job: Job): string {
  if (!job.salaryMin && !job.salaryMax) return '—';
  if (job.salaryMin && job.salaryMax) return `${job.salaryMin}〜${job.salaryMax}万`;
  if (job.salaryMin) return `${job.salaryMin}万〜`;
  return `〜${job.salaryMax}万`;
}

function skillsCell(skills: string[]): React.ReactNode {
  if (!skills.length) return <span className="text-gray-300">—</span>;
  const shown = skills.slice(0, 3);
  const rest = skills.length - 3;
  return (
    <span className="flex flex-wrap gap-1 items-center">
      {shown.map((s) => (
        <span key={s} className="inline-block bg-gray-100 text-gray-700 text-[11px] px-1.5 py-0.5 rounded">
          {s}
        </span>
      ))}
      {rest > 0 && (
        <span className="text-xs text-gray-400">+{rest}</span>
      )}
    </span>
  );
}

function sourceCell(job: Job): string {
  if (job.source === 'その他' && job.sourceNote) return `その他: ${job.sourceNote}`;
  return job.source;
}

function strCell(val: string | null | undefined): string {
  return val ? val : '—';
}

function numCell(val: number | null): string {
  return val !== null ? String(val) : '—';
}

// ── Column definitions (order per spec) ───────────────────────────────────────

const COLUMNS: {
  header: string;
  colClass?: string;
  clamp?: boolean;
  getTitle?: (job: Job) => string;
  render: (job: Job) => React.ReactNode;
}[] = [
  {
    header: '勤務地',
    colClass: 'min-w-[120px] max-w-[200px]',
    clamp: true,
    getTitle: (j) => j.location ?? '',
    render: (j) => strCell(j.location),
  },
  { header: '年収',         render: (j) => salaryCell(j) },
  { header: '始業時間',     render: (j) => strCell(j.workStartTime) },
  { header: 'リモート可否', render: (j) => j.remoteType },
  { header: '年間賞与',     render: (j) => numCell(j.annualBonus) },
  { header: '年末年始休暇', render: (j) => numCell(j.yearEndHolidays) },
  { header: '住宅補助',     render: (j) => (j.housingAllowance ? '✓' : '—') },
  { header: '雇用形態',     render: (j) => j.employmentType },
  {
    header: '必須スキル',
    colClass: 'min-w-[120px] max-w-[200px]',
    getTitle: (j) => j.requiredSkills.join(', '),
    render: (j) => skillsCell(j.requiredSkills),
  },
  {
    header: '技術スタック',
    colClass: 'min-w-[120px] max-w-[200px]',
    getTitle: (j) => j.techStack.join(', '),
    render: (j) => skillsCell(j.techStack),
  },
  {
    header: '媒体',
    colClass: 'min-w-[120px] max-w-[200px]',
    clamp: true,
    getTitle: (j) => sourceCell(j),
    render: (j) => sourceCell(j),
  },
  {
    header: '気になる点',
    colClass: 'min-w-[200px] max-w-[240px]',
    getTitle: (j) => j.notes ?? '',
    render: (j) =>
      j.notes ? (
        <span className="line-clamp-4 whitespace-pre-wrap text-xs text-gray-600">
          {j.notes}
        </span>
      ) : (
        '—'
      ),
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Compare() {
  const navigate = useNavigate();
  const { selectedIds, clear } = useCompareStore();
  const jobs = useJobStore((s) => s.jobs);

  useDocumentTitle('比較');

  const selectedJobs = selectedIds
    .map((id) => jobs.find((j) => j.id === id))
    .filter((j): j is Job => !!j);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4 md:py-5 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">比較</h1>
            <p className="text-sm text-gray-400 mt-0.5">{selectedJobs.length}件を比較中</p>
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
            <Button onClick={() => navigate('/')}>求人一覧に戻る</Button>
          }
        />
      ) : (
        <div className="flex-1 overflow-auto">
          <table
            data-testid="compare-table"
            className="border-collapse text-sm w-max min-w-full"
          >
            <thead>
              <tr className="bg-gray-50">
                {/* Left sticky header cell */}
                <th className="sticky left-0 z-20 bg-gray-50 px-3 py-2 text-left text-xs font-semibold text-gray-500 border-b border-r border-gray-200 w-[120px]">
                  求人
                </th>
                {COLUMNS.map((col) => (
                  <th
                    key={col.header}
                    className={`px-3 py-2 text-left text-xs font-semibold text-gray-500 border-b border-r border-gray-200 whitespace-nowrap ${col.colClass ?? 'min-w-[120px]'}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {selectedJobs.map((job, i) => (
                <tr
                  key={job.id}
                  className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  {/* Left sticky cell: company + position + status badge */}
                  <td className={`sticky left-0 z-10 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} px-3 py-3 border-b border-r border-gray-200 w-[120px]`}>
                    <p className="font-semibold text-gray-900 text-xs leading-snug line-clamp-2">
                      {job.companyName}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                      {job.position}
                    </p>
                    <div className="mt-1.5">
                      <StatusBadge status={job.status} />
                    </div>
                  </td>
                  {COLUMNS.map((col) => (
                    <td
                      key={col.header}
                      title={col.getTitle?.(job) || undefined}
                      className={`px-3 py-3 border-b border-r border-gray-200 text-sm text-gray-700 align-top ${col.colClass ?? ''}`}
                    >
                      {col.clamp ? (
                        <div className="line-clamp-4">{col.render(job)}</div>
                      ) : col.render(job)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
