import { useNavigate } from 'react-router-dom';
import { type Job } from '../types';
import { StatusBadge, ScoreDots, Tag } from './ui';
import { useCompareStore } from '../store/useCompareStore';
import { useScoreStore } from '../store/useScoreStore';
import { useCriteriaStore } from '../store/useCriteriaStore';

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const navigate = useNavigate();
  const { toggle, isSelected, isFull } = useCompareStore();
  const criteria = useCriteriaStore((s) => s.criteria);
  const { weightedTotal, getScoresByJob } = useScoreStore();

  const selected = isSelected(job.id);
  const scores = getScoresByJob(job.id);
  const activeCriteria = criteria.filter((c) => c.weight > 0);
  const total = activeCriteria.length > 0 ? weightedTotal(job.id, activeCriteria) : null;
  const unentered = activeCriteria.filter(
    (c) => !scores.find((s) => s.criteriaId === c.id)
  ).length;

  const handleCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggle(job.id);
  };

  const salaryLabel =
    job.salaryMin || job.salaryMax
      ? `${job.salaryMin ? job.salaryMin + '万' : '?'}〜${job.salaryMax ? job.salaryMax + '万' : '?'}`
      : null;

  return (
    <div
      onClick={() => navigate(`/jobs/${job.id}`)}
      className={[
        'bg-white rounded-xl p-5 flex flex-col gap-3 cursor-pointer transition-all',
        'border hover:shadow-md',
        selected
          ? 'border-blue-500 ring-1 ring-blue-500 shadow-sm'
          : 'border-gray-200 hover:border-gray-300',
      ].join(' ')}
    >
      {/* Row 1: company + badge */}
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1">
          {job.companyName}
        </p>
        <StatusBadge status={job.status} />
      </div>

      {/* Row 2: position + source */}
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm text-gray-800 font-medium line-clamp-1">{job.position}</p>
        <span className="text-xs text-gray-400 shrink-0">
          {job.source === 'その他' && job.sourceNote ? job.sourceNote : job.source}
        </span>
      </div>

      {/* Row 3: condition chips */}
      <div className="flex flex-wrap gap-1.5">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
          {job.remoteType}
        </span>
        {salaryLabel && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
            {salaryLabel}
          </span>
        )}
        {job.location && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
            {job.location}
          </span>
        )}
      </div>

      {/* Row 4: tech tags */}
      {job.techStack.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {job.techStack.slice(0, 4).map((t) => (
            <Tag key={t} variant="blue">{t}</Tag>
          ))}
          {job.techStack.length > 4 && (
            <Tag>+{job.techStack.length - 4}</Tag>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Row 5: score + compare checkbox */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 shrink-0">合致度</span>
        {total !== null ? (
          <>
            <ScoreDots score={Math.round(total / 20)} size="sm" />
            <span className="text-xs font-medium text-gray-700 tabular-nums">{total}%</span>
            {unentered > 0 && (
              <span className="text-xs text-amber-500">未入力{unentered}軸</span>
            )}
          </>
        ) : (
          <span className="text-xs text-gray-300">評価未入力</span>
        )}
        <div
          className="ml-auto"
          role="checkbox"
          aria-checked={selected}
          aria-label="比較に追加"
          onClick={handleCheck}
        >
          <div
            className={[
              'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0',
              selected
                ? 'bg-blue-600 border-blue-600'
                : isFull()
                ? 'border-gray-200 opacity-40 cursor-not-allowed'
                : 'border-gray-300 hover:border-blue-400',
            ].join(' ')}
          >
            {selected && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
