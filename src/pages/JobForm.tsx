import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Braces } from 'lucide-react';
import {
  type Job, type ApplicationStatus, type RemoteType, type EmploymentType, type JobSource,
  APPLICATION_STATUSES, JOB_SOURCES,
} from '../types';
import { useJobStore } from '../store/useJobStore';
import { nanoid } from '../lib/nanoid';
import { Button, Input, Textarea, Select, TagInput } from '../components/ui';
import { JobImportModal } from '../components/JobImportModal';
import { useDocumentTitle } from '../lib/useDocumentTitle';

const REMOTE_OPTIONS = (['不可', '一部リモート', 'フルリモート'] as RemoteType[]).map(
  (v) => ({ value: v, label: v })
);
const EMPLOYMENT_OPTIONS = (['正社員', '契約社員', '業務委託', 'その他'] as EmploymentType[]).map(
  (v) => ({ value: v, label: v })
);
const SOURCE_OPTIONS = JOB_SOURCES.map((s) => ({ value: s, label: s }));
const STATUS_OPTIONS = APPLICATION_STATUSES.map((s) => ({ value: s, label: s }));

const EMPTY_JOB: Omit<Job, 'id' | 'createdAt' | 'updatedAt'> = {
  companyName: '', position: '', source: 'Wantedly', sourceNote: '', url: '',
  salaryMin: null, salaryMax: null, location: '', remoteType: 'フルリモート',
  employmentType: '正社員', yearEndHolidays: null, workStartTime: '',
  housingAllowance: false, annualBonus: null,
  requiredSkills: [], preferredSkills: [], techStack: [],
  summary: '', notes: '', status: '未応募', appliedAt: null, nextActionAt: null,
};

