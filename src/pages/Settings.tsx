import { useRef, useState } from 'react';
import { Download, Upload, Trash2, Database } from 'lucide-react';
import { useJobStore } from '../store/useJobStore';
import { useCriteriaStore } from '../store/useCriteriaStore';
import { useScoreStore } from '../store/useScoreStore';
import { useCompareStore } from '../store/useCompareStore';
import { ConfirmModal, Button } from '../components/ui';
import { useDocumentTitle } from '../lib/useDocumentTitle';

interface ExportData {
  version: number;
  exportedAt: string;
  jobs: ReturnType<typeof useJobStore.getState>['jobs'];
  criteria: ReturnType<typeof useCriteriaStore.getState>['criteria'];
  scores: ReturnType<typeof useScoreStore.getState>['scores'];
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const data: ExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      jobs: useJobStore.getState().jobs,
      criteria: useCriteriaStore.getState().criteria,
      scores: useScoreStore.getState().scores,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-compare-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Import ─────────────────────────────────────────────────────────────────
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as ExportData;
        if (!data.version || !Array.isArray(data.jobs) || !Array.isArray(data.criteria) || !Array.isArray(data.scores)) {
          throw new Error('フォーマットが正しくありません');
        }
        // Restore to stores
        useJobStore.setState({ jobs: data.jobs });
        useCriteriaStore.setState({ criteria: data.criteria });
        useScoreStore.setState({ scores: data.scores });
        setImportSuccess(true);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'インポートに失敗しました');
      }
    };
    reader.readAsText(file);
    // Reset file input so the same file can be re-imported
    e.target.value = '';
  };

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = () => {
    useJobStore.setState({ jobs: [] });
    useCriteriaStore.setState({ criteria: [] });
    useScoreStore.setState({ scores: [] });
    useCompareStore.getState().clear();
    // Re-initialize default criteria
    useCriteriaStore.getState().initDefaults();
  };

  useDocumentTitle('設定');
  const jobCount = useJobStore((s) => s.jobs.length);
  const criteriaCount = useCriteriaStore((s) => s.criteria.length);
  const scoreCount = useScoreStore((s) => s.scores.length);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100 bg-white shrink-0">
        <h1 className="text-xl font-semibold text-gray-900">設定</h1>
        <p className="text-sm text-gray-400 mt-0.5">データの管理とバックアップ</p>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-xl mx-auto flex flex-col gap-6">

          {/* Data summary */}
          <SectionCard
            title="現在のデータ"
            description="ローカルストレージに保存されているデータの件数"
          >
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '求人', count: jobCount, icon: '📋' },
                { label: '評価軸', count: criteriaCount, icon: '⭐' },
                { label: '評価', count: scoreCount, icon: '📝' },
              ].map(({ label, count, icon }) => (
                <div key={label} className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="text-xl font-bold text-gray-900">{count}</div>
                  <div className="text-xs text-gray-400">{label}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Export */}
          <SectionCard
            title="エクスポート"
            description="すべてのデータをJSONファイルとしてダウンロードします"
          >
            <Button
              variant="secondary"
              icon={<Download size={15} />}
              onClick={handleExport}
              disabled={jobCount === 0 && criteriaCount === 0}
            >
              JSONをダウンロード
            </Button>
          </SectionCard>

          {/* Import */}
          <SectionCard
            title="インポート"
            description="バックアップしたJSONファイルからデータを復元します。現在のデータは上書きされます。"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <Button
              variant="ghost"
              icon={<Upload size={15} />}
              onClick={() => fileInputRef.current?.click()}
            >
              JSONファイルを選択
            </Button>
            {importError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                ⚠ {importError}
              </p>
            )}
            {importSuccess && (
              <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
                ✓ インポートが完了しました
              </p>
            )}
          </SectionCard>

          {/* Score method (read-only, for information) */}
          <SectionCard
            title="スコア計算方式"
            description="現在の合致度スコアの計算方式"
          >
            <div className="flex items-start gap-3 bg-blue-50 rounded-lg p-4">
              <Database size={18} className="text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">重み付き合計（正規化）</p>
                <p className="text-xs text-blue-700 mt-0.5">
                  Σ(スコア × 重み) ÷ Σ(5 × 重み) × 100。未入力の軸は0点として計算されます。
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Danger zone */}
          <div className="border border-red-200 rounded-xl p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-base font-semibold text-red-700">危険な操作</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                実行すると元に戻せません
              </p>
            </div>
            <Button
              variant="danger"
              icon={<Trash2 size={15} />}
              onClick={() => setConfirmReset(true)}
            >
              すべてのデータをリセット
            </Button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={handleReset}
        title="すべてのデータをリセット"
        message={`求人 ${jobCount}件・評価軸 ${criteriaCount}件・評価 ${scoreCount}件をすべて削除します。この操作は元に戻せません。`}
        confirmLabel="リセットする"
        danger
      />
    </div>
  );
}
