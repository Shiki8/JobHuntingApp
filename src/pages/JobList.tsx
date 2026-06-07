import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Briefcase } from 'lucide-react';
import { APPLICATION_STATUSES, type ApplicationStatus, JOB_SOURCES, type RemoteType } from '../types';
import { useJobStore } from '../store/useJobStore';
import { JobCard } from '../components/JobCard';
import { CompareBar } from '../components/CompareBar';
import { Button, CountBadge, EmptyState } from '../components/ui';
import { useDocumentTitle } from '../lib/useDocumentTitle';

const REMOTE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'すべて' },
  { value: '不可', label: '不可' },
  { value: '一部リモート', label: '一部リモート' },
  { value: 'フルリモート', label: 'フルリモート' },
];

const SOURCE_OPTIONS = [
  { value: '', label: 'すべての媒体' },
  ...JOB_SOURCES.map((s) => ({ value: s, label: s })),
];

const ALL_TABS = ['すべて', ...APPLICATION_STATUSES] as const;

export default function JobList() {
  const navigate = useNavigate();
  const { jobs, filters, setFilters, filteredJobs } = useJobStore();
  const displayed = filteredJobs();
  const searchRef = useRef<HTMLInputElement>(null);
  useDocumentTitle('求人一覧');

  // `/` キーで検索フォーカス
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const countByStatus = (status: ApplicationStatus) =>
    jobs.filter((j) => j.status === status).length;

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900">求人一覧</h1>
          <CountBadge count={jobs.length} />
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              ref={searchRef}
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              placeholder="企業名・職種・技術で検索 [/]"
              className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-64 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
            />
          </div>
          {/* Source filter */}
          <select
            value={filters.source}
            onChange={(e) => setFilters({ source: e.target.value })}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors text-gray-600 cursor-pointer"
          >
            {SOURCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {/* Remote filter */}
          <select
            value={filters.remoteType}
            onChange={(e) => setFilters({ remoteType: e.target.value as RemoteType | '' })}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors text-gray-600 cursor-pointer"
          >
            {REMOTE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Status tab bar */}
      <div className="flex border-b border-gray-100 bg-white px-6 shrink-0">
        {ALL_TABS.map((tab) => {
          const active = filters.status === tab;
          const count = tab === 'すべて' ? jobs.length : countByStatus(tab as ApplicationStatus);
          return (
            <button
              key={tab}
              onClick={() => setFilters({ status: tab as ApplicationStatus | 'すべて' })}
              className={[
                'flex items-center gap-1.5 px-4 py-3.5 text-sm border-b-2 transition-colors whitespace-nowrap',
                active
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              {tab}
              <CountBadge count={count} active={active} />
            </button>
          );
        })}
      </div>

      {/* Card grid */}
      <div className="flex-1 overflow-y-auto p-8 pb-24">
        {displayed.length === 0 ? (
          <EmptyState
            icon={<Briefcase size={48} />}
            title={jobs.length === 0 ? '求人がまだありません' : '条件に一致する求人がありません'}
            description={
              jobs.length === 0
                ? 'サイドバーの「求人を追加」から登録してみましょう'
                : 'フィルタや検索条件を変えてみてください'
            }
            action={
              jobs.length === 0 ? (
                <Button onClick={() => navigate('/jobs/new')} icon={<span>+</span>}>
                  求人を追加
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayed.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>

      <CompareBar />
    </div>
  );
}