export default function JobForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { jobs, addJob, updateJob } = useJobStore();

  const [form, setForm] = useState<Omit<Job, 'id' | 'createdAt' | 'updatedAt'>>(EMPTY_JOB);
  const [errors, setErrors] = useState<Partial<Record<keyof Job, string>>>({});
  const [importOpen, setImportOpen] = useState(false);
  useDocumentTitle(isEdit ? '求人を編集' : '求人を追加');

  useEffect(() => {
    if (isEdit) {
      const job = jobs.find((j) => j.id === id);
      if (job) {
        const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = job;
        setForm(rest);
      }
    }
  }, [id, isEdit, jobs]);

  const set = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const errs: typeof errors = {};
    if (!form.companyName.trim()) errs.companyName = '企業名は必須です';
    if (!form.position.trim()) errs.position = '職種は必須です';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const now = new Date().toISOString();
    if (isEdit && id) {
      updateJob(id, form);
    } else {
      addJob({ ...form, id: nanoid(), createdAt: now, updatedAt: now });
    }
    navigate('/');
  };

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
          <h1 className="text-lg font-semibold text-gray-900">
            {isEdit ? '求人を編集' : '求人を追加'}
          </h1>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<Braces size={14} />}
          onClick={() => setImportOpen(true)}
        >
          JSON から入力
        </Button>
      </div>

      <JobImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={(data) => setForm((f) => ({ ...f, ...data }))}
      />

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-8 flex flex-col gap-8">

          {/* Section: 基本情報 */}
          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">基本情報</h2>
            <Input
              label="企業名" required
              value={form.companyName}
              onChange={(e) => set('companyName', e.target.value)}
              error={errors.companyName}
              placeholder="例：株式会社〇〇"
            />
            <Input
              label="職種・ポジション名" required
              value={form.position}
              onChange={(e) => set('position', e.target.value)}
              error={errors.position}
              placeholder="例：フロントエンドエンジニア"
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <Select
                  label="媒体"
                  value={form.source}
                  onChange={(e) => set('source', e.target.value as JobSource)}
                  options={SOURCE_OPTIONS}
                />
              </div>
              {form.source === 'その他' && (
                <div className="flex-1">
                  <Input
                    label="媒体名（自由入力）"
                    value={form.sourceNote}
                    onChange={(e) => set('sourceNote', e.target.value)}
                    placeholder="例：ビズリーチ"
                  />
                </div>
              )}
            </div>
            <Input
              label="求人URL"
              type="url"
              value={form.url}
              onChange={(e) => set('url', e.target.value)}
              placeholder="https://"
            />
          </section>

          {/* Section: 条件 */}
          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">条件</h2>
            <div className="flex gap-3">
              <Input
                label="年収下限（万円）"
                type="number"
                value={form.salaryMin ?? ''}
                onChange={(e) => set('salaryMin', e.target.value ? Number(e.target.value) : null)}
                placeholder="例：600"
              />
              <Input
                label="年収上限（万円）"
                type="number"
                value={form.salaryMax ?? ''}
                onChange={(e) => set('salaryMax', e.target.value ? Number(e.target.value) : null)}
                placeholder="例：900"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  label="勤務地"
                  value={form.location}
                  onChange={(e) => set('location', e.target.value)}
                  placeholder="例：東京・渋谷"
                />
              </div>
              <div className="flex-1">
                <Select
                  label="リモート可否"
                  value={form.remoteType}
                  onChange={(e) => set('remoteType', e.target.value as RemoteType)}
                  options={REMOTE_OPTIONS}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Select
                  label="雇用形態"
                  value={form.employmentType}
                  onChange={(e) => set('employmentType', e.target.value as EmploymentType)}
                  options={EMPLOYMENT_OPTIONS}
                />
              </div>
              <div className="flex-1">
                <Input
                  label="始業時間"
                  value={form.workStartTime}
                  onChange={(e) => set('workStartTime', e.target.value)}
                  placeholder="例：9:00 / フレックス"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  label="年末年始休暇（日）"
                  type="number"
                  value={form.yearEndHolidays ?? ''}
                  onChange={(e) => set('yearEndHolidays', e.target.value ? Number(e.target.value) : null)}
                  placeholder="例：10"
                />
              </div>
              <div className="flex-1">
                <Input
                  label="年間賞与回数"
                  type="number"
                  value={form.annualBonus ?? ''}
                  onChange={(e) => set('annualBonus', e.target.value ? Number(e.target.value) : null)}
                  placeholder="例：2"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.housingAllowance}
                onChange={(e) => set('housingAllowance', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              住宅補助あり
            </label>
          </section>

          {/* Section: スキル・技術 */}
          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">スキル・技術</h2>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1.5">必須スキル</p>
              <TagInput
                tags={form.requiredSkills}
                onChange={(v) => set('requiredSkills', v)}
                placeholder="Enterで追加（例：React）"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1.5">歓迎スキル</p>
              <TagInput
                tags={form.preferredSkills}
                onChange={(v) => set('preferredSkills', v)}
                placeholder="Enterで追加"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1.5">技術スタック</p>
              <TagInput
                tags={form.techStack}
                onChange={(v) => set('techStack', v)}
                placeholder="Enterで追加（例：TypeScript）"
              />
            </div>
          </section>

          {/* Section: メモ */}
          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">メモ</h2>
            <Textarea
              label="業務内容・要約"
              value={form.summary}
              onChange={(e) => set('summary', e.target.value)}
              rows={4}
              placeholder="業務内容や求人のポイントを自由に記述"
            />
            <Textarea
              label="気になる点・懸念"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              placeholder="疑問点・懸念・確認したいことなど"
            />
          </section>

          {/* Section: ステータス・日程 */}
          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">ステータス・日程</h2>
            <Select
              label="応募ステータス"
              value={form.status}
              onChange={(e) => set('status', e.target.value as ApplicationStatus)}
              options={STATUS_OPTIONS}
            />
            <div className="flex gap-3">
              <Input
                label="応募日"
                type="date"
                value={form.appliedAt ?? ''}
                onChange={(e) => set('appliedAt', e.target.value || null)}
              />
              <Input
                label="次アクション日"
                type="date"
                value={form.nextActionAt ?? ''}
                onChange={(e) => set('nextActionAt', e.target.value || null)}
              />
            </div>
          </section>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 pb-8">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
              キャンセル
            </Button>
            <Button type="submit" variant="primary">
              {isEdit ? '変更を保存' : '求人を登録'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
