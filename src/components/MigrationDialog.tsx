import { useState } from 'react';
import type { Job, Criteria, Score } from '../types';
import { pushUpsert } from '../lib/sync';
import { markMigrationDone } from '../lib/migration';

interface Props {
  jobs: Job[];
  criteria: Criteria[];
  scores: Score[];
  onComplete: () => void;
}

export default function MigrationDialog({ jobs, criteria, scores, onComplete }: Props) {
  const [loading, setLoading] = useState(false);

  const handleMigrate = async () => {
    setLoading(true);
    try {
      await Promise.all([
        ...jobs.map((j) => pushUpsert('jobs', j.id, j)),
        ...criteria.map((c) => pushUpsert('criteria', c.id, c)),
        ...scores.map((s) => pushUpsert('scores', s.id, s)),
      ]);
    } finally {
      markMigrationDone();
      setLoading(false);
      onComplete();
    }
  };

  const handleSkip = () => {
    markMigrationDone();
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
        <h2 className="font-bold text-gray-900 text-base">既存データを引き継ぎますか？</h2>
        <p className="text-sm text-gray-500">
          このデバイスに {jobs.length} 件の求人が保存されています。
          クラウドに引き継ぐと、他の端末からも閲覧できるようになります。
        </p>
        <div className="flex flex-col gap-2 mt-2">
          <button
            onClick={handleMigrate}
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            )}
            {loading ? '引き継ぎ中…' : '引き継ぐ'}
          </button>
          <button
            onClick={handleSkip}
            disabled={loading}
            className="w-full py-2 rounded-lg text-gray-500 hover:bg-gray-100 text-sm transition-colors"
          >
            引き継がない
          </button>
        </div>
      </div>
    </div>
  );
}
