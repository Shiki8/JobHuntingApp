import { useState } from 'react';
import { Copy, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui';
import { parseJobImport, normalizeJobImport } from '../lib/jobImport';
import { type Job } from '../types';

const PROMPT_TEMPLATE = `以下の求人情報を読み取り、下記の JSON スキーマに従って構造化データに変換してください。

## 出力形式
JSON のみ出力してください（コードブロック・説明文は不要）。

## スキーマ
{
  "companyName": "企業名",
  "position": "職種・ポジション名",
  "source": "求人媒体（doda / リクルートエージェント / マイナビ転職 / マイナビ転職エージェント / Indeed / その他）",
  "url": "求人URL",
  "salaryMin": "年収下限・万円単位の整数（不明な場合は省略）",
  "salaryMax": "年収上限・万円単位の整数（不明な場合は省略）",
  "location": "勤務地",
  "remoteType": "リモート可否（不可 / 一部リモート / フルリモート）",
  "employmentType": "雇用形態（正社員 / 契約社員 / 業務委託 / その他）",
  "workStartTime": "始業時間（例：9:00 / フレックス）",
  "yearEndHolidays": "年末年始休暇日数・整数（不明な場合は省略）",
  "housingAllowance": "住宅補助の有無（true / false）",
  "annualBonus": "年間賞与回数・整数（不明な場合は省略）",
  "requiredSkills": ["必須スキルの配列"],
  "preferredSkills": ["歓迎スキルの配列"],
  "techStack": ["技術スタックの配列"],
  "summary": "業務内容・要約",
  "notes": "その他の気になる点"
}

## 注意事項
- 不明なフィールドはキー自体を省略してください（null は使わないでください）
- source は上記の選択肢から最も近いものを選んでください
- 数値は必ず整数で出力してください（例：600、800）
- 配列は情報がない場合は空配列 [] にしてください

## 求人情報
（ここに求人サイトの本文をコピーして貼り付けてください）`;

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (data: Partial<Job>) => void;
}

export function JobImportModal({ open, onClose, onImport }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [copied, setCopied] = useState(false);
  const [json, setJson] = useState('');
  const [error, setError] = useState('');

  const handleClose = () => {
    setStep(1);
    setCopied(false);
    setJson('');
    setError('');
    onClose();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(PROMPT_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    const result = parseJobImport(json);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onImport(normalizeJobImport(result.data));
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="JSON から入力"
      size="md"
      footer={
        step === 1 ? (
          <Button variant="primary" size="sm" icon={<ChevronRight size={14} />} onClick={() => setStep(2)}>
            次へ（JSON を貼り付ける）
          </Button>
        ) : (
          <div className="flex gap-2 w-full">
            <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />} onClick={() => { setError(''); setStep(1); }}>
              戻る
            </Button>
            <Button variant="primary" size="sm" className="ml-auto" onClick={handleApply}>
              フォームに反映
            </Button>
          </div>
        )
      }
    >
      {step === 1 ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            外部 LLM（Claude.ai・ChatGPT など）に以下のプロンプトを貼り付け、求人票の内容を変換してください。変換後の JSON を次のステップで貼り付けるとフォームに自動入力されます。
          </p>
          <div className="relative">
            <pre className="text-xs text-gray-500 bg-gray-50 rounded-lg p-4 overflow-y-auto max-h-52 whitespace-pre-wrap leading-relaxed font-mono">
              {PROMPT_TEMPLATE}
            </pre>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={copied ? <Check size={14} /> : <Copy size={14} />}
            onClick={handleCopy}
            className={copied ? 'text-green-600 bg-green-50 border-green-200 hover:bg-green-50' : ''}
          >
            {copied ? 'コピーしました' : 'プロンプトをコピー'}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">
            LLM が出力した JSON をそのまま貼り付けてください。
          </p>
          <textarea
            value={json}
            onChange={(e) => { setJson(e.target.value); setError(''); }}
            placeholder={'{\n  "companyName": "株式会社〇〇",\n  "position": "エンジニア"\n}'}
            rows={10}
            className="w-full text-sm font-mono border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none transition-colors"
          />
          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <span>⚠</span> {error}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
