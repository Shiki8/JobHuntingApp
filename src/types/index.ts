export type ApplicationStatus =
  | '未応募'
  | '応募済'
  | '書類選考中'
  | '面接中'
  | '最終選考'
  | '内定'
  | '見送り';

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  '未応募',
  '応募済',
  '書類選考中',
  '面接中',
  '最終選考',
  '内定',
  '見送り',
];

export type RemoteType = '不可' | '一部リモート' | 'フルリモート';
export type EmploymentType = '正社員' | '契約社員' | '業務委託' | 'その他';

export interface Job {
  id: string;
  companyName: string;
  position: string;
  source: string;
  url: string;
  salaryMin: number | null;
  salaryMax: number | null;
  location: string;
  remoteType: RemoteType;
  employmentType: EmploymentType;
  yearEndHolidays: number | null;
  startTime: string;
  housingAllowance: boolean;
  annualBonus: number | null;
  requiredSkills: string[];
  preferredSkills: string[];
  techStack: string[];
  summary: string;
  notes: string;
  status: ApplicationStatus;
  appliedAt: string | null;
  nextActionAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Criteria {
  id: string;
  name: string;
  weight: number; // 0–5
  description: string;
  order: number;
}

export interface Score {
  id: string;
  jobId: string;
  criteriaId: string;
  score: number; // 1–5
  memo: string;
  referenceUrl: string;
}

export const DEFAULT_CRITERIA: Omit<Criteria, 'id' | 'order'>[] = [
  { name: 'リモート',     weight: 3, description: 'フルリモートなら5、出社必須なら1' },
  { name: '年収',         weight: 5, description: '希望年収レンジに対して達成度を評価' },
  { name: '技術スタック', weight: 4, description: '自分の強みと学びたい技術に合っているか' },
  { name: '裁量',         weight: 3, description: '設計・意思決定への関与度' },
  { name: 'カルチャー',   weight: 3, description: '企業文化・働き方が自分に合うか' },
  { name: '成長環境',     weight: 4, description: '学習機会・メンバーのレベル' },
];
