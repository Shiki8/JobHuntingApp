import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Check } from 'lucide-react';
import { type Criteria } from '../types';
import { useJobStore } from '../store/useJobStore';
import { useCriteriaStore } from '../store/useCriteriaStore';
import { useScoreStore } from '../store/useScoreStore';
import { Button, ScoreDots, StatusBadge } from '../components/ui';
import { useDocumentTitle } from '../lib/useDocumentTitle';

// ドラフト状態（保存前のローカル編集）
interface Draft {
  score: number;
  memo: string;
  referenceUrl: string;
}

function CriteriaScoreRow({
  criteria,
  draft,
  onChange,
}: {
  criteria: Criteria;
  draft: Draft;
  onChange: (patch: Partial<Draft>) => void;
}) {
  const isEmpty = draft.score === 0;

  return (
    <div
      className={[
        'rounded-xl border p-5 flex flex-col gap-4 transition-colors',
        isEmpty ? 'border-gray-200 bg-white' : 'border-blue-200 bg-blue-50/30',
      ].join(' ')}
    >
      {/* 軸名 + 重み + スコア入力 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium text-gray-900 text-sm">{criteria.name}</span>
          {criteria.weight === 0 ? (
            <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded shrink-0">
              スコア対象外
            </span>
          ) : (
            <span className="text-xs text-gray-400 shrink-0">
              重み {criteria.weight}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <ScoreDots
            score={draft.score}
            onChange={(s) => onChange({ score: s })}
            size="md"
          />
          <span className={[
            'text-xs tabular-nums w-10 text-right',
            isEmpty ? 'text-amber-500' : 'text-gray-600 font-medium',
          ].join(' ')}>
            {isEmpty ? '未入力' : `${draft.score} / 5`}
          </span>
        </div>
      </div>

      {/* 説明（ヒント） */}
      {criteria.description && (
        <p className="text-xs text-gray-400 -mt-1">{criteria.description}</p>
      )}

      {/* メモ */}
      <textarea
        value={draft.memo}
        onChange={(e) => onChange({ memo: e.target.value })}
        placeholder="根拠・理由を書いておくと比較時に役立ちます"
        rows={2}
        className={[
          'w-full text-sm border rounded-lg px-3 py-2 resize-y outline-none transition-colors',
          'placeholder:text-gray-300 text-gray-700',
          'border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20',
        ].join(' ')}
      />

      {/* 参照リンク */}
      <input
        type="url"
        value={draft.referenceUrl}
        onChange={(e) => onChange({ referenceUrl: e.target.value })}
        placeholder="参照URL（任意）"
        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-400 transition-colors placeholder:text-gray-300 text-gray-600"
      />
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ScoreInput() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { jobs } = useJobStore();
  const { criteria } = useCriteriaStore();
  const { getScore, upsertScore } = useScoreStore();

  const job = jobs.find((j) => j.id === id);

  // ドラフト初期化（既存スコアを読み込む）
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => {
    const init: Record<string, Draft> = {};
    for (const c of criteria) {
      const existing = getScore(id ?? '', c.id);
      init[c.id] = {
        score: existing?.score ?? 0,
        memo: existing?.memo ?? '',
        referenceUrl: existing?.referenceUrl ?? '',
      };
    }
    return init;
  });

  const [saved, setSaved] = useState(false);
  useDocumentTitle(job ? `評価入力 — ${job.companyName}` : '評価入力');

  // 評価軸が後から追加された場合に対応
  useEffect(() => {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const c of criteria) {
        if (!next[c.id]) {
          const existing = getScore(id ?? '', c.id);
          next[c.id] = {
            score: existing?.score ?? 0,
            memo: existing?.memo ?? '',
            referenceUrl: existing?.referenceUrl ?? '',
          };
        }
      }
      return next;
    });
  }, [criteria, id, getScore]);

  if (!job) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        求人が見つかりません
      </div>
    );
  }

  const sorted = [...criteria].sort((a, b) => a.order - b.order);
  const active = sorted.filter((c) => c.weight > 0);
  const inactive = sorted.filter((c) => c.weight === 0);

  const enteredCount = active.filter((c) => (drafts[c.id]?.score ?? 0) > 0).length;
  const totalActive = active.length;
  const progress = totalActive > 0 ? Math.round((enteredCount / totalActive) * 100) : 0;

  const handleSave = () => {
    for (const c of criteria) {
      const d = drafts[c.id];
      if (!d) continue;
      upsertScore(job.id, c.id, {
        score: d.score,
        memo: d.memo,
        referenceUrl: d.referenceUrl,
      });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePatch = (criteriaId: string, patch: Partial<Draft>) =>
    setDrafts((prev) => ({
      ...prev,
      [criteriaId]: { ...prev[criteriaId], ...patch },
    }));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/jobs/${job.id}`)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-gray-900">{job.companyName}</h1>
              <StatusBadge status={job.status} />
            </div>
            <p className="text-sm text-gray-400">{job.position} — 評価を入力</p>
          </div>
        </div>
        <Button
          variant="primary"
          icon={saved ? <Check size={15} /> : undefined}
          onClick={handleSave}
          className={saved ? 'bg-green-600 hover:bg-green-600' : ''}
        >
          {saved ? '保存しました' : '一括保存'}
        </Button>
      </div>

      {/* Progress bar */}
      <div className="px-8 py-3 bg-white border-b border-gray-100 shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500">
            スコア対象軸の進捗
          </span>
          <span className="text-xs font-medium text-gray-700">
            {enteredCount} / {totalActive} 軸入力済み
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        {enteredCount === totalActive && totalActive > 0 && (
          <p className="text-xs text-green-600 mt-1 font-medium">
            すべての軸の入力が完了しています ✓
          </p>
        )}
      </div>

      {/* Score rows */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto flex flex-col gap-8">

          {/* スコア対象軸 */}
          {active.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                スコア対象（{active.length}軸）
              </h2>
              {active.map((c) => (
                <CriteriaScoreRow
                  key={c.id}
                  criteria={c}
                  draft={drafts[c.id] ?? { score: 0, memo: '', referenceUrl: '' }}
                  onChange={(patch) => handlePatch(c.id, patch)}
                />
              ))}
            </section>
          )}

          {/* 参考記録軸（weight=0） */}
          {inactive.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                参考記録（スコア対象外・{inactive.length}軸）
              </h2>
              {inactive.map((c) => (
                <CriteriaScoreRow
                  key={c.id}
                  criteria={c}
                  draft={drafts[c.id] ?? { score: 0, memo: '', referenceUrl: '' }}
                  onChange={(patch) => handlePatch(c.id, patch)}
                />
              ))}
            </section>
          )}

          {criteria.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-sm">評価軸が設定されていません。</p>
              <button
                onClick={() => navigate('/criteria')}
                className="text-sm text-blue-600 hover:underline mt-2"
              >
                評価軸を設定する →
              </button>
            </div>
          )}

          {/* Bottom save */}
          {criteria.length > 0 && (
            <div className="flex justify-end pt-2 pb-8">
              <Button
                variant="primary"
                size="lg"
                icon={saved ? <Check size={15} /> : undefined}
                onClick={handleSave}
                className={saved ? 'bg-green-600 hover:bg-green-600' : ''}
              >
                {saved ? '保存しました' : '一括保存'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
