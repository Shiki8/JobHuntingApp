import { useState } from 'react';
import { Plus, GripVertical, Trash2, SlidersHorizontal } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type Criteria } from '../types';
import { useCriteriaStore } from '../store/useCriteriaStore';
import { useScoreStore } from '../store/useScoreStore';
import { Button, ConfirmModal, EmptyState } from '../components/ui';

// ── Sortable row ──────────────────────────────────────────────────────────────

interface RowProps {
  criteria: Criteria;
  onUpdate: (patch: Partial<Omit<Criteria, 'id'>>) => void;
  onDelete: () => void;
}

function CriteriaRow({ criteria, onUpdate, onDelete }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: criteria.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'group flex items-start gap-3 bg-white rounded-xl border p-4 transition-shadow',
        isDragging ? 'shadow-lg border-blue-300' : 'border-gray-200 hover:border-gray-300',
      ].join(' ')}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="mt-1 p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none"
        aria-label="ドラッグして並び替え"
      >
        <GripVertical size={16} />
      </button>

      {/* Main content */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* Name + weight row */}
        <div className="flex items-center gap-3">
          <input
            value={criteria.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="軸名"
            className="flex-1 text-sm font-medium text-gray-900 border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none py-0.5 transition-colors bg-transparent"
          />
          {/* Weight selector: 0–5 */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-gray-400">重み</span>
            <div className="flex items-center gap-0.5">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onUpdate({ weight: n })}
                  className={[
                    'w-6 h-6 rounded text-xs font-medium transition-colors',
                    criteria.weight === n
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-100',
                  ].join(' ')}
                >
                  {n}
                </button>
              ))}
            </div>
            {criteria.weight === 0 && (
              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded ml-1">
                対象外
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <input
          value={criteria.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="どういう状態なら高評価か（任意）"
          className="text-xs text-gray-500 border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none py-0.5 transition-colors bg-transparent w-full"
        />
      </div>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="mt-1 p-1 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
        aria-label="削除"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CriteriaSettings() {
  const { criteria, addCriteria, updateCriteria, deleteCriteria, reorder } = useCriteriaStore();
  const { deleteScoresByCriteria } = useScoreStore();
  const [deleteTarget, setDeleteTarget] = useState<Criteria | null>(null);
  const [scoreCount, setScoreCount] = useState(0);

  const sorted = [...criteria].sort((a, b) => a.order - b.order);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = sorted.findIndex((c) => c.id === active.id);
    const newIndex = sorted.findIndex((c) => c.id === over.id);
    const reordered = [...sorted];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    reorder(reordered.map((c) => c.id));
  };

  const handleDeleteRequest = (c: Criteria) => {
    const { scores } = useScoreStore.getState();
    const count = scores.filter((s) => s.criteriaId === c.id).length;
    setScoreCount(count);
    setDeleteTarget(c);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteScoresByCriteria(deleteTarget.id); // 連鎖削除
    deleteCriteria(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleAdd = () => {
    addCriteria({ name: '', weight: 3, description: '', order: criteria.length });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">評価軸</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            求人を比較するときの観点を設定します
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={15} />}
          onClick={handleAdd}
        >
          評価軸を追加
        </Button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-8">
        {sorted.length === 0 ? (
          <EmptyState
            icon={<SlidersHorizontal size={48} />}
            title="評価軸がありません"
            description="「評価軸を追加」から求人を評価する観点を作成しましょう"
            action={
              <Button icon={<Plus size={15} />} onClick={handleAdd}>
                評価軸を追加
              </Button>
            }
          />
        ) : (
          <div className="max-w-2xl mx-auto flex flex-col gap-3">
            {/* Guide */}
            <p className="text-xs text-gray-400 mb-1">
              ドラッグして並び替え。重みは合致度スコアの計算に使用されます（0=スコア対象外）。
            </p>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sorted.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {sorted.map((c) => (
                  <CriteriaRow
                    key={c.id}
                    criteria={c}
                    onUpdate={(patch) => updateCriteria(c.id, patch)}
                    onDelete={() => handleDeleteRequest(c)}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {/* Summary */}
            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-xs text-gray-400">
                {sorted.length}軸
                （スコア対象: {sorted.filter((c) => c.weight > 0).length}軸 /
                対象外: {sorted.filter((c) => c.weight === 0).length}軸）
              </span>
              <span className="text-xs text-gray-400">
                最大重み合計: {sorted.reduce((s, c) => s + c.weight * 5, 0)}点
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="評価軸を削除"
        message={
          scoreCount > 0
            ? `「${deleteTarget?.name}」を削除します。この軸に入力した評価が ${scoreCount} 件削除されます。`
            : `「${deleteTarget?.name}」を削除します。`
        }
        confirmLabel="削除する"
        danger
      />
    </div>
  );
}
