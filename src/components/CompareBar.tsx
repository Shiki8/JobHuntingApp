import { useNavigate } from 'react-router-dom';
import { X, GitCompareArrows } from 'lucide-react';
import { useCompareStore } from '../store/useCompareStore';
import { useJobStore } from '../store/useJobStore';

export function CompareBar() {
  const navigate = useNavigate();
  const { selectedIds, toggle, clear } = useCompareStore();
  const jobs = useJobStore((s) => s.jobs);

  const selected = selectedIds
    .map((id) => jobs.find((j) => j.id === id))
    .filter(Boolean) as ReturnType<typeof jobs.find>[];

  const isVisible = selectedIds.length > 0;

  return (
    <div
      className={[
        'fixed bottom-[83px] md:bottom-6 left-1/2 -translate-x-1/2 z-40',
        'flex items-center gap-3 px-5 py-3.5 bg-gray-900 text-white rounded-2xl shadow-2xl',
        'transition-transform duration-300 ease-in-out',
        isVisible ? 'translate-y-0' : 'translate-y-[200%]',
        !isVisible ? 'pointer-events-none' : '',
      ].join(' ')}
    >
      {/* Selected job chips (desktop only) */}
      <div className="hidden md:flex items-center gap-2">
        {selected.map((job) => job && (
          <span
            key={job.id}
            className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg text-sm"
          >
            <span className="max-w-[120px] truncate">{job.companyName}</span>
            <button
              onClick={() => toggle(job.id)}
              className="opacity-60 hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>

      {/* Count text (mobile only) */}
      <span className="md:hidden text-sm text-white/80">{selectedIds.length}件選択中</span>

      <div className="hidden md:block w-px h-5 bg-white/20" />

      {/* Clear */}
      <button
        onClick={clear}
        className="text-sm text-white/50 hover:text-white/80 transition-colors"
      >
        クリア
      </button>

      {/* Compare button */}
      <button
        onClick={() => navigate('/compare')}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
      >
        <GitCompareArrows size={15} />
        {selectedIds.length}件を比較する
      </button>
    </div>
  );
}
